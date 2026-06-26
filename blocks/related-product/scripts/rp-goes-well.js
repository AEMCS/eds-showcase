import {
  getProduct,
  getProductsByGtins,
  transformSimilarProductsResponse,
} from '../../../api/products.js';

const DEBUG_PREFIX = '[related-product:goes-well]';

function debugLog(message, data) {
  // eslint-disable-next-line no-console
  console.log(`${DEBUG_PREFIX} ${message}`, data);
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return String(value).split(',');
}

function normalizeGtins(gtins) {
  return [...new Set(
    toArray(gtins)
      .flatMap((gtin) => toArray(gtin))
      .map((gtin) => String(gtin).trim())
      .filter(Boolean),
  )];
}

function getHits(response) {
  const hits = response?.hits?.hits;
  return Array.isArray(hits) ? hits : [];
}

function getGoesWellWithValue(productData = {}) {
  return productData.goesWellWith;
}

function getFirstGoesWellGtinsFromHit(hit) {
  // eslint-disable-next-line no-underscore-dangle
  const source = hit?._source || {};
  const goesWellWith = getGoesWellWithValue(source.productData);

  debugLog('goesWellWith from hits.hits._source.productData.goesWellWith', goesWellWith);

  return normalizeGtins(goesWellWith);
}

function getGoesWellGtins(productResponse) {
  return getHits(productResponse)
    .map(getFirstGoesWellGtinsFromHit)
    .find((gtins) => gtins.length > 0) || [];
}

function normalizeProductsResponse(productsResponse) {
  if (Array.isArray(productsResponse)) return productsResponse;
  return transformSimilarProductsResponse(productsResponse);
}

export default async function getGoesWellProducts() {
  debugLog('loading current product response');

  const currentProductResponse = await getProduct();

  debugLog('current product response', currentProductResponse);

  const gtins = getGoesWellGtins(currentProductResponse);

  debugLog('extracted goesWellWith gtins', gtins);

  if (gtins.length === 0) {
    debugLog('no goesWellWith gtins found; returning empty list');
    return [];
  }

  debugLog('requesting products by gtins', gtins.join('|'));

  const productsResponse = await getProductsByGtins(gtins);
  const products = normalizeProductsResponse(productsResponse);

  debugLog('raw products response', productsResponse);
  debugLog('normalized goes-well products', products);

  return products;
}
