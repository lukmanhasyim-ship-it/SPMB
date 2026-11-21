// ==================== CACHE HELPER (Consolidated) ====================

var CACHE_TTL_DEFAULT = 300;
var CACHE_KEY_GEL = 'cache_gelombang';
var CACHE_KEY_CFG = 'cache_config';
var CACHE_KEY_TML = 'cache_timeline';

function cacheGet_(key) {
  try {
    var cache = CacheService.getScriptCache();
    if (!cache) return null;
    var cached = cache.get(key);
    if (!cached) return null;
    return JSON.parse(cached);
  } catch (e) {
    return null;
  }
}

function cachePut_(key, data, ttl) {
  try {
    var cache = CacheService.getScriptCache();
    if (!cache) return;
    var t = ttl || CACHE_TTL_DEFAULT;
    cache.put(key, JSON.stringify(data), t);
  } catch (e) {
  }
}

function cacheRemove_(key) {
  try {
    var cache = CacheService.getScriptCache();
    if (!cache) return;
    cache.remove(key);
  } catch (e) {
  }
}

function cacheGetOrFetch_(key, fetchFn, ttl) {
  var cached = cacheGet_(key);
  if (cached !== null) {
    return cached;
  }
  var lock = null;
  try {
    lock = LockService.getScriptLock();
    lock.waitLock(5000);
  } catch (e) {
    lock = null;
  }
  try {
    cached = cacheGet_(key);
    if (cached !== null) {
      if (lock) {
        try { lock.releaseLock(); } catch (ex) {}
      }
      return cached;
    }
    var result = fetchFn();
    cachePut_(key, result, ttl);
    if (lock) {
      try { lock.releaseLock(); } catch (ex) {}
    }
    return result;
  } catch (e) {
    if (lock) {
      try { lock.releaseLock(); } catch (ex) {}
    }
    try {
      return fetchFn();
    } catch (ex2) {
      throw ex2;
    }
  }
}

