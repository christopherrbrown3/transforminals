# Transforminals

**A wild adventure by Calvin.** Rescue animals by jumping onto their cages, become your new friends, and explore a colorful 3D toy world. No lives, no drowning, and no game over.

[Play Transforminals](https://transforminals.christopherbrown.ai) · [Requirements and evidence](docs/REQUIREMENTS.md) · [Development plan](docs/DEVELOPMENT_PLAN.md)

## The adventure

Version 0.5.0 connects ten compact environments: Clover Meadow, Snowcone Valley, Sunbeam Savannah, Wobble Dunes, Bubble Bay, Atlantis, Popcorn Peaks, Twinkle Caverns, the Giggle Rift, and Big Little City. There are 22 required animal rescues and transformations, wandering wildlife, six original bosses, local autosaves, original synthesized music, and a skippable thank-you party. The final arena opens after every required rescue; five head boops defeat the Demon Lizard with five visible hearts, one lost per hit. Exploration continues afterward.

The v0.4 pass gives all 22 animals more distinct anatomy, faces, markings and movement. Bosses face the view, City rescue approaches are clearer, portal destinations appear earlier, and an arrival ripple marks travel. Native scroll areas support the transformation list and menus. Installed-iOS scrolling still needs physical-device confirmation.

Twinkle Caverns has connected chambers, tunnels, three surface exits, and a hidden crystal nook. Each biome has original synthesized music and ambience; Jazzy Finn’s song sends an empty toy boat into a harmless splashy reef bump. The v0.2 polish pass removes automatic training, simplifies the HUD, adds sharper rendering and shadows, improves scenery spacing/collision, and makes forward gates favor unexplored regions. Live WebKit updates through v0.4 preserved progress, optional cave discovery and offline play. Physical iPad installation, touch feel, and sustained performance still need device validation. Automated WebKit tests use an iPad-like profile; they are not physical iPad testing.

## How to play

- Use the big arrows on the right to move and the gold star to jump. The orange lightning button uses your form's own power.
- Land on a cage roof to rescue its animal. Tap its portrait on the left, or open Friends, to transform.
- Hold the star to fly or swim upward. Release it to glide or drift down. All forms can explore on land.
- Walk through a labeled glowing ring to visit another region. The Map button opens an illustrated atlas with your current location and the number of friends still waiting in every region. Tap a visited place to return, or choose Return to Meadow.
- Point a power at a wild animal to send it zooming into space. It always floats home a few seconds later.
- Trees, roofs, rocks and other scenery are solid: land on top and you stay there. Some, like the desert pyramid, can be climbed with jumps.
- Bounce on a boss's head to beat it, then play as that boss. Beaten bosses join your forms with their own powers.
- On desktop, use WASD or arrow keys, Space to jump, E or F for your power, M for the map, and Escape for pause. H returns to Meadow.

Saves stay in this browser on this device. There is no account or cloud save. Start a new adventure from pause/settings only after confirming the reset.

## iPad and offline play

Open the game in Safari, then use **Share → Add to Home Screen**. Landscape offers the most room. Open once online and let the game cache before leaving the network. All runtime libraries, models, fonts, and synthesized audio are local; no CDN, external API, backend, or paid hosting is required. Updates download in the background and activate from the menu or through a player-selected save-and-update button, with cutscenes deferred.

## Development

Use Node.js 22.12 or newer and npm.

```sh
npm ci
npm run dev
```

```sh
npm run check
npx playwright install chromium webkit
npm run test:e2e
npm run test:pwa
```

`check` runs TypeScript, ESLint, Vitest, and a production build. Browser gameplay tests use Chromium and WebKit; PWA tests use the production preview. The test setup API is available only at `?test=1`. Normal gameplay does not expose it.

## Project documents

- [Original brief](docs/ORIGINAL_BRIEF.md)
- [Game design](docs/GAME_DESIGN.md)
- [Technical architecture and content extension](docs/TECHNICAL_ARCHITECTURE.md)
- [Art direction](docs/ART_DIRECTION.md)
- [Requirements matrix](docs/REQUIREMENTS.md)
- [Development plan](docs/DEVELOPMENT_PLAN.md)
- [Testing](docs/TESTING.md)
- [Development log](docs/DEVELOPMENT_LOG.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Assets and attribution](docs/ASSETS.md)

## License

Original code and original project art use the [MIT license](LICENSE). Third-party dependencies and Fredoka retain their own licenses; see the asset register and bundled `public/licenses/`. All creatures and music are original interpretations. No ripped franchise assets are included.
