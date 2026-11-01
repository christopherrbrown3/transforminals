# A world made of pocket-sized adventures

Transforminals is a handmade toy landscape: square trunks, chunky paws, broad faces, colorful nature, and slightly silly proportions. The look borrows the readability of construction toys without copying another game's characters or assets. Each region uses the same geometry and lighting language; its palette, plants, and distant landmark make it recognizable.

## Palette

| Role                     | Colors                                        |
| ------------------------ | --------------------------------------------- |
| Warm paper / vanilla fur | `#FFF0CD`, `#F6E9D2`                          |
| Ink / eyes               | `#243C3B`                                     |
| Adventure teal           | `#438F88`                                     |
| Friendly marmalade       | `#E6873E`                                     |
| Celebration gold         | `#FFD476`                                     |
| Meadow                   | `#8DBF76`, `#5F9C69`, `#C7E9DC`               |
| Snow                     | `#E6EFF1`, `#77AEB4`, `#C6DFEC`               |
| Savannah / sand          | `#C7BF6D`, `#E4C68D`, `#F3D9B0`               |
| Seabed                   | `#95C7BB`, `#528EA4`, coral pink and lavender |
| Lava / caves / rifts     | warm gray, violet, peach lava, mint crystals  |

The environment keeps a lower contrast than faces, rescue effects, and controls. Lava is peach-orange rather than threatening red. The final lizard is a purple storybook monster with vanilla horns and an exaggerated friendly face.

## Character conventions

- Every model faces negative Z. Feet sit at Y=0. Human height is approximately 1.9 units including hair; the custom fox is 1.885 units including ears. The game enlarges giant forms and the final boss at runtime.
- Eyes use warm whites, deep evergreen pupils, and tiny highlights. Oversized ears, muzzles, feet, and tails make animals identifiable at the normal play camera distance.
- The fox has a long vanilla-tipped tail, cream cheeks and chest, dark socks, pointed ears, and a button nose. Arctic fox shares the silhouette with a snowy coat. Tiger stripes, giraffe spots, cow patches, lion mane, camel hump, turtle shell, whale-shark spots, and reptile dorsal plates distinguish forms.
- Bosses are stomped on their own heads or hats; there is no separate landing marker. `group.userData.headHeight` is measured straight down through the middle of the head when the model is built: about 2.33–2.44 for mini-bosses and 3.18 for the final lizard before its 1.7 runtime scale. Their large faces remain readable during movement.
- A beaten boss becomes a playable form drawn from the same sculpture at 0.8 scale (just taller than Calvin), or 0.6 for a giant form, which the game then doubles. Walking lifts each foot and swings the arms.
- Franchise-inspired fantasies use original designs: Bramblejaw and Boltback are original giant reptile/mechanical reptile models. No downloaded or recreated franchise models are included.

## Meshes and materials

Use boxes, five-sided cones, and faceted polyhedra. Substantial creature blocks and environmental props have small single-segment bevels so their edges catch the sunlight. Tiny eyes, markings, and groundcover stay crisp. The authored fox uses beveled edges and weighted normals. Keep materials matte: roughness around 0.7–0.82, little or no metalness. Crystal/ember emission is restrained. No textures, remote images, or texture atlases are required by the current 3D assets.

The procedural models are immediately available for every form. The Blender fox is a bundled GLB that can replace its procedural counterpart after local loading. Creature parts are independently disposable. Static sibling meshes are merged by material, while animated limb/head/tail groups retain their transforms and names. The same `batchCreatureMeshes` helper can be applied once to the loaded fox before making runtime clones. Environmental props are grouped by geometry/material into `InstancedMesh` batches; each region is built only when needed.

## Animation

Small movements communicate life without distracting from controls: short leg swings, gentle tail swishes, a slight head tilt, and soft wing flaps. Procedural models expose `animateCreature(group, time, moving)`. Movement is applied to local appendages so it does not fight the game controller's root position or facing.

The Blender fox contains two looping idle clips, one for its head and one for its tail. An animation mixer should play both clips. The controller can use the authored leg pivot names for movement animation in addition to these idle clips.

## Environmental composition

The flat playable ground is an intentional accessibility choice. It supports easy cage landing and reliable movement while ornamental hills and silhouettes provide depth. Cream trails have inset paving and low shoulders; planting islands, pebbles, flowers, and tree-root details add depth. Tall scenery is concentrated along the sides and northern background to avoid obscuring the player.

Placement reserves the full canopy or prop footprint separately from its collision radius. Cages, all three portal locations, wandering NPCs, the boss arena, and connected walking routes have explicit clearance. New random props also clear existing landmarks. Trees use trunk collisions, substantial landmarks use several appropriate footprint colliders, and flowers and small groundcover remain walkable. `WorldObstacle.height` supplies the camera with real obstacle heights. Tall props cast shadows; flat groundcover and paths only receive them.

The polish pass checked grid reachability from the start to all six cage locations and all three portals in every region, including the locked city arena, and checked collider separation from cage/portal/NPC envelopes. All locations passed. Worlds use 15–29 instanced batches plus their ground meshes and roughly 7,000–28,000 triangles before gameplay actors. Physical iPad performance still requires device testing.

| Region      | Signature landmark and dressing                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| Meadow      | giant storybook tree, flower patches, little fence                                                         |
| Winter      | layered snowy evergreens, ice pond, igloo, snow figures                                                    |
| Savannah    | wide acacias, watering hole, ocher rock outcrop                                                            |
| Desert      | stepped ruin, standing arch, cactus clusters, oasis                                                        |
| Beach       | turquoise bay, wet-sand/foam shore, offshore water, palms, parasols, jetty, sandcastle, shells and bubbles |
| Ocean       | Atlantis columns, toy shipwreck, siren toy-boat reef bump, coral and kelp                                  |
| Volcano     | conical volcano, peach lava channel, bridge, basalt spires                                                 |
| Underground | connected cutaway chambers, arched passages, mushroom parlour, hidden crystal nook                         |
| Rifts       | hovering rock islands, magic crystal ring, violet pillars                                                  |
| City        | pastel buildings, street markings, central plaza                                                           |

`world.hazards` describes the volcanic channel away from the bridge; game logic owns friendly recovery. Environmental modules do not create cages, bosses, NPCs, or portals.

## Underground exploration

`src/game/caves.ts` is the shared authored map: nine named rooms and nine connected tunnel polylines define the navigable floor. The Lantern Foyer opens onto the bat rescue chamber and Crystal Conservatory; Echo Crossing connects the three surface passages. A narrower, winding violet-stone trail behind Mushroom Parlour leads to the optional Humming Crystal Nook. Room colors and restrained luminous breadcrumbs distinguish the routes without a compulsory tutorial.

The cave is an open-top toy cutaway. Rounded, layered rock walls stand 2.8–3.16 units high, with circular collision footprints covering their corners. Thin arch frames mark tunnel transitions; they have no chamber roofs or hanging slabs. Main passages are 6–6.5 units wide, and the hidden branch is 5.4 units wide. These leave room for the human to navigate around the closed bat cage. Mushrooms and crystals are hand-placed within chambers, preserving NPC space and each exit approach. Unused rescue pads and the other regions' straight crossing paths are omitted.

`CAVE_LAYOUT` exposes rooms, tunnels, arches, exits, and the optional secret's discovery radius. `buildCaveFloorplan()` derives floor tiles and solid wall colliders from that same data. `isCaveWalkable()` describes the geometric floor envelope; `nearestCaveWalkable()` preserves valid coordinates or finds the nearest floor-tile center clear of the layout walls, allowing gameplay to relocate old saved positions. Ordinary scenery collisions remain the game controller's responsibility.

A static 0.5-unit walking-grid audit included all actual world colliders and the closed cage: all room centers, three portal centers, three NPC origins, and the secret center were reachable from the start; the cage was approachable within 3 units. Closed rock areas stayed inaccessible. A further 1,681 legacy-position samples relocated to wall-clear floor. The cave environment uses 33 draw calls and approximately 45,170 triangles before gameplay actors. TypeScript and scoped ESLint passed; coordinating native camera captures at three viewports now show the player, paths and cage clearly, with no page errors. Physical-device checks remain pending.

The Ocean's seven-part, passenger-free toy sailboat is exposed as `world.group.userData.sirenBoat`. Gameplay owns its original-music cue and harmless reef bump, splash, tip, and recovery animation. Its separate group has no collision obstacle, and each mesh owns disposable geometry and material.

## Interface and icon direction

Cream field-guide panels and forest-green text frame the world. Rounded Fredoka labels and simple authored SVG icons support touch-first play. Creature portraits should preserve the same silhouette and palette as the model, using a clear face or distinguishing feature rather than detailed realistic pictures. The playable world remains visible behind menus and arrival messages.

## Validation boundaries

The custom fox was created in the user's live Blender through MCP, rendered, and visually inspected. Its export was parsed by Three.js with correct floor placement, orientation, self-contained resources, and animation data. The TypeScript art modules passed type checking and ESLint. A Chromium gallery rendered all 29 models without page errors, including a visual inspection after static-mesh batching. Representative batched mesh counts: human 11, fox 16, tiger 12, giant reptile 9, Sproutzilla 9. The actual title scene and initial Meadow gameplay camera were also visually inspected. Broader biome camera checks, sustained frame rate, physical iPad performance, and interactive boss/cage behavior require the coordinating gameplay/QA checks; asset creation alone does not establish those results.

## v0.4 species detail

The 22 rescues now use individually authored geometry in `animalModels.ts`, retaining the soft construction-toy world. The red fox has taller triangular ears, a narrow muzzle and black socks; the Arctic fox has a compact body, rounded ears and thick pale paws. Tiger stripes and white cheek whiskers differ from the lion's mane and tufted tail. Giraffe ossicones, hippo high eyes/nostrils, camel pads, rat whiskers and cow split hooves provide visible identification cues.

Aquatic silhouettes differ in depth, length, head width and fin profiles: the piranha is deep-bodied, the barracuda long and narrow, and the whale shark broad and spotted. The sea turtle has flippers and a scute shell. Bat wing membranes, falcon feather panels and moustache marks, and the moth's four patterned wings keep flyers distinct. Eight curling kraken arms and a segmented sea-serpent body preserve the fantasy roster. Primary anatomical references are recorded in [the creature study](CREATURE_REFERENCE.md); they inform original artwork, with no copied source imagery.

Animated rigs vary stride, weight, wing rhythm, tail movement and tentacle motion. Compatible static siblings use per-vertex color batching, preserving authored colors and moving pivots while reducing draw calls. Cage fitting reserves idle-motion space. All player, cage, wildlife and ending instances use the same current model builders, including the fox; the earlier Blender export remains an archived asset.

Portal rings use smoother circular geometry and an animated inner arc. One tightly fitted destination label appears farther away and renders above scenery so buildings cannot cut through its text. Arrival ripples dissipate without blocking movement; gentle motion uses a stationary brief fade. The City's east façades are staged beyond the falcon approach.

## v0.5 atlas

The world map is a cream field-guide atlas over patterned pale water. Original miniature SVG landscapes give each region a recognizable toy landmark. Place names, required rescue counts and visit status sit beside the illustration; the current place has a green paw flag and outline. Unvisited places keep readable counts and show a discovery hint. Small landscape screens use the same native vertical scrolling as other dialogs.

## Boss sculptures — October 29

`bossModels.ts` gives each encounter an original toy silhouette: Sproutzilla has a leafy tail, broad muzzle and segmented belly; Sir Slush-a-lot wears mittens and a fringed scarf; the Sand Witch has layered fillings, a plum hat and olive wand; Admiral Flushington has an open seat, naval cap and moustache; Lava Lump has peach seams between basalt plates and popcorn tufts; the Demon Lizard has ribbed wings, a curled tail and small vanilla horns. Large eyes blink, while arms, wings, tails and the scarf move gently. Gentle-motion settings hold these appendages in a stationary pose.

The golden landing caps were removed on November 1 at the user's request; stomps now land on the head or hat itself. On short landscape screens at least 700 pixels wide, the hearts panel moves below the arena during play so it does not cover the final boss's face.

Before the caps were removed, the six sculptures used 4,258–7,224 triangles and 8–11 batched meshes each. They have no texture or remote-asset dependencies. The rendered model study is `assets/source/boss-gallery.png`; browser and interaction evidence is recorded in the development log. These counts do not establish physical iPad frame rate.

## Region atmosphere — October 31

Each region now sits inside a place rather than on one flat backdrop color. `atmosphere.ts` gives every biome a camera-following sky that grades from a fog-matched horizon to its own zenith, with a soft haze band. The play camera looks down, so most of the gradient sits just below eye level where the visible sky strip is; the title screen and boss cutscenes show the full sky.

Fogged, flat-shaded silhouettes stand beyond the playable disc and fade into the horizon: rolling hills and round trees in the Meadow, snowy peaks and pines in Winter, buttes and acacias on the Savannah, dunes and mesas in the Desert, palm islets on an open sea at the Beach, reef mounds, kelp and sunken columns at Atlantis, basalt spires and peach-tipped peaks at the Volcano, a stalagmite wall with small glowing crystals in the Caverns, floating islands under stars in the Rift, and a pastel skyline beyond the City. A lowland ring sits 2.6 units below the rim, so the diorama edge still reads as the world boundary. The Rift has no lowland and its islands float.

Chunky faceted clouds circle slowly in the open-sky regions. Small motes give each place a little life: pollen, falling snow, dust, sand glints, rising plankton, peach embers, cave fireflies and Rift sparkles. Soft additive light shafts fall through the water at Atlantis and through the open cavern ceiling. Reduced motion removes the motes and holds clouds and shafts still.

The flat ground cap is now a vertex-colored disc with broad sun and shade patches drifting toward each region's cliff tone and a slightly darker rim. Khronos PBR Neutral tone mapping replaces ACES filmic, which had lifted and greyed the pastel palette. Sun and sky light tints stay close to neutral so authored colors survive. In a 1194×834 Chromium capture, sunlit Meadow ground measured `#84b666` against authored `#8dbf76`, and City ground `#a0b9a9` against `#a2bcb0`. Savannah and Desert sand render a little more golden than authored.

None of this collides, joins `world.obstacles`, or enters the playable disc; silhouettes and clouds stay beyond radius 46. The motes use a 32×32 sprite generated in memory, so there is still no image file, remote texture or atlas.

The pass is budgeted for older iPads. Compared with the previous build in the same 1194×834 Chromium capture, each region adds 5–7 draw calls (3–5%) and 6,000–11,000 triangles. City is the busiest region at 196 calls and 142,272 triangles; Atlantis has the most calls at 216. Distant shapes, clouds, lowland and ground use matte Lambert shading. On devices that cannot hold frame rate at the lowest adaptive resolution, clouds, shafts and motes switch off while the sky and silhouettes remain. Physical iPad frame rate is still unmeasured.

## Powers and space trips — October 31

The gold star stays the Jump button; Power is a smaller marmalade button with a cream lightning bolt, placed lower-left of Jump so the two never overlap the D-pad. Its short capital label changes with the form: BOOP, DASH, ROAR, ACHOO, GEYSER and so on.

Power effects are bright, unlit toy shapes in each form's own palette: leaves, snowflakes, bubbles, sand puffs, glitter and cheese crumbs, sprayed along the facing direction. They also include roar and echo rings, ground shockwaves, a column for the whale shark's geyser, a curved arc for the giraffe's neck swing, a cyan beam for Boltback and a cream cartoon glove with a red cuff for Calvin's boop. A launched animal tumbles up and away with a warm comet glow and a sparkle trail, then becomes a four-point twinkle near the top of the view; both star shapes are drawn in memory, not loaded from files. It floats back down to its own spot and lands with the existing happy bounce.

Reduced motion keeps about a third of the particles, a single ring, and no tumbling in flight. Each power press adds a few short-lived batched meshes, which are disposed within about a second. Moving powers and flights add one small particle batch every 50 ms while they last.
