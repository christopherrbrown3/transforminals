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
- Bosses have conspicuous golden landing crowns. `group.userData.headHeight` gives the exact crown collision height: 2.49 for mini-bosses and 3.39 for the final lizard. Their large faces remain readable during movement.
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

| Region      | Signature landmark and dressing                              |
| ----------- | ------------------------------------------------------------ |
| Meadow      | giant storybook tree, flower patches, little fence           |
| Winter      | layered snowy evergreens, ice pond, igloo, snow figures      |
| Savannah    | wide acacias, watering hole, ocher rock outcrop              |
| Desert      | stepped ruin, standing arch, cactus clusters, oasis          |
| Beach       | palm trees, surf edge, jetty, sandcastle                     |
| Ocean       | Atlantis columns and pediment, toy shipwreck, coral and kelp |
| Volcano     | conical volcano, peach lava channel, bridge, basalt spires   |
| Underground | cave entrance, mint mushrooms, tall crystal clusters         |
| Rifts       | hovering rock islands, magic crystal ring, violet pillars    |
| City        | pastel buildings, street markings, central plaza             |

`world.hazards` describes the volcanic channel away from the bridge; game logic owns friendly recovery. Environmental modules do not create cages, bosses, NPCs, or portals.

## Interface and icon direction

Cream field-guide panels and forest-green text frame the world. Rounded Fredoka labels and simple authored SVG icons support touch-first play. Creature portraits should preserve the same silhouette and palette as the model, using a clear face or distinguishing feature rather than detailed realistic pictures. The playable world remains visible behind menus and arrival messages.

## Validation boundaries

The custom fox was created in the user's live Blender through MCP, rendered, and visually inspected. Its export was parsed by Three.js with correct floor placement, orientation, self-contained resources, and animation data. The TypeScript art modules passed type checking and ESLint. A Chromium gallery rendered all 29 models without page errors, including a visual inspection after static-mesh batching. Representative batched mesh counts: human 11, fox 16, tiger 12, giant reptile 9, Sproutzilla 9. The actual title scene and initial Meadow gameplay camera were also visually inspected. Broader biome camera checks, sustained frame rate, physical iPad performance, and interactive boss/cage behavior require the coordinating gameplay/QA checks; asset creation alone does not establish those results.
