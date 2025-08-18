# MatchDay Admin - League Management Portal

Administrative interface for MatchDay league administrators to manage leagues, approve team requests, and oversee competitions.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Configure your Supabase credentials (same as player app)
```

3. Start the development server:
```bash
npm run dev -- --port 3002
```

The admin app runs on `http://localhost:3002` by default to avoid conflicts with the player app.

## Architecture

This is the **admin application** in a two-app architecture:

- **Player App** (`/Users/lukini/MatchDay/`): For players to create teams, join leagues, view stats
- **Admin App** (`/Users/lukini/matchday-admin/`): For league administrators to manage competitions

Both apps share the same Supabase database but have different interfaces and permissions.

## Key Features

- **Dashboard**: Overview of leagues, teams, players, and pending requests
- **League Management**: Create and manage football leagues
- **Team Approval**: Review and approve team join requests
- **Match Management**: Schedule and manage matches
- **User Management**: Oversee player accounts and roles

## User Roles

The system supports these user roles:
- `league_admin`: Can manage leagues and approve team requests
- `app_admin`: Full system administration access
- `player`: Regular player access (uses the player app)

## Technology Stack

- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Tailwind CSS v4** with dark admin theme
- **Supabase** for backend and authentication
- **Shared Database** with the player application

## Development

Both applications can run simultaneously:
- Player app: `http://localhost:3000`
- Admin app: `http://localhost:3002`

Note: The player app typically runs on port 3000, but you mentioned it's on 3001 - adjust the port accordingly when running both apps.
