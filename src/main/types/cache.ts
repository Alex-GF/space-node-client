/**
 * Represents the configuration options for cache initialization
 */
export interface CacheOptions {
  /**
   * Whether to enable caching or not
   */
  enabled: boolean;
  
  /**
   * The type of cache to use
   */
  type?: CacheType;
  
  /**
   * Configuration for external cache providers
   */
  external?: ExternalCacheConfig;
  
  /**
   * TTL (Time To Live) for cache entries in seconds
   * @default 300 (5 minutes)
   */
  ttl?: number;
}

/**
 * Types of cache available
 */
export enum CacheType {
  BUILTIN = 'builtin',
  REDIS = 'redis'
}

/**
 * Configuration for external cache providers
 */
export interface ExternalCacheConfig {
  /**
   * Redis connection configuration
   */
  redis?: RedisConfig;
}

/**
 * Redis connection configuration
 */
export interface RedisConfig {
  /**
   * Redis host
   */
  host: string;
  
  /**
   * Redis port
   * @default 6379
   */
  port?: number;
  
  /**
   * Redis password (if required)
   */
  password?: string;
  
  /**
   * Redis database number
   * @default 0
   */
  db?: number;
  
  /**
   * Connection timeout in milliseconds
   * @default 5000
   */
  connectTimeout?: number;
  
  /**
   * Key prefix for all cache entries
   * @default 'space-client:'
   */
  keyPrefix?: string;
}

/**
 * Generic cache provider interface
 */
export interface CacheProvider {
  /**
   * Get a value from the cache
   */
  get<T = any>(key: string): Promise<T | null>;
  
  /**
   * Set a value in the cache
   */
  set<T = any>(key: string, value: T, ttl?: number): Promise<void>;
  
  /**
   * Delete a value from the cache
   */
  delete(key: string): Promise<void>;
  
  /**
   * Clear all cache entries
   */
  clear(): Promise<void>;
  
  /**
   * Check if a key exists in the cache
   */
  has(key: string): Promise<boolean>;
  
  /**
   * Get all keys matching a pattern
   */
  keys(pattern?: string): Promise<string[]>;
  
  /**
   * Close the cache connection (if applicable)
   */
  close(): Promise<void>;
}

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T = any> {
  /**
   * The cached value
   */
  value: T;
  
  /**
   * Timestamp when the entry was created
   */
  createdAt: number;
  
  /**
   * TTL for this specific entry in seconds
   */
  ttl: number;
  
  /**
   * Timestamp when the entry expires
   */
  expiresAt: number;
}
