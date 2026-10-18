import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createCreature, createBoss, animateCreature, batchCreatureMeshes } from './creatures';
import { buildWorld, type BuiltWorld } from './world';
import {
  BIOMES,
  BOSSES,
  CAGE_POSITIONS,
  CREATURES,
  getBiome,
  getCreature,
  type BiomeId,
  type Boss,
} from './data';
import {
  bossHearts,
  cageLanding,
  canEnterFinal,
  canTransform,
  headStompEligible,
  rescue,
} from './progression';
import { SaveManager } from './save';
import { AudioManager } from './audio';
import { Effects, label, disposeObject } from './effects';
import { UI } from '../ui/ui';
export type GameState = 'menu' | 'playing' | 'paused' | 'cutscene' | 'transition';
interface Cage {
  id: string;
  x: number;
  z: number;
  group: THREE.Group;
  bars: THREE.Group;
  animal: THREE.Group;
  rescued: boolean;
  age: number;
}
interface NPC {
  model: THREE.Group;
  origin: THREE.Vector3;
  name: string;
  line: number;
  wobble: number;
}
interface Encounter {
  data: Boss;
  model: THREE.Group;
  hits: number;
  cooldown: number;
  active: boolean;
  defeating: number;
}
interface Portal {
  group: THREE.Group;
  x: number;
  z: number;
  destination: BiomeId;
}
interface SceneTimeline {
  elapsed: number;
  duration: number;
  finish: () => void;
  kind: 'intro' | 'defeat' | 'victory';
}
export class Game {
  state: GameState = 'menu';
  biome: BiomeId = 'meadow';
  form = 'human';
  player = { x: 0, y: 0, z: 7, vy: 0 };
  readonly saves: SaveManager;
  readonly audio = new AudioManager();
  readonly ui: UI;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(48, 1, 0.1, 160);
  private world!: BuiltWorld;
  private region = new THREE.Group();
  private avatar = new THREE.Group();
  private effects: Effects;
  private cages: Cage[] = [];
  private npcs: NPC[] = [];
  private portals: Portal[] = [];
  private encounter: Encounter | null = null;
  private gate: THREE.Group | null = null;
  private input = new Set<string>();
  private starHeld = false;
  private jumpCooldown = 0;
  private powerTime = 0;
  private lastTime = 0;
  private elapsed = 0;
  private saveTime = 0;
  private portalCooldown = 0;
  private dialogueTime = 0;
  private hudTime = 0;
  private timeline: SceneTimeline | null = null;
  private introduced = new Set<string>();
  private celebration: THREE.Group | null = null;
  private celebrationTime = 0;
  private lastSafe = { x: 0, z: 7 };
  private qualityTime = 0;
  private qualityFrames = 0;
  private foxAsset: THREE.Group | null = null;
  private foxClips: THREE.AnimationClip[] = [];
  private mixer: THREE.AnimationMixer | null = null;
  private foxPromise: Promise<void>;
  private shadow: THREE.Mesh;
  private updateReady = false;
  private updateAction?: () => void;
  constructor(root: HTMLElement) {
    let storage: Storage;
    try {
      storage = window.localStorage;
    } catch {
      storage = {
        getItem: () => null,
        setItem: () => {
          throw new Error('Storage unavailable');
        },
        removeItem: () => {},
        clear: () => {},
        key: () => null,
        length: 0,
      };
    }
    this.saves = new SaveManager(storage);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      this.saves.data.settings.reducedMotion = true;
    this.ui = new UI(
      root,
      {
        start: () => this.start(),
        move: (key, down) => this.move(key, down),
        star: (down) => this.star(down),
        form: (id) => this.transform(id),
        pause: (paused) => this.pause(paused),
        travel: (id) => this.travel(id),
        settings: () => this.settings(),
        reset: () => this.reset(),
        replay: () => this.victory(true),
        skip: () => this.skip(),
        update: () => this.activateUpdate(),
      },
      this.saves.data,
    );
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.ui.el('world') as HTMLCanvasElement,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.scene.add(new THREE.HemisphereLight(0xfff5dc, 0x6f8e7a, 2.3));
    const sun = new THREE.DirectionalLight(0xfff3d0, 3.1);
    sun.position.set(-15, 35, 15);
    this.scene.add(sun);
    this.effects = new Effects(this.scene);
    this.scene.add(this.avatar);
    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.65, 20),
      new THREE.MeshBasicMaterial({
        color: 0x244e3b,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.shadow);
    this.foxPromise = new GLTFLoader()
      .loadAsync('/models/fox.glb')
      .then((gltf) => {
        this.foxAsset = gltf.scene;
        this.foxClips = gltf.animations;
        batchCreatureMeshes(this.foxAsset);
        this.foxAsset.name = 'CloverFoxBlender';
        if (this.form === 'fox') this.replaceAvatar();
      })
      .catch(() => {
        /* The procedural fox remains playable if the optional GLB fails. */
      });
    this.loadBiome('meadow', false);
    this.replaceAvatar();
    this.settings();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', (event) => this.key(event, true));
    window.addEventListener('keyup', (event) => this.key(event, false));
    window.addEventListener('blur', () => {
      this.releaseInputs();
      if (this.state === 'playing') this.ui.settings();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.releaseInputs();
        this.persist();
        if (this.state === 'playing') this.ui.settings();
      }
    });
    window.addEventListener('pagehide', () => this.persist());
    const canvas = this.ui.el('world');
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.pause(true);
      this.ui.toast('The picture needs a breather. Your adventure is saved. Reload to continue.');
    });
    requestAnimationFrame((t) => this.frame(t));
    if (new URLSearchParams(location.search).has('test')) this.exposeTests();
  }
  private resize() {
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }
  private settings() {
    const s = this.saves.data.settings;
    this.audio.muted = s.muted;
    this.audio.volume = s.volume;
    this.effects.reduced = s.reducedMotion;
    this.saves.save();
  }
  start() {
    this.audio.start();
    const loc = this.saves.data.location;
    this.loadBiome(loc.biome as BiomeId, false);
    this.player.x = loc.x;
    this.player.z = loc.z;
    this.player.y = 0;
    this.lastSafe = { x: loc.x, z: loc.z };
    this.form = canTransform(this.saves.data, this.saves.data.form)
      ? this.saves.data.form
      : 'human';
    this.replaceAvatar();
    this.ui.renderForms(this.form);
    this.state = 'playing';
    this.snapCamera();
    if (this.saves.warning) this.ui.toast(this.saves.warning);
    else if (!this.saves.data.rescued.length) {
      this.ui.dialogue(
        'Pip, picnic inspector',
        'Welcome, Calvin! Jump onto that fox’s cage. You’ll become the friend you rescue.',
      );
      this.dialogueTime = 7;
    } else this.ui.toast('Welcome back! Your wild friends missed you.');
    void this.foxPromise;
  }
  move(key: string, down: boolean) {
    if (down && this.state === 'playing') this.input.add(key);
    else this.input.delete(key);
  }
  private key(event: KeyboardEvent, down: boolean) {
    if (event.target instanceof HTMLInputElement) return;
    const keys: Record<string, string> = {
      KeyW: 'forward',
      ArrowUp: 'forward',
      KeyS: 'backward',
      ArrowDown: 'backward',
      KeyA: 'left',
      ArrowLeft: 'left',
      KeyD: 'right',
      ArrowRight: 'right',
    };
    if (keys[event.code]) {
      event.preventDefault();
      this.move(keys[event.code], down);
    }
    if (event.code === 'Space') {
      event.preventDefault();
      if (!event.repeat) this.star(down);
    }
    if (down && !event.repeat && event.code === 'KeyM' && this.state === 'playing') this.ui.map();
    if (down && !event.repeat && event.code === 'Escape') {
      if (!this.ui.el('panel').hidden) this.ui.close();
      else if (this.state === 'cutscene') this.skip();
      else if (this.state === 'playing') this.ui.settings();
    }
    if (down && !event.repeat && event.code === 'KeyH' && this.state === 'playing')
      this.travel('meadow');
  }
  private releaseInputs() {
    this.input.clear();
    this.starHeld = false;
  }
  pause(paused: boolean) {
    if (this.state === 'menu') return;
    if (paused) {
      this.state = 'paused';
      this.releaseInputs();
      this.audio.pause();
      this.persist();
    } else {
      this.state = this.timeline ? 'cutscene' : 'playing';
      this.audio.resume();
    }
  }
  private star(down: boolean) {
    this.starHeld = down && this.state === 'playing';
    if (!down || this.state !== 'playing') return;
    this.audio.start();
    this.jump();
  }
  private jump() {
    if (this.jumpCooldown > 0) return;
    const creature = getCreature(this.form);
    const swimming = this.biome === 'ocean' || (this.biome === 'beach' && this.player.x < -20);
    if (this.player.y < 0.15 || creature.kind === 'fly' || swimming) {
      const nearBoss =
        this.encounter?.active &&
        Math.hypot(
          this.player.x - this.encounter.model.position.x,
          this.player.z - this.encounter.model.position.z,
        ) < 7;
      this.player.vy = nearBoss
        ? this.encounter?.data.id === 'demon-lizard'
          ? 16.5
          : 12
        : swimming
          ? 4.8
          : ['giraffe', 'tiger'].includes(creature.id)
            ? 10.8
            : 9.6;
      this.jumpCooldown = 0.32;
      this.powerTime = 1.2;
      this.audio.play('jump');
      this.effects.burst(
        new THREE.Vector3(this.player.x, 0.5 + this.player.y, this.player.z),
        new THREE.Color(creature.color).getHex(),
        22,
      );
      for (const npc of this.npcs)
        if (npc.model.position.distanceTo(new THREE.Vector3(this.player.x, 0, this.player.z)) < 4) {
          npc.wobble = 1;
          this.ui.dialogue(
            npc.name,
            this.biome === 'ocean'
              ? 'Ba da bop! That’s my original jazz number.'
              : 'Boing! Ten out of ten for silliness.',
          );
          this.dialogueTime = 3;
        }
      if (this.form === 'mecha-reptile') {
        const beam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.3, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0x92f9ee }),
        );
        beam.rotation.x = Math.PI / 2;
        beam.position.set(this.player.x, this.player.y + 1.5, this.player.z - 4);
        this.region.add(beam);
        window.setTimeout(() => {
          this.region.remove(beam);
          disposeObject(beam);
        }, 220);
      }
    }
  }
  transform(id: string) {
    if (this.state !== 'playing' || !canTransform(this.saves.data, id)) return;
    this.form = id;
    this.saves.data.form = id;
    this.saves.save();
    this.replaceAvatar();
    this.effects.burst(
      new THREE.Vector3(this.player.x, this.player.y + 1, this.player.z),
      new THREE.Color(getCreature(id).color).getHex(),
      70,
    );
    this.audio.play('transform');
    this.ui.renderForms(id);
    this.ui.toast(`${getCreature(id).name}! ${getCreature(id).power} with the star.`);
  }
  private replaceAvatar() {
    const old = this.avatar;
    const rotation = old.rotation.y;
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(old);
      this.mixer = null;
    }
    this.scene.remove(old);
    if (!old.userData.sharedAsset) disposeObject(old);
    this.avatar =
      this.form === 'fox' && this.foxAsset ? this.foxAsset.clone(true) : createCreature(this.form);
    this.avatar.userData.sharedAsset = this.form === 'fox' && !!this.foxAsset;
    this.avatar.rotation.y = rotation;
    if (getCreature(this.form).kind === 'giant') this.avatar.scale.setScalar(2);
    this.scene.add(this.avatar);
    if (this.avatar.userData.sharedAsset) {
      this.mixer = new THREE.AnimationMixer(this.avatar);
      for (const clip of this.foxClips) this.mixer.clipAction(clip).play();
    }
  }
  travel(id: BiomeId) {
    if (this.state === 'cutscene') return;
    this.persist();
    this.state = 'transition';
    this.releaseInputs();
    this.effects.clear();
    this.loadBiome(id, true);
    this.player = { x: 0, y: 0, z: 5, vy: 0 };
    this.lastSafe = { x: 0, z: 5 };
    this.portalCooldown = 2;
    this.state = 'playing';
    this.audio.play('portal');
    this.snapCamera();
    this.persist();
  }
  private loadBiome(id: BiomeId, announce: boolean) {
    const previous = this.region;
    this.scene.remove(previous);
    disposeObject(previous);
    this.region = new THREE.Group();
    this.scene.add(this.region);
    this.biome = getBiome(id).id;
    this.world = buildWorld(this.biome);
    this.region.add(this.world.group);
    this.scene.background = new THREE.Color(this.world.sky);
    this.scene.fog = new THREE.Fog(this.world.sky, 45, 105);
    this.cages = [];
    this.npcs = [];
    this.portals = [];
    this.encounter = null;
    this.gate = null;
    this.ui.hideBoss();
    this.ui.hideDialogue();
    this.timeline = null;
    this.ui.endCutscene();
    document.body.classList.toggle(
      'dark-biome',
      ['ocean', 'underground', 'rifts', 'volcano'].includes(id),
    );
    if (!this.saves.data.discovered.includes(id)) {
      this.saves.data.discovered.push(id);
      if (announce) this.ui.arrival(getBiome(id).name);
    }
    if (!this.saves.data.portals.includes(id)) this.saves.data.portals.push(id);
    const local = CREATURES.filter((c) => c.biome === this.biome);
    local.forEach((creature, i) => {
      if (!this.saves.data.rescued.includes(creature.id)) {
        const [x, z] = CAGE_POSITIONS[i];
        this.addCage(creature.id, x, z);
      }
    });
    this.addPortals();
    this.addWildlife();
    this.addBoss();
    this.ui.biome(this.biome);
    this.ui.renderForms(this.form);
    this.portalCooldown = 1;
    this.updateGuide();
  }
  private addCage(id: string, x: number, z: number) {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    const bars = new THREE.Group();
    group.add(bars);
    const steel = new THREE.MeshStandardMaterial({
      color: 0x7eaa9b,
      metalness: 0.15,
      roughness: 0.65,
    });
    const wood = new THREE.MeshStandardMaterial({ color: 0xe0bc7d, roughness: 1 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.18, 3.7), wood);
    base.position.y = 0.09;
    bars.add(base);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.18, 3.8), wood);
    roof.position.y = 1.4;
    bars.add(roof);
    const rods = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 1.2, 0.07), steel, 20);
    const matrix = new THREE.Matrix4();
    let rod = 0;
    for (let i = 0; i < 5; i++)
      for (const side of [-1, 1]) {
        matrix.makeTranslation(-1.7 + i * 0.85, 0.75, side * 1.7);
        rods.setMatrixAt(rod++, matrix);
        matrix.makeTranslation(side * 1.7, 0.75, -1.7 + i * 0.85);
        rods.setMatrixAt(rod++, matrix);
      }
    bars.add(rods);
    const lock = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.5, 0.16),
      new THREE.MeshStandardMaterial({ color: 0xf6d168 }),
    );
    lock.position.set(0, 0.8, 1.82);
    bars.add(lock);
    const pad = new THREE.Mesh(
      new THREE.CircleGeometry(0.7, 24),
      new THREE.MeshBasicMaterial({ color: 0xffe09a }),
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 1.501;
    bars.add(pad);
    const animal = createCreature(id);
    animal.scale.setScalar(0.55);
    animal.position.y = 0.18;
    group.add(animal);
    const tag = label(`${getCreature(id).name} · jump here`, '#fff5dc', 5.7);
    tag.position.y = 3;
    group.add(tag);
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 6, 8),
      new THREE.MeshBasicMaterial({
        color: 0xffe497,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      }),
    );
    beacon.position.y = 4.4;
    bars.add(beacon);
    this.region.add(group);
    this.cages.push({ id, x, z, group, bars, animal, rescued: false, age: 0 });
  }
  private rescueCage(cage: Cage) {
    if (!rescue(this.saves.data, cage.id)) return;
    cage.rescued = true;
    cage.age = 0;
    this.effects.burst(new THREE.Vector3(cage.x, 2, cage.z), 0xffd268, 100);
    this.audio.play('rescue');
    this.ui.renderForms(this.form);
    this.ui.toast(`${getCreature(cage.id).name} rescued! Tap your new friend on the left.`);
    this.saves.save();
    if (canEnterFinal(this.saves.data.rescued)) {
      this.ui.toast('Every friend is free! The Demon Lizard arena in Big Little City is open!');
      // The last cage may be in this region: open the arena immediately, without a reload.
      if (this.gate) {
        this.region.remove(this.gate);
        disposeObject(this.gate);
        this.gate = null;
        this.addBoss();
      }
    }
    this.updateGuide();
  }
  private addPortals() {
    const index = BIOMES.findIndex((b) => b.id === this.biome);
    const targets: [number, BiomeId][] = [
      [-28, BIOMES[(index + BIOMES.length - 1) % BIOMES.length].id],
      [0, 'meadow'],
      [28, BIOMES[(index + 1) % BIOMES.length].id],
    ];
    if (this.biome === 'meadow') targets[1] = [0, 'rifts'];
    for (const [x, destination] of targets) {
      const group = new THREE.Group();
      const z = x === 0 ? -38 : -30;
      group.position.set(x, 0, z);
      const color =
        destination === 'meadow' ? 0x8dd6a9 : destination === 'rifts' ? 0xc9a5ef : 0xffd387;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2, 0.28, 6, 24),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.28 }),
      );
      ring.position.y = 2.3;
      group.add(ring);
      const veil = new THREE.Mesh(
        new THREE.CircleGeometry(1.75, 24),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.24,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      veil.position.set(0, 2.3, 0.02);
      group.add(veil);
      const tag = label(getBiome(destination).name, '#fff5dc', 6);
      tag.position.y = 5.3;
      group.add(tag);
      this.region.add(group);
      this.portals.push({ group, x, z, destination });
    }
  }
  private addWildlife() {
    const local = CREATURES.filter((c) => c.biome === this.biome);
    for (let i = 0; i < 3; i++) {
      const animal = createCreature(local[i % local.length].id);
      animal.scale.setScalar(0.85);
      const x = i === 0 ? 5 : i === 1 ? -17 : 17;
      const z = i === 0 ? 0 : i === 1 ? -2 : -5;
      animal.position.set(x, 0, z);
      this.region.add(animal);
      this.npcs.push({
        model: animal,
        origin: new THREE.Vector3(x, 0, z),
        name: i === 0 ? getBiome(this.biome).npc : getCreature(local[i % local.length].id).name,
        line: i,
        wobble: 0,
      });
    }
    if (this.biome === 'ocean') {
      // An original boy siren: sailor vest, fin tail and a tiny jazz stage.
      const npc = this.npcs[0];
      this.region.remove(npc.model);
      disposeObject(npc.model);
      npc.model = createCreature('human');
      npc.model.position.copy(npc.origin);
      const tail = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 1.2, 4),
        new THREE.MeshStandardMaterial({ color: 0x72c9bc }),
      );
      tail.rotation.x = Math.PI / 2;
      tail.position.set(0, 0.35, 0.7);
      npc.model.add(tail);
      this.region.add(npc.model);
      const tag = label('Jazzy Finn · original jazz', '#ffe5a0', 5.4);
      tag.position.set(5, 3.2, 0);
      this.region.add(tag);
    }
  }
  private addBoss() {
    const data = BOSSES.find((b) => b.biome === this.biome);
    if (!data || this.saves.data.defeated.includes(data.id)) return;
    if (data.id === 'demon-lizard' && !canEnterFinal(this.saves.data.rescued)) {
      this.gate = new THREE.Group();
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(11, 3.2, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xa7b5b6, transparent: true, opacity: 0.65 }),
      );
      door.position.y = 1.6;
      this.gate.add(door);
      const text = label(
        `Arena opens: ${this.saves.data.rescued.length}/${CREATURES.length} rescued`,
        '#fff3c5',
        10,
      );
      text.position.y = 4;
      this.gate.add(text);
      this.gate.position.set(0, 0, -18);
      this.region.add(this.gate);
      return;
    }
    const model = createBoss(data.id);
    const size = data.id === 'demon-lizard' ? 1.7 : 1;
    model.scale.setScalar(size);
    model.userData.baseScale = size;
    model.userData.headHeight = Number(model.userData.headHeight) * size;
    model.position.set(0, 0, -19);
    model.rotation.y = 0;
    this.region.add(model);
    const tag = label(`${data.name} · head boops!`, '#ffe5a0', 6.2);
    tag.position.y = data.id === 'demon-lizard' ? 4.8 : 4.6;
    model.add(tag);
    this.encounter = { data, model, hits: 0, cooldown: 0, active: false, defeating: 0 };
    const pad = new THREE.Mesh(
      new THREE.RingGeometry(3.6, 4, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffdc87,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      }),
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(0, 0.06, -19);
    this.region.add(pad);
  }
  private beginBoss(enc: Encounter) {
    enc.active = true;
    this.ui.hideDialogue();
    this.ui.boss(enc.data.name, enc.hits, enc.data.hits, bossHearts(enc.hits, enc.data.hits));
    if (this.introduced.has(enc.data.id)) return;
    this.introduced.add(enc.data.id);
    this.beginCutscene(enc.data.intro, 2.8, 'intro', () => {});
  }
  private beginCutscene(
    text: string,
    duration: number,
    kind: SceneTimeline['kind'],
    finish: () => void,
  ) {
    this.releaseInputs();
    this.state = 'cutscene';
    this.timeline = { elapsed: 0, duration, kind, finish };
    this.ui.cutscene(text);
  }
  private skip() {
    if (!this.timeline) return;
    const finish = this.timeline.finish;
    this.timeline = null;
    this.ui.endCutscene();
    this.state = 'playing';
    finish();
    this.snapCamera();
  }
  private stomp(enc: Encounter) {
    if (enc.cooldown > 0 || enc.defeating > 0) return;
    enc.hits++;
    enc.cooldown = 0.55;
    this.player.y =
      Number(enc.model.userData.headHeight ?? (enc.data.id === 'demon-lizard' ? 3.39 : 2.49)) +
      0.15;
    this.player.vy = 9.5;
    this.effects.burst(
      new THREE.Vector3(enc.model.position.x, this.player.y, enc.model.position.z),
      0xffe298,
      55,
    );
    this.audio.play('hit');
    this.ui.boss(enc.data.name, enc.hits, enc.data.hits, bossHearts(enc.hits, enc.data.hits));
    this.ui.toast(`BOING! ${enc.hits} / ${enc.data.hits} head boops!`);
    if (enc.hits >= enc.data.hits) {
      this.saves.data.defeated.push(enc.data.id);
      this.saves.save();
      if (enc.data.id === 'demon-lizard') {
        enc.defeating = 0.001;
        this.victory(false);
      } else {
        enc.defeating = 0.001;
        this.audio.play(enc.data.id === 'flushington' ? 'flush' : 'victory');
        this.beginCutscene(enc.data.outro, 3, 'defeat', () => this.removeBoss());
      }
    }
  }
  private removeBoss() {
    if (!this.encounter) return;
    this.region.remove(this.encounter.model);
    disposeObject(this.encounter.model);
    this.encounter = null;
    this.ui.hideBoss();
    this.updateGuide();
  }
  private victory(replay: boolean) {
    if (this.state === 'menu' || this.timeline || this.celebration) return;
    this.celebrationTime = 0;
    this.celebration = new THREE.Group();
    this.region.add(this.celebration);
    CREATURES.forEach((c, i) => {
      const animal = createCreature(c.id);
      animal.scale.setScalar(0.65);
      const a = (i / CREATURES.length) * Math.PI * 2;
      animal.position.set(this.player.x + Math.sin(a) * 6, 0, this.player.z + Math.cos(a) * 6);
      animal.rotation.y = a;
      this.celebration!.add(animal);
    });
    const thanks = label('THANK YOU, CALVIN!', '#ffdf7e', 12);
    thanks.position.set(this.player.x, 6, this.player.z);
    this.celebration.add(thanks);
    this.effects.burst(new THREE.Vector3(this.player.x, 4, this.player.z), 0xffd46e, 180);
    this.audio.play('victory');
    this.beginCutscene(
      replay
        ? 'THANK YOU! Your friends remember the day you saved the world.'
        : 'You did it, Calvin! Every friend is free. The adventure is yours forever.',
      7,
      'victory',
      () => {
        if (!replay) this.removeBoss();
        if (this.celebration) {
          this.region.remove(this.celebration);
          disposeObject(this.celebration);
          this.celebration = null;
        }
        this.ui.toast('World saved. Keep exploring, transforming, and being wonderfully wild!');
      },
    );
  }
  private updateGuide() {
    const remaining = this.cages.filter((c) => !c.rescued);
    if (remaining.length) {
      const nearest = remaining.reduce((a, b) =>
        Math.hypot(a.x - this.player.x, a.z - this.player.z) <
        Math.hypot(b.x - this.player.x, b.z - this.player.z)
          ? a
          : b,
      );
      const dx = nearest.x - this.player.x,
        dz = nearest.z - this.player.z;
      const dir =
        Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'right' : 'left') : dz < 0 ? 'ahead' : 'behind';
      const dist = Math.round(Math.hypot(dx, dz));
      this.ui.guide(
        `${getCreature(nearest.id).name} ${dir} · ${dist < 4 ? 'jump onto the roof!' : `${dist} steps to a new friend`}`,
      );
    } else if (this.biome === 'city' && !this.saves.data.defeated.includes('demon-lizard'))
      this.ui.guide(
        canEnterFinal(this.saves.data.rescued)
          ? 'The Demon Lizard is ready. Five head boops. You’ve got this!'
          : `${CREATURES.length - this.saves.data.rescued.length} more friends need rescuing. Follow the rings!`,
      );
    else
      this.ui.guide(
        this.encounter
          ? 'Try head boops on the silly boss, or explore the glowing rings.'
          : 'All local friends are free! Glowing rings lead to your next adventure.',
      );
  }
  private persist() {
    if (this.state === 'menu') return;
    this.saves.data.location = { biome: this.biome, x: this.lastSafe.x, z: this.lastSafe.z };
    this.saves.save();
  }
  private reset() {
    // Pagehide must not autosave the old region over the fresh adventure.
    this.state = 'menu';
    this.saves.reset();
    location.reload();
  }
  private snapCamera() {
    this.camera.position.set(this.player.x + 3, 12 + this.player.y * 0.35, this.player.z + 17);
    this.camera.lookAt(this.player.x, 1 + this.player.y * 0.5, this.player.z - 3);
  }
  private updatePlayer(dt: number) {
    const c = getCreature(this.form);
    let dx = (this.input.has('right') ? 1 : 0) - (this.input.has('left') ? 1 : 0),
      dz = (this.input.has('backward') ? 1 : 0) - (this.input.has('forward') ? 1 : 0);
    const length = Math.hypot(dx, dz);
    const moving = length > 0;
    if (moving) {
      dx /= length;
      dz /= length;
      const speed =
        c.speed *
        (this.powerTime > 0 && (['fox', 'arctic-fox', 'rat'].includes(c.id) || c.kind === 'swim')
          ? 1.5
          : 1);
      this.player.x += dx * speed * dt;
      this.player.z += dz * speed * dt;
      const angle = Math.atan2(-dx, -dz);
      this.avatar.rotation.y +=
        Math.atan2(
          Math.sin(angle - this.avatar.rotation.y),
          Math.cos(angle - this.avatar.rotation.y),
        ) * Math.min(1, dt * 13);
    }
    for (const obstacle of this.world.obstacles) {
      const distance = Math.hypot(this.player.x - obstacle.x, this.player.z - obstacle.z);
      const min = obstacle.radius + 0.4;
      if (distance < min) {
        this.player.x = obstacle.x + ((this.player.x - obstacle.x) / (distance || 1)) * min;
        this.player.z = obstacle.z + ((this.player.z - obstacle.z) / (distance || 1)) * min;
      }
    }
    if (this.gate && Math.hypot(this.player.x, this.player.z + 19) < 6.5) {
      // Enclose only the arena, keeping the northern city cage reachable around either side.
      const angle = Math.atan2(this.player.x, this.player.z + 19);
      this.player.x = Math.sin(angle) * 6.5;
      this.player.z = -19 + Math.cos(angle) * 6.5;
      this.ui.guide(
        `${CREATURES.length - this.saves.data.rescued.length} more friends will open the final arena!`,
      );
    }
    const previousY = this.player.y;
    const water = this.biome === 'ocean' || (this.biome === 'beach' && this.player.x < -20);
    const flying = c.kind === 'fly' && this.starHeld;
    if ((water || flying) && this.starHeld) {
      this.player.vy = Math.min(this.player.vy + dt * 16, 5);
      if (this.player.y > 9) this.player.vy = Math.min(this.player.vy, -1);
    } else this.player.vy -= dt * (water ? 5 : c.kind === 'fly' ? 8 : 18);
    this.player.y += this.player.vy * dt;
    if (this.player.y < 0) {
      this.player.y = 0;
      this.player.vy = 0;
      if (previousY > 0 && c.kind === 'giant') {
        this.effects.burst(new THREE.Vector3(this.player.x, 0.3, this.player.z), 0xffd37a, 60);
        this.audio.tone(90, 0.35, 0, 'sine', 0.2);
        this.audio.tone(135, 0.3, 0.1, 'sine', 0.1);
      }
    }
    if (this.starHeld && this.player.y === 0 && this.jumpCooldown <= 0) this.jump();
    const enc = this.encounter;
    if (enc && enc.defeating === 0) {
      const distance = Math.hypot(
        this.player.x - enc.model.position.x,
        this.player.z - enc.model.position.z,
      );
      if (distance < 9 && !enc.active) this.beginBoss(enc);
      if (enc.active) {
        const target = {
          x: enc.model.position.x,
          z: enc.model.position.z,
          height: Number(
            enc.model.userData.headHeight ?? (enc.data.id === 'demon-lizard' ? 3.39 : 2.49),
          ),
        };
        if (this.player.y > 1.5 && distance < 5 && this.player.vy < 0) {
          this.player.x = THREE.MathUtils.lerp(this.player.x, target.x, Math.min(1, dt * 4));
          this.player.z = THREE.MathUtils.lerp(this.player.z, target.z, Math.min(1, dt * 4));
        }
        if (headStompEligible(this.player, target, previousY)) this.stomp(enc);
      }
    }
    for (const cage of this.cages)
      if (!cage.rescued) {
        if (cageLanding(this.player, cage, previousY)) {
          this.rescueCage(cage);
          this.player.y = 1.5;
          this.player.vy = 4;
        } else if (
          this.player.vy < 0 &&
          this.player.y > 0.8 &&
          Math.hypot(this.player.x - cage.x, this.player.z - cage.z) < 3.2
        ) {
          this.player.x = THREE.MathUtils.lerp(this.player.x, cage.x, dt * 4);
          this.player.z = THREE.MathUtils.lerp(this.player.z, cage.z, dt * 4);
        }
      }
    const hazards =
      (this.world as BuiltWorld & { hazards?: Array<{ x: number; z: number; radius: number }> })
        .hazards ?? [];
    const hazard =
      this.player.y < 0.3 &&
      hazards.some((h) => Math.hypot(this.player.x - h.x, this.player.z - h.z) < h.radius);
    if (Math.hypot(this.player.x, this.player.z) > 42 || this.player.y < -5 || hazard) {
      this.player.x = this.lastSafe.x;
      this.player.z = this.lastSafe.z;
      this.player.y = 1;
      this.player.vy = 5;
      this.ui.toast(
        hazard
          ? 'SPICY BOING! Back to comfy ground.'
          : 'The world gives you a friendly boing back!',
      );
      this.audio.play('jump');
    }
    if (this.player.y === 0 && !hazard && Math.hypot(this.player.x, this.player.z) < 39)
      this.lastSafe = { x: this.player.x, z: this.player.z };
    if (this.portalCooldown <= 0)
      for (const portal of this.portals)
        if (Math.hypot(this.player.x - portal.x, this.player.z - portal.z) < 2.2) {
          this.travel(portal.destination);
          break;
        }
    animateCreature(this.avatar, this.elapsed, moving);
    this.avatar.position.set(
      this.player.x,
      this.player.y + (moving ? 0.04 * Math.sin(this.elapsed * 12) : 0),
      this.player.z,
    );
    this.shadow.position.set(this.player.x, 0.065, this.player.z);
    this.shadow.scale.setScalar(
      Math.max(0.4, 1 - this.player.y * 0.06) * (c.kind === 'giant' ? 2 : 1),
    );
  }
  private updateNPCs(dt: number) {
    this.dialogueTime -= dt;
    if (this.dialogueTime <= 0) this.ui.hideDialogue();
    for (const [i, npc] of this.npcs.entries()) {
      npc.wobble = Math.max(0, npc.wobble - dt);
      const wander = this.elapsed * 0.25 + i * 2;
      npc.model.position.x = npc.origin.x + Math.sin(wander) * 1.7;
      npc.model.position.z = npc.origin.z + Math.cos(wander) * 1.2;
      npc.model.position.y = npc.wobble > 0 ? Math.abs(Math.sin(npc.wobble * 20)) * 0.5 : 0;
      npc.model.rotation.z = npc.wobble > 0 ? Math.sin(npc.wobble * 25) * 0.2 : 0;
      npc.model.rotation.y = Math.sin(wander) * 0.8;
      animateCreature(npc.model, this.elapsed + i, true);
      if (
        this.dialogueTime <= -5 &&
        Math.hypot(this.player.x - npc.model.position.x, this.player.z - npc.model.position.z) < 4
      ) {
        const biome = getBiome(this.biome);
        this.ui.dialogue(npc.name, biome.dialogue[npc.line++ % biome.dialogue.length]);
        this.dialogueTime = 5;
        this.audio.play('talk');
      }
    }
  }
  private animateWorld(dt: number) {
    for (const cage of this.cages) {
      animateCreature(cage.animal, this.elapsed, false);
      if (cage.rescued) {
        cage.age += dt;
        cage.bars.position.y = -Math.min(2, cage.age * 2);
        cage.bars.rotation.y = cage.age * 0.6;
        cage.bars.scale.setScalar(Math.max(0.01, 1 - cage.age * 0.7));
        cage.animal.position.y = 0.4 + Math.abs(Math.sin(cage.age * 6)) * 0.8;
        if (cage.age > 3 && cage.group.visible) {
          this.region.remove(cage.group);
          cage.group.visible = false;
          disposeObject(cage.group);
        }
      }
    }
    for (const portal of this.portals) {
      const ring = portal.group.children[0];
      ring.rotation.z = Math.sin(this.elapsed * 0.5) * 0.05;
    }
    const enc = this.encounter;
    if (enc) {
      enc.cooldown = Math.max(0, enc.cooldown - dt);
      animateCreature(enc.model, this.elapsed, false);
      if (enc.defeating > 0) {
        enc.defeating += dt;
        const t = Math.min(1, enc.defeating / 2.7);
        enc.model.rotation.y += dt * (enc.data.id === 'flushington' ? 12 : 5);
        enc.model.scale.setScalar((1 - t) * Number(enc.model.userData.baseScale ?? 1));
        enc.model.position.y =
          enc.data.id === 'flushington' ? -t * 1.5 : Math.sin(t * Math.PI) * 1.5;
      } else {
        enc.model.position.x = Math.sin(this.elapsed * 0.55) * 0.4;
        enc.model.rotation.z = enc.cooldown > 0 ? Math.sin(enc.cooldown * 20) * 0.12 : 0;
      }
    }
    if (this.celebration) {
      this.celebrationTime += dt;
      this.celebration.children.forEach((animal, i) => {
        if (animal instanceof THREE.Group) {
          animal.position.y = Math.abs(Math.sin(this.celebrationTime * 5 + i)) * 0.8;
          animateCreature(animal, this.elapsed, true);
        }
      });
      if (Math.floor(this.celebrationTime * 3) !== Math.floor((this.celebrationTime - dt) * 3))
        this.effects.burst(
          new THREE.Vector3(
            this.player.x + (Math.random() - 0.5) * 10,
            5,
            this.player.z + (Math.random() - 0.5) * 10,
          ),
          0xffcc7c,
          45,
        );
    }
  }
  private updateCamera(dt: number) {
    let desired = new THREE.Vector3(
      this.player.x + 3,
      (getCreature(this.form).kind === 'giant' ? 15 : 12) + this.player.y * 0.55,
      this.player.z + (getCreature(this.form).kind === 'giant' ? 21 : 17),
    );
    const target = new THREE.Vector3(this.player.x, 1 + this.player.y * 0.6, this.player.z - 3);
    if (this.state === 'menu') {
      desired = new THREE.Vector3(16, 15, 20);
      target.set(-3, 0, -10);
    } else if (this.timeline && !this.saves.data.settings.reducedMotion) {
      const t = this.timeline.elapsed;
      desired = new THREE.Vector3(this.player.x + Math.sin(t * 0.25) * 7, 11, this.player.z + 15);
      if (this.encounter && this.timeline.kind !== 'victory')
        target.set(this.encounter.model.position.x, 2, this.encounter.model.position.z);
    }
    // Lift the camera above any nearby scenery in its follow corridor.
    for (const o of this.world.obstacles)
      if (Math.hypot(desired.x - o.x, desired.z - o.z) < o.radius + 2)
        desired.y = Math.max(desired.y, 14 + o.radius);
    this.camera.position.lerp(desired, Math.min(1, dt * 5));
    this.camera.lookAt(target);
  }
  private frame(ms: number) {
    const dt = Math.min(0.05, (ms - (this.lastTime || ms)) / 1000);
    this.lastTime = ms;
    this.elapsed += dt;
    this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);
    this.powerTime = Math.max(0, this.powerTime - dt);
    this.portalCooldown = Math.max(0, this.portalCooldown - dt);
    if (this.state === 'playing') {
      this.updatePlayer(dt);
      this.updateNPCs(dt);
      this.audio.tick(this.elapsed, this.biome);
      this.saveTime += dt;
      this.hudTime += dt;
      if (this.saveTime > 8) {
        this.saveTime = 0;
        this.persist();
        if (this.saves.warning) this.ui.toast(this.saves.warning);
      }
      if (this.hudTime > 0.5) {
        this.hudTime = 0;
        this.updateGuide();
      }
    }
    if (this.timeline && this.state === 'cutscene') {
      this.timeline.elapsed += dt;
      if (this.timeline.elapsed >= this.timeline.duration) this.skip();
    }
    if (this.state !== 'paused') {
      this.mixer?.update(dt);
      this.animateWorld(dt);
      this.effects.tick(dt);
      this.updateCamera(dt);
    }
    this.renderer.render(this.scene, this.camera);
    this.qualityTime += dt;
    this.qualityFrames++;
    if (this.qualityTime > 5) {
      const fps = this.qualityFrames / this.qualityTime;
      if (fps < 28 && this.renderer.getPixelRatio() > 1) this.renderer.setPixelRatio(1);
      this.qualityTime = 0;
      this.qualityFrames = 0;
    }
    requestAnimationFrame((t) => this.frame(t));
  }
  notifyUpdate(callback: () => void) {
    this.updateReady = true;
    this.updateAction = callback;
    this.ui.el('update-button').hidden = false;
    this.ui.el('update-button').textContent = 'New adventure ready · tap to save & update';
    if (this.state === 'menu') this.activateUpdate();
  }
  private activateUpdate() {
    if (!this.updateReady) return;
    if (this.state === 'cutscene') {
      this.ui.toast('The update can wait until this big moment is over.');
      return;
    }
    this.persist();
    this.pause(true);
    this.updateAction?.();
  }
  private exposeTests() {
    const snapshot = () => ({
      state: this.state,
      biome: this.biome,
      form: this.form,
      rescued: [...this.saves.data.rescued],
      defeated: [...this.saves.data.defeated],
      player: { ...this.player },
      boss: this.encounter
        ? {
            id: this.encounter.data.id,
            hits: this.encounter.hits,
            total: this.encounter.data.hits,
            height: Number(this.encounter.model.userData.headHeight),
          }
        : null,
      renderer: {
        calls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
        geometries: this.renderer.info.memory.geometries,
        textures: this.renderer.info.memory.textures,
      },
    });
    (window as unknown as { __game: unknown }).__game = {
      snapshot,
      teleport: (x: number, z: number) => {
        this.player = { x, y: 0, z, vy: 0 };
        this.lastSafe = { x, z };
        this.snapCamera();
      },
      travel: (id: BiomeId) => this.travel(id),
      rescueAll: () => {
        CREATURES.forEach((c) => rescue(this.saves.data, c.id));
        this.saves.save();
        this.loadBiome(this.biome, false);
        this.ui.renderForms(this.form);
      },
      setBossHits: (n: number) => {
        if (this.encounter) this.encounter.hits = n;
      },
      setPlayer: (p: Partial<typeof this.player>) => {
        Object.assign(this.player, p);
      },
      save: () => this.persist(),
      skip: () => this.skip(),
    };
  }
}
