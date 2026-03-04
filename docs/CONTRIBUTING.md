# Contributing

## Project & deployment

- **GitHub project**: [Flywheel Studio Project 7](https://github.com/orgs/FlywheelStudio/projects/7) — tasks and releases are tracked here.
- **Production**: App is hosted on the client’s (Medvanta) Vercel account. Deploy with:
  ```bash
  git push production main
  ```

## Workflow

1. **Tasks** — Create tasks/issues in the GitHub project.
2. **Branches** — Create branches from those issues directly and never using git commands.
3. **Releases** — Use the project board to manage and ship releases using `pnpm release` directly on main branch only.
