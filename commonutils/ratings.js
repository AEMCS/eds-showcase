import { getSiteConfig, loadBrandConfig } from '../scripts/utils/context.js';

const DEFAULT_PRODUCT_IMAGE = 'https://placehold.jp/400x400.png';

function normalize(str) {
  return (str || '').trim().toLowerCase();
}

function createElement(tagName, attributes = {}, text = '') {
  const element = document.createElement(tagName);

  Object.entries(attributes).forEach(([name, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      element.setAttribute(name, value);
    }
  });

  if (text) element.textContent = text;

  return element;
}

function safeGet(obj, paths = []) {
  for (const path of paths) {
    const value = path.split('.').reduce((acc, key) => acc?.[key], obj);

    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }

  return '';
}

function getRatingsEntityId(product) {
  return safeGet(product, [
    'gtin',
    'GTIN',
    'sku',
    'SKU',
    'id',
    'ID',
    'productId',
    'productID',
    'ProductID',
    'productInfo.productID',
    'productInfo.productId',
    'productInfo.sku',
    'productInfo.SKU',
    'productInfo.gtin',
    'productInfo.GTIN',
    'commerce.productID',
    'commerce.productId',
    'commerce.sku',
    'commerce.gtin',
  ]);
}

function normalizeBazaarvoiceProductId(productId) {
  const id = String(productId || '').trim();
  if (/^00\d{12}$/.test(id)) {
    return id.substring(2);
  }

  return id;
}

function normalizeRatingsConfig(siteConfig, brandConfig) {
  if (!siteConfig) {
    return {
      enableRatings: false,
      provider: '',
      kritique: {},
      bazaarvoice: {},
    };
  }

  if (siteConfig.ratingsProvider || siteConfig.kritique || siteConfig.bazaarvoice) {
    return {
      enableRatings: !!siteConfig.enableRatings,
      provider: normalize(siteConfig.ratingsProvider),
      kritique: {
        url: siteConfig.kritique?.url || '',
        brandId: siteConfig.kritique?.brandId || brandConfig?.brand || '',
        prodApiKey: siteConfig.kritique?.prodApiKey || siteConfig.kritique?.apiKey || '',
        stageApiKey: siteConfig.kritique?.stageApiKey || siteConfig.kritique?.apiKey || '',
      },
      bazaarvoice: {
        clientName: siteConfig.bazaarvoice?.clientName || '',
        siteID: siteConfig.bazaarvoice?.siteID || siteConfig.bazaarvoice?.siteId || '',
        bazaarvoiceEnvironment:
          siteConfig.bazaarvoice?.bazaarvoiceEnvironment
          || siteConfig.bazaarvoice?.deploymentZone
          || '',
        cloudKey: siteConfig.bazaarvoice?.cloudKey || '',
        bazaarvoiceUrl:
          siteConfig.bazaarvoice?.bazaarvoiceUrl
          || siteConfig.bazaarvoice?.url
          || '',
        localeId: `${brandConfig.language}_${String(brandConfig.country).toUpperCase()}`,
      },
    };
  }

  const rrSheet =
    siteConfig?.ReviewRating
    || siteConfig?.data?.ReviewRating
    || siteConfig?.raw?.ReviewRating;

  if (!rrSheet || !Array.isArray(rrSheet.data)) {
    console.warn('[ratings] ReviewRating sheet missing or invalid', siteConfig);

    return {
      enableRatings: false,
      provider: '',
      kritique: {},
      bazaarvoice: {},
    };
  }

  const rr = {};

  rrSheet.data.forEach((row) => {
    const key = (row?.key || '').trim();
    const value = (row?.value || '').trim();

    if (key) rr[key] = value;
  });

  return {
    enableRatings: normalize(rr.enableRatings) === 'enable',
    provider: normalize(rr.provider),
    kritique: {
      url: rr.url || '',
      brandId: rr.brandId || brandConfig?.brand || '',
      prodApiKey: rr.prodApiKey || rr.apiKey || '',
      stageApiKey: rr.stageApiKey || rr.apiKey || '',
    },
    bazaarvoice: {
      clientName: rr.clientName || '',
      siteID: rr.siteId || rr.siteID || '',
      bazaarvoiceEnvironment: rr.deploymentZone || rr.bazaarvoiceEnvironment || '',
      cloudKey: rr.cloudKey || '',
      bazaarvoiceUrl: rr.bazaarvoiceUrl || rr.url || '',
      localeId: `${brandConfig.language}_${String(brandConfig.country).toUpperCase()}`,
    },
  };
}

function loadKritiqueListing({
  url,
  apiKey,
  locale,
  brandId,
}) {
  if (!url || !apiKey || !locale || !brandId) {
    console.warn('[ratings] Missing Kritique listing config', {
      url,
      apiKey,
      locale,
      brandId,
    });

    return false;
  }

  if (document.getElementById('rr-widget-script')) {
    return true;
  }

  const script = document.createElement('script');
  script.id = 'rr-widget-script';
  script.async = true;
  script.src = `${url}?brandid=${brandId}&apikey=${apiKey}&localeid=${locale}`;

  console.log('[ratings] Kritique Listing Script URL:', script.src);

  script.onload = () => {
    console.log('[ratings] Kritique listing script LOADED');
  };

  script.onerror = () => {
    console.warn('[ratings] Kritique listing script FAILED');
  };

  document.body.appendChild(script);

  return true;
}

function loadBazaarvoiceListing({
  bazaarvoiceUrl,
  clientName,
  siteID,
  bazaarvoiceEnvironment,
  localeId,
}) {
  if (!bazaarvoiceUrl || !clientName || !siteID || !bazaarvoiceEnvironment || !localeId) {
    console.warn('[ratings] Missing Bazaarvoice listing config', {
      bazaarvoiceUrl,
      clientName,
      siteID,
      bazaarvoiceEnvironment,
      localeId,
    });

    return Promise.resolve(false);
  }

  if (window.__BV_SCRIPT_READY__) {
    return Promise.resolve(true);
  }

  const existing = document.getElementById('bv-widget');

  if (existing) {
    return new Promise((resolve) => {
      if (window.__BV_SCRIPT_READY__) {
        resolve(true);
        return;
      }

      existing.addEventListener('load', () => {
        window.__BV_SCRIPT_READY__ = true;
        resolve(true);
      }, { once: true });

      existing.addEventListener('error', () => {
        resolve(false);
      }, { once: true });
    });
  }

  if (!document.getElementById('bv-preconnect')) {
    const preconnect = document.createElement('link');
    preconnect.id = 'bv-preconnect';
    preconnect.rel = 'preconnect';
    preconnect.href = bazaarvoiceUrl;
    document.head.appendChild(preconnect);
  }

  return new Promise((resolve) => {
    try {
      const script = document.createElement('script');
      script.id = 'bv-widget';
      script.async = true;
      script.src = `${bazaarvoiceUrl}/deployments/${clientName}/${siteID}/${bazaarvoiceEnvironment}/${localeId}/bv.js`;

      console.log('[ratings] Bazaarvoice Listing Script URL:', script.src);

      script.onload = () => {
        window.__BV_SCRIPT_READY__ = true;
        console.log('[ratings] Bazaarvoice listing script LOADED');
        resolve(true);
      };

      script.onerror = () => {
        console.warn('[ratings] Bazaarvoice listing script FAILED: CORS / domain whitelist / network');
        resolve(false);
      };

      document.head.appendChild(script);
    } catch (e) {
      console.warn('[ratings] Bazaarvoice script load crashed', e);
      resolve(false);
    }
  });
}

function createKritiqueListingRating(product, productId) {
  return createElement('div', {
    class: 'rr-widget-container',
    'data-summary-template': 'listing',
    'data-entity-id': productId,
    'data-entity-type': 'product',
    title: product.name || product.title || product.productName || '',
  });
}

function createBazaarvoiceListingRating(product, productId) {
  const bvProductId = normalizeBazaarvoiceProductId(productId);

  const rating = createElement('div', {
    class: 'rating',
  });

  const componentKey = `relatedproducts-${bvProductId}`;

  const dataLayer = {
    [componentKey]: {
      provider: 'bazaarvoice',
    },
  };

  const rrWidget = createElement('div', {
    'data-ref': 'rr-widget',
    class: 'cmp-integration--reviewrating cmp-integration-lazy',
    'data-cmp-data-layer': JSON.stringify(dataLayer),
  });

  const bazaarvoice = createElement('div', {
    class: 'bazaarvoice',
  });

  const content = createElement('div', {
    class: 'component-content',
  });

  const inlineRating = createElement('div', {
    'data-bv-show': 'inline_rating',
    'data-bv-product-id': bvProductId,
    'data-bv-seo': 'false',
    title: product.name || product.title || product.productName || '',
  });

  content.appendChild(inlineRating);
  bazaarvoice.appendChild(content);
  rrWidget.appendChild(bazaarvoice);
  rating.appendChild(rrWidget);

  return rating;
}

function getListingCards(block, itemSelector) {
  if (!block || !itemSelector) return [];

  return [...block.querySelectorAll(itemSelector)];
}

function getRatingInsertTarget(card, targetSelector) {
  if (!card) return null;

  if (!targetSelector) return card;

  if (card.matches(targetSelector)) return card;

  return card.querySelector(targetSelector) || card;
}

function hasExistingRating(card) {
  if (!card) return false;

  return !!(
    card.querySelector('.rr-widget-container')
    || card.querySelector('.rating')
    || card.querySelector('[data-bv-show="inline_rating"]')
  );
}

function injectListingRatings({
  block,
  products,
  provider,
  itemSelector,
  linkSelector,
  insertBeforeSelector,
}) {
  const cards = getListingCards(block, itemSelector);

  console.log('[ratings] cards found:', cards.length);
  console.log('[ratings] products found:', products.length);

  cards.forEach((card, index) => {
    if (!card) return;

    if (hasExistingRating(card)) {
      return;
    }

    const target = getRatingInsertTarget(card, linkSelector);

    if (!target) {
      console.warn('[ratings] insert target missing for card index:', index);
      return;
    }
   const product = products[index] || {};

const productId =
  card.getAttribute('data-sku') ||
  card.dataset?.sku ||
  card.dataset?.productId ||
  getRatingsEntityId(product);

    if (!productId) {
      console.warn('[ratings] missing SKU on card', {
        index,
        card,
      });
      return;
    }

    const insertBeforeElement = insertBeforeSelector
      ? target.querySelector(insertBeforeSelector)
      : null;

    let ratingElement = null;

    if (provider === 'kritique') {
      ratingElement = createKritiqueListingRating(product, productId);
    }

    if (provider === 'bazaarvoice') {
      ratingElement = createBazaarvoiceListingRating(product, productId);
    }

    if (!ratingElement) return;

    if (insertBeforeElement) {
      target.insertBefore(ratingElement, insertBeforeElement);
    } else {
      target.appendChild(ratingElement);
    }

    console.log('[ratings] injected rating:', {
      provider,
      originalProductId: productId,
      bvProductId: provider === 'bazaarvoice'
        ? normalizeBazaarvoiceProductId(productId)
        : productId,
      index,
    });
  });
}

export async function enhanceListingWithRatings({
  block,
  products = [],
  itemSelector = ':scope > .product-item',
  linkSelector = 'a',
  insertBeforeSelector = '.product-link',
} = {}) {
if (!block) {
  console.warn('[ratings] skipped: block missing');
  return;
}

  try {
    const [siteConfig, brandConfig] = await Promise.all([
      getSiteConfig(),
      loadBrandConfig(),
    ]);

    const ratingsConfig = normalizeRatingsConfig(siteConfig, brandConfig);

    console.log('[ratings] ratingsConfig:', ratingsConfig);

    if (!ratingsConfig.enableRatings) {
      console.warn('[ratings] ratings disabled');
      return;
    }

  if (ratingsConfig.provider === 'kritique') {
  injectListingRatings({
    block,
    products,
    provider: 'kritique',
    itemSelector,
    linkSelector,
    insertBeforeSelector,
  });

  const kritique = ratingsConfig.kritique || {};
  const isLocal = window.location.hostname.includes('localhost');

  const apiKey = isLocal
    ? kritique.stageApiKey
    : kritique.prodApiKey || kritique.stageApiKey;

  const kritiqueUrl = kritique.url;
  const locale = `${brandConfig.language}-${String(brandConfig.country).toUpperCase()}`;
  const brandId = kritique.brandId || brandConfig.brand;

  if (!kritiqueUrl || !apiKey || !brandId) {
    console.warn('[ratings] Missing Kritique config');
    return;
  }

  loadKritiqueListing({
    url: kritiqueUrl,
    apiKey,
    locale,
    brandId,
  });

  return;
}

if (ratingsConfig.provider === 'bazaarvoice') {

  injectListingRatings({
    block,
    products,
    provider: 'bazaarvoice',
    itemSelector,
    linkSelector,
    insertBeforeSelector,
  });

  // ✅ Step 2: load BV script AFTER DOM is ready
  const loaded = await loadBazaarvoiceListing(ratingsConfig.bazaarvoice);

  if (!loaded) {
    console.warn('[ratings] BV script failed');
    return;
  }

  return;
}


    console.warn('[ratings] Unsupported ratings provider:', ratingsConfig.provider);
  } catch (error) {
    console.warn('[ratings] ratings enhancement failed for listing', error);
  }
}

export {
  DEFAULT_PRODUCT_IMAGE,
};