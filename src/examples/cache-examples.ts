import { SpaceClient, CacheType } from '../main';

/**
 * Example usage of the Space Client with different cache configurations
 * This file demonstrates how to use the caching functionality
 */

// Example 1: Built-in cache
async function exampleBuiltinCache() {
  console.log('=== Built-in Cache Example ===');
  
  const client = new SpaceClient({
    url: 'https://your-space-api.com',
    apiKey: 'your-api-key',
    cache: {
      enabled: true,
      type: CacheType.BUILTIN,
      ttl: 300 // 5 minutes
    }
  });

  try {
    // These calls will be cached
    const contract1 = await client.contracts.getContract('user123');
    console.log('First call - from API:', contract1);

    const contract2 = await client.contracts.getContract('user123');
    console.log('Second call - from cache:', contract2);

    // Feature evaluation (read-only, will be cached)
    const evaluation1 = await client.features.evaluate('user123', 'service-feature');
    console.log('Feature evaluation - from API:', evaluation1);

    const evaluation2 = await client.features.evaluate('user123', 'service-feature');
    console.log('Feature evaluation - from cache:', evaluation2);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Example 2: Redis cache
async function exampleRedisCache() {
  console.log('=== Redis Cache Example ===');
  
  const client = new SpaceClient({
    url: 'https://your-space-api.com',
    apiKey: 'your-api-key',
    cache: {
      enabled: true,
      type: CacheType.REDIS,
      ttl: 600, // 10 minutes
      external: {
        redis: {
          host: 'localhost',
          port: 6379,
          // password: 'your-password', // if needed
          db: 0,
          keyPrefix: 'my-app:'
        }
      }
    }
  });

  try {
    // These calls will be cached in Redis
    const contract = await client.contracts.getContract('user456');
    console.log('Contract from Redis cache:', contract);

    // Cache statistics (Redis provider specific)
    const cache = client.getCache();
    const keys = await cache.keys('contract:*');
    console.log('Cached contract keys:', keys);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Example 3: No cache
async function exampleNoCache() {
  console.log('=== No Cache Example ===');
  
  const client = new SpaceClient({
    url: 'https://your-space-api.com',
    apiKey: 'your-api-key'
    // No cache configuration = no caching
  });

  try {
    // These calls will always go to the API
    const contract = await client.contracts.getContract('user789');
    console.log('Direct API call:', contract);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Example 4: Cache management
async function exampleCacheManagement() {
  console.log('=== Cache Management Example ===');
  
  const client = new SpaceClient({
    url: 'https://your-space-api.com',
    apiKey: 'your-api-key',
    cache: {
      enabled: true,
      type: CacheType.BUILTIN,
      ttl: 300
    }
  });

  try {
    const cache = client.getCache();
    
    // Manual cache operations
    await cache.set('custom-key', { data: 'custom-value' }, 60);
    const customValue = await cache.get('custom-key');
    console.log('Custom cached value:', customValue);

    // Check if key exists
    const exists = await cache.has('custom-key');
    console.log('Key exists:', exists);

    // Get all keys
    const allKeys = await cache.keys();
    console.log('All cache keys:', allKeys);

    // Clear specific key
    await cache.delete('custom-key');

    // Clear all cache
    await cache.clear();

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

// Run examples (uncomment the ones you want to test)
// exampleBuiltinCache();
// exampleRedisCache();
// exampleNoCache();
// exampleCacheManagement();
