# Development plan

Work in playable vertical slices. A phase is complete only when its acceptance points are implemented and validated; a listed or planned feature is not evidence of completion.

| Phase | Milestone             | Exit evidence                                                                                                                                                                                                                                    |
| ----- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0     | Foundation            | **Verified.** Static shell builds, checks pass, the public foundation shell was served through Pages, and production-preview offline shell/model behavior passes in Chromium.                                                                    |
| 1     | Meadow slice          | **Automated acceptance passed.** Human movement, visible jump control, forgiving rescue, transformation, save/reload, and touch-profile browser coverage pass.                                                                                   |
| 2     | World exploration     | **Core implemented; broad rescue flow passes.** Ten biomes load; all 22 required cage jumps, city-cow gate access, wildlife dialogue, and Meadow-to-Winter portal pass in browser automation. Additional route, ability, and swim checks remain. |
| 3     | Advanced environments | **Core implemented; detailed behavior review remains.** Ocean, Volcano, Underground, and Rifts load; Ocean creatures rescue; underwater controls and hazard/return behavior need focused coverage.                                               |
| 4     | Bosses                | **Flushington and finale flows verified.** Shared hit/heart logic, mini-boss defeat, skip, and replay safety pass; other configured boss variants need coverage.                                                                                 |
| 5     | City and finale       | **Automated acceptance passed for core loop.** All city cages, final gate, five stomps, heart feedback, saved victory, and continued exploration pass in Chromium and WebKit.                                                                    |
| 6     | Polish                | **In progress.** Physical iPad feel/install, audio policies, update lifecycle, sustained performance, full asset rights/source audit, accessibility, and remaining regression checks are open.                                                   |

Detailed requirements and current status live in [REQUIREMENTS.md](REQUIREMENTS.md). GitHub milestones mirror these phases. Do not start broad content expansion before the playable Meadow slice works.
