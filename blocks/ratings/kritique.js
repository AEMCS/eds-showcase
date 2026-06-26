export function loadKritique({
  url,
  apiKey,
  locale,
  brandId,
  productId,
  forceReload = false,
}) {
  if (!url || !apiKey || !locale || !brandId || !productId) {
    console.error('[Kritique] Missing config', {
      url,
      apiKey,
      locale,
      brandId,
      productId,
    });
    return Promise.resolve(false);
  }

  if (forceReload) {
    const oldScript = document.getElementById('rr-widget-script');
    if (oldScript) {
      oldScript.remove();
    }
  }

  const existing = document.getElementById('rr-widget-script');
  if (existing) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.id = 'rr-widget-script';
    script.async = true;
    script.src = `${url}?brandid=${brandId}&apikey=${apiKey}&localeid=${locale}&productid=${productId}`;

    console.log('[Kritique] Loading:', script.src);

    script.onload = () => {
      console.log('[Kritique] Loaded');
      resolve(true);
    };

    script.onerror = () => {
      console.error('[Kritique] Failed');
      resolve(false);
    };

    document.body.appendChild(script);
  });
}

export function createKritiqueWidget(type, productId) {
  const widget = document.createElement('div');

  const title = document.querySelector('h1')?.textContent?.trim() || '';
  const image = document.querySelector('.product-info img, .product-detail img, picture img')?.src || '';

  if (type === 'summarywidget') {
    widget.className = 'rr-widget-container';
    widget.setAttribute('data-summary-template', 'detail');
    widget.setAttribute('data-entity-type', 'product');
    widget.setAttribute('data-entity-id', productId);
    widget.setAttribute('data-entity-name', title);
    widget.setAttribute('title', title);
    widget.setAttribute('data-entity-image-url', image);
    return widget;
  }

  if (type === 'readpanelwidget') {
    widget.className = 'rr-widget-container';
    widget.setAttribute('data-readpanel-template', 'readpanel');
    widget.setAttribute('data-entity-type', 'product');
    widget.setAttribute('data-entity-id', productId);
    widget.setAttribute('data-entity-name', title);
    widget.setAttribute('title', title);
    widget.setAttribute('data-entity-image-url', image);
    return widget;
  }

  if (type === 'onlystarswidget' || type === 'inlinewidget') {
    widget.className = 'rr-widget-container kr-star-percentage kr-has-rp kr-inline-widget kr-read-widget';
    widget.setAttribute('data-summary-template', 'listing');
    widget.setAttribute('data-entity-type', 'product');
    widget.setAttribute('data-entity-id', productId);
    widget.setAttribute('title', title);
    widget.setAttribute('data-added', 'true');

    widget.innerHTML = `
      <span class="kr-sr-only">No ratings submitted for this product</span>
      <div
        class="kr-aggregateRating kr-Stars"
        aria-hidden="true"
        title="No ratings submitted for this product"
        style="--rating: 0;"
      ></div>
    `;

    return widget;
  }

  console.warn('[Kritique] Unsupported widget type:', type);
  return null;
}