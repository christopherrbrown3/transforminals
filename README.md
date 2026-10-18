# Transforminals

Transforminals is a browser-based, open-world 3D creature rescue and transformation adventure for iPad and desktop. The game is in active development; this repository currently tracks the implementation and its requirements, and the public playable build has not yet been declared complete.

The project aims to pair relaxed exploration with easy cage-top animal rescues, permanent creature transformations, friendly boss encounters, and a colorful connected world. The target is a static site on GitHub Pages that can be installed and played offline after its assets are cached.

## Development

Requirements: Node.js 22 and npm.

```sh
npm ci
npm run dev
```

The available project checks are `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:e2e`. Browser tests use Playwright; install its browsers with `npx playwright install chromium webkit` when needed.

## Project documents

- [Original brief](docs/ORIGINAL_BRIEF.md) — Calvin's full brief and acceptance expectations.
- [Game design](docs/GAME_DESIGN.md) — gameplay rules and content direction.
- [Technical architecture](docs/TECHNICAL_ARCHITECTURE.md) — runtime structure and engineering decisions.
- [Requirements](docs/REQUIREMENTS.md) — tracked requirements and implementation status.
- [Development plan](docs/DEVELOPMENT_PLAN.md) — phased milestones.
- [Testing](docs/TESTING.md) — automated and manual test coverage.
- [Development log](docs/DEVELOPMENT_LOG.md) — dated implementation notes.
- [Deployment](docs/DEPLOYMENT.md) — Pages and custom-domain release procedure.

## License and assets

Original project code is licensed under MIT; see [LICENSE](LICENSE). Asset rights are tracked separately. Do not assume the code license applies to third-party or generated assets; see the attribution guidance in the development documentation.
