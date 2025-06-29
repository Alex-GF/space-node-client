import { CacheProvider, CacheOptions, CacheType } from '../../types/cache';
import { BuiltinCacheProvider } from './BuiltinCacheProvider';
import { RedisCacheProvider } from './RedisCacheProvider';

/**
 * Factory class for creating cache providers
 */
export class CacheProviderFactory {
  /**
   * Create a cache provider based on the provided options
   */
  static create(options: CacheOptions): CacheProvider {
    const type = options.type || CacheType.BUILTIN;
    const ttl = options.ttl || 300;

    switch (type) {
      case CacheType.BUILTIN:
        return new BuiltinCacheProvider(ttl);
        
      case CacheType.REDIS:
        if (!options.external?.redis) {
          throw new Error('Redis configuration is required when using Redis cache type');
        }
        return new RedisCacheProvider(options.external.redis, ttl);
        
      default:
        throw new Error(`Unsupported cache type: ${type}`);
    }
  }

  /**
   * Validate cache options
   */
  static validate(options: CacheOptions): void {
    if (!options.enabled) {
      return;
    }

    if (options.type === CacheType.REDIS && !options.external?.redis) {
      throw new Error('Redis configuration is required when using Redis cache type');
    }

    if (options.ttl && options.ttl <= 0) {
      throw new Error('TTL must be a positive number');
    }

    if (options.type === CacheType.REDIS && options.external?.redis) {
      const redis = options.external.redis;
      
      if (!redis.host) {
        throw new Error('Redis host is required');
      }

      if (redis.port && (redis.port < 1 || redis.port > 65535)) {
        throw new Error('Redis port must be between 1 and 65535');
      }

      if (redis.db && (redis.db < 0 || redis.db > 15)) {
        throw new Error('Redis database number must be between 0 and 15');
      }

      if (redis.connectTimeout && redis.connectTimeout <= 0) {
        throw new Error('Redis connect timeout must be a positive number');
      }
    }
  }
}
