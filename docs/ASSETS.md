# Asset register

## Original project assets

The following assets were authored specifically for Transforminals. They use the repository's MIT license. No ripped franchise assets, downloaded models, paid generators, external texture services, or runtime asset APIs are used.

| Asset               | Source                                                                                   | Runtime output          | Notes                                                                                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pip the fox         | `assets/source/fox.blend`, `assets/source/create_fox.py`, `assets/source/isolate_fox.py` | `public/models/fox.glb` | Archived original blocky fox, authored using live Blender MCP; 95,776 bytes, 34 meshes, 41 model nodes, 2 idle animation clips                                               |
| Fox studio preview  | `assets/source/fox-preview.png`                                                          | documentation only      | Transparent 1,000 × 1,000 Blender render, visually inspected                                                                                                                 |
| Creature study      | `assets/source/creature-gallery.png`                                                     | documentation only      | Chromium render of 23 playable forms (human and 22 rescue forms); bosses are separate models                                                                                 |
| Creature collection | `src/game/creatures.ts`, `src/game/animalModels.ts`                                      | bundled JS              | Human, 22 individually detailed rescue forms, and six separate bosses; original procedural geometry and species-specific appendage animation                                 |
| Ten regions         | `src/game/world.ts`                                                                      | bundled JS              | Original deterministic props, instanced meshes, terrain disk and paths                                                                                                       |
| Cave network        | `src/game/caves.ts`                                                                      | bundled JS              | Authored room/tunnel layout, three surface exits, and an optional crystal-nook discovery; human traversal, discovery persistence and safe relocation pass in Chromium/WebKit |
| Music and ambience  | `src/game/soundscapes.ts`, `src/game/audio.ts`                                           | synthesized at runtime  | Original biome motifs, ambient cues, effects, and Jazzy Finn phrase via Web Audio; no recording files                                                                        |

The fox export contains one scene, no external image/buffer URIs, and no objects from the user's other Blender projects. The saved source file contains only the fox studio scene and its dependencies. The original open Blender project was preserved, and the original active scene was restored after authoring. Other creature and boss models, region geometry, UI icons, and soundscapes are procedural/local source code; the fox GLB is the only bundled authored 3D model file.

## Fox asset contract

- Coordinates: X right, Y up, faces -Z.
- Bounds observed after Three.js GLTFLoader parsing: minimum approximately `[-0.456, 0, -1.310]`, maximum `[0.421, 1.885, 1.919]` in the first animation frame.
- Root node: `Pip_Fox_Root`.
- Animated pivots: `Bushy tail pivot`, `Friendly head pivot`.
- Idle clips: `Pip | curious idle | Bushy tail pivot` and `Pip | curious idle | Friendly head pivot`.
- Leg pivots: `Leg pivot 0` through `Leg pivot 3`.
- The exported asset is independent of Blender and can be inspected with Three.js GLTFLoader. Since v0.4 the playable fox uses the current procedural sculpture, matching its caged and wildlife forms; the earlier GLB remains bundled as an archived source asset.

## Rebuilding the fox

`create_fox.py` records the authored geometry and studio setup. Run its contents in Blender in the repository's intended location; the `ROOT` constant can be updated if the checkout moves. It creates a **new scene**, exports only that scene's selected fox objects, and saves a temporary copy at `/tmp/transforminals-fox-studio.blend`. It does not overwrite the currently open project.

The MCP installation's safe mode permits the model creation and GLB export but blocks `bpy.data.libraries.write`. Therefore `isolate_fox.py` runs in a separate background Blender process on the temporary copy. It removes unrelated scenes/objects from that copy, purges unused data, re-exports the model, and writes the clean `assets/source/fox.blend`. Do not add the temporary whole-session copy to the repository. After inspecting the fox, restore the original active scene using `transforminals_previous_scene` saved on the new fox scene.

## Third-party runtime dependencies

Three.js and other code dependencies are governed by their package licenses, separate from original project assets. Fredoka is self-hosted through `@fontsource/fredoka`; preserve the font package's SIL Open Font License when redistributing it. The font license is included in `public/licenses/Fredoka-OFL.txt`; Three.js MIT attribution is in `public/licenses/Three-MIT.txt`. UI glyphs in `src/ui/icons.ts` and application icons in `public/icons` are original geometric vector/raster art. All melodies and sound effects in `src/game/audio.ts` are original Web Audio synthesis, with biome definitions in `src/game/soundscapes.ts`, including Jazzy Finn’s ocean jazz motif; no music recordings are used. Audio unit tests and the browser siren/boat cue checks pass. Physical listening review remains pending. No third-party visual assets are included.

## Restrictions

Minecraft, Pokémon, Godzilla, Mechagodzilla, and Skibidi Toilet names in the original brief express the designer's inspirations. This project includes no models, textures, music, logos, or other extracted assets from those properties. Public character models are original designs.

## v0.4 creature studies

`src/game/animalModels.ts` contains original toy sculptures. [Creature references](CREATURE_REFERENCE.md) records the primary zoological sources consulted for anatomy; no source photographs, textures, recordings, or models are copied or bundled. Fantasy characters retain original invented features. `assets/source/creature-land-v04.png` and `creature-water-v04.png` are browser renders of these project models, licensed with the original artwork under MIT. They replace neither the historical Blender study nor its source files.
