# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 project called "hontodana" built with:
- **Next.js 15.3.5** with App Router
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **shadcn/ui** component library (New York style)
- **Prisma** as ORM with PostgreSQL
- **next-auth** for authentication
- **Biome** for linting and formatting

## Common Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run Next.js linting
```

### Code Quality
The project uses **Biome** for linting and formatting. Run Biome commands directly when needed:
```bash
npx biome check      # Check code quality
npx biome check --fix # Fix automatically
```

### Database
```bash
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
npx prisma studio    # Open Prisma Studio
```

## Project Structure

### Database Setup
- **Prisma schema**: `prisma/schema.prisma`
- **Generated client**: `app/generated/prisma` (custom output location)
- **Database**: PostgreSQL (requires `DATABASE_URL` environment variable)

### Frontend Architecture
- **App Router**: Uses Next.js 15 App Router in `app/` directory
- **Components**: shadcn/ui components with aliases configured in `components.json`
- **Styling**: Tailwind CSS v4 with global styles in `app/globals.css`
- **TypeScript**: Path mapping with `@/*` pointing to root directory

### Key Configuration
- **shadcn/ui**: New York style, RSC enabled, using Lucide icons
- **Component aliases**: 
  - `@/components` → components/
  - `@/lib` → lib/
  - `@/ui` → components/ui/
  - `@/hooks` → hooks/
- **Prisma client**: Custom output to `app/generated/prisma`

## Development Notes

### Authentication
The project includes next-auth setup but authentication implementation needs to be completed.

### Styling
- Uses Tailwind CSS v4 with CSS variables enabled
- shadcn/ui components use neutral base color
- Global styles are in `app/globals.css`

### Type Safety
- Strict TypeScript configuration
- Path mapping configured for clean imports
- Prisma generates types automatically