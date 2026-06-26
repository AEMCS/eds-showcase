function ensurePreconnect(url) {
  if (!url || document.getElementById('bv-preconnect')) return;

  const link = document.createElement('link');
  link.id = 'bv-preconnect';
  link.rel = 'preconnect';
  link.href = url;
  document.head.appendChild(link);
}

function getBvScriptUrl({
  bazaarvoiceUrl,
  clientName,
  siteID,
  bazaarvoiceEnvironment,
  localeId,
}) {
  return `${bazaarvoiceUrl}/deployments/${clientName}/${siteID}/${bazaarvoiceEnvironment}/${localeId}/bv.js`;
}

export function loadBazaarvoice({
  bazaarvoiceUrl,
  clientName,
  siteID,
  bazaarvoiceEnvironment,
  localeId,
  forceReload = false,
}) {
  if (!bazaarvoiceUrl || !clientName || !siteID || !bazaarvoiceEnvironment || !localeId) {
    console.warn('[BV] Missing config', {
      bazaarvoiceUrl,
      clientName,
      siteID,
      bazaarvoiceEnvironment,
      localeId,
    });
    return Promise.resolve(false);
  }

  if (forceReload) {
    const oldScript = document.getElementById('bv-widget');
    if (oldScript) {
      oldScript.remove();
    }
    window.__BV_SCRIPT_READY__ = false;
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

      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });

      setTimeout(() => resolve(Boolean(window.__BV_SCRIPT_READY__)), 10000);
    });
  }

  ensurePreconnect(bazaarvoiceUrl);

  return new Promise((resolve) => {
    try {
      const script = document.createElement('script');
      script.id = 'bv-widget';
      script.async = true;
      script.defer = true;

      script.src = getBvScriptUrl({
        bazaarvoiceUrl,
        clientName,
        siteID,
        bazaarvoiceEnvironment,
        localeId,
      });

      console.log('[BV] Loading script:', script.src);

      let settled = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      script.onload = () => {
        window.__BV_SCRIPT_READY__ = true;
        console.log('[BV] Script loaded');
        finish(true);
      };

      script.onerror = () => {
        window.__BV_SCRIPT_READY__ = false;
        console.warn('[BV] Script failed (CORS / whitelist / network)');
        finish(false);
      };

      setTimeout(() => {
        if (!window.__BV_SCRIPT_READY__) {
          console.warn('[BV] Script load timed out');
          finish(false);
        }
      }, 10000);

      document.head.appendChild(script);
    } catch (e) {
      console.warn('[BV] Script load crashed', e);
      resolve(false);
    }
  });
}

function createFeaturedReviewTemplates(widget) {
  widget.innerHTML = `
    <template class="cmp-star--template">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" focusable="false" aria-hidden="true" class="cmp-featured-review-star-svg">
        <polygon points=""></polygon>
        <path d="M24.8676481,9.0008973 C24.7082329,8.54565507 24.2825324,8.23189792 23.7931772,8.20897226 L16.1009423,8.20897226 L13.658963,0.793674161 C13.4850788,0.296529881 12.9965414,-0.0267985214 12.4623931,0.00174912135 L12.4623931,0.00174912135 C11.9394964,-0.00194214302 11.4747239,0.328465149 11.3146628,0.81767189 L8.87268352,8.23296999 L1.20486846,8.23296999 C0.689809989,8.22949161 0.230279943,8.55030885 0.0640800798,9.0294023 C-0.102119784,9.50849575 0.0623083246,10.0383495 0.472274662,10.3447701 L6.69932193,14.9763317 L4.25734261,22.4396253 C4.08483744,22.9295881 4.25922828,23.4727606 4.68662933,23.7767181 C5.11403038,24.0806756 5.69357086,24.0736812 6.11324689,23.7595003 L12.6333317,18.9599546 L19.1778362,23.7595003 C19.381674,23.9119158 19.6299003,23.9960316 19.8860103,23.9994776 C20.2758842,24.0048539 20.6439728,23.8232161 20.8724402,23.5127115 C21.1009077,23.202207 21.1610972,22.8017824 21.0337405,22.4396253 L18.5917612,14.9763317 L24.6967095,10.3207724 C25.0258477,9.95783882 25.0937839,9.43328063 24.8676481,9.0008973 Z"></path>
      </svg>
    </template>

    <template class="cmp-featured-review--template">
      <div class="cmp-featured-review">
        <div class="cmp-featured-review-content">
          <div class="cmp-featured-review-content-heading"></div>
          <div class="cmp-featured-review-content-description"></div>
          <div class="cmp-featured-review-star">
            <abbr title="" aria-hidden="true"></abbr>
          </div>
        </div>
        <div class="cmp-featured-review-author">
          <span class="cmp-featured-review-author-name"></span>
          <span class="cmp-featured-review-date"></span>
        </div>
      </div>
    </template>
  `;
}

export function createBazaarvoiceWidget(type, productId, options = {}) {
  const seoRequired = String(options.seoRequired).toLowerCase() === 'true';
  const seoHtml = options.seoHtml || '';
  const featureApi = options.featureApi || '';
  const passKey = options.passKey || '';
  const reviewLimit = options.reviewLimit || '';

  const supportedTypes = [
    'inlineRating',
    'ratingsAndReviews',
    'summaryContainer',
    'featuredReview',
  ];

  if (!supportedTypes.includes(type)) {
    console.warn('[BV] Unsupported widget type:', type);
    return null;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'bazaarvoice';
  wrapper.dataset.bvWidgetType = type;

  const content = document.createElement('div');
  content.className = 'component-content';

  let widget = document.createElement('div');

  if (type === 'inlineRating') {
    widget.setAttribute('data-bv-show', 'inline_rating');
    widget.setAttribute('data-bv-product-id', productId);
    widget.setAttribute('data-bv-seo', 'false');
  }

  if (type === 'ratingsAndReviews') {
    widget.setAttribute('data-bv-show', 'reviews');
    widget.setAttribute('data-bv-product-id', productId);
  }

  if (type === 'summaryContainer') {
    widget.setAttribute('data-bv-show', 'rating_summary');
    widget.setAttribute('data-bv-product-id', productId);
    widget.setAttribute('data-bv-seo', seoRequired ? 'true' : 'false');

    if (seoRequired && seoHtml) {
      const seoDiv = document.createElement('div');
      seoDiv.className = 'bv-seo-data';
      seoDiv.innerHTML = seoHtml;
      widget.appendChild(seoDiv);
    }
  }

  if (type === 'featuredReview') {
    widget.className = 'featuredReview';
    widget.setAttribute('data-bv-show', 'featuredReview');
    widget.setAttribute('data-bv-featureapi', featureApi);
    widget.setAttribute('data-bv-passkey', passKey);
    widget.setAttribute('data-bv-product-id', productId);

    if (reviewLimit) {
      widget.setAttribute('data-bv-featured-limit', reviewLimit);
    }

    createFeaturedReviewTemplates(widget);
  }

  content.appendChild(widget);
  wrapper.appendChild(content);

  console.log('[BV] Widget created:', {
    type,
    productId,
    bvShow: widget.getAttribute('data-bv-show'),
    seoRequired,
    featureApi,
    passKey,
    reviewLimit,
  });

  return wrapper;
}