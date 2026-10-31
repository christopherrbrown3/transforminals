# Game design

## Player promise

Transforminals is a cheerful, forgiving exploration game for children ages 6–10. The player explores a connected toy-like world, rescues animals by landing on broad low cages, and can then transform into each rescued creature. Exploration has no game-over state: hazards and boss attacks return the player safely to play.

## Core loop

Explore a readable region, follow landmarks or animal hints, jump onto an easy-to-reach cage, celebrate the rescue, then try the new creature and its ability. Required rescues advance the main adventure; optional wildlife and surprises add delight without affecting the final gate.

## Player and controls

The player starts as a human in Meadow. Landscape iPad touch controls are primary: a creature selector on the left, movement on the right, a prominent gold star Jump button, and a separate orange Power button beside it. Keyboard and mouse remain available. The camera follows automatically. Following the October 18 polish feedback, start immediately without automatic training or recurring instruction panels. Cage roofs and the star action communicate the rescue interaction; Pause → How to play holds optional movement, rescue, transformation, and ability instructions. NPC speech follows deliberate star interactions rather than proximity. Jump also flies or swims upward when held; Power uses the current form's own move.

## Transformations and rescue

Jumping onto a wide, low cage rescues its animal. The rescue is idempotent and permanently unlocks that form. Transformations are immediate or nearly so, reversible, and cost no resource. Every form has a distinct look and at least one useful or amusing trait. The rescue set is explicit game data and is separate from ambient wildlife.

## World

The connected regions are Meadow, Winter, Savannah, Desert, Beach, Ocean/Atlantis, Lava, Underground, Nether-inspired dimension, and City. Each needs a distinct palette, landmarks, approachable routes, rescue content, and local wildlife. Ocean movement permits easy vertical swimming without drowning. The Nether-inspired portal and return route are visible and original. City exploration is possible before the finale; only the final arena is gated by all required rescues.

## Creatures and character content

Required creatures include an Arctic fox; tiger, lion, giraffe, and hippopotamus; sharks, piranhas, barracudas, whale shark, kraken, and leviathan; and city rat, peregrine falcon, giant cow, plus original giant reptile and mechanical reptile characters where rights to franchise characters are unavailable. Baby Godzilla and the final demon lizard are concepts in the brief; public implementation must use suitable original designs unless rights permit. Boy siren is explicitly permitted and sings an original jazz-inspired motif. No mermaids.

Wildlife NPCs wander, react, and provide authored contextual hints. Jumping beside one makes it wobble and talk. Animals never fight back or appear injured.

## Powers — October 31

Calvin asked for separate Jump and Power buttons, a unique power for every animal, and powers that shoot a wild animal into space. All 23 forms have their own power, defined as data in `powers.ts`: Calvin's Super boop is the brief's harmless cartoon punch, and the animals dash, pounce, roar, sneeze sand, splash, spin, blow bubbles, ping, beam, swing their necks, twirl tentacles and stomp. Each has its own reach, motion, particles and sound. Powers cost nothing and can be repeated after a 0.45-second animation beat, matching the brief's "no cooldown or only negligible animation delays".

Powers act where the player faces, with gentle aim help toward an animal roughly in front and a small forgiveness margin like the cage landing. A wild animal inside a power's reach rockets up and away with a sparkle trail, becomes a twinkling star near the top of the view, and three seconds later floats back down to its own spot with a happy bounce and a funny line. It is never hurt, never fights back, and its hints keep working. Bosses and caged animals are unaffected, so rescues still need cage jumps and bosses still need head stomps. Moving powers respect scenery, cages and hazards, and a pounce landing on a cage still rescues.

## Bosses and ending

Six original encounters are configured: Sproutzilla (a friendly baby giant lizard), Sir Slush-a-lot, The Sand Witch, Admiral Flushington (a comedic toilet monster with a flush-and-spin defeat), the Lava Lump, and the final Demon Lizard. Bosses use readable slow patterns and cannot kill the player. The final arena stays locked until all required cages are rescued. Five forgiving head stomps defeat the final boss; five visible hearts each represent one remaining hit (revised by the user on October 19). The short, skippable finale uses harmless colorful effects, rescued animals, “THANK YOU!”, and a fanfare. The boss is completed only once, and exploration continues afterward.

## Tone, accessibility, and sound

Use colorful, blocky, toy-like original art, expressive silhouettes, playful effects, short readable dialogue, gentle music, and clear feedback. Support mute/volume and reduced motion where practical. Avoid disturbing imagery, copyrighted music, and external runtime services.

## Exploration gates — October 18 revision

The user requested fewer repeated returns while walking forward. The far gate now favors an undiscovered biome, cycling through the registry until every region has been visited. One side gate returns to the place just left; the other offers a shortcut. All three destinations differ, and after the world is discovered the forward gate still avoids an immediate return. The map retains explicit revisits and Return to Meadow.

## Underground discoveries — October 19 revision

Twinkle Caverns is a cutaway network of named chambers and connecting passages. Pale inlaid stones guide the main paths; sparse violet crystals lead beyond the mushroom room to the Humming Crystal Nook. Discovering the nook is optional, saves locally, and never changes the 22-rescue requirement. Three surface rings and the map offer exits. Older saves move out of newly solid rock; flying forms that land beyond the walkable cave return to the last safe path. Jazzy Finn’s original song also triggers an empty toy boat’s comic reef bump, splash, and recovery in Ocean.

## Player feedback — v0.4

Bosses keep their faces toward the view outside defeat animations. The City falcon approach remains open and visible. Portal destinations appear earlier in one readable scene label; a gentle arrival ripple marks travel without blocking movement, with a subdued reduced-motion version. Native vertical scrolling belongs to the transformation list and dialogs so swiping the collection does not select an animal or move the player.

## World map and Bubble Bay — October 19 revision

The Map button opens an illustrated atlas of all ten regions. A “You are here” marker identifies the actual current region, and every region shows its remaining required rescues, including places not yet visited. Completed regions show “All friends rescued.” Only discovered regions permit fast travel; glowing rings still introduce new places. Return to Meadow remains available. The map pauses play, scrolls vertically on smaller screens and restores focus to its opener.

Bubble Bay keeps its name and becomes a distinctly coastal toy landscape: turquoise shallow water, wet sand, surf, offshore water, palms, beach furniture, shells and floating bubbles. Its shoreline matches the existing swimming boundary at X = -20. Bubbles use gentle movement, with a stable pose under reduced motion. Rescues, routes, wildlife and the harmless Flushington encounter retain their authored clearances.
