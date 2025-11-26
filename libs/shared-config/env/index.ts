import { config } from 'dotenv';

// Load environment variables
config();

// JWT Configuration
export const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
export const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';

// Database URLs
export const databaseUrlVector = process.env.DATABASE_URL_VECTOR;
export const databaseUrlRaster = process.env.DATABASE_URL_RASTER;

// Service Ports
export const vectorServicePort = process.env.VECTOR_SERVICE_PORT || 3001;
export const rasterServicePort = process.env.RASTER_SERVICE_PORT || 3002;

// CORS Configuration
export const corsOrigin = process.env.CORS_ORIGIN || '*';

// Node Environment
export const nodeEnv = process.env.NODE_ENV || 'development';
export const isProduction = nodeEnv === 'production';
export const isDevelopment = nodeEnv === 'development';
