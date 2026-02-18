# Project Tracker: One-Page Map

## What This App Is
A multi-workspace project tracker built with React + Vite + Firebase.
Users sign in, create/join workspaces, track projects/goals, manage people, and collaborate with role-based permissions.

## Stack
- React 18 + React Router
- Vite
- Firebase Auth + Firestore
- CSS variables for theming (`palette-*`)
- Tailwind toolchain installed (minimal usage)
- PWA manifest + service worker

## App Flow
1. `src/main.jsx` boots app, router, global styles, service worker.
2. `src/App.jsx` handles:
   - auth state
   - route protection
   - loading user workspaces (`memberIds` query)
   - workspace create/delete/test-connection
   - banner messages
   - global palette state
3. `/workspace/:id` page (`src/pages/workspace/index.jsx`) handles:
   - live projects/people/goals listeners
   - role checks (owner/admin/editor/collaborator)
   - presence tracking
   - derived project progress from goal statuses

## Routes
- `/login` -> login page
- `/profile/new` -> create account
- `/profile/edit` -> edit profile
- `/` -> dashboard (workspace tiles + create)
- `/workspace/:id` -> workspace UI (projects/goals/people)
- `*` -> not found

## Firestore Shape
- `profiles/{uid}`
- `workspaces/{wsId}`
  - `members` map (`uid -> role`)
  - `memberIds` array (queryable membership)
  - `paletteKey`
- `workspaces/{wsId}/projects/{projectId}`
- `workspaces/{wsId}/projects/{projectId}/goals/{goalId}`
- `workspaces/{wsId}/people/{personId}`
- `workspaces/{wsId}/presence/{uid}`

## Permissions (High Level)
Defined in `firestore.rules`:
- workspace read: members only
- workspace update: owner/admin
- workspace delete: owner only
- projects write: owner/admin
- goals write: owner/admin/editor, collaborator limited
- people write: owner/admin

## Theme System
- Palette names: `src/constants/palettes.js`
- Palette variables: `src/styles/palette.css`
- App root class: `palette-${paletteKey}` in `src/App.jsx`

## Key UI Building Blocks
- Header/Auth/Theme: `src/components/header/*`
- Reusable card/button/input rows: `src/components/ui/ui.jsx`
- Tabs: `src/components/tabs/*`
- Lists: `src/components/list/*`
- Project selector: `src/components/projects-overview/*`
- People manager: `src/components/people-overview/*`
- Presence indicator: `src/components/presence-list/*`

## Dev Commands
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`
- `npm run deploy:rules`
