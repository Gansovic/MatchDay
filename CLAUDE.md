# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **pnpm monorepo** containing the MatchDay platform:
- **Player App** (`apps/player/`) - Player-facing Next.js 15 application (port 3000)
- **Admin App** (`apps/admin/`) - Admin-facing Next.js 15 application (port 3001)
- **Shared Packages** (`packages/`) - Common code shared between apps

Both apps use React 19, TypeScript 5, and Tailwind CSS v4 with the App Router architecture.

## Monorepo Structure

```
matchday/
├── apps/
│   ├── player/          # Player app (Next.js 15)
│   └── admin/           # Admin app (Next.js 15)
├── packages/
│   ├── database/        # Shared database types (@matchday/database)
│   ├── services/        # Shared services (@matchday/services)
│   ├── auth/            # Auth utilities (@matchday/auth)
│   └── shared/          # Common utilities (@matchday/shared)
├── supabase/            # Database migrations
└── pnpm-workspace.yaml  # Workspace config
```

## Development Commands

### Core Development
- `pnpm dev` - Run both player and admin apps in parallel
- `pnpm dev:player` - Start player app only (port 3000)
- `pnpm dev:admin` - Start admin app only (port 3002)
- `pnpm build` - Build all apps and packages
- `pnpm lint` - Lint both apps
- `pnpm type-check` - Type-check both apps

### Working with Specific Apps
- `pnpm --filter @matchday/player dev` - Run player app
- `pnpm --filter @matchday/admin build` - Build admin app

### Development Servers
- Player app: `http://localhost:3000`
- Admin app: `http://localhost:3001`
Both use Turbopack for enhanced performance.

## Architecture & Structure

### File Structure
- `src/app/` - Next.js App Router pages and layouts
  - `layout.tsx` - Root layout with Geist fonts and global styling
  - `page.tsx` - Homepage component
  - `globals.css` - Global styles with Tailwind and CSS custom properties
- `public/` - Static assets (SVG icons)
- Configuration files at root level

### Styling System
- **Tailwind CSS v4** with PostCSS integration
- **CSS Custom Properties** for theming (light/dark mode support)
- **Geist Fonts** (Sans and Mono variants) loaded via `next/font/google`
- Automatic dark mode support via `prefers-color-scheme`

### TypeScript Configuration
- Strict mode enabled with modern ES2017+ target
- Path aliases: `@/*` maps to `./src/*`
- Next.js plugin integration for enhanced TypeScript support
- Bundler module resolution for optimal tree-shaking

### Key Technologies
- **Next.js 15** with App Router
- **React 19** with latest features
- **TypeScript 5** with strict configuration
- **Tailwind CSS v4** with inline theme configuration
- **ESLint** with Next.js core web vitals rules

## Development Notes

### Font Loading
The application uses Geist font family with CSS variables for consistent typography across the application.

### Styling Approach
- Tailwind classes for component styling
- CSS custom properties for theme values
- Responsive design patterns with Tailwind breakpoints
- Dark mode handled automatically via CSS media queries