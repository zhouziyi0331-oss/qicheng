// Sets environment variables before any test module is loaded.
// This ensures rate limiters and config read NODE_ENV=test.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/qicheng';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-min-32-characters!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-min-32-characters!!';
process.env.AI_SERVICE_URL = 'http://localhost:8001';
