# Engineering guidance

- Read `docs/ORIGINAL_BRIEF.md` and the relevant design/architecture documents before changing game behavior.
- Preserve the child-friendly constraints: no player death, no punitive failure, easy controls, and forgiving rescue jumps.
- Keep game content data-driven where practical. Keep the required rescue set distinct from optional wildlife and ambient content.
- Treat the iPad in landscape as the primary play target; retain keyboard and pointer support for development.
- Bundle runtime dependencies and assets. The deployed game must not depend on a backend, external API, or CDN.
- Keep requirements and testing status honest. Mark items implemented only after inspecting the behavior and validating it at the stated level.
- Do not commit ripped or unlicensed third-party assets. Record asset source and license before adding third-party content.
- Run the checks relevant to a change and report what ran. Never claim physical iPad testing without a real device.
- Use short, focused changes. The coordinating agent owns Git commits and pushes unless it explicitly delegates them.
