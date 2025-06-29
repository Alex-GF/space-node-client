import { describe, it, expect, beforeAll, afterEach, beforeEach } from 'vitest';
import { SpaceClient } from '../main/config/SpaceClient';
import { CacheModule } from '../main/api/CacheModule';
import { BuiltinCacheProvider } from '../main/api/cache/BuiltinCacheProvider';
import { CacheProviderFactory } from '../main/api/cache/CacheProviderFactory';
import { CacheType, CacheOptions } from '../main/types/cache';
import { TEST_API_KEY, TEST_SPACE_URL } from './lib/axios';

describe('Cache Module Test Suite', () => {
  let client: SpaceClient;

  afterEach(async () => {
    if (client) {
      await client.close();
    }
  });

  describe('SpaceClient with Built-in Cache', () => {
    beforeEach(() => {
      client = new SpaceClient({
        url: TEST_SPACE_URL,
        apiKey: TEST_API_KEY,
        cache: {
          enabled: true,
          type: CacheType.BUILTIN,
          ttl: 300
        }
      });
    });

    it('Should initialize SpaceClient with built-in cache enabled', () => {
      expect(client).toBeDefined();
      expect(client.getCache()).toBeDefined();
      expect(client.getCache().isEnabled()).toBe(true);
    });

    it('Should generate correct cache keys', () => {
      const cache = client.getCache();
      
      expect(cache.getContractKey('user123')).toBe('contract:user123');
      expect(cache.getFeatureKey('user123', 'feature-name')).toBe('feature:user123:feature-name');
      expect(cache.getSubscriptionKey('user123')).toBe('subscription:user123');
    });

    it('Should cache and retrieve values correctly', async () => {
      const cache = client.getCache();
      const testKey = 'test-key';
      const testValue = { message: 'Hello Cache!', timestamp: Date.now() };

      // Set a value
      await cache.set(testKey, testValue);
      
      // Retrieve the value
      const retrieved = await cache.get(testKey);
      expect(retrieved).toEqual(testValue);
    });

    it('Should check if key exists', async () => {
      const cache = client.getCache();
      const testKey = 'exists-key';
      const testValue = 'test-value';

      // Key should not exist initially
      expect(await cache.has(testKey)).toBe(false);
      
      // Set a value
      await cache.set(testKey, testValue);
      
      // Key should exist now
      expect(await cache.has(testKey)).toBe(true);
    });

    it('Should delete values correctly', async () => {
      const cache = client.getCache();
      const testKey = 'delete-key';
      const testValue = 'delete-value';

      // Set a value
      await cache.set(testKey, testValue);
      expect(await cache.has(testKey)).toBe(true);
      
      // Delete the value
      await cache.delete(testKey);
      expect(await cache.has(testKey)).toBe(false);
    });

    it('Should invalidate all user cache entries', async () => {
      const cache = client.getCache();
      const userId = 'user123';

      // Set multiple cache entries for the user
      await cache.set(cache.getContractKey(userId), { contract: 'data' });
      await cache.set(cache.getFeatureKey(userId, 'feature1'), { feature: 'data1' });
      await cache.set(cache.getFeatureKey(userId, 'feature2'), { feature: 'data2' });
      await cache.set(cache.getSubscriptionKey(userId), { subscription: 'data' });

      // Verify all entries exist
      expect(await cache.has(cache.getContractKey(userId))).toBe(true);
      expect(await cache.has(cache.getFeatureKey(userId, 'feature1'))).toBe(true);
      expect(await cache.has(cache.getFeatureKey(userId, 'feature2'))).toBe(true);
      expect(await cache.has(cache.getSubscriptionKey(userId))).toBe(true);

      // Invalidate all user cache
      await cache.invalidateUser(userId);

      // Verify all entries are gone
      expect(await cache.has(cache.getContractKey(userId))).toBe(false);
      expect(await cache.has(cache.getFeatureKey(userId, 'feature1'))).toBe(false);
      expect(await cache.has(cache.getFeatureKey(userId, 'feature2'))).toBe(false);
      expect(await cache.has(cache.getSubscriptionKey(userId))).toBe(false);
    });

    it('Should clear all cache entries', async () => {
      const cache = client.getCache();

      // Set multiple cache entries
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.set('key3', 'value3');

      // Verify entries exist
      expect(await cache.has('key1')).toBe(true);
      expect(await cache.has('key2')).toBe(true);
      expect(await cache.has('key3')).toBe(true);

      // Clear all cache
      await cache.clear();

      // Verify all entries are gone
      expect(await cache.has('key1')).toBe(false);
      expect(await cache.has('key2')).toBe(false);
      expect(await cache.has('key3')).toBe(false);
    });
  });

  describe('SpaceClient without Cache', () => {
    beforeEach(() => {
      client = new SpaceClient({
        url: TEST_SPACE_URL,
        apiKey: TEST_API_KEY
      });
    });

    it('Should initialize SpaceClient with cache disabled by default', () => {
      expect(client).toBeDefined();
      expect(client.getCache()).toBeDefined();
      expect(client.getCache().isEnabled()).toBe(false);
    });

    it('Should not cache values when cache is disabled', async () => {
      const cache = client.getCache();
      const testKey = 'disabled-cache-key';
      const testValue = 'disabled-cache-value';

      // Try to set a value (should not throw, but should not cache)
      await cache.set(testKey, testValue);
      
      // Try to retrieve the value (should return null)
      const retrieved = await cache.get(testKey);
      expect(retrieved).toBeNull();
    });
  });

  describe('SpaceClient with Explicit Cache Disabled', () => {
    beforeEach(() => {
      client = new SpaceClient({
        url: TEST_SPACE_URL,
        apiKey: TEST_API_KEY,
        cache: {
          enabled: false
        }
      });
    });

    it('Should have cache disabled when explicitly disabled', () => {
      expect(client.getCache().isEnabled()).toBe(false);
    });
  });
});

describe('BuiltinCacheProvider Test Suite', () => {
  let provider: BuiltinCacheProvider;

  beforeEach(() => {
    provider = new BuiltinCacheProvider(60); // 60 seconds TTL
  });

  afterEach(async () => {
    await provider.close();
  });

  it('Should create provider with default TTL', () => {
    expect(provider).toBeDefined();
  });

  it('Should set and get values', async () => {
    const key = 'test-key';
    const value = { data: 'test-data', number: 42 };

    await provider.set(key, value);
    const retrieved = await provider.get(key);
    
    expect(retrieved).toEqual(value);
  });

  it('Should return null for non-existent keys', async () => {
    const retrieved = await provider.get('non-existent-key');
    expect(retrieved).toBeNull();
  });

  it('Should respect custom TTL', async () => {
    const key = 'ttl-key';
    const value = 'ttl-value';
    const customTtl = 1; // 1 second

    await provider.set(key, value, customTtl);
    
    // Should exist immediately
    expect(await provider.has(key)).toBe(true);
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Should be expired now
    expect(await provider.has(key)).toBe(false);
    expect(await provider.get(key)).toBeNull();
  });

  it('Should delete values', async () => {
    const key = 'delete-key';
    const value = 'delete-value';

    await provider.set(key, value);
    expect(await provider.has(key)).toBe(true);
    
    await provider.delete(key);
    expect(await provider.has(key)).toBe(false);
  });

  it('Should clear all values', async () => {
    await provider.set('key1', 'value1');
    await provider.set('key2', 'value2');
    await provider.set('key3', 'value3');

    await provider.clear();

    expect(await provider.has('key1')).toBe(false);
    expect(await provider.has('key2')).toBe(false);
    expect(await provider.has('key3')).toBe(false);
  });

  it('Should return keys matching patterns', async () => {
    await provider.set('user:123:contract', 'contract1');
    await provider.set('user:123:feature:login', 'feature1');
    await provider.set('user:456:contract', 'contract2');
    await provider.set('other:data', 'other');

    const userKeys = await provider.keys('user:123:*');
    expect(userKeys).toHaveLength(2);
    expect(userKeys).toContain('user:123:contract');
    expect(userKeys).toContain('user:123:feature:login');

    const allUserKeys = await provider.keys('user:*');
    expect(allUserKeys).toHaveLength(3);

    const allKeys = await provider.keys('*');
    expect(allKeys).toHaveLength(4);
  });

  it('Should provide cache statistics', async () => {
    await provider.set('active1', 'value1');
    await provider.set('active2', 'value2');
    await provider.set('expired', 'value-expired', 1); // 1 second TTL

    // Wait for one entry to expire
    await new Promise(resolve => setTimeout(resolve, 1100));

    const stats = provider.getStats();
    expect(stats.total).toBe(3);
    expect(stats.active).toBe(2);
    expect(stats.expired).toBe(1);
  });
});

describe('CacheProviderFactory Test Suite', () => {
  it('Should create builtin cache provider', () => {
    const options: CacheOptions = {
      enabled: true,
      type: CacheType.BUILTIN,
      ttl: 300
    };

    const provider = CacheProviderFactory.create(options);
    expect(provider).toBeInstanceOf(BuiltinCacheProvider);
  });

  it('Should validate cache options', () => {
    const validOptions: CacheOptions = {
      enabled: true,
      type: CacheType.BUILTIN,
      ttl: 300
    };

    expect(() => CacheProviderFactory.validate(validOptions)).not.toThrow();
  });

  it('Should throw error for invalid TTL', () => {
    const invalidOptions: CacheOptions = {
      enabled: true,
      type: CacheType.BUILTIN,
      ttl: -1
    };

    expect(() => CacheProviderFactory.validate(invalidOptions)).toThrow('TTL must be a positive number');
  });

  it('Should throw error for Redis without config', () => {
    const invalidOptions: CacheOptions = {
      enabled: true,
      type: CacheType.REDIS
    };

    expect(() => CacheProviderFactory.validate(invalidOptions)).toThrow('Redis configuration is required');
  });

  it('Should validate Redis configuration', () => {
    const validRedisOptions: CacheOptions = {
      enabled: true,
      type: CacheType.REDIS,
      external: {
        redis: {
          host: 'localhost',
          port: 6379
        }
      }
    };

    expect(() => CacheProviderFactory.validate(validRedisOptions)).not.toThrow();
  });

  it('Should throw error for invalid Redis port', () => {
    const invalidOptions: CacheOptions = {
      enabled: true,
      type: CacheType.REDIS,
      external: {
        redis: {
          host: 'localhost',
          port: 70000 // Invalid port
        }
      }
    };

    expect(() => CacheProviderFactory.validate(invalidOptions)).toThrow('Redis port must be between 1 and 65535');
  });

  it('Should throw error for missing Redis host', () => {
    const invalidOptions: CacheOptions = {
      enabled: true,
      type: CacheType.REDIS,
      external: {
        redis: {
          host: '' // Empty host
        }
      }
    };

    expect(() => CacheProviderFactory.validate(invalidOptions)).toThrow('Redis host is required');
  });
});
