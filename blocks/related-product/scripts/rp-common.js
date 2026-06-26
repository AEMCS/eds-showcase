import { getSimilarProducts } from '../../../api/products.js';

const DEFAULT_PRODUCT_IMAGE = 'https://placehold.jp/400x400.png';
const DEBUG_PREFIX = '[related-product]';
let relatedProductItemId = 0;

function debugLog(message, data) {
  // eslint-disable-next-line no-console
  console.log(`${DEBUG_PREFIX} ${message}`, data);
}

export function getClassValue(block, prefix, fallback) {
  const className = [...block.classList].find((name) => name.startsWith(prefix));
  return className ? className.substring(prefix.length) : fallback;
}

export function getClassNumber(block, prefix, fallback) {
  const number = parseInt(getClassValue(block, prefix, fallback), 10);
  return Number.isNaN(number) ? fallback : number;
}

export function createElement(tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);

  Object.entries(attributes).forEach(([name, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      element.setAttribute(name, value);
    }
  });

  if (text) element.textContent = text;
  return element;
}

export function getRelatedProductConfig(block) {
  const rows = [...block.children];
  const blockClasses = [...block.classList];
  const targetProducts = block.classList.contains('goes-well-products')
    ? 'goes-well-products'
    : 'related-products';
  const config = {
    title: rows[0]?.textContent?.trim() || '',
    subtitle: rows[1]?.textContent?.trim() || '',
    displayAwards: block.classList.contains('display-awards'),
    targetProducts,
  };

  debugLog('resolved config from block classes', {
    blockClasses,
    config,
  });

  return config;
}

function getCurrentDomainUrl(url) {
  if (!url || url === '#') return '#';
  if (typeof window === 'undefined') return url;

  try {
    const parsedUrl = new URL(url, window.location.origin);

    if (!parsedUrl.pathname || parsedUrl.pathname === '/') {
      return url;
    }

    return `${window.location.origin}${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch (error) {
    return url;
  }
}

function getProductUrl(product) {
  let productUrl = '';

  if (product.url || product.path || product.link) {
    productUrl = product.url || product.path || product.link;
  } else if (product.name) {
    productUrl = `plp?product=${encodeURIComponent(product.name)}`;
  }

  return getCurrentDomainUrl(productUrl);
}

function getResizedImageUrl(url, width) {
  if (!url) return '';
  return url.replace(/\/w\d+\//, `/w${width}/`);
}

function getImageSrcSet(url) {
  if (!/\/w\d+\//.test(url)) return '';

  return [600, 900, 1200]
    .map((width) => `${getResizedImageUrl(url, width)} ${width}w`)
    .join(', ');
}

function getImageAttributes(imageUrl, altText) {
  const attributes = {
    src: getResizedImageUrl(imageUrl, 900) || imageUrl,
    alt: altText,
    loading: 'lazy',
    decoding: 'async',
    sizes: '(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw',
  };
  const srcset = getImageSrcSet(imageUrl);

  if (srcset) attributes.srcset = srcset;

  return attributes;
}

function toIdPart(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^0-9a-z]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'item';
}

function getProductName(product) {
  return product.name || product.title || 'Related product';
}

function createProductAwards(product, productName) {
  const awards = product.awards || product.source?.awards || [];
  if (!Array.isArray(awards) || awards.length === 0) return null;

  const list = createElement('ul', {
    class: 'related-product-awards',
    'aria-label': `Awards for ${productName}`,
  });

  awards.forEach((award) => {
    const text = typeof award === 'string' ? award : award?.name || award?.title || '';
    if (text) list.append(createElement('li', {}, text));
  });

  return list.children.length ? list : null;
}

export function createRelatedProductItem(product, options = {}) {
  relatedProductItemId += 1;

  const name = getProductName(product);
  const description = product.description || product.summary || '';
  const imageUrl = product.image || product.thumbnail || product.imageUrl || DEFAULT_PRODUCT_IMAGE;
  const itemId = `related-product-${toIdPart(product.id || product.sku || name)}-${relatedProductItemId}`;
  const titleId = `${itemId}-title`;
  const descriptionId = description ? `${itemId}-description` : '';
const sku = product.sku || product.gtin || product.id || '';

const item = createElement('article', {
  class: 'related-product-item',
  'aria-labelledby': titleId,
  'data-sku': sku,
});
  const mediaLink = createElement('a', {
    class: 'related-product-media-link',
    href: getProductUrl(product),
    'aria-label': `View details for ${name}`,
  });
  const image = createElement(
    'img',
    getImageAttributes(imageUrl, product.altText || product.alt || name),
  );
  const media = createElement('figure', { class: 'related-product-media' });
  const title = createElement('h3', {
    id: titleId,
    class: 'related-product-title',
  }, name);
  const summary = createElement('p', {
    id: descriptionId,
    class: 'related-product-description',
  }, description);
  const content = createElement('div', { class: 'related-product-content' });

  media.append(image);
  mediaLink.append(media);
  content.append(title);
  if (description) content.append(summary);

  if (options.displayAwards) {
    const awards = createProductAwards(product, name);
    if (awards) content.append(awards);
  }

  item.append(mediaLink, content);

  return item;
}

export async function getRelatedProducts(config = {}) {
  debugLog('resolving product source', config);

  if (config.targetProducts === 'goes-well-products') {
    debugLog('loading goes-well module');

    const { default: getGoesWellProducts } = await import('./rp-goes-well.js');
    return getGoesWellProducts();
  }

  debugLog('loading related products from getSimilarProducts');

  const products = await getSimilarProducts();

  debugLog('related products response', products);

  return Array.isArray(products) ? products : [];
}
