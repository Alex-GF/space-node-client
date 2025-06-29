# Space Client Cache System

The Space Client now supports caching to improve performance and reduce API calls. The cache system supports two types of cache providers:

1. **Built-in Cache**: In-memory cache using a Map (default)
2. **Redis Cache**: External Redis cache for distributed applications

## Basic Usage

### Built-in Cache (Default)

```typescript
import { SpaceClient, CacheType } from 'space-node-client';

const client = new SpaceClient({
  url: 'https://your-space-api.com',
  apiKey: 'your-api-key',
  cache: {
    enabled: true,
    type: CacheType.BUILTIN,
    ttl: 300 // 5 minutes default TTL
  }
});
```

### Redis Cache

```typescript
import { SpaceClient, CacheType } from 'space-node-client';

const client = new SpaceClient({
  url: 'https://your-space-api.com',
  apiKey: 'your-api-key',
  cache: {
    enabled: true,
    type: CacheType.REDIS,
    ttl: 300,
    external: {
      redis: {
        host: 'localhost',
        port: 6379,
        password: 'your-redis-password', // optional
        db: 0, // optional, default 0
        connectTimeout: 5000, // optional, default 5000ms
        keyPrefix: 'space-client:' // optional, default 'space-client:'
      }
    }
  }
});
```

## Cache Behavior

### Contract Operations
- `getContract(userId)`: Results are cached with the configured TTL
- `addContract(contract)`: Invalidates user cache and caches the new contract
- `updateContractSubscription(userId, subscription)`: Invalidates and updates user cache

### Feature Evaluations
- **Read-only evaluations** (no expectedConsumption): Cached with shorter TTL (60 seconds)
- **Write operations** (with expectedConsumption): Not cached, invalidates related cache entries
- `revertEvaluation()`: Invalidates related cache entries

## Configuration Options

### CacheOptions
```typescript
interface CacheOptions {
  enabled: boolean;           // Enable/disable caching
  type?: CacheType;          // BUILTIN or REDIS
  ttl?: number;              // Default TTL in seconds (default: 300)
  external?: ExternalCacheConfig;
}
```

### RedisConfig
```typescript
interface RedisConfig {
  host: string;              // Redis host (required)
  port?: number;             // Redis port (default: 6379)
  password?: string;         // Redis password (optional)
  db?: number;               // Redis database (default: 0)
  connectTimeout?: number;   // Connection timeout in ms (default: 5000)
  keyPrefix?: string;        // Key prefix (default: 'space-client:')
}
```

## Cache Keys

The cache system uses structured keys to organize data:

- Contracts: `contract:{userId}`
- Features: `feature:{userId}:{featureName}`
- Subscriptions: `subscription:{userId}`

## Best Practices

1. **Use built-in cache** for single-instance applications
2. **Use Redis cache** for distributed applications or when you need persistence
3. **Configure appropriate TTL** based on your data freshness requirements
4. **Monitor cache performance** using the built-in statistics methods
5. **Handle cache failures gracefully** - the system continues to work even if cache fails

## Error Handling

The cache system is designed to be fault-tolerant:
- Cache failures don't break the main functionality
- Failed cache operations are logged but don't throw errors
- If Redis connection fails, operations fall back to direct API calls

## Cleanup

Always properly close the SpaceClient to cleanup cache resources:

```typescript
// Cleanup when your application shuts down
await client.close();
```

This will properly close Redis connections and cleanup resources.
