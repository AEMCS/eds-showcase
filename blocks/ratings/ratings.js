import { getSiteConfig, loadBrandConfig } from '../../scripts/utils/context.js';

const authorObserverMap = new WeakMap();
const authorTimerMap = new WeakMap();

let kritiqueModule;
let bazaarvoiceModule;

function normalize(str) {
  return (str || '').trim().toLowerCase();
}

function normalizeCompact(str = '') {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function isTruthy(value) {
  return String(value).trim().toLowerCase() === 'true';
}

function isAuthorMode() {
  return Boolean(
    window.Granite?.author
    || window.location.search.includes('wcmmode=')
    || window.location.hostname.includes('author')
  );
}

function delay(ms = 100) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function unwrapRatingsBlock() {
  // Intentionally empty.
  // Keep .ratings-wrapper intact and do not unwrap/remove it.
}

function resolveProviderFromConfig(config) {
  const rrSheet =
    config?.ReviewRating
    || config?.data?.ReviewRating
    || config?.raw?.ReviewRating;

  if (!rrSheet || !Array.isArray(rrSheet.data)) {
    console.error('[ratings] ReviewRating sheet missing or invalid', config);
    return {};
  }

  const rr = {};

  rrSheet.data.forEach((row) => {
    const key = (row?.key || '').trim();
    const value = (row?.value || '').trim();

    if (key) {
      rr[key] = value;
    }
  });

  console.log('[ratings] RR parsed:', rr);
  return rr;
}

function getRatingsConfig(config, brandConfig) {
  if (config?.ratingsProvider || config?.kritique || config?.bazaarvoice) {
    return {
      enableRatings: !!config?.enableRatings,
      provider: normalize(config?.ratingsProvider),

      kritique: {
        url: config?.kritique?.url || '',
        brandId: config?.kritique?.brandId || brandConfig?.brand || '',
        prodApiKey: config?.kritique?.prodApiKey || config?.kritique?.apiKey || '',
        stageApiKey: config?.kritique?.stageApiKey || config?.kritique?.apiKey || '',
      },

      bazaarvoice: {
        clientName: config?.bazaarvoice?.clientName || '',
        siteID: config?.bazaarvoice?.siteID || '',
        bazaarvoiceEnvironment: config?.bazaarvoice?.bazaarvoiceEnvironment || '',
        cloudKey: config?.bazaarvoice?.cloudKey || '',
        bazaarvoiceUrl: config?.bazaarvoice?.bazaarvoiceUrl || '',
        localeId: `${brandConfig.language}_${String(brandConfig.country).toUpperCase()}`,
        seoRequired: isTruthy(config?.bazaarvoice?.seoRequired),
        seoHtml: config?.bazaarvoice?.seoHtml || '',
        featureApi: config?.bazaarvoice?.featureApi || '',
        passKey: config?.bazaarvoice?.passKey || '',
        reviewLimit: config?.bazaarvoice?.reviewLimit || '',
      },
    };
  }

  const rr = resolveProviderFromConfig(config);

  return {
    enableRatings: normalize(rr?.enableRatings) === 'enable',
    provider: normalize(rr?.provider),

    kritique: {
      url: rr?.url || '',
      brandId: rr?.brandId || brandConfig?.brand || '',
      prodApiKey: rr?.prodApiKey || rr?.apiKey || '',
      stageApiKey: rr?.stageApiKey || rr?.apiKey || '',
    },

    bazaarvoice: {
      clientName: rr?.clientName || '',
      siteID: rr?.siteId || '',
      bazaarvoiceEnvironment: rr?.deploymentZone || '',
      cloudKey: rr?.cloudKey || '',
      bazaarvoiceUrl: rr?.url || '',
      localeId: `${brandConfig.language}_${String(brandConfig.country).toUpperCase()}`,
      seoRequired: isTruthy(rr?.seoRequired),
      seoHtml: rr?.seoHtml || '',
      featureApi: rr?.featureApi || '',
      passKey: rr?.passKey || '',
      reviewLimit: rr?.reviewLimit || '',
    },
  };
}

function getProductId() {
  const params = new URLSearchParams(window.location.search);
  const skuFromQuery = params.get('sku');
  if (skuFromQuery) return skuFromQuery.trim();
  const pathParts = window.location.pathname.split('/').filter(Boolean);

  for (let i = pathParts.length - 1; i >= 0; i -= 1) {
    const part = pathParts[i];

    if (/^\d+$/.test(part)) {
      return part.trim();
    }
  }

  // Fallback if product API already stored SKU globally
  if (window.__productData?.sku) {
    return String(window.__productData.sku).trim();
  }

  console.warn('[ratings] SKU not found');
  return '';
}

function normalizeBvProductId(productId = '') {
  const value = String(productId).trim();
  if (value.startsWith('00')) {
    return value.slice(2);
  }

  return value;
}

function normalizeLabel(str = '') {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function getAuthoredFieldValue(sourceEl, labels = []) {
  if (!sourceEl) return '';

  const normalizedLabels = labels.map((label) => normalizeLabel(label));

  const directRows = [...sourceEl.querySelectorAll(':scope > div')];

  for (const row of directRows) {
    const cols = [...row.children];
    if (cols.length < 2) continue;

    const key = normalizeLabel(cols[0].textContent || '');
    const value = (cols[1].textContent || '').trim();

    if (normalizedLabels.some((label) => key.includes(label))) {
      return value;
    }
  }

  const allRows = [...sourceEl.querySelectorAll('div')];

  for (const row of allRows) {
    const cols = [...row.children];
    if (cols.length < 2) continue;

    const key = normalizeLabel(cols[0].textContent || '');
    const value = (cols[1].textContent || '').trim();

    if (normalizedLabels.some((label) => key.includes(label))) {
      return value;
    }
  }

  return '';
}

function getAuthoredSeoValue(sourceEl) {
  return getAuthoredFieldValue(sourceEl, [
    'seo required',
    'seo enabled',
    'enable seo',
    'bv seo',
  ]);
}

function getAuthoredVariationValue(sourceEl) {
  return getAuthoredFieldValue(sourceEl, [
    'variation',
    'widget type',
    'rating type',
    'review type',
    'component type',
    'ratings variation',
    'ratings type',
  ]);
}

function getVariationFromAuthoredValue(value, provider) {
  const normalized = normalizeCompact(value);

  if (!normalized) return '';

  if (provider === 'bazaarvoice') {
    const bazaarvoiceMap = {
      summarycontainer: 'summaryContainer',
      summary: 'summaryContainer',
      ratingsummary: 'summaryContainer',
      ratingsandreviews: 'ratingsAndReviews',
      ratingandreviews: 'ratingsAndReviews',
      reviews: 'ratingsAndReviews',
      review: 'ratingsAndReviews',
      inlinerating: 'inlineRating',
      inline: 'inlineRating',
      featuredreview: 'featuredReview',
      featuredreviews: 'featuredReview',
      featurereview: 'featuredReview',
    };

    return bazaarvoiceMap[normalized] || '';
  }

  if (provider === 'kritique') {
    const kritiqueMap = {
      summarywidget: 'summarywidget',
      summary: 'summarywidget',
      readpanelwidget: 'readpanelwidget',
      readpanel: 'readpanelwidget',
      onlystarswidget: 'onlystarswidget',
      onlystars: 'onlystarswidget',
      inlinewidget: 'onlystarswidget',
      inline: 'onlystarswidget',
    };

    return kritiqueMap[normalized] || '';
  }

  return '';
}

function getVariationFromClass(block, provider) {
  const classes = [...block.classList].map((cls) => cls.toLowerCase());

  if (provider === 'kritique') {
    const kritiqueMap = {
      summarywidget: 'summarywidget',
      readpanelwidget: 'readpanelwidget',
      onlystarswidget: 'onlystarswidget',
      inlinewidget: 'onlystarswidget',
    };

    const found = classes
      .filter((cls) => Object.prototype.hasOwnProperty.call(kritiqueMap, cls))
      .pop();

    return kritiqueMap[found] || 'summarywidget';
  }

  if (provider === 'bazaarvoice') {
    const bazaarvoiceMap = {
      summarycontainer: 'summaryContainer',
      ratingsandreviews: 'ratingsAndReviews',
      inlinerating: 'inlineRating',
      featuredreview: 'featuredReview',
    };

    const bvClasses = classes.filter((cls) =>
      Object.prototype.hasOwnProperty.call(bazaarvoiceMap, cls)
    );

    if (bvClasses.length > 1) {
      console.warn(
        '[ratings] Multiple Bazaarvoice classes found. Using last one:',
        bvClasses,
        block
      );
    }

    const found = bvClasses[bvClasses.length - 1];

    return bazaarvoiceMap[found] || 'summaryContainer';
  }

  return '';
}

function getVariation(block, authoredSource, provider) {
  const authoredVariation = getAuthoredVariationValue(authoredSource);

  const variationFromAuthored = getVariationFromAuthoredValue(
    authoredVariation,
    provider
  );

  if (variationFromAuthored) {
    console.log('[ratings] variation from authored value:', {
      authoredVariation,
      variationFromAuthored,
    });

    return variationFromAuthored;
  }

  const variationFromClass = getVariationFromClass(block, provider);

  console.log('[ratings] variation from class fallback:', variationFromClass);

  return variationFromClass;
}

function isSeoEnabled(block) {
  return block.classList.contains('seo-enabled');
}

function removeRatingsBlock(block) {
  if (isAuthorMode()) {
    block.innerHTML = '<div class="ratings-container"><p>Ratings disabled</p></div>';
    return;
  }

  block.remove();
}

function setInternalRender(block, value) {
  block.dataset.ratingsInternalRender = value ? 'true' : 'false';
}

function scheduleAuthorRedecorate(block) {
  if (!isAuthorMode()) return;
  if (authorObserverMap.has(block)) return;

  const observer = new MutationObserver((mutations) => {
    if (block.dataset.ratingsInternalRender === 'true') {
      return;
    }

    const hasRelevantChange = mutations.some((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        return true;
      }

      if (mutation.type === 'childList') {
        return true;
      }

      if (mutation.type === 'characterData') {
        return true;
      }

      return false;
    });

    if (!hasRelevantChange) return;

    window.clearTimeout(authorTimerMap.get(block));

    const timer = window.setTimeout(() => {
      console.log('[ratings] Author change detected -> re-decorating');
      decorate(block);
    }, 150);

    authorTimerMap.set(block, timer);
  });

  observer.observe(block, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class'],
  });

  authorObserverMap.set(block, observer);
}

async function getKritiqueModule() {
  if (!kritiqueModule) {
    kritiqueModule = await import('./kritique.js');
  }

  return kritiqueModule;
}

async function getBazaarvoiceModule() {
  if (!bazaarvoiceModule) {
    bazaarvoiceModule = await import('./bazaarvoice.js');
  }

  return bazaarvoiceModule;
}

export default async function decorate(block) {
  scheduleAuthorRedecorate(block);
  unwrapRatingsBlock(block);

  try {
    if (isAuthorMode()) {
      await delay(100);
    }

    const productId = getProductId();

    if (!productId) {
      if (isAuthorMode()) {
        block.innerHTML = '<div class="ratings-container"><p>Waiting for product context...</p></div>';
        return;
      }

      block.textContent = 'No productId';
      return;
    }

    const [config, brandConfig] = await Promise.all([
      getSiteConfig(),
      loadBrandConfig(),
    ]);

    if (!config || !brandConfig) {
      if (isAuthorMode()) {
        block.innerHTML = '<div class="ratings-container"><p>Config not loaded yet...</p></div>';
        return;
      }

      block.textContent = 'Config not loaded';
      return;
    }

    const ratingsConfig = getRatingsConfig(config, brandConfig);

    console.log('[ratings] full config:', config);
    console.log('[ratings] provider:', ratingsConfig.provider);
    console.log('[ratings] ratingsConfig:', ratingsConfig);

    if (!ratingsConfig.enableRatings) {
      removeRatingsBlock(block);
      return;
    }

    if (!ratingsConfig.provider) {
      if (isAuthorMode()) {
        block.innerHTML = '<div class="ratings-container"><p>No provider configured</p></div>';
        return;
      }

      block.textContent = 'No provider';
      return;
    }

    const authoredSource = block.cloneNode(true);
    const variation = getVariation(block, authoredSource, ratingsConfig.provider);

    console.log('[ratings] final variation:', variation);
    console.log('[ratings] raw productId:', productId);
    console.log('[ratings] block classes:', [...block.classList]);

    const authoredFeatureApi = getAuthoredFieldValue(authoredSource, [
      'feature review api',
      'feature api',
    ]);

    const authoredPassKey = getAuthoredFieldValue(authoredSource, [
      'api pass key',
      'pass key',
    ]);

    const authoredReviewLimit = getAuthoredFieldValue(authoredSource, [
      'review limit',
    ]);

    const authoredSeo = getAuthoredSeoValue(authoredSource);

    console.log('[ratings] authored Feature API:', authoredFeatureApi);
    console.log('[ratings] authored Pass Key:', authoredPassKey);
    console.log('[ratings] authored Review Limit:', authoredReviewLimit);
    console.log('[ratings] authored SEO:', authoredSeo);

    setInternalRender(block, true);

    block.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'ratings-container';
    block.appendChild(container);

    // -------------------------
    // KRITIQUE
    // -------------------------
    if (ratingsConfig.provider === 'kritique') {
      const {
        loadKritique,
        createKritiqueWidget,
      } = await getKritiqueModule();

      // Kritique uses raw productId
      const widget = createKritiqueWidget(variation, productId);

      if (!widget) {
        console.warn('[ratings] Kritique widget failed');
        setInternalRender(block, false);
        return;
      }

      container.appendChild(widget);

      const apiKey = window.location.hostname.includes('localhost')
        ? ratingsConfig.kritique.stageApiKey
        : (ratingsConfig.kritique.prodApiKey || ratingsConfig.kritique.stageApiKey);

      const loaded = await loadKritique({
        url: ratingsConfig.kritique.url,
        apiKey,
        locale: `${brandConfig.language}-${String(brandConfig.country).toUpperCase()}`,
        brandId: ratingsConfig.kritique.brandId,
        productId,
        forceReload: isAuthorMode(),
      });

      if (!loaded) {
        console.warn('[ratings] Kritique script failed; keeping page intact');
      }

      setInternalRender(block, false);
      return;
    }

    // -------------------------
    // BAZAARVOICE
    // -------------------------
    if (ratingsConfig.provider === 'bazaarvoice') {
      block.classList.remove(
        'summarywidget',
        'readpanelwidget',
        'onlystarswidget',
        'inlinewidget'
      );

      const bvProductId = normalizeBvProductId(productId);

      console.log('[ratings] Bazaarvoice raw productId:', productId);
      console.log('[ratings] Bazaarvoice normalized productId:', bvProductId);

      const {
        loadBazaarvoice,
        createBazaarvoiceWidget,
      } = await getBazaarvoiceModule();

      const seoEnabled = authoredSeo
        ? isTruthy(authoredSeo)
        : (isSeoEnabled(authoredSource) || ratingsConfig.bazaarvoice.seoRequired);

      const widget = createBazaarvoiceWidget(variation, bvProductId, {
        seoRequired: seoEnabled,
        seoHtml: ratingsConfig.bazaarvoice.seoHtml,
        featureApi: authoredFeatureApi || ratingsConfig.bazaarvoice.featureApi,
        passKey: authoredPassKey || ratingsConfig.bazaarvoice.passKey,
        reviewLimit: authoredReviewLimit || ratingsConfig.bazaarvoice.reviewLimit,
      });

      if (!widget) {
        console.warn('[ratings] Bazaarvoice widget failed');
        setInternalRender(block, false);
        return;
      }

      container.appendChild(widget);

      const loaded = await loadBazaarvoice({
        bazaarvoiceUrl: ratingsConfig.bazaarvoice.bazaarvoiceUrl,
        clientName: ratingsConfig.bazaarvoice.clientName,
        siteID: ratingsConfig.bazaarvoice.siteID,
        bazaarvoiceEnvironment: ratingsConfig.bazaarvoice.bazaarvoiceEnvironment,
        localeId: ratingsConfig.bazaarvoice.localeId,
        forceReload: isAuthorMode(),
      });

      if (!loaded) {
        console.warn('[ratings] Bazaarvoice script failed or blocked; keeping page intact');
      }

      setInternalRender(block, false);
      return;
    }

    setInternalRender(block, false);
    console.warn(`[ratings] Unsupported provider: ${ratingsConfig.provider}`);
  } catch (e) {
    console.error('[ratings] Fatal error:', e);
    setInternalRender(block, false);

    if (!block.innerHTML.trim()) {
      block.textContent = 'Ratings unavailable';
    }
  }
}
