import { LRUCache } from 'lru-cache';
import Redis from 'ioredis';

const USE_REDIS = !!process.env.REDIS_URL;

// Global variables for singleton behavior
let redisClient = null;
let memoryCache = null;

if (USE_REDIS) {
    if (!global._redisClient) {
        global._redisClient = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });
        global._redisClient.on('error', (err) => {
            console.error('Redis error:', err);
        });
    }
    redisClient = global._redisClient;
} else {
    if (!global._memoryCache) {
        global._memoryCache = new LRUCache({
            max: 500, // Maximum number of items
            ttl: 1000 * 60 * 5, // Default TTL 5 minutes
        });
    }
    memoryCache = global._memoryCache;
}

/**
 * Get an item from cache
 * @param {string} key 
 * @returns {Promise<any>}
 */
export async function getCache(key) {
    try {
        if (USE_REDIS && redisClient) {
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } else if (memoryCache) {
            return memoryCache.get(key) || null;
        }
    } catch (error) {
        console.error(`Cache get error for ${key}:`, error);
        return null;
    }
}

/**
 * Set an item in cache
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlSeconds Time to live in seconds
 */
export async function setCache(key, value, ttlSeconds = 300) {
    try {
        if (USE_REDIS && redisClient) {
            await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        } else if (memoryCache) {
            memoryCache.set(key, value, { ttl: ttlSeconds * 1000 });
        }
    } catch (error) {
        console.error(`Cache set error for ${key}:`, error);
    }
}

/**
 * Wrapper to fetch data: checks cache first, if not found, executes fetcher and caches the result.
 * @param {string} key 
 * @param {function} fetcher Function returning a Promise with data
 * @param {number} ttlSeconds Time to live in seconds
 */
export async function withCache(key, fetcher, ttlSeconds = 300) {
    const cachedData = await getCache(key);
    if (cachedData !== null) {
        return cachedData;
    }

    const data = await fetcher();
    
    // Only cache non-null/undefined results
    if (data !== null && data !== undefined) {
        // Run cache set in background to not block the request
        setCache(key, data, ttlSeconds).catch(err => console.error('Background cache set error:', err));
    }

    return data;
}

export default { getCache, setCache, withCache, isRedisEnabled: USE_REDIS };
