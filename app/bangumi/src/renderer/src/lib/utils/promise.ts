/**
 * A utility for caching and reusing promises to prevent duplicate async operations
 * This is useful for operations like token refresh, logout, etc. where multiple
 * concurrent calls should reuse the same promise instead of creating new ones
 */

/**
 * Creates a promise cache that ensures the same promise is reused for identical keys
 * @returns A set of functions for managing cached promises
 */
export function createPromiseCache<K, T>() {
  // Cache to store promises by key
  const promiseCache = new Map<K, Promise<T>>()

  /**
   * Gets or creates a promise for the given key
   * @param key The cache key
   * @param createPromise Function that creates a new promise if one doesn't exist
   * @returns The cached or newly created promise
   */
  const getOrCreatePromise = async (key: K, createPromise: () => Promise<T>): Promise<T> => {
    // Check if there's already a promise for this key
    let promise = promiseCache.get(key)

    if (!promise) {
      // If no promise exists, create a new one with automatic cleanup
      promise = (async () => {
        try {
          return await createPromise()
        } finally {
          // Clean up the promise from the cache when done
          promiseCache.delete(key)
        }
      })()

      // Store the promise in the cache
      promiseCache.set(key, promise)
    }

    // Return the promise (either existing or newly created)
    return promise
  }

  /**
   * Manually removes a promise from the cache
   * @param key The cache key to clear
   */
  const clearPromise = (key: K): void => {
    promiseCache.delete(key)
  }

  /**
   * Clears all promises from the cache
   */
  const clearAllPromises = (): void => {
    promiseCache.clear()
  }

  /**
   * Checks if a promise exists for the given key
   * @param key The cache key to check
   * @returns True if a promise exists, false otherwise
   */
  const hasPromise = (key: K): boolean => {
    return promiseCache.has(key)
  }

  return {
    getOrCreatePromise,
    clearPromise,
    clearAllPromises,
    hasPromise,
  }
}

/**
 * Creates a singleton promise that ensures only one instance of an async operation runs at a time
 * @returns A function to run or await the singleton promise
 */
export function createSingletonPromise<T>() {
  // Single promise instance
  let promise: Promise<T> | null = null

  /**
   * Runs or awaits the singleton promise
   * @param createPromise Function that creates a new promise if one doesn't exist
   * @returns The result of the promise
   */
  const runOrAwait = async (createPromise: () => Promise<T>): Promise<T> => {
    if (!promise) {
      // Create a new promise with automatic cleanup
      promise = (async () => {
        try {
          return await createPromise()
        } finally {
          // Clear the promise reference after completion
          promise = null
        }
      })()
    }

    // Return the promise (either existing or newly created)
    return promise
  }

  /**
   * Manually clears the singleton promise
   */
  const clear = (): void => {
    promise = null
  }

  /**
   * Checks if a promise is currently in progress
   * @returns True if a promise exists, false otherwise
   */
  const isRunning = (): boolean => {
    return promise !== null
  }

  return {
    runOrAwait,
    clear,
    isRunning,
  }
}
