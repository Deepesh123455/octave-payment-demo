import redisClient from "../config/redis";

const DEFAULT_TTL = 600; // 10 minutes in seconds

export class CacheService {
  /**
   * Generates a version-based cache key for a given module and query parameters.
   * Key format: C:{module}:V{version}:{params_hash}
   */
  private static async getVersionedKey(module: string, params: object): Promise<string> {
    const versionKey = `V:${module.toUpperCase()}`;
    let version = await redisClient.get(versionKey);
    
    if (!version) {
      version = "1";
      await redisClient.set(versionKey, version);
    }

    const paramsString = JSON.stringify(params);
    return `C:${module.toUpperCase()}:V${version}:${paramsString}`;
  }

  /**
   * Wraps a data-fetching function with a versioned cache.
   */
  static async getOrSet<T>(
    module: string,
    params: object,
    fetchFn: () => Promise<T>,
    ttl: number = DEFAULT_TTL
  ): Promise<T> {
    try {
      const cacheKey = await this.getVersionedKey(module, params);
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const freshData = await fetchFn();
      
      // Store in Redis with TTL
      await redisClient.setex(cacheKey, ttl, JSON.stringify(freshData));
      
      return freshData;
    } catch (error) {
      console.error(`[CacheService] Error for module ${module}:`, error);
      // Fallback: return fresh data even if cache fails
      return fetchFn();
    }
  }

  /**
   * Atomically increments the version number for a module.
   * This instantly invalidates all existing cache keys for that module.
   */
  static async invalidate(module: string): Promise<void> {
    try {
      const versionKey = `V:${module.toUpperCase()}`;
      await redisClient.incr(versionKey);
      console.log(`[CacheService] Invalidated cache for module: ${module}`);
    } catch (error) {
      console.error(`[CacheService] Invalidation error for module ${module}:`, error);
    }
  }

  /**
   * Global invalidation for multiple modules (e.g., on cross-module mutations)
   */
  static async invalidateMultiple(modules: string[]): Promise<void> {
    await Promise.all(modules.map(m => this.invalidate(m)));
  }
}
