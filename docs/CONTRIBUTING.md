# Contributing

## Project & deployment

- **GitHub project**: [Flywheel Studio Project 7](https://github.com/orgs/FlywheelStudio/projects/7) — tasks and releases are tracked here.
- **Remotes**:
  - `origin` → [FlywheelStudio/vantaverse-admin](https://github.com/FlywheelStudio/vantaverse-admin) (Flywheel org — day-to-day work)
  - `production` → [VantaThrive/vantathrive-admin](https://github.com/VantaThrive/vantathrive-admin) (client repo — Vercel production)
- **Add the production remote** (once per clone):
  ```bash
  git remote add production https://github.com/VantaThrive/vantathrive-admin.git
  ```
- **Sync / deploy**: App is hosted on the client’s (Medvanta) Vercel account. Push Flywheel branches into the matching client branches:
  ```bash
  git push production develop   # sync develop → VantaThrive develop
  git push production main      # sync/deploy main → VantaThrive main
  ```

## Workflow

1. **Tasks** — Create tasks/issues in the GitHub project.
2. **Branches** — Create branches from those issues directly and never using git commands.
3. **Releases** — Use the project board to manage and ship releases using `pnpm release` directly on main branch only.
