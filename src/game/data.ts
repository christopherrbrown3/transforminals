export type BiomeId =
  | 'meadow'
  | 'winter'
  | 'savannah'
  | 'desert'
  | 'beach'
  | 'ocean'
  | 'volcano'
  | 'underground'
  | 'rifts'
  | 'city';
export interface Creature {
  id: string;
  name: string;
  biome: BiomeId;
  color: string;
  power: string;
  speed: number;
  kind: 'land' | 'swim' | 'fly' | 'giant';
}
export const CREATURES: Creature[] = [
  {
    id: 'fox',
    name: 'Clover fox',
    biome: 'meadow',
    color: '#e58a45',
    power: 'Zoomy dash',
    speed: 12,
    kind: 'land',
  },
  {
    id: 'arctic-fox',
    name: 'Arctic fox',
    biome: 'winter',
    color: '#e5f3fb',
    power: 'Snowflake dash',
    speed: 12,
    kind: 'land',
  },
  {
    id: 'tiger',
    name: 'Tiger',
    biome: 'savannah',
    color: '#eda849',
    power: 'Tiger leap',
    speed: 10,
    kind: 'land',
  },
  {
    id: 'lion',
    name: 'Lion',
    biome: 'savannah',
    color: '#c58a43',
    power: 'Bouncy roar',
    speed: 9,
    kind: 'land',
  },
  {
    id: 'giraffe',
    name: 'Giraffe',
    biome: 'savannah',
    color: '#e8c369',
    power: 'Sky-high hop',
    speed: 9,
    kind: 'land',
  },
  {
    id: 'hippo',
    name: 'Hippopotamus',
    biome: 'savannah',
    color: '#a9a0c0',
    power: 'Hippo splash',
    speed: 8,
    kind: 'land',
  },
  {
    id: 'camel',
    name: 'Camel',
    biome: 'desert',
    color: '#d5ae72',
    power: 'Dune boing',
    speed: 10,
    kind: 'land',
  },
  {
    id: 'turtle',
    name: 'Sea turtle',
    biome: 'beach',
    color: '#79a975',
    power: 'Shell spin',
    speed: 9,
    kind: 'swim',
  },
  {
    id: 'shark',
    name: 'Shark',
    biome: 'ocean',
    color: '#7ca8c4',
    power: 'Fin-tastic boost',
    speed: 12,
    kind: 'swim',
  },
  {
    id: 'piranha',
    name: 'Piranha',
    biome: 'ocean',
    color: '#f38f79',
    power: 'Bubble burst',
    speed: 11,
    kind: 'swim',
  },
  {
    id: 'barracuda',
    name: 'Barracuda',
    biome: 'ocean',
    color: '#adcebc',
    power: 'Silver streak',
    speed: 14,
    kind: 'swim',
  },
  {
    id: 'whale-shark',
    name: 'Whale shark',
    biome: 'ocean',
    color: '#6f9ea7',
    power: 'Whale of a splash',
    speed: 10,
    kind: 'swim',
  },
  {
    id: 'kraken',
    name: 'Kraken',
    biome: 'ocean',
    color: '#aa81b9',
    power: 'Tentacle twirl',
    speed: 9,
    kind: 'swim',
  },
  {
    id: 'leviathan',
    name: 'Leviathan',
    biome: 'ocean',
    color: '#56b6ac',
    power: 'Rainbow bubbles',
    speed: 11,
    kind: 'swim',
  },
  {
    id: 'salamander',
    name: 'Ember salamander',
    biome: 'volcano',
    color: '#e2824e',
    power: 'Spark stomp',
    speed: 10,
    kind: 'land',
  },
  {
    id: 'bat',
    name: 'Crystal bat',
    biome: 'underground',
    color: '#8c82ba',
    power: 'Flap & glide',
    speed: 11,
    kind: 'fly',
  },
  {
    id: 'glow-moth',
    name: 'Starlight moth',
    biome: 'rifts',
    color: '#cba8e1',
    power: 'Moonbeam flutter',
    speed: 11,
    kind: 'fly',
  },
  {
    id: 'giant-reptile',
    name: 'Bramblejaw',
    biome: 'city',
    color: '#69a379',
    power: 'Mighty stomp',
    speed: 9,
    kind: 'giant',
  },
  {
    id: 'mecha-reptile',
    name: 'Boltback',
    biome: 'city',
    color: '#9ebac0',
    power: 'Star beam',
    speed: 9,
    kind: 'giant',
  },
  {
    id: 'rat',
    name: 'Rat',
    biome: 'city',
    color: '#afa0aa',
    power: 'Cheese zoom',
    speed: 13,
    kind: 'land',
  },
  {
    id: 'falcon',
    name: 'Peregrine falcon',
    biome: 'city',
    color: '#798fa9',
    power: 'Take off & glide',
    speed: 14,
    kind: 'fly',
  },
  {
    id: 'giant-cow',
    name: 'Giant cow',
    biome: 'city',
    color: '#eee5d5',
    power: 'Mega moo stomp',
    speed: 9,
    kind: 'giant',
  },
];
export const HUMAN: Creature = {
  id: 'human',
  name: 'Calvin',
  biome: 'meadow',
  color: '#6baf91',
  power: 'Jump',
  speed: 8,
  kind: 'land',
};
export const getCreature = (id: string) => CREATURES.find((c) => c.id === id) ?? HUMAN;
export interface Biome {
  id: BiomeId;
  name: string;
  subtitle: string;
  color: string;
  hint: string;
  npc: string;
  dialogue: string[];
}
export const BIOMES: Biome[] = [
  {
    id: 'meadow',
    name: 'Clover Meadow',
    subtitle: 'A little jump. A big adventure.',
    color: '#91bd68',
    hint: 'Jump onto the low cage to rescue your first friend.',
    npc: 'Pip',
    dialogue: [
      'I’m Pip. Professional picnic inspector.',
      'Hop onto a cage roof. The lock goes POP!',
      'Those glowing rings lead to whole new places.',
    ],
  },
  {
    id: 'winter',
    name: 'Snowcone Valley',
    subtitle: 'Snow much to discover.',
    color: '#bfdce1',
    hint: 'An Arctic fox is waiting near the snowy trees.',
    npc: 'Flurry',
    dialogue: [
      'I ordered a snowcone. They delivered a valley.',
      'The Arctic fox has excellent snow socks.',
      'The snow monster just wants a high-five on the head.',
    ],
  },
  {
    id: 'savannah',
    name: 'Sunbeam Savannah',
    subtitle: 'Tall friends. Very tall snacks.',
    color: '#d4be70',
    hint: 'Four new friends are waiting across the golden grass.',
    npc: 'Mango',
    dialogue: [
      'The giraffe can see next Tuesday.',
      'Four cages! That is quite a rescue picnic.',
      'Hippos are surprisingly good at cannonballs.',
    ],
  },
  {
    id: 'desert',
    name: 'Wobble Dunes',
    subtitle: 'Sand in absolutely everything.',
    color: '#e5c790',
    hint: 'Look near the ruins for a very patient camel.',
    npc: 'Doodle',
    dialogue: [
      'The sand sandwich is mostly sand.',
      'Camels store excellent jokes in their humps.',
      'Try bouncing on that very dramatic sandwich.',
    ],
  },
  {
    id: 'beach',
    name: 'Bubble Bay',
    subtitle: 'Please excuse the dancing toilet.',
    color: '#e8d89e',
    hint: 'Rescue the turtle, then take the Atlantis ring.',
    npc: 'Shelly',
    dialogue: [
      'No drowning here. Even socks can swim.',
      'Admiral Flushington is blocking my sandcastle view.',
      'Atlantis has the best bubbles.',
    ],
  },
  {
    id: 'ocean',
    name: 'Atlantis',
    subtitle: 'Deep water. Absolutely no mermaids.',
    color: '#67b4be',
    hint: 'Six sea creatures need rescuing. Hold the star to swim up.',
    npc: 'Jazzy Finn',
    dialogue: [
      'I sing jazz. The ships get distracted. Oops.',
      'That ship landed on a cushion of seaweed.',
      'Hold the star to swim up. Let go to float down.',
      'Six sea friends are waiting among the ruins.',
    ],
  },
  {
    id: 'volcano',
    name: 'Popcorn Peaks',
    subtitle: 'The floor is spicy.',
    color: '#bd795d',
    hint: 'The lava bounces you back safely. Find the ember salamander.',
    npc: 'Toast',
    dialogue: [
      'Please do not toast marshmallows on my head.',
      'Lava is just the world’s silliest trampoline.',
      'Lava Lump has forgotten how to sit down.',
    ],
  },
  {
    id: 'underground',
    name: 'Twinkle Caverns',
    subtitle: 'Glow wherever you go.',
    color: '#8e8aa6',
    hint: 'A crystal bat is hiding among the glowing mushrooms.',
    npc: 'Pebble',
    dialogue: [
      'I am a very underground celebrity.',
      'Follow the little crystals. There’s a secret beyond the mushroom room.',
      'Crystal bats have sparkly pajamas.',
    ],
  },
  {
    id: 'rifts',
    name: 'The Giggle Rift',
    subtitle: 'A portal to the pleasantly peculiar.',
    color: '#a185ad',
    hint: 'Rescue the starlight moth. The green ring goes home.',
    npc: 'Zorp',
    dialogue: [
      'Welcome! Gravity is mostly working today.',
      'I used to be a mushroom. Long story.',
      'The moth is collecting moonbeams for breakfast.',
    ],
  },
  {
    id: 'city',
    name: 'Big Little City',
    subtitle: 'Small streets. Enormous moo.',
    color: '#a1bbb3',
    hint: 'Five city friends. One enormous final surprise.',
    npc: 'Mayor Crumb',
    dialogue: [
      'The giant cow has eaten the traffic report.',
      'Bramblejaw and Boltback are original local legends.',
      'Rescue every friend to open the demon lizard arena.',
    ],
  },
];
export const getBiome = (id: string) => BIOMES.find((b) => b.id === id) ?? BIOMES[0];
export const CAGE_POSITIONS = [
  [-7, -9],
  [9, -17],
  [-15, -24],
  [18, -29],
  [0, -32],
  [22, -8],
] as const;
export interface Boss {
  id: string;
  name: string;
  biome: BiomeId;
  hits: number;
  intro: string;
  outro: string;
}
export const BOSSES: Boss[] = [
  {
    id: 'sproutzilla',
    name: 'Sproutzilla',
    biome: 'meadow',
    hits: 3,
    intro: 'I AM ENORMOUS! Well… for my age. Jump on my head!',
    outro: 'Sproutzilla has agreed to use an indoor roar.',
  },
  {
    id: 'frosty',
    name: 'Sir Slush-a-lot',
    biome: 'winter',
    hits: 3,
    intro: 'My hat is itchy! Bounce on my head to shake it loose!',
    outro: 'A snowman becomes a snowpuddle. He seems delighted.',
  },
  {
    id: 'sandwich',
    name: 'The Sand Witch',
    biome: 'desert',
    hits: 3,
    intro: 'Behold my sandy sandwich! Head boops welcome.',
    outro: 'The Sand Witch is now a very small picnic.',
  },
  {
    id: 'flushington',
    name: 'Admiral Flushington',
    biome: 'beach',
    hits: 3,
    intro: 'I demand a royal flush! Bounce on my head!',
    outro: 'FLUUUSH! The Admiral has gone down in history. And the bowl.',
  },
  {
    id: 'lava-lump',
    name: 'Lava Lump',
    biome: 'volcano',
    hits: 3,
    intro: 'I am too warm for hugs. Try some head boings!',
    outro: 'Lava Lump has popped into a pile of popcorn.',
  },
  {
    id: 'demon-lizard',
    name: 'The Demon Lizard',
    biome: 'city',
    hits: 5,
    intro: 'ROOOAR! Five head boops? That is my one weakness!',
    outro: 'THANK YOU! You made the whole world a little wilder.',
  },
];
