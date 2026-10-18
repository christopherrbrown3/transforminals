import { BIOMES, CREATURES, HUMAN, getCreature, type BiomeId } from '../game/data';
import type { SaveData } from '../game/progression';
import { icon, portrait } from './icons';
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
  private previousForms = '';
  private form = 'human';
  constructor(
    private root: HTMLElement,
    private actions: UIActions,
    private save: SaveData,
  ) {
    root.innerHTML = `<canvas id="world" aria-label="Transforminals 3D adventure"></canvas>
 <div id="hud" hidden>
 <header class="topbar"><div class="location"><span class="location-mark">${icon('paw', 22)}</span><div><strong id="biome-name">Clover Meadow</strong><small id="biome-subtitle">A little jump. A big adventure.</small></div></div><div class="top-actions"><div class="progress-pill">${icon('paw', 20)}<strong id="rescue-count">0 / ${CREATURES.length}</strong><span>rescued</span></div><button id="map-button" class="icon-button" aria-label="World map">${icon('map')}</button><button id="pause-button" class="icon-button" aria-label="Pause and settings">${icon('pause')}</button></div></header>
 <aside class="forms-bar" aria-label="Your transformations"><span class="rail-label">BE YOU</span><div id="forms"></div><button id="collection-button" class="collection-button" aria-label="Animal collection">${icon('paw')}<span>Friends</span></button></aside>
 <div id="boss-hud" hidden><strong id="boss-name"></strong><div id="boss-hearts"></div><span id="boss-hits"></span></div>
 <div id="discovery" hidden></div><div id="dialogue" hidden role="status"></div><div id="toast" hidden role="status"></div>
 <div class="bottom-note"><div id="guide">Jump onto the cage to rescue your first friend.</div><span id="form-name">Calvin</span> <span class="dot">·</span> <span id="power-name">Jump</span><small class="desktop-help">WASD / arrows to move · Space to jump · M for map</small></div>
 <div class="touch-controls"><button id="star-button" aria-label="Jump or use power">${icon('star', 38)}<span id="star-label">JUMP</span></button><div class="dpad" aria-label="Movement controls"><button data-move="forward" class="forward" aria-label="Move forward">${icon('up', 32)}</button><button data-move="left" class="left" aria-label="Move left">${icon('left', 32)}</button><button data-move="backward" class="backward" aria-label="Move backward">${icon('down', 32)}</button><button data-move="right" class="right" aria-label="Move right">${icon('right', 32)}</button><i></i></div></div>
 <button id="update-button" hidden>A fresh adventure update is ready</button><div id="cutscene" hidden><p id="cutscene-text"></p><button id="skip-button">Skip ${icon('right', 18)}</button></div>
 </div>
 <section id="title-screen" class="title-screen"><div class="title-copy"><div class="calvin-badge">${icon('spark', 18)} A wild adventure by Calvin</div><h1>TRANS<span>FORMINALS</span></h1><p class="title-tagline">Little rescues.<br>Enormous possibilities.</p><p class="title-description">Jump on cages. Make new friends.<br>Become anyone you rescue.</p><button id="start-button" class="primary-button">${icon('play', 23)} ${save.rescued.length ? 'Continue adventure' : 'Let’s get wild'}</button><p class="title-note">No lives to lose. Just a whole world to find.</p></div><div class="title-world-label">CLOVER MEADOW <span>your adventure starts here</span></div><span class="version">v0.1 · Made for Calvin</span></section>
 <section id="panel" class="panel-backdrop" hidden></section><div id="loading" hidden>Growing a new corner of the world…</div><div id="rotate-hint">More room for adventure in landscape.</div>`;
    this.panel = this.el('panel');
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
    this.el('forms').innerHTML = unlocked
      .map(
        (c) =>
          `<button class="form-button ${c.id === current ? 'selected' : ''}" data-form="${c.id}" aria-label="Transform into ${c.name}" aria-pressed="${c.id === current}" style="--creature-color:${c.color}">${portrait(c.id, c.color)}<span>${c.id === 'human' ? 'Calvin' : c.name}</span></button>`,
      )
      .join('');
    this.root
      .querySelectorAll<HTMLButtonElement>('[data-form]')
      .forEach((b) => (b.onclick = () => this.actions.form(b.dataset.form!)));
    this.el('rescue-count').textContent = `${this.save.rescued.length} / ${CREATURES.length}`;
    const c = getCreature(current);
    this.el('form-name').textContent = c.name;
    this.el('power-name').textContent = c.power;
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
    const b = BIOMES.find((b) => b.id === id)!;
    this.el('biome-name').textContent = b.name;
    this.el('biome-subtitle').textContent = b.subtitle;
  }
  guide(text: string) {
    this.el('guide').textContent = text;
  }
  toast(text: string) {
    const el = this.el('toast');
    el.textContent = text;
    el.hidden = false;
    window.clearTimeout(this.messageTimer);
    this.messageTimer = window.setTimeout(() => (el.hidden = true), 4200);
  }
  dialogue(name: string, text: string) {
    const el = this.el('dialogue');
    el.innerHTML = '';
    const strong = document.createElement('strong');
    strong.textContent = name;
    const p = document.createElement('p');
    p.textContent = text;
    el.append(strong, p);
    el.hidden = false;
  }
  hideDialogue() {
    this.el('dialogue').hidden = true;
  }
  arrival(name: string) {
    this.el('discovery').textContent = name;
    this.el('discovery').hidden = false;
    window.setTimeout(() => (this.el('discovery').hidden = true), 2400);
  }
  boss(name: string, hits: number, total: number, hearts: number) {
    const el = this.el('boss-hud');
    el.hidden = false;
    this.el('boss-name').textContent = name;
    this.el('boss-hearts').innerHTML = Array.from(
      { length: 3 },
      (_, i) => `<span class="${i < hearts ? 'full' : 'empty'}">${icon('heart', 28)}</span>`,
    ).join('');
    this.el('boss-hits').textContent = `${hits} / ${total} head boops`;
  }
  hideBoss() {
    this.el('boss-hud').hidden = true;
  }
  cutscene(text: string) {
    this.el('cutscene').hidden = false;
    this.el('cutscene-text').textContent = text;
  }
  endCutscene() {
    this.el('cutscene').hidden = true;
  }
  close() {
    this.panel.hidden = true;
    this.panel.innerHTML = '';
    this.actions.pause(false);
  }
  private open(title: string, content: string) {
    this.actions.pause(true);
    this.panel.innerHTML = `<section class="panel" role="dialog" aria-modal="true" aria-label="${title}"><div class="panel-heading"><h2>${title}</h2><button id="close-panel" class="icon-button" aria-label="Close">${icon('close')}</button></div>${content}</section>`;
    this.panel.hidden = false;
    this.el('close-panel').onclick = () => this.close();
    this.el('close-panel').focus();
  }
  map() {
    this.open(
      'A whole wild world',
      `<p class="panel-intro">Walk into the glowing rings to discover places. Revisit them here anytime.</p><div class="map-grid">${BIOMES.map((b, i) => `<button data-travel="${b.id}" ${this.save.discovered.includes(b.id) ? '' : 'disabled'} style="--biome-color:${b.color}"><span class="map-number">${String(i + 1).padStart(2, '0')}</span><strong>${b.name}</strong><small>${this.save.discovered.includes(b.id) ? `${CREATURES.filter((c) => c.biome === b.id && this.save.rescued.includes(c.id)).length}/${CREATURES.filter((c) => c.biome === b.id).length} friends rescued` : 'Find a ring to discover'}</small></button>`).join('')}</div><button id="home-button" class="secondary-button">${icon('home', 20)} Return to Meadow</button>`,
    );
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
      `<p class="panel-intro">Hop onto cage roofs to rescue friends. Tap any rescued friend to become them.</p><div class="collection-grid">${[
        HUMAN,
        ...CREATURES,
      ]
        .map((c) => {
          const unlocked = c.id === 'human' || this.save.rescued.includes(c.id);
          return `<button data-choose="${c.id}" ${unlocked ? '' : 'disabled'}>${portrait(c.id, unlocked ? c.color : '#9bada2')}<strong>${c.name}</strong><small>${unlocked ? c.power : BIOMES.find((b) => b.id === c.biome)!.name}</small></button>`;
        })
        .join('')}</div>`,
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
      `<p class="panel-intro">Your adventure saves on this device. Come back whenever you like.</p><label class="setting-row">Sound <input id="muted-setting" type="checkbox" ${!this.save.settings.muted ? 'checked' : ''}></label><label class="setting-row">Volume <input id="volume-setting" type="range" min="0" max="1" step="0.05" value="${this.save.settings.volume}"></label><label class="setting-row">Gentle motion <input id="motion-setting" type="checkbox" ${this.save.settings.reducedMotion ? 'checked' : ''}></label><p class="install-note">On iPad: Safari → Share → Add to Home Screen. Open once online to pack your offline adventure.</p><div class="settings-actions"><button id="resume-button" class="primary-button">Keep exploring ${icon('play', 18)}</button><button id="memory-button" class="secondary-button" ${this.save.defeated.includes('demon-lizard') ? '' : 'disabled'}>Replay the thank-you party</button><button id="reset-button" class="text-button">Start a new adventure…</button></div><small class="save-note">v0.1.0 · Local saves · Original creatures & music</small>`,
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
    this.el('resume-button').onclick = () => this.close();
    this.el('memory-button').onclick = () => {
      this.close();
      this.actions.replay();
    };
    this.el('reset-button').onclick = () => this.confirmReset();
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
