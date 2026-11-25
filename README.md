# Minimal shared front-end base

Contains only the core app bootstrap/configuration files and shared folder scaffold.

Included:

- package.json
- index.html
- Vite, TypeScript and Tailwind configuration
- src/vite-env.d.ts
- shared source folders with .gitkeep markers

Intentionally excluded:

- .env / .env.example and secrets
- tests and test configuration
- README/docs, deployment/container configuration
- lockfiles
- feature/page implementation code

Important:

- Extract at the repository root.
- Do not copy or replace the repository's .git directory.
- If the repository already has any included configuration file, compare it before
  overwriting; keep the existing version if it contains project-specific settings.
- Use the package manager already agreed by the team and generate/update its lockfile
  consistently after reviewing package.json.
