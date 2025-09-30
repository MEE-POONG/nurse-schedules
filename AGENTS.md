# Repository Guidelines

## Project Structure & Module Organization
Route components live in `pages/`; API handlers share `pages/api`. Feature-focused UI sits in `components/`, Redux slices in `store/`, helpers in `utils/`, Prisma schema and seeds in `prisma/`, Tailwind and global CSS in `styles/`, and static assets in `public/`. Auto-scheduling references and scripts are kept in the root (`AUTO_SCHEDULE_*.md`, `diagnose-auto-schedule.js`, `run-diagnosis.js`).

## Build, Test, and Development Commands
- `npm install` installs dependencies after cloning or lockfile updates.
- `npm run dev` starts the hot-reload dev server on port 3000.
- `npm run build` outputs the production bundle.
- `npm run start` serves the build with logger hooks on port 6040.
- `npm run lint` runs ESLint/Next checks; keep it clean before PRs.
- `node prisma/seed.js` seeds Mongo once `DATABASE_URL` is configured.
- `node test-auto-schedule.js` hits core auto-schedule APIs against `http://localhost:6040`.

## Coding Style & Naming Conventions
Use 2-space indentation, dangling semicolons, and mostly double quotes enforced by `eslint-config-next`. Prefer React function components, PascalCase for component files, camelCase for helpers, and Tailwind class strings over custom CSS. Respect path aliases from `jsconfig.json` rather than deep relative imports, and add short comments only where business rules or scheduling math may surprise reviewers.

## Testing Guidelines
Linting is the fast gate; run `npm run lint` before every push. Extend `test-auto-schedule.js` or add new Node scripts when introducing endpoints, capturing sample payloads in the accompanying docs. For UI or scheduling updates, note manual verification steps (route, dataset, expected totals) in the PR and update `AUTO_SCHEDULE_TROUBLESHOOTING.md` when workflows change.

## Commit & Pull Request Guidelines
History favors concise imperative subjects (e.g., `Improves duty sorting by sequence number`); keep each commit focused on one behavior or fix. Pull requests should summarise the change, link Jira/GitHub issues where relevant, attach screenshots or JSON diffs for UI/API shifts, and list the manual or scripted checks you ran.

## Data & Configuration Tips
Define `DATABASE_URL` in `.env.local` or `.env` before running Prisma commands. Use `npx prisma db push` after schema edits and reseed via `node prisma/seed.js`; keep credentials out of source control and reach for the Docker `npm run build-push*` scripts only when registries are accessible.
