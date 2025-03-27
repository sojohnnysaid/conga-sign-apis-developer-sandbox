# CLAUDE.md for Conga-Sign-APIs-Developer-Sandbox

## IMPORTANT: AFTER REVIEWING THIS FILE
After reviewing this file, IMMEDIATELY read the `/docs/START_HERE.md` document to understand the project goals, structure, and current development status. That document contains the detailed project overview and development milestones.

## Build Commands
- Build: `npm run build:all` - Builds both frontend and backend
- Lint: `npm run lint` - Run ESLint on all JS/TS/Svelte files
- Test (all): `npm test` - Run all unit tests with Vitest
- Test (single): `npm test -- -t "test name"` - Run a specific test
- Test (e2e): `npm run test:e2e` - Run end-to-end tests with Playwright
- Dev mode: `npm run dev` - Start both frontend and backend dev servers

## Code Style Guidelines
- **Formatting**: Use 2-space indentation, consistent line breaks
- **Naming**: camelCase for variables/functions, PascalCase for components/classes
- **Types**: Use TypeScript types where applicable
- **Imports**: Group imports (standard library, third-party, local)
- **Error Handling**: Use try/catch for async functions, provide informative error messages
- **Services**: Backend code should follow the service pattern with clear separation of concerns
- **Components**: Svelte components should be focused on a single responsibility
- **State Management**: Use Svelte stores for global state, component state for local state
- **Testing**: Write unit tests for services and components

## Project Structure
- Backend services in `src/backend/services/`
- Frontend components in `src/frontend/components/`
- API routes in `src/backend/routes/`
- Test files in `tests/`

## Documentation
- `/docs/START_HERE.md` - Main project guide and development checklist
- `/docs/development-guide.md` - Detailed architectural blueprint
- `README.md` - Installation and usage instructions