# AI Chat Application

## Overview

This is a full-stack real-time AI chat application that enables conversations between users and multiple AI assistants (Gemini, Groq, and Replit AI). The application supports both manual messaging and automated multi-AI conversations with configurable parameters.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Real-time Communication**: WebSocket server for live chat functionality
- **Data Layer**: Drizzle ORM with PostgreSQL database schema
- **Storage**: In-memory storage implementation with interface for future database integration
- **AI Integration**: Multiple AI service providers (Google Gemini, Groq, Replit AI)

### Database Schema
The application uses Drizzle ORM with PostgreSQL and defines three main entities:
- **Messages**: Chat messages with content, sender, timestamp, and conversation ID
- **AI Participants**: AI assistant status, rate limiting, and availability tracking
- **Conversations**: Chat session configuration including auto-mode settings

## Key Components

### Real-time Communication
- WebSocket server handles multiple connection types:
  - Join conversation events
  - Send message events
  - Auto-conversation controls (start/stop)
  - Single message sending
  - Chat clearing functionality
- Connection management with conversation-based message broadcasting

### AI Service Integration
- Unified AI service interface supporting multiple providers
- Rate limiting and error handling for each AI service
- Conversation context building for coherent multi-turn discussions
- Fallback mechanisms for service availability

### Frontend Components
- **Chat Interface**: Real-time message display with sender identification
- **AI Status Panel**: Live status monitoring for all AI participants
- **Settings Panel**: Configuration for conversation parameters and API keys
- **Message Components**: Styled chat bubbles with sender-specific theming

## Data Flow

1. **User Message**: User sends message via WebSocket
2. **Message Storage**: Message stored in conversation history
3. **AI Processing**: Available AI participants process the message based on conversation context
4. **Response Generation**: AI services generate responses with error handling
5. **Real-time Broadcasting**: Responses broadcast to all connected clients
6. **Auto-mode**: Optional automated conversation continuation between AI participants

## External Dependencies

### AI Services
- **Google Gemini AI**: Primary AI assistant using @google/genai package
- **Groq AI**: Fast processing AI service via REST API
- **Replit AI**: Code-focused AI assistant

### Database
- **Neon Database**: Serverless PostgreSQL via @neondatabase/serverless
- **Drizzle**: Type-safe ORM with migration support

### UI Framework
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library for consistent UI elements

## Deployment Strategy

### Development
- Vite development server with HMR and error overlay
- TypeScript compilation with strict type checking
- ESBuild for fast backend compilation during development

### Production Build
- Frontend: Vite build with optimized bundle output
- Backend: ESBuild bundle with external packages and ESM format
- Static asset serving through Express middleware

### Environment Configuration
- Database URL configuration for PostgreSQL connection
- AI service API keys stored as environment variables
- Development vs production mode handling

## Changelog
- July 05, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.