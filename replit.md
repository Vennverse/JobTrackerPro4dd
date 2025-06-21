# AutoJobr - AI-Powered Job Application Platform

## Overview

AutoJobr is a full-stack web application that automates job applications, tracks application progress, and provides AI-powered job recommendations. The platform helps job seekers streamline their application process by providing intelligent matching, automated application tracking, and comprehensive profile management.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server:

- **Frontend**: React-based SPA using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with OpenID Connect
- **Hosting**: Replit deployment with autoscale configuration

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with React plugin and development optimizations

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API design
- **Database Access**: Drizzle ORM with Neon serverless PostgreSQL
- **Session Management**: Express sessions with PostgreSQL store
- **Authentication**: Passport.js with OpenID Connect strategy

### Database Schema
The application uses a comprehensive schema supporting:
- **User Management**: Users table with profile information
- **User Profiles**: Extended profile data including professional details, skills, work experience, and education
- **Job Applications**: Application tracking with status, match scores, and metadata
- **Job Recommendations**: AI-powered job suggestions with matching algorithms
- **Session Storage**: Secure session management for authentication

## Data Flow

1. **Authentication Flow**: Users authenticate via Replit Auth using OpenID Connect
2. **Profile Management**: Users create and update comprehensive professional profiles
3. **Job Discovery**: System provides AI-powered job recommendations based on user profiles
4. **Application Tracking**: Users can apply to jobs and track application status
5. **Analytics**: Dashboard provides insights into application success rates and metrics

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire stack
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

The application is deployed on Replit with the following configuration:

- **Environment**: Node.js 20 with PostgreSQL 16
- **Build Process**: Vite builds the client, ESBuild bundles the server
- **Development**: `npm run dev` runs the development server with hot reload
- **Production**: `npm run build` creates optimized builds, `npm run start` runs the production server
- **Port Configuration**: Server runs on port 5000, externally accessible on port 80
- **Database**: Managed PostgreSQL instance with connection pooling
- **Scaling**: Autoscale deployment target for handling traffic variations

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 21, 2025. Initial setup