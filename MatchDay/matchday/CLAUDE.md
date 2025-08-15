# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application called "MatchDay" built with React 19, TypeScript, and Tailwind CSS v4. It uses the App Router architecture with modern Next.js patterns.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack for fast builds
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with Next.js TypeScript configuration

### Development Server
The development server runs on `http://localhost:3000` by default and uses Turbopack for enhanced performance.

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