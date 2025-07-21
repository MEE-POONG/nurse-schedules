# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a nurse scheduling system for Krabi Hospital (tarangwen), built with Next.js and MongoDB. The system manages nurse duty schedules, on-call duties, overtime tracking, and generates printable reports for monthly schedules.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server (port 6040)
npm start

# Lint code
npm run lint

# Docker build and push (multiple variants)
npm run build-push         # chunwarayut/tarangwen:latest
npm run build-push-rn      # chunwarayut/nurse-schedules:latest
npm run build-push-pn      # chunwarayut/pasuk-pn-tarangwen:latest
```

## Architecture

### Database (MongoDB + Prisma)

- **User**: Staff members with roles, compensation rates, and locations
- **Duty**: Regular shift assignments (morning/afternoon/night)
- **OnCallDuty**: On-call assignments for ICU staff
- **UserDuty**: Associates users with work locations and training status
- **Location**: Work areas (ICU, ER, etc.)
- **Shif**: Shift types (ช=morning, บ=afternoon, ด=night, อบรม=training)
- **Position**: Job roles (nurse, stretcher bearer, etc.)
- **Title**: Professional titles
- **Configuration**: System settings for signatures

### Frontend Structure

- **Pages Router**: Traditional Next.js pages structure
- **Redux Store**: Global state management for date selection
- **Cookie Auth**: Authentication via `_auth_nurse` cookie
- **Thai Language**: All UI text in Thai

### Key Components

- **TableSelectMonth**: Main schedule table with month view
- **TableSelectMonthOnCall**: On-call duty table for ICU
- **ModalSelectMonth**: Duty assignment modal for individual days
- **Layout**: Wrapper with navigation and authentication

### API Routes

- `/api/user/selectMonth`: Get users and duties for specific month
- `/api/duty`: CRUD operations for duty assignments
- `/api/on-call`: On-call duty management
- `/api/user-duty`: User-location assignments
- `/api/login`: Authentication endpoint

## Development Notes

### Authentication

- Uses cookie-based auth with `authProvider.js`
- Admin users can assign duties via form interface
- Auto-logout on invalid sessions

### Shift Types

- **ช** (morning): 08:30-16:30
- **บ** (afternoon): 16:30-00:30  
- **ด** (night): 00:30-08:30
- **O**: Overtime marker
- **อบรม**: Training

### Special Logic

- Training staff get special row rendering with training name
- Stretcher bearers (พนักงานเปล) are separated in table
- ICU staff have additional on-call duties
- Overtime calculations separate from regular duties

### Print Functionality

- Uses `react-to-print` for generating reports
- Custom print styles in `utils/printStyle.js`
- Includes signature blocks for hospital officials

## Database Operations

```bash
# Initialize/reset database
npx prisma db push

# Seed database
npm run seed
# or
node prisma/seed.js
```

## Docker Deployment

The app is containerized and deployed to multiple environments. The production server runs on port 6040 with Node.js logging enabled.
