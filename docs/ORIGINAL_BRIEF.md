# PROJECT: TRANSFORMINALS

## Your Mission

You are the lead engineering and creative orchestration agent responsible for building **Transforminals**, a complete, browser-based, open-world 3D adventure game designed by Calvin, a seven-year-old boy turning eight.

This is a real game intended to be played on an iPad, not a concept, mockup, or technical demonstration.

Calvin loves Minecraft, Godzilla, Pokémon, fantastical creatures, enormous monsters, exploration, and general chaos.

His vision is an enormous world full of different environments, animals to rescue, transformations, silly bosses, magical powers, and surprises.

The central design philosophy:

**Minecraft-inspired exploration meets creature collecting and transformation, with the difficulty of a relaxed children's adventure game.**

The world should feel exciting, colorful, and full of discoveries, but it must NEVER be frustrating.

Build a game Calvin will genuinely enjoy playing.

You have substantial creative freedom to fill gaps in his design while preserving the requirements below.

**Do not stop at writing a plan. Create the repository, implement the game incrementally, test it, and deploy a playable version.**

---

# 1. AGENT ORCHESTRATION

The primary orchestration agent is **Sol 6.1**.

Delegate tasks to specialized agents where actual subagent and model-routing capabilities are available.

### Orchestrator — Sol 6.1
Responsibilities:
- Overall architecture and technical direction
- Requirements management and prioritization
- Work planning, integration, and coordination
- Delegation to specialized agents
- Quality and architectural reviews
- Maintaining consistency across the game
- Tracking progress through GitHub issues and milestones

### 3D Engineering and Creative — Astra
Responsibilities:
- Three.js implementation
- Procedural environment generation
- Blender modeling and asset preparation
- Character and animal modeling
- Animations and visual effects
- Lighting, materials, textures, and shaders
- Performance optimization
- Gameplay implementation as appropriate

### GitHub, Testing, and Quality — Luna
Responsibilities:
- Repository configuration
- GitHub Actions and deployment
- Automated testing
- Regression testing
- Browser compatibility
- Code review
- Documentation
- Issue tracking
- Quality assurance

These names describe the intended assignment of responsibilities. Verify actual agent and model availability before attempting delegation.

If a specific named model or agent is unavailable, use available agents or execute the corresponding work directly. Do not claim to have delegated work that was not delegated.

Parallelize independent work when practical, but maintain architectural consistency.

The primary agent remains responsible for integrating and validating every contribution.

---

# 2. FIRST TASK: CREATE THE REPOSITORY

**This must be your first implementation activity.**

Create a new public GitHub repository under the authenticated personal GitHub account. All github actions must attribute to the user christopherrbrown3.

Repository name:

`transforminals`

Description:

"Transforminals — An open-world 3D creature rescue and transformation adventure."

Use the GitHub CLI or connected GitHub tools where appropriate.

Before attempting creation, verify authentication, permissions, and whether the repository already exists. Do not overwrite an existing repository.

Create a professional project structure.

Initial setup must include:

- README.md describing the project
- AGENTS.md with engineering and agent instructions
- MIT license for original project code
- .gitignore
- TypeScript configuration
- Vite configuration
- Three.js integration
- ESLint and Prettier
- Vitest for unit tests
- Playwright for browser testing
- GitHub Actions for CI
- GitHub Actions for Pages deployment
- Dependabot configuration
- GitHub issue templates
- Pull request template
- Project documentation directory
- Asset and attribution documentation
- Initial GitHub issues and development milestones

Do not apply the code license to third-party assets that are not appropriately licensed.

Use `main` as the default branch.

Make the initial commit and push it.

**Commit code frequently throughout development.** Prefer small, functional, meaningful commits. Do not accumulate hours of uncommitted work.

Use short-lived branches and pull requests for substantial independent changes when practical.

Never commit broken builds to main.

---

# 3. TECHNICAL ARCHITECTURE

## Hosting

The entire game must run as a static website on GitHub Pages.

Target production URL:

`https://transforminals.christopherbrown.ai`

The application must require:
- No backend server
- No database server
- No paid hosting
- No external runtime APIs
- No external CDNs
- No external authentication
- No remote AI inference during gameplay

Build-time npm dependencies are permitted. Bundle required libraries and assets into the deployable static application.

The application must work offline after its required assets have been cached.

## Technology stack

Preferred:

| Component | Technology |
|---|---|
| Language | TypeScript |
| Game engine | Three.js |
| Bundler | Vite |
| 3D modeling | Blender via MCP |
| 3D asset format | GLB/glTF |
| User interface | HTML/CSS overlays |
| Unit testing | Vitest |
| Browser testing | Playwright |
| Hosting | GitHub Pages |
| PWA | vite-plugin-pwa / Workbox |
| Storage | IndexedDB or localStorage |
| Deployment | GitHub Actions |

You may introduce lightweight libraries when justified.

Prefer a simple, maintainable architecture to a large game framework.

Use lightweight arcade-style movement and collision rather than introducing a complicated physics simulation unnecessarily.

Use realistic dependency pinning and commit the package lockfile.

## Progressive Web App

Transforminals must be installable on an iPad from Safari using Add to Home Screen.

Implement:
- Web app manifest
- Appropriate application icons
- Standalone display mode
- Landscape-friendly presentation
- Service worker
- Offline support
- Automatic update checks
- Version management
- Local game persistence
- Reliable save migration across releases

New versions should download when available, but **never unexpectedly reload the game in the middle of active gameplay or a boss fight**.

Activate updates at a safe point, such as the main menu, or provide a friendly update prompt.

Because this is a static application, there must be no expectation of server-side cloud saves.

## Performance

The primary target is Safari on a reasonably modern iPad.

Aim for:
- Smooth 30–60 FPS gameplay
- Responsive touch input
- Fast initial loading
- Reasonable memory usage
- Efficient draw calls
- Limited polygon counts
- Instancing where useful
- Frustum culling
- Level of detail for distant objects
- Efficient texture sizes
- Progressive biome and asset loading

Use an adaptive quality system when appropriate.

Avoid loading the entire game's models and textures simultaneously.

Do not make graphics more complicated at the expense of playability.

---

# 4. GAME IDENTITY

Title: **TRANSFORMINALS**

Genre: Open-world, 3D, third-person, creature transformation adventure.

Audience: Children ages 6–10.

Difficulty: Very easy.

Tone: Funny, imaginative, colorful, adventurous, and sometimes ridiculous.

Art direction: Stylized, blocky, and toy-like, with Minecraft-inspired landscapes but an original visual identity.

Avoid gritty realism.

Think:
- Bright grass and chunky trees
- Oversized friendly animals
- Expressive character faces
- Simple readable silhouettes
- Colorful magical effects
- Big cartoon monsters
- Vibrant particle effects
- Playful animations
- Dramatic but funny boss encounters

The game should be visually cohesive despite its intentionally chaotic creature selection.

---

# 5. CORE GAMEPLAY

## Starting state

The player begins as a human character in the **Meadow biome**.

The character should be friendly, appealing, and easy to control.

Give the player a simple introductory moment explaining the world.

The player learns:
1. How to move
2. How to jump
3. How to rescue a caged animal
4. How to transform into that animal
5. How to use a transformation's special power

Keep the tutorial integrated into gameplay.

Never force the player through a long instruction sequence.

## Main objective

Animals have been trapped in cages across the world.

The player must explore different environments, find cages, and rescue animals.

**To rescue an animal, jump onto the top of its cage.**

This is an explicit requirement from Calvin.

When the player lands on a cage:
- The cage unlocks
- A satisfying animation plays
- The cage opens or breaks apart harmlessly
- The animal celebrates
- A rescue message appears
- Confetti, sparkles, or another fun effect plays
- The animal is added to the player's transformation collection

The cages must be EASY to jump onto.

Make them broad, low, and forgiving.

Use generous collision zones and landing assistance as appropriate.

A near-successful jump should generally succeed.

Do not require precision platforming.

## Transformations

Once rescued, an animal becomes available in the player's transformation menu.

The player can transform into rescued animals at any time.

Transformations should:
- Be visually satisfying
- Happen quickly
- Include a little particle or magical effect
- Retain their unlocked status permanently
- Be reversible
- Not consume resources
- Have no cooldown or only negligible animation delays

The player may switch directly between unlocked creatures.

Every playable creature should have a distinct visual appearance and at least one interesting characteristic or special ability.

Examples:
- Fox: Fast running
- Giraffe: High viewpoint
- Shark: Fast swimming
- Falcon: Flying or gliding
- Giant cow: Powerful stomp
- Kraken: Tentacle action
- Mecha monster: Energy blast

These examples are suggestions, not all confirmed design decisions.

Favor delightful abilities over complicated systems.

## Endless gameplay

The game has no game over.

**The player cannot die.**

There are no permanent failures, lives, or lose conditions.

If the player falls into a hazard, return them safely to nearby ground with a funny animation.

If a boss attacks, it may briefly bounce the player away but must not kill them.

No punishment for experimentation.

The player must always be able to continue exploring.

---

# 6. THE WORLD

Build a connected 3D world with recognizable biomes.

The world should feel large, but use bounded and thoughtfully arranged regions rather than attempting a truly infinite Minecraft-style world.

Each environment should have:
- A distinctive visual identity
- Appropriate animals
- Local NPCs
- Caged animals
- Environmental props
- Interesting landmarks
- Fun interactive surprises
- Clear paths to neighboring areas

Use interconnected regions, portals, or loading transitions where appropriate.

Avoid long, empty walks.

## Required biomes

### A. Meadow / Grassy Plains
The starting area.

Rolling grass, flowers, trees, gentle hills, and friendly animals.

Contains the introductory rescue.

### B. Winter / Snow
Snow-covered terrain, icy trees, frozen lakes, and snowy hills.

**Required animal: Arctic fox.**

Optional features include snowmen, igloos, and playful sliding.

### C. Savannah
Warm grasslands with scattered trees and watering holes.

Required animals:
- Tiger
- Lion
- Giraffe
- Hippopotamus

### D. Desert
Sand dunes, rocks, cacti, oases, and ancient ruins.

Add appropriate original creatures and surprises.

### E. Beach
A coastal transition area with sand, palm trees, shallow water, and fun wildlife.

The beach should offer an easy introduction to swimming.

### F. Ocean / Atlantis
A substantial underwater environment.

Required creatures:
- Sharks
- Piranhas
- Barracudas
- Whale shark
- Kraken
- Leviathan

The ocean also contains Atlantis: a mysterious underwater city or ruin that the player can explore.

Use colorful coral, underwater plants, ancient structures, treasure-like props, and large sea creatures.

Swimming must be easy and forgiving.

Provide intuitive vertical movement when underwater.

No drowning mechanic.

### Special Ocean NPC: Boy Siren

Calvin specifically said:

**No mermaids. Boy sirens are allowed.**

Boy sirens sing sweet jazz melodies and cause ships to crash.

Implement an original, child-friendly boy siren character with a short original jazz-inspired musical motif.

There may be a whimsical shipwreck nearby.

Avoid disturbing imagery or realistic destruction.

Do not use copyrighted music.

### G. Lava / Volcanic Region
A dramatic landscape featuring:
- Volcanoes
- Glowing lava rivers
- Dark rocks
- Smoke particles
- Fiery creatures
- Bridges or jumping platforms

Lava should not kill the player.

Use a silly bounce, teleport, or other friendly recovery mechanic.

### H. Underground
A cavern network with:
- Caves
- Crystals
- Tunnels
- Glowing mushrooms
- Underground animals
- Hidden passages
- Interesting discoveries

Include ways to return to the surface easily.

### I. Nether-Inspired Dimension
Calvin explicitly wants a Nether portal similar to Minecraft.

Create a prominent magical portal in the overworld that transports the player into a strange alternate dimension.

Make this an original fantasy dimension with:
- Darker colors
- Glowing terrain
- Floating particles
- Unusual creatures
- Distinctive structures
- Magical atmosphere
- An obvious return portal

It may connect thematically with the volcanic environment, but should feel distinct.

Use an original portal design rather than reproducing Minecraft assets.

### J. City — Final Environment
The last major environment.

A whimsical, exaggerated city containing tall buildings, streets, parks, and giant monsters.

Required creatures:
- Godzilla
- Mechagodzilla
- Rat
- Peregrine falcon
- Giant cow

Calvin explicitly imagined these characters inhabiting the city.

For public distribution, direct use of protected franchise characters requires appropriate rights. Where those rights are unavailable, create original, clearly distinguishable giant reptile and mechanical reptile characters that fulfill the same gameplay fantasy.

The city is associated with the final stage of the main rescue adventure.

**Important:** The final city must be explorable, but access to the final boss arena remains locked until all required animals have been rescued.

---

# 7. WORLD NAVIGATION

The game is open-world rather than a rigid sequence of levels.

Use clear visual landmarks and convenient connections between areas.

The player should be able to explore freely without getting lost or trapped.

Implement:
- An optional world map
- A return-to-meadow function
- Clear portal destinations
- Directional hints for remaining caged animals
- Simple navigation indicators
- Fast travel to previously discovered major landmarks, if helpful

Do not require a player to memorize complicated paths.

Ensure human form can reach essential areas.

Animal transformations may make exploration more entertaining or faster, but must not create progression softlocks.

For the initial implementation, prefer hand-designed biome layouts and procedural decoration over uncontrolled procedural terrain.

---

# 8. ANIMAL NPCs

Not every animal is trapped.

Many wild animals should wander freely around the world.

These animals are NPCs.

They should:
- Wander casually
- Idle and animate
- React when approached
- Occasionally say funny things
- Provide hints about trapped animals
- Mention bosses causing trouble
- Make the environments feel alive

Example dialogue:

"Help! That giant lizard is causing trouble!"

"I heard someone is trapped near the volcano!"

"Watch out for the toilet monster!"

"You're getting really good at rescuing animals!"

Calvin is a strong reader, so written dialogue is encouraged.

Use speech bubbles or visually appealing dialogue boxes.

NPCs do not need complicated conversational AI.

Use authored dialogue pools and simple contextual triggers.

## Punching NPCs

Calvin said the player can punch wild animals, but they do not fight back.

Implement an optional silly, nonviolent cartoon interaction.

Animals may wobble, bounce, or play a funny animation.

No blood, injury, or harm.

Animals never retaliate.

Keep it playful rather than rewarding cruelty.

---

# 9. BOSSES

Boss battles are important.

Calvin imagined approximately **five or six bosses total**, including one final boss.

Do not overcomplicate this system.

Start with a configurable boss registry supporting multiple encounters.

Confirmed boss concepts:

### Baby Godzilla
A miniature giant-lizard boss.

Funny and energetic rather than frightening.

### Skibidi Toilet
A ridiculous walking toilet creature inspired by Calvin's description.

Create an original comedic toilet-monster interpretation suitable for a public game.

**Defeat animation: The toilet flushes, the monster spins or disappears down the bowl, and celebratory effects play.**

### Additional biome bosses
Create approximately two or three additional quirky mini-bosses.

Their exact identities are not specified.

Choose whimsical original characters appropriate to their environments.

Examples include:
- Snow monster
- Giant lava creature
- Desert sand monster

These are design proposals, not confirmed Calvin requirements.

### FINAL BOSS: DEMON LIZARD

The final boss is an enormous demon lizard.

He should look impressive, powerful, and dramatic while remaining age-appropriate.

The final boss has **three visible hearts**.

Calvin specifically said:

**You jump on his head five times to defeat him.**

Resolve these mechanics as follows:
- Five successful head stomps are required
- Three hearts represent remaining boss health
- Hearts decrease at predetermined hit milestones
- Every successful stomp produces unmistakable feedback
- The player cannot die
- Failed jumps are easy to retry

Make the boss very easy to defeat.

Use slow, predictable movement.

Make the head a generous target.

Allow forgiving jump timing and automatic bouncing after successful stomps.

Do not require complex attack patterns.

## Final boss unlock condition

**All required caged animals must be rescued before the final boss can be encountered.**

Track this independently of optional wild NPCs and endlessly generated ambient content.

The player must be able to see how many required animals remain.

Make it impossible to enter the final fight prematurely.

## Final boss defeat cutscene

After the fifth successful head stomp:

1. The demon lizard dramatically reacts.
2. It explodes into a harmless burst of colorful cartoon particles.
3. Confetti fills the screen.
4. All rescued animals appear or are represented in the celebration.
5. Animals jump up and down.
6. The animals say "THANK YOU!"
7. A triumphant musical moment plays.
8. A special victory message appears.
9. The game returns the player to normal exploration.

Make this a memorable sequence.

The final boss appears only once per save.

After victory, the player can continue playing forever.

Do not end the game or lock the world.

Cutscenes should be short, skippable, and optionally replayable from a memories or gallery menu without respawning the boss.

---

# 10. BOSS PRESENTATION AND CUTSCENES

Every boss should have:
- A unique introduction
- Distinct visual personality
- Easy-to-understand mechanics
- A funny defeat animation
- A brief celebratory outcome

Use real-time Three.js animations and scripted camera sequences.

Pre-rendered animations are acceptable where they improve quality, but avoid needlessly large video assets.

Build a reusable cutscene system with:
- Camera transitions
- Character animation timelines
- Dialogue overlays
- Particle effects
- Audio cues
- Skip button
- Safe restoration of gameplay controls

Never make the player repeat long cutscenes.

---

# 11. IPAD TOUCH CONTROLS

**The iPad is the primary input device.**

Design for landscape orientation first.

Use large touch targets.

Avoid tiny icons or complicated menus.

## Left side: Transformation selector

Display portraits or icons representing the player's available forms.

Initially:
- Human form is available
- Locked animals are not selectable
- Rescued animals become selectable immediately

The selector should be scrollable or expandable as the number of transformations increases.

Tapping an animal portrait transforms the player.

Provide clear selection feedback.

## Right side: Movement controls

Use large directional arrows or a simple directional pad.

Include:
- Forward
- Backward
- Left
- Right

A clearly visible **star button** triggers the current character's contextual ability.

For the initial design:
- Human: Jump
- Land animals: Jump or signature ability
- Birds: Take off, flap, or glide
- Swimming creatures: Swim boost or signature ability
- Large monsters: Stomp, roar, or special attack

If separate jump and ability controls become necessary, add them carefully without cluttering the screen.

Prioritize one-button simplicity wherever possible.

## Camera

Use a smooth, automatic third-person follow camera.

Optional drag-to-rotate camera controls are acceptable.

The player should not need to manage the camera constantly.

Make the camera collision-aware and prevent it from getting trapped inside scenery.

## General interface

Include:
- Rescue progress indicator
- Current biome name
- Current animal name
- Contextual ability description
- Pause/settings button
- Optional map
- Clear boss heart display
- Readable dialogue and notifications

Support keyboard and mouse for desktop development and testing.

Handle touch cancellation, screen resizing, and orientation changes gracefully.

Prevent browser scrolling and zoom gestures from interfering with gameplay.

Use safe-area spacing for iPad screens.

Support reduced-motion and audio settings where practical.

---

# 12. SAVE SYSTEM

The game must save automatically.

Persist:
- Rescued animals
- Unlocked transformations
- Bosses defeated
- Final boss completion
- Player's latest safe location
- Discovered biomes
- Discovered portals
- Settings
- Other meaningful progression

Use browser-local persistence.

Autosave after significant gameplay events and periodically while playing.

Use a versioned save schema and safe migrations.

Do not lose progress when a PWA update is installed.

If loading fails, handle it gracefully rather than crashing.

Provide a manual reset option with confirmation.

---

# 13. SOUND AND MUSIC

Create an appropriate audio system.

Include:
- Ambient biome sounds
- Gentle background music
- Jump effects
- Cage unlock sounds
- Transformation effects
- Creature noises
- Boss sounds
- Victory fanfare
- Confetti sounds
- A sweet, original jazz-inspired boy-siren melody

Avoid copyrighted songs.

Audio must respect browser restrictions requiring user interaction before playback.

Include mute and volume controls.

Music should never be excessively loud or frightening.

---

# 14. ASSET CREATION

You have access to Blender through MCP on the development machine.

Use Blender to create custom models and animations where it improves quality.

You may also use available image generation capabilities for original textures, icons, illustrations, and interface artwork.

However:

**Avoid generating an inconsistent collection of random-looking assets.**

Establish a coherent visual style first.

Create an art direction guide containing:
- Color palette
- Model proportions
- Material guidelines
- Character design conventions
- Animation style
- Environmental design conventions
- UI icon style

Use:
- Low-poly and stylized meshes
- Simple readable geometry
- Efficient materials
- Appropriately sized textures
- GLB exports
- Reusable rigs and animation systems where practical

Preserve Blender source files for original assets where feasible.

Keep the runtime entirely independent of Blender.

Assets must be packaged with the static application.

Document third-party assets and licenses.

Do not download or distribute ripped assets from Minecraft, Pokémon, Godzilla, Skibidi Toilet, or other protected properties.

---

# 15. GAME ARCHITECTURE

Design the application as maintainable modules.

Suggested systems:

- Game engine/bootstrap
- Scene management
- World and biome management
- Player controller
- Camera controller
- Creature registry
- Transformation manager
- Animation manager
- Cage/rescue manager
- NPC manager
- Dialogue manager
- Boss manager
- Quest/progression manager
- Cutscene system
- Audio manager
- Save manager
- Touch UI
- Asset loader
- Performance manager
- PWA/update manager

Keep creatures, biomes, bosses, and abilities data-driven.

For example, adding a new animal should not require rewriting the player controller.

Adding a new biome should not require duplicating scene-management code.

Use explicit game states for gameplay, menus, cutscenes, paused states, and transitions.

Centralize progression logic.

Do not hardcode rescue counts in multiple locations.

Document how new content can be added.

---

# 16. DEVELOPMENT PHASES

Do not attempt to model every animal and build every biome before there is a playable game.

Build in vertical slices.

## Phase 0 — Foundation

Deliver:
- Public GitHub repository
- Engineering scaffolding
- CI workflows
- GitHub Pages pipeline
- PWA shell
- Project documentation
- Initial agent instructions
- Requirements and issue backlog

Acceptance:
- The app builds
- CI succeeds
- GitHub Pages deploys a valid application shell
- PWA manifest and service worker are configured
- No external runtime dependencies are required

## Phase 1 — Playable Proof of Concept

Create the Meadow.

Implement:
- 3D world
- Human player
- Third-person camera
- Touch movement
- Star button
- Jumping
- One animal cage
- Cage unlocking
- Animal rescue animation
- Animal transformation
- Basic auto-save
- Basic audio and effects

**This phase must be genuinely playable on an iPad.**

Use at least one visually credible animal model instead of relying entirely on primitive placeholders.

Acceptance:
- Player can move
- Player can jump onto a cage easily
- The animal is rescued
- Player can transform
- Player can move as that animal
- Progress persists after refresh

This is the first major milestone.

## Phase 2 — World Exploration

Implement:
- Biome framework
- Connections between regions
- Winter
- Savannah
- Desert
- Beach
- World navigation
- Additional rescue animals
- Ambient wildlife NPCs

Keep every new region visually distinct.

## Phase 3 — Advanced Environments

Implement:
- Ocean and Atlantis
- Underwater movement
- Underwater animals
- Boy siren encounter
- Volcanic region
- Underground caves
- Nether-inspired dimension
- Portals
- Appropriate transformations and abilities

## Phase 4 — Bosses

Implement the reusable boss system.

Begin with one complete mini-boss.

Validate:
- Easy controls
- Readable boss feedback
- No player death
- Correct victory behavior
- Skippable animations

Then introduce the other mini-bosses.

Include the unique toilet-flushing defeat animation.

## Phase 5 — City and Finale

Implement:
- City biome
- Required city creatures
- Rescue progression completion
- Final boss gate
- Demon lizard boss
- Five-stomp mechanic
- Three-heart display
- Explosion animation
- Animal celebration
- Confetti
- Thank-you dialogue
- Continued exploration after victory

## Phase 6 — Polish

Focus on:
- Cohesive art direction
- Improved animations
- Sound and music
- Performance
- Camera behavior
- Touch responsiveness
- PWA installation
- Update reliability
- Save migration
- Cutscene polish
- Accessibility
- Bug fixing

Do not introduce major new features until the existing gameplay is reliable.

---

# 17. TESTING REQUIREMENTS

Testing is a first-class workstream.

Run unit and integration tests where appropriate.

Use Playwright for browser smoke tests.

Test desktop browsers and WebKit where available.

Do not claim to have tested a physical iPad unless actual device testing occurred.

Automated tests should cover:

### Gameplay
- Player spawns in meadow
- Movement responds to input
- Jump works
- Cage collision triggers rescue
- Rescue cannot duplicate
- Animal unlock persists
- Transformation succeeds
- Player cannot select locked animals
- NPC interaction works

### Progression
- Required animal count is correct
- Final boss gate rejects incomplete collections
- Final boss unlocks after all required rescues
- Five successful stomps trigger victory
- Three hearts display correctly
- Final boss does not respawn after completion
- Player can explore after victory

### Persistence
- Save data survives reload
- Boss completion persists
- Save migration works
- Corrupted save data fails safely

### Application
- Build succeeds
- Assets load
- No fatal runtime errors
- UI works with touch and pointer inputs
- PWA manifest is valid
- Service worker registers
- Offline shell loads after caching
- GitHub Pages deployment succeeds

### Performance
- No significant memory leaks
- Large biomes remain playable
- Scene transitions release unnecessary assets
- Touch controls remain responsive
- Asset loading failures are handled

Document what is automated, what was manually verified, and what remains untested.

---

# 18. GITHUB AND DEPLOYMENT

Use GitHub Actions to:
- Install dependencies
- Type-check
- Lint
- Run tests
- Build production assets
- Publish the site to GitHub Pages

Deploy from the main branch following successful checks.

Configure the site for:

`transforminals.christopherbrown.ai`

Use the correct Vite base path for the custom domain.

Include the required GitHub Pages custom-domain configuration.

Verify DNS configuration and document any necessary Namecheap changes.

Do not modify unrelated DNS records, the apex domain, or other applications.

If automated DNS changes are unavailable, provide exact manual instructions.

Ensure HTTPS is configured when supported and domain validation is complete.

Do not report successful live deployment until the deployment and URL have actually been verified.

Commit often and merge after various milestones. The game should be accessible for testing and feedback throughout the development process.

---

# 19. PRODUCT QUALITY EXPECTATIONS

This project must not feel like a generic AI-generated technology demo.

Prioritize:
- Fun
- Responsiveness
- Personality
- Visual coherence
- Clear feedback
- Satisfying animations
- Interesting environments
- Stable gameplay

Every core gameplay interaction should have appropriate feedback.

For example, rescuing an animal should feel like an accomplishment.

Transforming should feel magical.

Discovering a new biome should feel exciting.

Defeating a boss should feel hilarious and rewarding.

Small moments of delight matter more than unnecessary technical sophistication.

The final game should be a complete experience rather than a collection of loosely connected feature demonstrations.

---

# 20. REQUIREMENTS TRACKING

Create and maintain:

`docs/GAME_DESIGN.md`

`docs/TECHNICAL_ARCHITECTURE.md`

`docs/ART_DIRECTION.md`

`docs/DEVELOPMENT_PLAN.md`

`docs/REQUIREMENTS.md`

`docs/TESTING.md`

`docs/ASSETS.md`

Use a requirements matrix that maps each major requirement to:
- Implementation issue
- Owner or responsible workstream
- Status
- Acceptance criteria
- Test coverage

Distinguish between:
1. Calvin's explicit requirements
2. Agreed technical requirements
3. Proposed design decisions
4. Optional future improvements

Do not silently drop requirements.

Where Calvin's requirements are contradictory or ambiguous, choose the simplest child-friendly solution, document the assumption, and proceed.

Only request human intervention when truly required, such as unavailable credentials or permissions.

---

# 21. WORKING RULES

1. Make frequent, meaningful Git commits.
2. Keep builds working.
3. Delegate independent tasks when supported.
4. Integrate agent work regularly.
5. Keep documentation current.
6. Treat mobile playability as a primary requirement.
7. Avoid unnecessary complexity.
8. Do not use copyrighted third-party assets without authorization.
9. Never sacrifice gameplay for visual effects.
10. Complete and test one vertical slice before expanding extensively.
11. Prefer real, playable implementations over impressive-looking mockups.
12. Maintain an actionable GitHub issue backlog.
13. Record meaningful architectural decisions.
14. Ensure completed features are actually connected to gameplay.
15. Do not invent test results or deployment success.
16. Continue making progress without unnecessary approval requests.

---

# 22. IMMEDIATE EXECUTION INSTRUCTIONS

Begin now.

Your first sequence of actions:

1. Inspect the development environment, available tools, Blender MCP integration, GitHub authentication, and agent capabilities.
2. Verify the intended repository does not already exist.
3. Create the new public GitHub repository named `transforminals`.
4. Scaffold the application using the specified stack.
5. Establish the GitHub Actions workflows and project standards.
6. Commit and push the initial foundation.
7. Create the product specifications and technical architecture documentation.
8. Create GitHub issues and milestones covering the phased implementation.
9. Implement the minimal Three.js application and confirm that it builds.
10. Set up the initial GitHub Pages deployment.
11. Begin Phase 1 by building the Meadow biome, player movement, and first animal rescue.
12. Implement and test a complete rescue-to-transformation gameplay loop.

Maintain a concise development log and report:
- Repository URL
- Deployment URL, if working
- Completed milestones
- Tests performed
- Current implementation status
- Remaining blockers
- Next planned work

**Do not spend the entire session planning. Write code, create assets, commit progress, and ship a playable increment.**

## Ultimate Goal

Build Calvin's game.

Not just a prototype, not just a 3D viewer, and not just a collection of computer-generated art.

Build a funny, colorful, enormous-feeling adventure where a kid can rescue animals, turn into them, explore fantastical worlds, encounter ridiculous bosses, defeat a demon lizard, celebrate with his animal friends, and keep playing as long as he wants.

Above all else:

**Make Transforminals fun for Calvin.**