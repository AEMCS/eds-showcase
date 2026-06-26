let config;
let siteConfig; // cache for integration config

export async function loadBrandConfig() {
  if (config) return config;

  try {
    const resp = await fetch('/brandconfig.json', {
      cache: 'force-cache',
    });

    if (!resp.ok) {
      throw new Error(`Failed to load config: ${resp.status}`);
    }

    const json = await resp.json();
    const rows = json.data || [];

    const segments = window.location.pathname.split('/').filter(Boolean);

    const pathPrefix =
      segments.length >= 2
        ? `/${segments[0]}/${segments[1]}`
        : segments.length === 1
          ? `/${segments[0]}`
          : '';

    let matchedConfig = rows.find((item) => item.contentPath === pathPrefix);

    if (!matchedConfig) {
      console.warn('No matching config found. Using default.');

      matchedConfig = {
        brandName: 'knorr',
        contentPath: '/us/en',
        store: '',
      };
    }

    config = {
      brand: matchedConfig.brandName,
      contentPath: matchedConfig.contentPath,
      store: matchedConfig.store,
      country: matchedConfig.contentPath.split('/')[1] || 'us',
      language: matchedConfig.contentPath.split('/')[2] || 'en',
    };

    console.log('Resolved Brand Config:', config);

    // preload integration config
    await loadSiteConfig(config.country, config.language);

    return config;
  } catch (e) {
    console.error('Error loading brand config:', e);

    config = {
      brand: 'knorr',
      country: 'us',
      language: 'en',
      contentPath: '/us/en',
      store: '',
    };

    return config;
  }
}

export const {
  brand,
  country,
  language,
  store,
} = await loadBrandConfig();


function normalize(str) {
  return (str || '').trim().toLowerCase();
}


function toMap(rows = []) {
  return Object.fromEntries(
    rows.map((item) => [
      normalize(item.key),
      (item.value || '').trim(),
    ]),
  );
}

// LOAD INTEGRATION CONFIG
export async function loadSiteConfig(countryCode, languageCode) {
  if (siteConfig) return siteConfig;

  try {
    const resp = await fetch(`/${countryCode}/${languageCode}/config/integration.json`, {
      cache: 'force-cache',
    });

    if (!resp.ok) {
      throw new Error(`Failed to load config: ${resp.status}`);
    }

    const json = await resp.json();

    console.log('Raw integration config:', json);

    const reviewRows = json?.ReviewRating?.data || [];
    const reviewMap = toMap(reviewRows);

    const provider = normalize(reviewMap.provider || reviewMap['']);
    const enableRatings = normalize(reviewMap.enableratings) === 'enable';

    siteConfig = {
      enableRatings,
      ratingsProvider: provider,

      kritique: {
        provider: provider === 'kritique' ? 'kritique' : '',
        stageApiKey: reviewMap.stageapikey || reviewMap['stage api key'] || '',
        prodApiKey: reviewMap.prodapikey || reviewMap['production api key'] || '',
        apiKey: reviewMap.apikey || reviewMap['api key'] || '',
        brandId: reviewMap.brandid || reviewMap['brand id'] || '',
        url: reviewMap.url || 'https://widget.kritique.io/widget/RR_widget.js',
      },

      bazaarvoice: {
        clientName: reviewMap.clientname || '',
        siteID: reviewMap.siteid || '',
        bazaarvoiceEnvironment: reviewMap.deploymentzone || '',
        cloudKey: reviewMap.cloudkey || '',
        bazaarvoiceUrl: reviewMap.url || '',
        featureApi: reviewMap.featureapi || '',
        passKey: reviewMap.passkey || '',
        reviewLimit: reviewMap.reviewlimit || '',
      },


      // expose original sheets too (IMPORTANT for existing ratings.js)
      ReviewRating: json?.ReviewRating || null,
      Integration: json?.Integration || null,
      BuyNow: json?.BuyNow || null,

      raw: json,
    };

    window.__siteConfig = siteConfig;

    console.log('Normalized Site Config:', siteConfig);

    return siteConfig;
  } catch (e) {
    console.error('Error loading site config:', e);

    siteConfig = {
      enableRatings: false,
      ratingsProvider: '',
      kritique: {},
      bazaarvoice: {},
      ReviewRating: null,
      Integration: null,
      BuyNow: null,
      raw: null,
    };

    return siteConfig;
  }
}

export async function getSiteConfig() {
  if (siteConfig) return siteConfig;

  const { country: resolvedCountry, language: resolvedLanguage } = await loadBrandConfig();

  return loadSiteConfig(resolvedCountry, resolvedLanguage);
}