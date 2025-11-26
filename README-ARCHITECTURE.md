# Serena GIS Monorepo API

A NestJS-based microservices monorepo for geospatial data management, following the GreenAI monorepo architecture patterns.

## Architecture

This project follows a **database-per-service** pattern with:
- **Microservices**: Independent NestJS applications in `apps/`
- **Shared Libraries**: Common code in `libs/shared-config/`
- **PostGIS Integration**: Geospatial database capabilities
- **JWT Authentication**: Shared across all services
- **Swagger Documentation**: Auto-generated API docs for each service

### Project Structure

```
serena-monorepo-api/
├── apps/                           # Microservices
│   ├── vector-service/            # Vector data service (PostGIS)
│   │   ├── prisma/
│   │   │   └── vector/
│   │   │       ├── schema.prisma  # Vector DB schema
│   │   │       └── prisma.config.ts
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── prisma/        # Prisma service
│   │       │   └── authentication/ # JWT auth module
│   │       ├── dto/               # Data transfer objects
│   │       └── main.ts            # Service entry point
│   └── raster-service/            # Raster data service
│
├── libs/                          # Shared libraries
│   └── shared-config/
│       ├── authentication/        # JWT guards & strategies
│       │   ├── guards/
│       │   │   ├── jwt-auth.guard.ts
│       │   │   └── local-auth.guard.ts
│       │   └── strategy/
│       │       ├── jwt.strategy.ts
│       │       └── local.strategy.ts
│       ├── helpers/               # Utility functions
│       │   └── index.ts          # Password hashing, case conversion
│       ├── env/                   # Environment config
│       ├── constants/             # Shared constants & enums
│       └── type/                  # TypeScript types
│
└── node_modules/@notiz/          # Generated Prisma clients
    ├── vector/                    # Vector service client
    └── raster/                    # Raster service client
```

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14 with PostGIS extension
- npm or yarn

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Create/update `.env` file in the root directory:
   ```env
   # Database URLs (separate per service)
   DATABASE_URL_VECTOR=postgresql://user:password@localhost:5432/serena_vector?schema=public
   DATABASE_URL_RASTER=postgresql://user:password@localhost:5432/serena_raster?schema=public
   
   # Service Ports
   VECTOR_SERVICE_PORT=3001
   RASTER_SERVICE_PORT=3002
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   
   # CORS
   CORS_ORIGIN=*
   
   # Environment
   NODE_ENV=development
   ```

3. **Enable PostGIS in PostgreSQL:**
   ```sql
   CREATE DATABASE serena_vector;
   CREATE DATABASE serena_raster;
   
   \c serena_vector
   CREATE EXTENSION IF NOT EXISTS postgis;
   
   \c serena_raster
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

4. **Generate Prisma clients:**
   ```bash
   npm run prisma:generate:all
   ```

5. **Run database migrations:**
   ```bash
   npm run prisma:migrate:all
   ```

## Development

### Run All Services
```bash
npm run start:dev
```

### Run Individual Services
```bash
# Vector service only
npm run start:dev:vector-service

# Raster service only
npm run start:dev:raster-service
```

### Convenient Shortcuts
```bash
# Setup and run vector service
npm run vector:dev

# Setup and run raster service
npm run raster:dev

# Setup and run all services
npm run dev:all
```

## API Documentation

Once services are running, access Swagger documentation:

- **Vector Service**: http://localhost:3001/api
- **Raster Service**: http://localhost:3002/api

## Database Management

### Prisma Commands

**Generate Prisma Clients:**
```bash
npm run prisma:generate:vector    # Vector service only
npm run prisma:generate:raster    # Raster service only
npm run prisma:generate:all       # All services
```

**Run Migrations:**
```bash
npm run prisma:migrate:vector     # Vector service only
npm run prisma:migrate:raster     # Raster service only
npm run prisma:migrate:all        # All services
```

**Prisma Studio (Database GUI):**
```bash
npm run prisma:studio:vector      # Vector DB
npm run prisma:studio:raster      # Raster DB
```

**Check Migration Status:**
```bash
npm run prisma:status:vector
npm run prisma:status:raster
npm run prisma:status:all
```

**Reset Database (⚠️ DESTRUCTIVE):**
```bash
npm run prisma:reset:vector
npm run prisma:reset:raster
npm run prisma:reset:all
```

## Authentication

Services use JWT authentication managed through `@shared-config/authentication`.

### Protected Routes

Use the `@UseGuards(JwtAuthGuard)` decorator:

```typescript
import { JwtAuthGuard } from '@shared-config/authentication/guards';

@Post()
@UseGuards(JwtAuthGuard)
async protectedRoute(@Request() req) {
  const userId = req.user.userId;
  // Your logic here
}
```

### JWT Token Format

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "USER"
}
```

## Geospatial Features (Vector Service)

The vector service includes PostGIS integration for spatial queries:

### Create Vector Layer with GeoJSON
```json
POST /api/vector-layers
{
  "name": "Farm Boundary",
  "description": "Main farm boundary",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[
      [100.0, 0.0],
      [101.0, 0.0],
      [101.0, 1.0],
      [100.0, 1.0],
      [100.0, 0.0]
    ]]
  },
  "properties": {
    "siteName": "North Field",
    "classification": "Agricultural",
    "year": 2024
  }
}
```

### Available Spatial Queries

The service includes methods for:
- **Bounding Box Queries**: Find features intersecting a bbox
- **Proximity Queries**: Find features within distance from a point
- **Spatial Indexes**: Optimized with PostGIS GIST indexes

## Production Deployment

### Build
```bash
npm run build
```

### Run Production
```bash
npm run start:prod              # All services
npm run start:prod:vector-service
npm run start:prod:raster-service
```

### Deploy Migrations
```bash
npm run prisma:migrate:deploy:all
```

## Shared Libraries

Services can import shared functionality:

```typescript
// Authentication
import { JwtAuthGuard } from '@shared-config/authentication/guards';
import { JwtStrategy } from '@shared-config/authentication/strategy';

// Helpers
import { encryptPassword, checkPassword } from '@shared-config/helpers';

// Environment
import { jwtSecret, vectorServicePort } from '@shared-config/env';

// Types
import { AuthUser, PaginatedResponse } from '@shared-config/type';

// Constants
import { SortEnum, UserRole } from '@shared-config/constants';
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Code Quality

```bash
# Lint
npm run lint

# Format
npm run format
```

## Architecture Patterns

### Database-per-Service
- Each service has its own PostgreSQL database
- Prisma client generated to `@notiz/{service}` namespace
- Independent migrations and schema evolution
- Complete data isolation

### Shared Authentication
- JWT strategy shared via `libs/shared-config`
- All services validate same JWT tokens
- User context available in `req.user`

### Path Aliases
TypeScript path aliases configured in `tsconfig.json`:
```typescript
"@shared-config/*": ["libs/shared-config/*"]
"@vectorModules/*": ["apps/vector-service/src/modules/*"]
"@rasterModules/*": ["apps/raster-service/src/modules/*"]
```

### Soft Deletes
Vector service implements soft deletes:
- Records marked with `deletedAt` timestamp
- Queries automatically filter deleted records
- Data preservation for audit trails

## Troubleshooting

### Prisma Client Not Found
```bash
npm run prisma:generate:all
```

### Migration Drift
```bash
npm run prisma:migrate:reset:vector
npm run prisma:migrate:vector
```

### Port Already in Use
Change ports in `.env`:
```env
VECTOR_SERVICE_PORT=3011
RASTER_SERVICE_PORT=3012
```

## License

UNLICENSED
