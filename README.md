# MatchDay Monorepo

A comprehensive sports team management platform with separate player and admin applications, built on a shared codebase.

## 📦 Monorepo Structure

```
matchday/
├── apps/
│   ├── player/          # Player-facing Next.js app (port 3000)
│   ├── admin/           # Admin Next.js app (port 3001)
├── packages/
│   ├── database/        # Shared database types and schema
│   ├── services/        # Shared business logic services
│   ├── auth/            # Authentication utilities
│   └── shared/          # Common utilities and helpers
├── supabase/            # Database migrations and config
└── pnpm-workspace.yaml  # Workspace configuration
```

## ✨ Features

- **Team Management**: Create and manage teams with detailed player rosters and statistics
- **League Discovery**: Browse and join leagues for organized play
- **Player Dashboard**: Comprehensive player profiles with performance analytics
- **Match Recording**: Post-match score recording and statistics tracking
- **Achievement System**: Player achievements and performance recognition
- **Global Leaderboards**: Track top performers across leagues and teams
- **User Authentication**: Secure authentication with user profiles and preferences
- **Responsive Design**: Optimized for desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+ (`npm install -g pnpm`)
- Supabase account

### Installation

```bash
# Install all dependencies
pnpm install

# Start player app (port 3000)
pnpm dev:player

# Start admin app (port 3001)
pnpm dev:admin

# Run both apps simultaneously
pnpm dev
```

## 📱 Applications

### Player App (`apps/player/`)
Player-facing features:
- Team management and player rosters
- League discovery and joining
- Match tracking and live scoring
- Player dashboards and statistics
- Achievement system
- Global leaderboards

**Port**: 3000
**Environment**: `.env.local` with `NEXT_PUBLIC_SITE_URL=http://localhost:3000`

### Admin App (`apps/admin/`)
Admin-facing features:
- League management and creation
- Team join request approval
- Match scheduling and management
- User role administration
- System oversight and analytics

**Port**: 3001
**Environment**: `.env.local` with `NEXT_PUBLIC_SITE_URL=http://localhost:3001`

## 📚 Shared Packages

### @matchday/database
Database types and schema definitions generated from Supabase. Provides type-safe access to:
- User profiles
- Leagues and seasons
- Teams and team members
- Matches and statistics

### @matchday/services
Shared business logic services:
- League service
- Team service
- Match service
- Season service
- Player service
- User service
- Stats service
- Analytics service
- Achievement service

### @matchday/auth
Authentication and authorization utilities:
- JWT validation
- Role-based access control
- Session management

### @matchday/shared
Common utilities and helpers:
- Tailwind class utilities (cn)
- Date formatters
- Environment validation
- Constants and configurations

## 🛠 Development Commands

```bash
# Development
pnpm dev              # Run both apps in parallel
pnpm dev:player       # Run player app only
pnpm dev:admin        # Run admin app only

# Building
pnpm build            # Build all apps and packages
pnpm build:player     # Build player app
pnpm build:admin      # Build admin app
pnpm build:packages   # Build shared packages only

# Code Quality
pnpm lint             # Lint both apps
pnpm type-check       # Type-check both apps
pnpm test             # Run player app tests
pnpm format           # Format all code with Prettier

# Cleaning
pnpm clean            # Remove all node_modules and build artifacts
```

## 🗄️ Database

Both apps share the same Supabase PostgreSQL database.

### Migrations

Database migrations are located in `supabase/migrations/` and managed centrally.

```bash
# Apply migrations
npx supabase db push

# Create new migration
npx supabase migration new migration_name
```

### Schema Updates

When database schema changes:
1. Update migrations in `supabase/migrations/`
2. Regenerate types in `packages/database/src/database.types.ts`
3. Update service layer if needed

## 🔐 Environment Setup

Both apps require environment variables for Supabase connection.

### Player App (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Admin App (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3002
```

## 🏗️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19, TypeScript 5
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Query (TanStack Query)
- **Monorepo**: pnpm workspaces
- **Testing**: Jest, React Testing Library

## 📝 Development Guidelines

### Adding Shared Code

1. **Database Types**: Add to `packages/database/src/database.types.ts`
2. **Services**: Add to `packages/services/src/`
3. **Auth Logic**: Add to `packages/auth/src/`
4. **Utilities**: Add to `packages/shared/src/`

### Creating New Apps

```bash
# Create new app directory
mkdir apps/new-app

# Add to workspace
# Update pnpm-workspace.yaml (already includes apps/*)

# Install workspace dependencies
cd apps/new-app
pnpm add @matchday/database@workspace:*
pnpm add @matchday/services@workspace:*
```

### Importing Shared Packages

```typescript
// In any app
import { Database } from '@matchday/database';
import { LeagueService } from '@matchday/services';
import { validateSession } from '@matchday/auth';
import { cn, formatDate } from '@matchday/shared';
```

## 🚢 Deployment

### Vercel (Recommended)

Both apps can be deployed separately to Vercel:

```bash
# Deploy player app
cd apps/player
vercel

# Deploy admin app
cd apps/admin
vercel --prod
```

Configure environment variables in Vercel dashboard for each app.

### Other Platforms

The monorepo is compatible with:
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test both apps: `pnpm test && pnpm type-check`
4. Commit: `git commit -m 'feat: add feature'`
5. Push: `git push origin feature/your-feature`
6. Open a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Check existing issues on GitHub
- Create a new issue with detailed description
- Include error messages and reproduction steps
