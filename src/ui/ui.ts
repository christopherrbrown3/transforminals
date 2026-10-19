import { BIOMES, CREATURES, HUMAN, getCreature, type BiomeId } from '../game/data';
import type { SaveData } from '../game/progression';
import { icon, portrait } from './icons';
import { worldMap } from './worldMap';
export interface UIActions {
  start(): void;
  move(key: string, down: boolean): void;
  star(down: boolean): void;
  form(id: string): void;
  pause(paused: boolean): void;
  travel(id: BiomeId): void;
  settings(): void;
  reset(): void;
  replay(): void;
  skip(): void;
  update(): void;
}
export class UI {
  private panel: HTMLElement;
  private messageTimer = 0;
  private dialogueTimer = 0;
  private previousForms = '';
  private returnFocus: HTMLElement | null = null;
  private previousBoss = '';
  private form = 'human';
  private currentBiome: BiomeId = 'meadow';
  constructor(
    private root: HTMLElement,
    private actions: UIActions,
    private save: SaveData,
  ) {
    root.innerHTML = `<canvas id="world" aria-label="Transforminals 3D adventure"></canvas>
 <div id="hud" hidden>
 <header class="topbar"><div class="location"><span class="location-mark">${icon('paw', 22)}</span><div><strong id="biome-name">Clover Meadow</strong></div></div><div class="top-actions"><div class="progress-pill">${icon('paw', 20)}<strong id="rescue-count">0 / ${CREATURES.length}</strong><span>rescued</span></div><button id="map-button" class="icon-button" aria-label="World map" aria-haspopup="dialog" title="World map (M)">${icon('map')}<span>Map</span></button><button id="pause-button" class="icon-button" aria-label="Pause and settings">${icon('pause')}</button></div></header>
 <aside class="forms-bar" aria-label="Your transformations"><div id="forms" data-scroll-surface></div><button id="collection-button" class="collection-button" aria-label="Animal collection">${icon('paw')}<span>Friends</span></button></aside>
 <div id="boss-hud" hidden><strong id="boss-name"></strong><div id="boss-hearts"></div><span id="boss-hits"></span></div>
 <div id="dialogue" hidden role="status"></div><div id="toast" hidden role="status"></div>

 <div class="touch-controls"><button id="star-button" aria-label="Jump or use power">${icon('star', 38)}<span id="star-label">JUMP</span></button><div class="dpad" aria-label="Movement controls"><button data-move="forward" class="forward" aria-label="Move forward">${icon('up', 32)}</button><button data-move="left" class="left" aria-label="Move left">${icon('left', 32)}</button><button data-move="backward" class="backward" aria-label="Move backward">${icon('down', 32)}</button><button data-move="right" class="right" aria-label="Move right">${icon('right', 32)}</button><i></i></div></div>
 <button id="update-button" hidden>A fresh adventure update is ready</button><div id="cutscene" hidden><p id="cutscene-text"></p><button id="skip-button">Skip ${icon('right', 18)}</button></div>
 </div>
 <section id="title-screen" class="title-screen"><div class="title-copy"><div class="calvin-badge">${icon('spark', 18)} A wild adventure by Calvin</div><h1>TRANS<span>FORMINALS</span></h1><p class="title-tagline">Little rescues.<br>Enormous possibilities.</p><p class="title-description">Jump on cages. Make new friends.<br>Become anyone you rescue.</p><button id="start-button" class="primary-button">${icon('play', 23)} ${save.rescued.length ? 'Continue adventure' : 'Let’s get wild'}</button><p class="title-note">No lives to lose. Just a whole world to find.</p></div><div class="title-world-label">CLOVER MEADOW <span>your adventure starts here</span></div><span class="version">v0.5.0 · Made for Calvin</span></section>
 <section id="panel" class="panel-backdrop" hidden></section><div id="loading" hidden>Growing a new corner of the world…</div><div id="rotate-hint">More room for adventure in landscape.</div>`;
    this.panel = this.el('panel');
    this.panel.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const controls = Array.from(
        this.panel.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]',
        ),
      ).filter((control) => control.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    });
    this.el('start-button').onclick = () => {
      this.el('title-screen').hidden = true;
      this.el('hud').hidden = false;
      actions.start();
    };
    this.el('map-button').onclick = () => this.map();
    this.el('pause-button').onclick = () => this.settings();
    this.el('collection-button').onclick = () => this.collection();
    this.el('skip-button').onclick = () => actions.skip();
    this.el('update-button').onclick = () => actions.update();
    root
      .querySelectorAll<HTMLButtonElement>('[data-move]')
      .forEach((button) =>
        this.bindHold(button, (down) => actions.move(button.dataset.move!, down)),
      );
    this.bindHold(this.el('star-button'), (down) => actions.star(down));
    this.renderForms();
  }
  el(id: string) {
    return this.root.querySelector<HTMLElement>(`#${id}`)!;
  }
  private bindHold(el: HTMLElement, fn: (down: boolean) => void) {
    el.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      try {
        el.setPointerCapture(event.pointerId);
      } catch {
        /* Synthetic or already cancelled pointer. */
      }
      el.classList.add('pressed');
      fn(true);
    });
    const release = () => {
      el.classList.remove('pressed');
      fn(false);
    };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('lostpointercapture', release);
  }
  renderForms(current = this.form) {
    this.form = current;
    const key = `${current}:${this.save.rescued.join(',')}`;
    if (key === this.previousForms) return;
    this.previousForms = key;
    const unlocked = [HUMAN, ...CREATURES.filter((c) => this.save.rescued.includes(c.id))];
    const scrollTop = this.el('forms').scrollTop;
    this.el('forms').innerHTML = unlocked
      .map(
        (c) =>
          `<button class="form-button ${c.id === current ? 'selected' : ''}" data-form="${c.id}" aria-label="Transform into ${c.name}" aria-pressed="${c.id === current}" style="--creature-color:${c.color}">${portrait(c.id, c.color)}<span>${c.id === 'human' ? 'Calvin' : c.name}</span></button>`,
      )
      .join('');
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-form]')
      .forEach((b) => (b.onclick = () => this.actions.form(b.dataset.form!)));
    this.el('forms').scrollTop = scrollTop;
    const selected = this.root.querySelector<HTMLElement>(`[data-form="${current}"]`);
    if (selected) {
      const list = this.el('forms');
      const selectedRect = selected.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();
      if (selectedRect.top < listRect.top || selectedRect.bottom > listRect.bottom)
        list.scrollTop +=
          selectedRect.top - listRect.top - (list.clientHeight - selectedRect.height) / 2;
    }
    this.el('rescue-count').textContent = `${this.save.rescued.length} / ${CREATURES.length}`;
    const c = getCreature(current);
    this.el('star-button').setAttribute('title', c.power);
    this.el('star-label').textContent =
      current === 'human'
        ? 'JUMP'
        : c.kind === 'fly'
          ? 'FLAP'
          : c.kind === 'swim'
            ? 'BOOST'
            : 'POWER';
  }
  biome(id: BiomeId) {
    this.currentBiome = id;
    const b = BIOMES.find((b) => b.id === id)!;
    this.el('biome-name').textContent = b.name;
  }
  toast(text: string) {
    this.hideDialogue();
    const el = this.el('toast');
    el.textContent = text;
    el.hidden = false;
    window.clearTimeout(this.messageTimer);
    this.messageTimer = window.setTimeout(() => (el.hidden = true), 3000);
  }
  dialogue(name: string, text: string) {
    // Deliberate interactions share one small message slot with rescue notices.
    this.el('toast').hidden = true;
    window.clearTimeout(this.dialogueTimer);
    const el = this.el('dialogue');
    el.replaceChildren();
    const strong = document.createElement('strong');
    strong.textContent = name;
    const p = document.createElement('p');
    p.textContent = text;
    el.append(strong, p);
    el.hidden = false;
    this.dialogueTimer = window.setTimeout(() => this.hideDialogue(), 3000);
  }
  hideDialogue() {
    window.clearTimeout(this.dialogueTimer);
    this.el('dialogue').hidden = true;
  }
  clearMessages() {
    this.hideDialogue();
    window.clearTimeout(this.messageTimer);
    this.el('toast').hidden = true;
  }
  arrival(name: string) {
    this.toast(name);
  }
  boss(name: string, hits: number, total: number, hearts: number) {
    const el = this.el('boss-hud');
    el.hidden = false;
    const key = `${name}:${hits}:${total}:${hearts}`;
    if (key === this.previousBoss) return;
    this.previousBoss = key;
    this.el('boss-name').textContent = name;
    this.el('boss-hearts').innerHTML = Array.from(
      { length: total },
      (_, i) => `<span class="${i < hearts ? 'full' : 'empty'}">${icon('heart', 28)}</span>`,
    ).join('');
    this.el('boss-hits').textContent = `${hits} / ${total} head boops`;
  }
  hideBoss() {
    this.el('boss-hud').hidden = true;
  }
  cutscene(text: string) {
    this.hideDialogue();
    this.el('toast').hidden = true;
    this.el('cutscene').hidden = false;
    this.el('hud').classList.add('cinematic');
    this.el('cutscene-text').textContent = text;
  }
  endCutscene() {
    this.el('cutscene').hidden = true;
    this.el('hud').classList.remove('cinematic');
  }
  close() {
    this.panel.hidden = true;
    this.el('hud').inert = false;
    this.returnFocus?.focus();
    this.panel.innerHTML = '';
    this.actions.pause(false);
  }
  private open(title: string, content: string, opener?: HTMLElement) {
    if (this.panel.hidden) this.returnFocus = opener ?? (document.activeElement as HTMLElement);
    this.el('hud').inert = true;
    this.hideDialogue();
    this.el('toast').hidden = true;
    this.actions.pause(true);
    this.panel.innerHTML = `<section class="panel" data-scroll-surface role="dialog" aria-modal="true" aria-label="${title}"><div class="panel-heading"><h2>${title}</h2><button id="close-panel" class="icon-button" aria-label="Close">${icon('close')}</button></div>${content}</section>`;
    this.panel.hidden = false;
    this.el('close-panel').onclick = () => this.close();
    this.el('close-panel').focus();
  }
  map() {
    this.open('World map', worldMap(this.save, this.currentBiome), this.el('map-button'));
    this.panel.querySelector('.panel')!.classList.add('world-map-panel');
    this.root.querySelectorAll<HTMLButtonElement>('[data-travel]').forEach(
      (b) =>
        (b.onclick = () => {
          this.close();
          this.actions.travel(b.dataset.travel as BiomeId);
        }),
    );
    this.el('home-button').onclick = () => {
      this.close();
      this.actions.travel('meadow');
    };
  }
  collection() {
    this.open(
      `Your wild friends · ${this.save.rescued.length}/${CREATURES.length}`,
      `<p class="panel-intro">Hop onto cage roofs to rescue friends. Tap any rescued friend to become them.</p>${this.save.secrets.includes('crystal-nook') ? `<p class="panel-intro">${icon('spark', 18)} Humming Crystal Nook discovered</p>` : ''}<div class="collection-grid">${[
        HUMAN,
        ...CREATURES,
      ]
        .map((c) => {
          const unlocked = c.id === 'human' || this.save.rescued.includes(c.id);
          return `<button data-choose="${c.id}" ${unlocked ? '' : 'disabled'}>${portrait(c.id, unlocked ? c.color : '#9bada2')}<strong>${c.name}</strong><small>${unlocked ? c.power : BIOMES.find((b) => b.id === c.biome)!.name}</small></button>`;
        })
        .join('')}</div>`,
      this.el('collection-button'),
    );
    this.root.querySelectorAll<HTMLButtonElement>('[data-choose]').forEach(
      (b) =>
        (b.onclick = () => {
          this.close();
          this.actions.form(b.dataset.choose!);
        }),
    );
  }
  settings() {
    this.open(
      'Take a breather',
      `<p class="panel-intro">Your adventure saves on this device. Come back whenever you like.</p><label class="setting-row">Sound <input id="muted-setting" type="checkbox" ${!this.save.settings.muted ? 'checked' : ''}></label><label class="setting-row">Volume <input id="volume-setting" type="range" min="0" max="1" step="0.05" value="${this.save.settings.volume}"></label><label class="setting-row">Gentle motion <input id="motion-setting" type="checkbox" ${this.save.settings.reducedMotion ? 'checked' : ''}></label><p class="install-note">On iPad: Safari → Share → Add to Home Screen. Open once online to pack your offline adventure.</p><div class="settings-actions"><button id="resume-button" class="primary-button">Keep exploring ${icon('play', 18)}</button><button id="help-button" class="secondary-button">How to play</button><button id="memory-button" class="secondary-button" ${this.save.defeated.includes('demon-lizard') ? '' : 'disabled'}>Replay the thank-you party</button><button id="reset-button" class="text-button">Start a new adventure…</button></div><small class="save-note">v0.5.0 · Local saves · Original creatures & music</small>`,
      this.el('pause-button'),
    );
    this.el('muted-setting').onchange = () => {
      this.save.settings.muted = !(this.el('muted-setting') as HTMLInputElement).checked;
      this.actions.settings();
    };
    this.el('volume-setting').oninput = () => {
      this.save.settings.volume = Number((this.el('volume-setting') as HTMLInputElement).value);
      this.actions.settings();
    };
    this.el('motion-setting').onchange = () => {
      this.save.settings.reducedMotion = (this.el('motion-setting') as HTMLInputElement).checked;
      this.actions.settings();
    };
    this.el('help-button').onclick = () => this.help();
    this.el('resume-button').onclick = () => this.close();
    this.el('memory-button').onclick = () => {
      this.close();
      this.actions.replay();
    };
    this.el('reset-button').onclick = () => this.confirmReset();
  }
  private help() {
    this.open(
      'Ready when you are',
      `<div class="play-help"><p>${icon('up')} Move with the arrow buttons, WASD, or keyboard arrows.</p><p>${icon('star')} Tap the star or press Space to jump. Land on a cage roof to free a friend.</p><p>${icon('paw')} Tap a friend on the left to become them. The star uses their power. Hold it to fly or swim up.</p><p>${icon('map')} Glowing rings lead to new places. The map lets you revisit them.</p><p>You can’t lose. Explore as much as you like.</p></div><button id="help-done" class="primary-button">Let’s explore ${icon('play', 18)}</button>`,
    );
    this.el('help-done').onclick = () => this.close();
  }
  private confirmReset() {
    this.open(
      'Start over?',
      `<p class="panel-intro">This clears all rescued friends and boss victories on this device. Your current adventure will be gone.</p><div class="settings-actions"><button id="keep-save" class="primary-button">Keep my adventure</button><button id="confirm-reset" class="secondary-button">Clear save and start again</button></div>`,
    );
    this.el('keep-save').onclick = () => this.settings();
    this.el('confirm-reset').onclick = () => {
      this.close();
      this.actions.reset();
    };
  }
}
