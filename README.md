# MatchDay

A comprehensive sports team management application built with Next.js 15, designed to streamline team organization, player management, and match tracking for sports leagues and organizations.

## Features

- **Team Management**: Create and manage teams with detailed player rosters and statistics
- **League Discovery**: Browse and join leagues for organized play
- **Player Dashboard**: Comprehensive player profiles with performance analytics
- **Match Recording**: Post-match score recording and statistics tracking
- **Achievement System**: Player achievements and performance recognition
- **Global Leaderboards**: Track top performers across leagues and teams
- **User Authentication**: Secure authentication with user profiles and preferences
- **Responsive Design**: Optimized for desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19, TypeScript 5
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Query
- **Fonts**: Geist Sans & Mono
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account (for database and authentication)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/matchday.git
cd matchday
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Update `.env.local` with your Supabase configuration (see [Environment Setup](#environment-setup) below for details).

4. Set up the database:
- Go to your Supabase project dashboard
- Run the migrations in `/supabase/migrations/` in order
- Or use the Supabase CLI: `supabase db push`

5. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Environment Setup

### Required Environment Variables

The application requires the following environment variables. Copy `.env.example` to `.env.local` and fill in your values:

```bash
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_APP_URL=http://localhost:3001
```

### Getting Supabase Credentials

1. Go to [app.supabase.com](https://app.supabase.com)
2. Create a new project or select an existing one
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

### Running the Admin App

The admin app runs separately on port 3001:

```bash
cd matchday-admin
cp .env.example .env.local
# Use the SAME Supabase credentials as the main app
npm install
PORT=3001 npm run dev
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── leagues/          # League management
│   ├── teams/            # Team management
│   └── profile/          # User profiles
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── features/         # Feature-specific components
│   ├── layout/           # Layout components
│   ├── player/           # Player-related components
│   └── ui/               # Reusable UI components
├── lib/                   # Utility functions and services
│   ├── auth/             # Authentication services
│   ├── services/         # API services
│   ├── supabase/         # Supabase client
│   └── types/            # TypeScript type definitions
└── docs/                  # Documentation
```

## Database Schema

The application uses a comprehensive PostgreSQL schema with the following main entities:

- **Users**: Player and admin user accounts
- **Teams**: Team information and management
- **Leagues**: League organization and settings
- **Matches**: Match scheduling and results
- **Players**: Player profiles and statistics
- **Achievements**: Player achievements and rewards

See `docs/database-schema.md` for detailed schema documentation.

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with TypeScript support

### Code Style

This project uses:
- ESLint for code linting
- TypeScript strict mode
- Tailwind CSS for styling
- Component-based architecture

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on every push to main branch

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@matchday.app or open an issue on GitHub.
