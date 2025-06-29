// Cache providers
export { BuiltinCacheProvider } from './BuiltinCacheProvider';
export { RedisCacheProvider, createRedisCacheProvider } from './RedisCacheProvider';
export { CacheProviderFactory } from './CacheProviderFactory';

// Re-export cache types for convenience
export type { 
  CacheProvider, 
  CacheOptions, 
  CacheEntry, 
  RedisConfig, 
  ExternalCacheConfig 
} from '../../types/cache';
export { CacheType } from '../../types/cache';
