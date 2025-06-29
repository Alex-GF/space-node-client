import { createClient, RedisClientType } from 'redis';
import { CacheProvider, RedisConfig } from '../../types/cache';

/**
 * Redis cache provider for external caching
 * Uses the redis package for actual Redis connection and operations
 */
export class RedisCacheProvider implements CacheProvider {
  private config: Required<RedisConfig>;
  private client: RedisClientType | null = null;
  private connected: boolean = false;
  private readonly defaultTtl: number;

  constructor(config: RedisConfig, defaultTtl: number = 300) {
    this.defaultTtl = defaultTtl;
    this.config = {
      host: config.host,
      port: config.port || 6379,
      password: config.password || '',
      db: config.db || 0,
      connectTimeout: config.connectTimeout || 5000,
      keyPrefix: config.keyPrefix || 'space-client:'
    };
  }

  /**
   * Initialize the Redis connection
   */
  private async connect(): Promise<void> {
    if (this.connected && this.client) {
      return;
    }

    try {
      // Create Redis client configuration
      const url = `redis://${this.config.password ? `:${this.config.password}@` : ''}${this.config.host}:${this.config.port}/${this.config.db}`;
      
      this.client = createClient({
        url,
        socket: {
          connectTimeout: this.config.connectTimeout,
          // Limit reconnection attempts to avoid hanging
          reconnectStrategy: (retries, cause) => {
            console.error(`[RedisCacheProvider] Reconnection attempt ${retries}:`, cause);
            // Stop trying after 3 attempts
            if (retries > 3) {
              return false;
            }
            // Exponential backoff with max 2 seconds
            return Math.min(retries * 200, 2000);
          }
        }
      });

      // Set up error handling
      this.client.on('error', (error) => {
        console.error('[RedisCacheProvider] Redis client error:', error);
        this.connected = false;
      });

      this.client.on('connect', () => {
        console.log('[RedisCacheProvider] Connected to Redis');
        this.connected = true;
      });

      this.client.on('disconnect', () => {
        console.log('[RedisCacheProvider] Disconnected from Redis');
        this.connected = false;
      });

      this.client.on('end', () => {
        console.log('[RedisCacheProvider] Redis connection ended');
        this.connected = false;
      });

      // Connect to Redis with timeout
      const connectionPromise = this.client.connect();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), this.config.connectTimeout);
      });

      await Promise.race([connectionPromise, timeoutPromise]);
      this.connected = true;
      
    } catch (error) {
      this.connected = false;
      this.client = null;
      throw new Error(`Failed to connect to Redis: ${error}`);
    }
  }

  /**
   * Get the prefixed key
   */
  private getKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * Get a value from Redis
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.connected || !this.client) {
      try {
        await this.connect();
      } catch {
        return null;
      }
    }
    
    if (!this.client) {
      return null;
    }

    try {
      const value = await this.client.get(this.getKey(key));
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('[RedisCacheProvider] Error getting key:', error);
      return null;
    }
  }

  /**
   * Set a value in Redis
   */
  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.connected || !this.client) {
      try {
        await this.connect();
      } catch {
        return; // Fail silently for cache operations
      }
    }
    
    if (!this.client) {
      return;
    }

    try {
      const actualTtl = ttl || this.defaultTtl;
      const serializedValue = JSON.stringify(value);
      
      if (actualTtl > 0) {
        await this.client.setEx(this.getKey(key), actualTtl, serializedValue);
      } else {
        await this.client.set(this.getKey(key), serializedValue);
      }
    } catch (error) {
      console.error('[RedisCacheProvider] Error setting key:', error);
      // Don't throw - cache operations should fail silently
    }
  }

  /**
   * Delete a value from Redis
   */
  async delete(key: string): Promise<void> {
    if (!this.connected || !this.client) {
      try {
        await this.connect();
      } catch {
        return;
      }
    }
    
    if (!this.client) {
      return;
    }

    try {
      await this.client.del(this.getKey(key));
    } catch (error) {
      console.error('[RedisCacheProvider] Error deleting key:', error);
    }
  }

  /**
   * Clear all cache entries with the configured prefix
   */
  async clear(): Promise<void> {
    if (!this.connected || !this.client) {
      try {
        await this.connect();
      } catch {
        return;
      }
    }
    
    if (!this.client) {
      return;
    }

    try {
      const keys = await this.client.keys(`${this.config.keyPrefix}*`);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('[RedisCacheProvider] Error clearing cache:', error);
    }
  }

  /**
   * Check if a key exists in Redis
   */
  async has(key: string): Promise<boolean> {
    if (!this.connected || !this.client) {
      try {
        await this.connect();
      } catch {
        return false;
      }
    }
    
    if (!this.client) {
      return false;
    }

    try {
      const exists = await this.client.exists(this.getKey(key));
      return exists === 1;
    } catch (error) {
      console.error('[RedisCacheProvider] Error checking key existence:', error);
      return false;
    }
  }

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern?: string): Promise<string[]> {
    if (!this.connected || !this.client) {
      try {
        await this.connect();
      } catch {
        return [];
      }
    }
    
    if (!this.client) {
      return [];
    }

    try {
      const searchPattern = pattern 
        ? `${this.config.keyPrefix}${pattern}`
        : `${this.config.keyPrefix}*`;
        
      const keys = await this.client.keys(searchPattern);
      // Remove the prefix from the returned keys
      return keys.map(key => key.replace(this.config.keyPrefix, ''));
    } catch (error) {
      console.error('[RedisCacheProvider] Error getting keys:', error);
      return [];
    }
  }

  /**
   * Close the Redis connection
   */
  async close(): Promise<void> {
    if (this.client && this.connected) {
      try {
        await this.client.quit();
        this.connected = false;
        this.client = null;
      } catch (error) {
        console.error('[RedisCacheProvider] Error closing connection:', error);
      }
    }
  }

  /**
   * Get Redis connection status and statistics
   */
  getStats() {
    return {
      connected: this.connected,
      host: this.config.host,
      port: this.config.port,
      db: this.config.db,
      keyPrefix: this.config.keyPrefix
    };
  }

  /**
   * Ping Redis to check connection
   */
  async ping(): Promise<boolean> {
    try {
      await this.connect();
      if (!this.client) {
        return false;
      }
      
      const response = await this.client.ping();
      return response === 'PONG';
    } catch (error) {
      console.error('[RedisCacheProvider] Error pinging Redis:', error);
      return false;
    }
  }
}

/**
 * Factory function to create a Redis cache provider
 */
export function createRedisCacheProvider(config: RedisConfig, defaultTtl?: number): RedisCacheProvider {
  return new RedisCacheProvider(config, defaultTtl);
}
