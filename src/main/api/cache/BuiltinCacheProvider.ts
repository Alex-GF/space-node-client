import { CacheProvider, CacheEntry } from '../../types/cache';

/**
 * Built-in cache provider using a Map for in-memory storage
 * This provider is suitable for single-instance applications
 */
export class BuiltinCacheProvider implements CacheProvider {
  private cache: Map<string, CacheEntry> = new Map();
  private cleanupInterval?: NodeJS.Timeout;
  private readonly defaultTtl: number;

  constructor(defaultTtl: number = 300) {
    this.defaultTtl = defaultTtl;
    this.startCleanupInterval();
  }

  /**
   * Get a value from the cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if the entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Set a value in the cache
   */
  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    const actualTtl = ttl || this.defaultTtl;
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      value,
      createdAt: now,
      ttl: actualTtl,
      expiresAt: now + (actualTtl * 1000)
    };

    this.cache.set(key, entry);
  }

  /**
   * Delete a value from the cache
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Check if a key exists in the cache and is not expired
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if the entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get all keys matching a pattern
   * For builtin cache, pattern is a simple string match or regex
   */
  async keys(pattern?: string): Promise<string[]> {
    const allKeys = Array.from(this.cache.keys());
    
    if (!pattern) {
      return allKeys;
    }

    // Simple pattern matching - convert glob-like patterns to regex
    const regexPattern = new RegExp(
      pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
    );

    return allKeys.filter(key => regexPattern.test(key));
  }

  /**
   * Close the cache connection
   */
  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const [, entry] of this.cache) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired
    };
  }

  /**
   * Start the cleanup interval to remove expired entries
   */
  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  /**
   * Remove expired entries from the cache
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}
