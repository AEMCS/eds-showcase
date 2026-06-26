import { brand, language, country, store } from '../scripts/utils/context.js';

const DEFAULT_TTL = Infinity;
const API_BASE_URL = 'https://integration-dev-gateway.unileversolutions.com/api';

function getRuntimeStore() {
  window.hlx = window.hlx || {};
  window.hlx.api = window.hlx.api || {};
  window.hlx.api.products = window.hlx.api.products || {};

  window.hlx.api.products.responseCache = window.hlx.api.products.responseCache || new Map();
  window.hlx.api.products.pendingRequests = window.hlx.api.products.pendingRequests || new Map();

  return window.hlx.api.products;
}

function normalizeHeaderValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(',');
  if (typeof value === 'boolean') return String(value);
  return value || '';
}

function buildHeaders(headers = {}) {
  return Object.entries(headers).reduce((result, [name, value]) => {
    const normalizedValue = normalizeHeaderValue(value);
    if (normalizedValue) result[name] = normalizedValue;
    return result;
  }, {});
}

function buildCacheKey(endpoint, headers) {
  const headerKey = Object.keys(headers)
    .sort()
    .map((name) => `${name}:${normalizeHeaderValue(headers[name])}`)
    .join('|');

  return `${endpoint}|${headerKey}`;
}

function getCached(cache, cacheKey, ttl) {
  if (!cache.has(cacheKey)) return null;

  const cached = cache.get(cacheKey);

  if (Number.isFinite(ttl) && Date.now() - cached.timestamp > ttl) {
    cache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

function getHeaderImageUrl(image) {
  if (typeof image === 'string') return image;
  if (typeof image?.url === 'string') return image.url;
  if (typeof image?.url?.['@id'] === 'string') return image.url['@id'];
  if (typeof image?.['@id'] === 'string') return image['@id'];
  return '';
}

function normalizeSimilarProduct(hit) {
  // eslint-disable-next-line no-underscore-dangle
  const source = hit?._source || {};
  const header = source.header || {};
  const name = header.name || '';
  const description = header.description || '';
  const image = getHeaderImageUrl(header.image);

  return {
    // eslint-disable-next-line no-underscore-dangle
    id: hit?._id || header.gtin || header.sku || source.longKey || '',
    name,
    title: name,
    description,
    summary: description,
    image,
    thumbnail: image,
    imageUrl: image,
    altText: name,
    url: header.url || '#',
    gtin: header.gtin || '',
    sku: header.sku || '',
    source,
  };
}

function transformSimilarProductsResponse(response) {
  const hits = response?.hits?.hits;
  if (!Array.isArray(hits)) return [];

  return hits
    .map(normalizeSimilarProduct)
    .filter((product) => product.name || product.description || product.image);
}

function parseStoreValue(storeValue) {
    const parts = storeValue.split('_');
    return {
        assortmentCode: parts[3] || '',
        ipgln: parts[4] || '',
    };
}

function getSkuFromUrl() {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get('sku') || url.pathname.match(/\/(\d{14})$/)?.[1] || null;
  } catch {
    return null;
  }
}

const sku = getSkuFromUrl();

const API_CONFIG = {
  products: {
    endpoint: `${API_BASE_URL}/products`,
    headers: {
      brand: brand,
      locale: language,
      market: country,
      ...parseStoreValue(store),
      gtins: sku || '00011111010406',
      summary: false,
    },
    transform: (response) => response,
  },
  similarProducts: {
    endpoint: `${API_BASE_URL}/products/similar`,
    headers: {
      brand: brand,
      locale: language,
      market: country,
      ...parseStoreValue(store),
      gtin: sku || '00011111010406',
    },
    transform: transformSimilarProductsResponse,
  },
  productSearch: {
    endpoint: `${API_BASE_URL}/search`,
    headers: {
      brand: brand,
      locale: language,
      market: country,
      ...parseStoreValue(store),
      productTags: '123',
    },
    transform: (response) => response,
  },
};

function omitHeaders(headers = {}, omittedNames = []) {
  return Object.entries(headers).reduce((result, [name, value]) => {
    if (!omittedNames.includes(name)) result[name] = value;
    return result;
  }, {});
}

function getExplicitProductLookupHeaders(headers = {}) {
  return {
    ...omitHeaders(API_CONFIG.products.headers, [
      'gtin',
      'gtins',
      'productTags',
    ]),
    showAll: true,
    ...headers,
  };
}

async function requestApi(config, { ttl = DEFAULT_TTL } = {}) {
  if (!config?.endpoint) return null;

  const runtimeStore = getRuntimeStore();
  const requestHeaders = buildHeaders(config.headers);
  const cacheKey = buildCacheKey(config.endpoint, requestHeaders);
  const { responseCache, pendingRequests } = runtimeStore;
  const cached = getCached(responseCache, cacheKey, ttl);

  if (responseCache.has(cacheKey)) return cached;
  if (pendingRequests.has(cacheKey)) return pendingRequests.get(cacheKey);

  const request = fetch(config.endpoint, {
    method: 'GET',
    headers: requestHeaders,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Products API failed: ${response.status}`);
      }

      return response.json();
    })
    .then((json) => {
      const data = config.transform(json);

      responseCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      runtimeStore.lastResponse = json;
      runtimeStore.lastProducts = data;

      return data;
    })
    .finally(() => {
      pendingRequests.delete(cacheKey);
    });

  pendingRequests.set(cacheKey, request);
  return request;
}

export function getProductsByGtins(gtins, options = {}) {
  const { headers = {}, ...requestOptions } = options;
  const gtinList = Array.isArray(gtins) ? gtins : [gtins];
  const normalizedGtins = gtinList
    .flatMap((gtin) => String(gtin || '').split(','))
    .map((gtin) => gtin.trim())
    .filter(Boolean);

  if (normalizedGtins.length === 0) return Promise.resolve(null);

  const productsConfig = {
    ...API_CONFIG.products,
    headers: {
      ...getExplicitProductLookupHeaders(headers),
      gtins: normalizedGtins.join('|'),
    },
  };

  const request = {
    endpoint: productsConfig.endpoint,
    method: 'GET',
    headers: buildHeaders(productsConfig.headers),
  };

  return requestApi(productsConfig, requestOptions);
}
export function getAllProducts(options) {
  return requestApi(API_CONFIG.products, options);
}

export function getProduct(options) {
  return requestApi(API_CONFIG.products, options);
}

export function getSimilarProducts(options) {
  return requestApi(API_CONFIG.similarProducts, options);
}

export function searchProducts(options) {
  return requestApi(API_CONFIG.productSearch, options);
}

export function getProducts(options) {
  return getSimilarProducts(options);
}

export { transformSimilarProductsResponse };
