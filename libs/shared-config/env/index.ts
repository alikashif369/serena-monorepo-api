import { config } from 'dotenv';

// Load environment variables
config();

// JWT Configuration
export const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
export const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';

// Database URLs
export const databaseUrlVector = process.env.DATABASE_URL_VECTOR;
export const databaseUrlRaster = process.env.DATABASE_URL_RASTER;
export const databaseUrlAuth = process.env.DATABASE_URL_AUTH;

// Service Ports
export const vectorServicePort = process.env.VECTOR_SERVICE_PORT || 3001;
export const rasterServicePort = process.env.RASTER_SERVICE_PORT || 3002;
export const authServicePort = process.env.AUTH_SERVICE_PORT || 3003;

// CORS Configuration
export const corsOrigin = process.env.CORS_ORIGIN || '*';

// MinIO Configuration
export const minioEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
export const minioPort = process.env.MINIO_PORT || '9000';
export const minioAccessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
export const minioSecretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
export const minioBucket = process.env.MINIO_BUCKET || 'serena-rasters';
export const minioUseSSL = process.env.MINIO_USE_SSL === 'true';

// TiTiler Configuration
export const titilerUrl = process.env.TITILER_URL || 'http://localhost:8000';

// Upload Configuration
export const maxRasterUploadSizeMB = process.env.MAX_RASTER_UPLOAD_SIZE_MB || '2048';

// Raster Service Auth/Access Flags
export const rasterPublicList = process.env.RASTER_PUBLIC_LIST !== 'false';
export const rasterPublicDetails = process.env.RASTER_PUBLIC_DETAILS !== 'false';
export const rasterTilesRequireAuth = process.env.RASTER_TILES_REQUIRE_AUTH === 'true';
export const rasterTileRateLimitPerMinute = Number(process.env.RASTER_TILE_RATE_LIMIT_PER_MINUTE || '120');

// Node Environment
export const nodeEnv = process.env.NODE_ENV || 'development';
export const isProduction = nodeEnv === 'production';
export const isDevelopment = nodeEnv === 'development';
