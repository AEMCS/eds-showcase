import { getSiteConfig, loadBrandConfig } from '../../scripts/utils/context.js';

const CARTWIRE_SCRIPT_ID = 'cwsc';
const MIKMAK_SCRIPT_ID = 'mikmak-wtb-script';
const PRICESPIDER_SCRIPT_ID = 'pricespider-widget-script';
const PRICESPIDER_ANALYTICS_SCRIPT_ID = 'pricespider-analytics-script';

let variantBound = false;
let mikmakLoaded = false;
let priceSpiderLoaded = false;

/* ===============================
   UTIL
=============================== */

function delay(ms = 100) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeScriptUrl(url = '') {
  const value = String(url || '').trim();

  if (!value) return '';

  // Config has //cdn.pricespider.com/...
  if (value.startsWith('//')) {
    return `${window.location.protocol}${value}`;
  }

  return value;
}

function loadScriptOnce({
  id,
  src,
  async = true,
  defer = false,
  parent = document.head,
  onload,
}) {
  if (!src) {
    console.warn('[buy-now] missing script src for', id);
    return Promise.resolve(false);
  }

  const existing = document.getElementById(id);

  if (existing) {
    if (typeof onload === 'function') {
      onload();
    }
    return Promise.resolve(true);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');

    script.id = id;
    script.src = normalizeScriptUrl(src);
    script.async = async;
    script.defer = defer;

    script.onload = () => {
      console.log('[buy-now] script loaded:', script.src);
      if (typeof onload === 'function') {
        onload();
      }
      resolve(true);
    };

    script.onerror = (e) => {
      console.warn('[buy-now] failed to load script:', script.src, e);
      reject(e);
    };

    parent.appendChild(script);
  });
}

/* ===============================
   RAW AUTHORING PARSE
   XWalk VALUE-ONLY SAFE
=============================== */

function getAuthoredValuesFromRaw(block) {
  const values = block.textContent
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean);

  console.log('[buy-now] raw values:', values);

  let provider = '';
  let mikMakExperience = 'popin';
  let buyNowTitle = '';

  values.forEach((val) => {
    const lower = val.toLowerCase();

    if (lower.includes('mikmak')) {
      provider = 'mikmak';
    } else if (lower.includes('cartwire')) {
      provider = 'cartwire';
    } else if (lower.includes('inpage') || lower.includes('pop in')) {
      mikMakExperience = 'inpage';
    } else if (lower.includes('popup') || lower.includes('pop up')) {
      mikMakExperience = 'popup';
    }
    else if (!provider || !mikMakExperience) {
      // skip config labels
    } else {
      buyNowTitle = val;
    }
  });

  console.log('[buy-now] parsed authored:', {
    provider,
    mikMakExperience,
    buyNowTitle,
  });

  return {
    provider,
    mikMakExperience,
    buyNowTitle,
  };
}

/* ===============================
   CONFIG
=============================== */

function normalizeBoolean(val) {
  if (typeof val === 'boolean') return val;

  const value = String(val || '').trim().toLowerCase();

  return value === 'enable'
    || value === 'enabled'
    || value === 'true'
    || value === 'yes';
}

function parseBuyNowConfig(config) {
  const sheet = config?.BuyNow;

  if (!sheet?.data) {
    console.warn('[buy-now] BuyNow config missing');
    return {};
  }

  const buyNow = {};

  sheet.data.forEach((row) => {
    const key = String(row?.key || '').trim().toLowerCase();
    const value = String(row?.value || '').trim();

    if (!key) return;

    if (key === 'provider') buyNow.provider = value.toLowerCase();

    if (key === 'enablebuynowintegration') {
      buyNow.enableBuyNow = normalizeBoolean(value);
    }

    if (key === 'appid') buyNow.appId = value;

    if (key === 'enablemikmakversion2') {
      buyNow.mikmakV2 = normalizeBoolean(value);
    }

    if (key === 'buynowtitle') buyNow.title = value;

    if (key === 'cartwirescript') {
      buyNow.cartwireScript = normalizeScriptUrl(value);
    }

    if (key === 'pricespiderscript') {
      buyNow.priceSpiderScript = normalizeScriptUrl(value);
    }

    if (key === 'pricespideranalyticsscript') {
      buyNow.priceSpiderAnalyticsScript = normalizeScriptUrl(value);
    }

    if (key === 'configurationkey') {
      buyNow.configurationKey = value;
    }

    if (key === 'buynowmethod') {
      buyNow.buyNowMethod = value;
    }

    if (key === 'locale') {
      buyNow.locale = value;
    }
  });

  console.log('[buy-now] parsed config:', buyNow);

  return buyNow;
}

/* ===============================
   VARIANTS / GTIN / SKU
=============================== */

function isValidGtin(value = '') {
  return /^\d{8,14}$/.test(String(value || '').trim());
}

function getGtinFromUrl() {
  try {
    const url = new URL(window.location.href);
    const queryKeys = [
      'gtin',
      'sku',
      'product',
      'productId',
      'productid',
      'variant',
      'ean',
      'upc',
    ];

    for (const key of queryKeys) {
      const value = url.searchParams.get(key);

      if (value && isValidGtin(value)) {
        console.log('[buy-now] variant from URL query =>', value.trim());
        return value.trim();
      }
    }
    const pathMatch = window.location.pathname.match(/(\d{8,14})(?:\/)?$/);

    if (pathMatch?.[1] && isValidGtin(pathMatch[1])) {
      console.log('[buy-now] variant from URL path end =>', pathMatch[1]);
      return pathMatch[1];
    }
    const anyPathMatch = window.location.pathname.match(/(\d{8,14})/);

    if (anyPathMatch?.[1] && isValidGtin(anyPathMatch[1])) {
      console.log('[buy-now] variant from URL path anywhere =>', anyPathMatch[1]);
      return anyPathMatch[1];
    }
  } catch (e) {
    console.warn('[buy-now] failed to parse URL GTIN', e);
  }

  return '';
}

function getSelectedVariantGtin() {
  const selected = document.querySelector(
    '.variant-selector-button.is-selected[data-gtin], '
    + '.variant-selector-button[aria-checked="true"][data-gtin]'
  );

  if (selected?.dataset?.gtin) {
    const gtin = selected.dataset.gtin.trim();

    if (isValidGtin(gtin)) {
      console.log('[buy-now] selected variant from button =>', gtin);
      return gtin;
    }
  }

  return '';
}

function getProductAttributeGtin() {
  const productNode = document.querySelector(
    '[data-gtin], [data-sku], [data-product-id], [data-productid]'
  );

  const gtin = productNode?.dataset?.gtin?.trim();
  const sku = productNode?.dataset?.sku?.trim();
  const productId = productNode?.dataset?.productId?.trim();
  const productid = productNode?.dataset?.productid?.trim();

  if (gtin && isValidGtin(gtin)) return gtin;
  if (sku && isValidGtin(sku)) return sku;
  if (productId && isValidGtin(productId)) return productId;
  if (productid && isValidGtin(productid)) return productid;

  return '';
}

function getSwnDataLayerGtin() {
  const value = window.swnDataLayer?.product_eans;

  if (!value) return '';

  const variants = String(value || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  const firstValid = variants.find((v) => isValidGtin(v));

  if (firstValid) {
    console.log('[buy-now] variant from swnDataLayer =>', firstValid);
    return firstValid;
  }

  return '';
}

function getVariants() {
  const urlGtin = getGtinFromUrl();
  if (urlGtin) return urlGtin;

  const selectedGtin = getSelectedVariantGtin();
  if (selectedGtin) return selectedGtin;

  const swnGtin = getSwnDataLayerGtin();
  if (swnGtin) return swnGtin;

  const productGtin = getProductAttributeGtin();
  if (productGtin) return productGtin;

  return '';
}

function getPrimaryVariant(variants = '') {
  return String(variants || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)[0] || '';
}

/* ===============================
   MIKMAK
=============================== */

function injectSwnDataLayer(variants, appId) {
  const selectedVariant = getPrimaryVariant(variants);

  if (!selectedVariant) return;

  window.swnDataLayer = {
    ...(window.swnDataLayer || {}),
    product_eans: selectedVariant,
  };

  if (appId) {
    window.swnDataLayer.appId = appId;
  }

  console.log('[buy-now] final dataLayer =>', window.swnDataLayer);
}

function loadMikMakScript(appId) {
  if (!appId || mikmakLoaded) return;

  mikmakLoaded = true;

  loadScriptOnce({
    id: MIKMAK_SCRIPT_ID,
    src: `https://wtb-tag.mikmak.ai/scripts/${appId}/tag.min.js`,
    async: true,
    parent: document.head,
    onload: () => {
      console.log('[buy-now] MikMak script loaded');
    },
  }).catch((e) => {
    console.warn('[buy-now] MikMak script failed', e);
  });
}

function tryRebindMikMak() {
  try {
    if (window.SwavenWidget && typeof window.SwavenWidget.init === 'function') {
      window.SwavenWidget.init();
      return;
    }

    if (window.swn && typeof window.swn.init === 'function') {
      window.swn.init();
      return;
    }

    if (window.swnDataLayer && typeof window.swnDataLayer.discover === 'function') {
      window.swnDataLayer.discover();
      return;
    }

    console.log('[buy-now] MikMak explicit rebind global not found; relying on vendor auto-bind');
  } catch (e) {
    console.warn('[buy-now] MikMak rebind failed', e);
  }
}

function createMikMakInPage(variants, buyNow) {
  const div = document.createElement('div');
  const selectedVariant = getPrimaryVariant(variants);

  div.className = 'embed mm-cre swn-tag-wtb-btn';

  div.dataset.mmWtbid = buyNow.appId;
  div.dataset.mmIds = selectedVariant;

  div.setAttribute('data-mm-anchor', 'true');

  const id = `mm_${Math.random().toString(36).substring(2, 12)}`;
  div.id = id;

  div.setAttribute(
    'data-awe-iid',
    `${Math.random().toString(16).substring(2, 10)}${Date.now()}`
  );

  return div;
}

function createMikMakButton(variants, buyNow, authoredTitle) {
  const btn = document.createElement('button');
  const selectedVariant = getPrimaryVariant(variants);

  btn.className = 'btn-primary mikmak swn-tag-wtb-btn cmp-button';
  btn.textContent = authoredTitle || buyNow.title || 'Buy Now';

  if (buyNow.mikmakV2) {
    btn.dataset.mmWtbid = buyNow.appId;
    btn.dataset.mmIds = selectedVariant;
  } else {
    btn.dataset.eans = selectedVariant;
  }

  return btn;
}

/* ===============================
   CARTWIRE
=============================== */

function initCartwire() {
  try {
    if (window.CartwireWidget && typeof window.CartwireWidget.init === 'function') {
      console.log('[cartwire] initializing widget');
      window.CartwireWidget.init();
    } else {
      console.log('[cartwire] CartwireWidget not available yet');
    }
  } catch (e) {
    console.warn('[cartwire] init failed', e);
  }
}

function loadCartwireScript(url) {
  if (!url) {
    console.warn('[cartwire] script url missing');
    return;
  }

  if (document.getElementById(CARTWIRE_SCRIPT_ID)) {
    initCartwire();
    return;
  }

  loadScriptOnce({
    id: CARTWIRE_SCRIPT_ID,
    src: url,
    async: false,
    defer: true,
    parent: document.body,
    onload: initCartwire,
  }).catch((e) => {
    console.warn('[cartwire] script failed', e);
  });
}

function createCartwireButton(variants, buyNow) {
  const div = document.createElement('div');
  const selectedVariant = getPrimaryVariant(variants);

  div.className = 'cc-smart-product-button';
  div.dataset.ref = 'cartwire-bin-widget';
  div.dataset.gtin = selectedVariant;

  div.dataset.locale = buyNow.locale || 'en-us';
  div.dataset.widgetType = 'popup';
  div.dataset.ctaLabel = buyNow.title || 'Buy Now';

  div.dataset.enableQuickCommerce = 'false';
  div.dataset.displayLowestPrice = 'false';
  div.dataset.showPrices = 'true';

  return div;
}

/* ===============================
   PRICESPIDER
=============================== */

function initPriceSpider() {
  try {
    console.log('[pricespider] init/rebind requested');

    if (window.PriceSpider?.rebind && typeof window.PriceSpider.rebind === 'function') {
      window.PriceSpider.rebind();
      return;
    }

    if (window.PriceSpider?.init && typeof window.PriceSpider.init === 'function') {
      window.PriceSpider.init();
      return;
    }

    if (window.PriceSpider?.Widget?.init && typeof window.PriceSpider.Widget.init === 'function') {
      window.PriceSpider.Widget.init();
      return;
    }

    if (window.PSWidget?.init && typeof window.PSWidget.init === 'function') {
      window.PSWidget.init();
      return;
    }

    console.log('[pricespider] no explicit global init found; relying on auto-bind');
  } catch (e) {
    console.warn('[pricespider] init failed', e);
  }
}

function loadPriceSpiderScripts(buyNow) {
  if (priceSpiderLoaded) {
    initPriceSpider();
    return;
  }

  priceSpiderLoaded = true;

  const analyticsScript = buyNow.priceSpiderAnalyticsScript;
  const widgetScript = buyNow.priceSpiderScript;

  const loadAnalytics = analyticsScript
    ? loadScriptOnce({
      id: PRICESPIDER_ANALYTICS_SCRIPT_ID,
      src: analyticsScript,
      async: true,
      parent: document.head,
      onload: () => {
        console.log('[pricespider] analytics script loaded');
      },
    }).catch((e) => {
      console.warn('[pricespider] analytics script failed', e);
    })
    : Promise.resolve();

  loadAnalytics
    .then(() => loadScriptOnce({
      id: PRICESPIDER_SCRIPT_ID,
      src: widgetScript,
      async: true,
      parent: document.head,
      onload: () => {
        console.log('[pricespider] widget script loaded');
        initPriceSpider();
      },
    }))
    .catch((e) => {
      console.warn('[pricespider] widget script failed', e);
    });
}

function createPriceSpiderWidget(variants, buyNow, authoredTitle) {
  const sku = getPrimaryVariant(variants);

  const outer = document.createElement('div');
  outer.className = 'pricespider cmp-integration-lazy';
  outer.dataset.ref = 'pricespider-lazyLoad';
  outer.dataset.gtin = sku;

  const analytics = document.createElement('div');
  analytics.className = 'component-content cmp-integration-lazy';
  analytics.dataset.ref = 'pricespider-analytics';

  const widget = document.createElement('div');
  widget.className = 'ps-widget btn-primary';

  widget.setAttribute('ps-sku', sku);
  widget.setAttribute('title', authoredTitle || buyNow.title || 'Buy Now');

  if (buyNow.configurationKey) {
    widget.setAttribute('ps-config', buyNow.configurationKey);
  }

  widget.setAttribute('data-cmp-clickable', 'true');

  analytics.append(widget);
  outer.append(analytics);

  return outer;
}

/* ===============================
   VARIANT EVENTS
=============================== */

function updateVariantSelectorState(button) {
  if (!button) return;

  const group = button.closest('.variant-selector-buttons');

  if (!group) return;

  group.querySelectorAll('.variant-selector-button').forEach((btn) => {
    btn.classList.remove('is-selected');
    btn.setAttribute('aria-checked', 'false');
  });

  button.classList.add('is-selected');
  button.setAttribute('aria-checked', 'true');
}

function updateAllBuyNow(variants) {
  const selectedVariant = getPrimaryVariant(variants);

  if (!selectedVariant) return;

  console.log('[buy-now] updating widgets with variant =>', selectedVariant);

  document.querySelectorAll('.buy-now-wrapper').forEach((wrapper) => {
    const mikmak = wrapper.querySelector('.mikmak');
    const mikmakInPage = wrapper.querySelector('.mm-cre');
    const cartwire = wrapper.querySelector('.cc-smart-product-button');
    const priceSpider = wrapper.querySelector('.pricespider');
    const priceSpiderWidget = wrapper.querySelector('.ps-widget');

    if (mikmak) {
      if (mikmak.dataset.mmWtbid) {
        mikmak.dataset.mmIds = selectedVariant;
      } else {
        mikmak.dataset.eans = selectedVariant;
      }

      mikmak.classList.remove('swn-bound');
      mikmak.classList.remove('swn-awe-btn-enabled');

      injectSwnDataLayer(selectedVariant);
      tryRebindMikMak();
    }

    if (mikmakInPage) {
      mikmakInPage.dataset.mmIds = selectedVariant;
      mikmakInPage.classList.remove('swn-bound');
      mikmakInPage.classList.remove('swn-awe-btn-enabled');

      injectSwnDataLayer(selectedVariant);
      tryRebindMikMak();
    }

    if (cartwire) {
      cartwire.dataset.gtin = selectedVariant;
      initCartwire();
    }

    if (priceSpider && priceSpiderWidget) {
      priceSpider.dataset.gtin = selectedVariant;
      priceSpiderWidget.setAttribute('ps-sku', selectedVariant);

      initPriceSpider();
    }
  });
}

function bindVariantEvents() {
  if (variantBound) return;
  variantBound = true;

  document.addEventListener('click', (e) => {
    const button = e.target.closest('.variant-selector-button[data-gtin]');

    if (!button) return;

    const gtin = button.dataset.gtin?.trim();

    if (!gtin || !isValidGtin(gtin)) {
      console.warn('[buy-now] clicked variant missing/invalid data-gtin:', gtin);
      return;
    }

    console.log('[buy-now] variant clicked =>', gtin);

    updateVariantSelectorState(button);
    updateAllBuyNow(gtin);
  });
}

/* ===============================
   MAIN
=============================== */

async function render(block, originalBlock) {
  await delay(100);

  const [config] = await Promise.all([
    getSiteConfig(),
    loadBrandConfig(),
  ]);

  if (!config) {
    block.innerHTML = '<p>Config not loaded</p>';
    return;
  }

  const buyNow = parseBuyNowConfig(config);

  if (!buyNow.enableBuyNow) {
    console.log('[buy-now] disabled → removing full wrapper');
    let wrapper = block.closest('.two-column-right.buy-now-wrapper');

    if (!wrapper) {
      wrapper = block.closest('.buy-now-wrapper');
    }

    if (wrapper) {
      wrapper.remove();
    } else {
      block.remove();
    }
    return;
  }



  let variants = getVariants();
  let retries = 8;

  while ((!variants || variants.length === 0) && retries > 0) {
    await delay(200);
    variants = getVariants();
    retries -= 1;
  }

  if (!variants) {
    block.innerHTML = '<p style="color:red">Variants missing</p>';
    return;
  }

  console.log('[buy-now] initial variant used =>', variants);

  const authored = getAuthoredValuesFromRaw(originalBlock);

  if (!buyNow.provider && authored.provider) {
    buyNow.provider = authored.provider.toLowerCase();
  }

  const experience = authored.mikMakExperience
    .replace(/\s+/g, '')
    .toLowerCase();

  const authoredTitle = authored.buyNowTitle;

  block.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'buy-now-wrapper';

  if (buyNow.provider === 'mikmak') {
    injectSwnDataLayer(variants, buyNow.appId);

    if (experience === 'inpage') {
      wrapper.append(createMikMakInPage(variants, buyNow));
    } else {
      wrapper.append(createMikMakButton(variants, buyNow, authoredTitle));
    }

    block.append(wrapper);

    loadMikMakScript(buyNow.appId);

    /*
      If script was already available, try immediate rebind.
    */
    await delay(100);
    tryRebindMikMak();
  } else if (buyNow.provider === 'cartwire') {
    const btn = createCartwireButton(variants, buyNow);

    wrapper.append(btn);
    block.append(wrapper);

    loadCartwireScript(buyNow.cartwireScript);
  } else if (buyNow.provider === 'pricespider') {
    const priceSpiderWidget = createPriceSpiderWidget(variants, buyNow, authoredTitle);

    wrapper.append(priceSpiderWidget);
    block.append(wrapper);
    loadPriceSpiderScripts(buyNow);
  } else {
    console.warn('[buy-now] unsupported provider:', buyNow.provider);
    block.innerHTML = `<p>Unsupported BuyNow provider: ${buyNow.provider || 'missing'}</p>`;
    return;
  }

  bindVariantEvents();
}

/* ===============================
   DECORATE
=============================== */

export default async function decorate(block) {
  try {
    const originalBlock = block.cloneNode(true);
    await render(block, originalBlock);
  } catch (e) {
    console.error('[buy-now] error', e);
    block.innerHTML = '<p>BuyNow failed</p>';
  }
}