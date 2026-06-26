import { getProduct } from '../../api/products.js';

function createEl(tag, className, textContent) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (textContent !== undefined && textContent !== null) {
    el.textContent = textContent;
  }
  return el;
}

function getImageUrl(image) {
  if (!image) return '';
  if (typeof image === 'string') return image;

  if (typeof image.contentURL === 'string') return image.contentURL;
  if (typeof image.previewURL === 'string') return image.previewURL;
  if (typeof image.url === 'string') return image.url;
  if (typeof image.src === 'string') return image.src;
  if (typeof image.image === 'string') return image.image;
  if (typeof image.imageUrl === 'string') return image.imageUrl;
  if (typeof image.thumbnail === 'string') return image.thumbnail;
  if (typeof image.url?.['@id'] === 'string') return image.url['@id'];
  if (typeof image['@id'] === 'string') return image['@id'];
  return '';
}

function getThumbnailUrl(image) {
  if (!image) return '';
  if (typeof image === 'string') return image;

  if (typeof image.previewURL === 'string') return image.previewURL;
  if (typeof image.thumbnail === 'string') return image.thumbnail;
  if (typeof image.thumb === 'string') return image.thumb;
  if (typeof image.preview === 'string') return image.preview;
  if (typeof image.small === 'string') return image.small;
  if (typeof image.contentURL === 'string') return image.contentURL;

  return getImageUrl(image);
}

function getImageAlt(image, fallback = 'Product image') {
  if (!image || typeof image === 'string') return fallback;
  return image.alt || image.altText || image.name || image.title || fallback;
}

function normalizeMediaAsset(asset, index, productName) {
  const fileType = String(asset?.fileType || '').toUpperCase();

  // ✅ STRICT RULE: ONLY MP4 IS VIDEO
  const isVideo = fileType === 'MP4';

  const src = getImageUrl(asset);
  const thumb = getThumbnailUrl(asset) || src;

  if (!src) return null;

  return {
    id: asset?.assetID || asset?.id || asset?.key || `${src}-${index}`,
    src,
    thumb,
    alt: getImageAlt(asset, `${productName} media ${index + 1}`),
    isVideo,
    videoSrc: isVideo ? src : '',
  };
}

function extractProduct(response) {
  if (!response) return null;
  if (Array.isArray(response)) return response[0] || null;
  if (Array.isArray(response.products)) return response.products[0] || null;
  if (Array.isArray(response.items)) return response.items[0] || null;
  if (response.product) return response.product;

  if (Array.isArray(response?.hits?.hits) && response.hits.hits.length) {
    return response.hits.hits[0]?._source || null;
  }

  if (response?._source) return response._source;

  return response;
}

function extractProductName(product) {
  return (
    product?.header?.name
    || product?.productData?.productName
    || product?.retailerProductData?.retailer1VOTEcommerceTitle
    || product?.retailerProductData?.retailerMetaTitle
    || product?.name
    || product?.title
    || 'Product'
  );
}

function findRawAssets(product) {
  if (!product) return [];

  const assets = product?.productData?.assets;
  if (Array.isArray(assets) && assets.length) return assets;

  const productImages = product?.productData?.productImages;
  if (Array.isArray(productImages) && productImages.length) return productImages;

  const headerImage = product?.header?.image?.url?.['@id'];
  if (headerImage) return [headerImage];

  return [
    product?.image,
    product?.thumbnail,
    product?.imageUrl,
  ].filter(Boolean);
}

function extractAssets(response) {
  const product = extractProduct(response);
  if (!product) return [];

  const productName = extractProductName(product);
  const rawAssets = findRawAssets(product);

  const normalized = rawAssets
    .map((asset, index) => normalizeMediaAsset(asset, index, productName))
    .filter(Boolean);

  const unique = [];
  const seen = new Set();

  normalized.forEach((asset) => {
    const key = asset.isVideo
      ? `${asset.videoSrc}|video`
      : `${asset.src}|image`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(asset);
    }
  });

  return unique;
}

function getCarouselMinItemsFromClassList(block) {
  if (!block || !block.classList) return 1;

  const classMatch = [...block.classList].find((cls) =>
    /^carousel-min-\d+$/.test(cls)
  );

  if (!classMatch) return 1;

  const value = Number(classMatch.replace('carousel-min-', ''));
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function readBlockConfig(block) {
  if (!block || !block.classList) {
    return {
      verticalView: false,
      showThumbnails: true,
      singleAssetOnly: false,
      carouselMinItems: 1,

      enableImageZoom: true,
      showZoomButton: true,

      videoProvider: 'html',
      videoAutoplay: false,
      videoLoop: false,
      videoMuted: false,
      videoControls: true,
      videoOverlay: false,
    };
  }

  return {
    verticalView: block.classList.contains('vertical-view'),
    showThumbnails: !block.classList.contains('hide-thumbnails'),
    singleAssetOnly: block.classList.contains('single-asset-only'),
    carouselMinItems: getCarouselMinItemsFromClassList(block),

    enableImageZoom: !block.classList.contains('disable-zoom'),
    showZoomButton: !block.classList.contains('hide-zoom-button'),

    videoProvider: block.classList.contains('video-youtube') ? 'youtube' : 'html',
    videoAutoplay: block.classList.contains('video-autoplay'),
    videoLoop: block.classList.contains('video-loop'),
    videoMuted: block.classList.contains('video-muted'),
    videoControls: !block.classList.contains('video-no-controls'),
    videoOverlay: block.classList.contains('video-overlay'),
  };
}

function renderLoading(block) {
  block.innerHTML = '';
  block.append(createEl('div', 'product-media-gallery__loading', 'Loading product media...'));
}

function renderEmpty(block, message = 'No product media available for this SKU.') {
  block.innerHTML = '';
  block.append(createEl('div', 'product-media-gallery__empty', message));
}

function createImageElement(asset) {
  const img = document.createElement('img');
  img.className = 'product-media-gallery__main-image';
  img.src = asset.src;
  img.alt = asset.alt;
  img.loading = 'eager';
  img.decoding = 'async';
  return img;
}

function createHtmlVideoElement(asset, config, className = 'product-media-gallery__main-video') {
  const video = document.createElement('video');
  video.className = className;
  video.src = asset.videoSrc || asset.src || '';
  video.playsInline = true;
  video.autoplay = !!config.videoAutoplay;
  video.loop = !!config.videoLoop;
  video.muted = !!config.videoMuted;
  video.controls = !!config.videoControls;

  if (config.videoAutoplay) video.setAttribute('autoplay', '');
  if (config.videoLoop) video.setAttribute('loop', '');
  if (config.videoMuted) video.setAttribute('muted', '');
  if (video.controls) video.setAttribute('controls', '');

  return video;
}

function buildMainMedia(asset, config) {
  if (asset.isVideo) {
    return createHtmlVideoElement(asset, config);
  }
  return createImageElement(asset);
}

function buildOverlayMedia(asset, config) {
  if (asset.isVideo) {
    return createHtmlVideoElement(asset, config, 'product-media-gallery__zoom-video');
  }

  const img = document.createElement('img');
  img.className = 'product-media-gallery__zoom-image';
  img.src = asset.src;
  img.alt = asset.alt;
  return img;
}

function updateGallery(state) {
  if (!state || !Array.isArray(state.assets) || !state.assets.length) return;

  const { assets, thumbs = [], activeIndex = 0, config = {} } = state;

  const active = assets[activeIndex];
  if (!active || !state.mainMedia) return;

  // Main stage
  if (active.isVideo && config.videoOverlay) {
    if (state.mainMedia.tagName !== 'IMG') {
      const replacement = createImageElement(active);
      replacement.src = active.thumb || active.src || '';
      state.mainMedia.replaceWith(replacement);
      state.mainMedia = replacement;
    } else {
      state.mainMedia.src = active.thumb || active.src || '';
      state.mainMedia.alt = active.alt || '';
    }
  } else {
    const nextMain = buildMainMedia(active, config);

    if (
      state.mainMedia.tagName !== nextMain.tagName ||
      state.mainMedia.className !== nextMain.className
    ) {
      state.mainMedia.replaceWith(nextMain);
      state.mainMedia = nextMain;
    } else if (state.mainMedia.tagName === 'IMG') {
      state.mainMedia.src = active.src || '';
      state.mainMedia.alt = active.alt || '';
    } else if (state.mainMedia.tagName === 'VIDEO') {
      state.mainMedia.src = active.videoSrc || active.src || '';
      state.mainMedia.autoplay = !!config.videoAutoplay;
      state.mainMedia.loop = !!config.videoLoop;
      state.mainMedia.muted = !!config.videoMuted;
      state.mainMedia.controls = !!config.videoControls;

      if (config.videoAutoplay && state.mainMedia.play) {
        state.mainMedia.play().catch(() => {});
      }
    }
  }

  // ✅ SAFE LOOP
  (thumbs || []).forEach((thumb, index) => {
    if (!thumb) return;

    const isActive = index === activeIndex;
    thumb.classList.toggle('is-active', isActive);
    thumb.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    thumb.setAttribute('aria-current', isActive ? 'true' : 'false');
  });

  const activeThumb = thumbs?.[activeIndex];
  if (activeThumb?.scrollIntoView) {
    activeThumb.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth',
    });
  }
}


function moveToNextAsset(state) {
  state.activeIndex = (state.activeIndex + 1) % state.assets.length;
  updateGallery(state);
}

function moveToPrevAsset(state) {
  state.activeIndex = (state.activeIndex - 1 + state.assets.length) % state.assets.length;
  updateGallery(state);
}

function buildThumbButton(asset, index) {
  const btn = createEl('button', 'product-media-gallery__thumb');
  btn.type = 'button';
  btn.setAttribute('aria-label', `Show asset ${index + 1}`);
  btn.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
  btn.setAttribute('aria-current', index === 0 ? 'true' : 'false');

  if (asset.isVideo) {
    btn.classList.add('has-video');
  }

  const img = document.createElement('img');
  img.src = asset.thumb || asset.src;
  img.alt = asset.alt;
  img.loading = 'lazy';
  img.decoding = 'async';

  btn.append(img);

  if (asset.isVideo) {
    const videoIcon = createEl('span', 'product-media-gallery__video-icon', '▶');
    btn.append(videoIcon);
  }

  return btn;
}

function createZoomButton() {
  const btn = createEl('button', 'product-media-gallery__zoom-button');
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Open media viewer');

  btn.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="6.5"></circle>
      <line x1="15" y1="15" x2="21" y2="21"></line>
      <line x1="10" y1="7" x2="10" y2="13"></line>
      <line x1="7" y1="10" x2="13" y2="10"></line>
    </svg>
  `;

  return btn;
}

function createMainGalleryNav(isVertical) {
  const prevSymbol = isVertical ? '˄' : '‹';
  const nextSymbol = isVertical ? '˅' : '›';

  const prevBtn = createEl(
    'button',
    'product-media-gallery__nav product-media-gallery__nav--prev',
    prevSymbol
  );
  prevBtn.type = 'button';
  prevBtn.setAttribute('aria-label', 'Previous asset');

  const nextBtn = createEl(
    'button',
    'product-media-gallery__nav product-media-gallery__nav--next',
    nextSymbol
  );
  nextBtn.type = 'button';
  nextBtn.setAttribute('aria-label', 'Next asset');

  return { prevBtn, nextBtn };
}

function createThumbnailNav(isVertical) {
 const prevSymbol = isVertical ? '˄' : '‹';
 const nextSymbol = isVertical ? '˅' : '›';

  const prevBtn = createEl(
    'button',
    'product-media-gallery__thumb-nav product-media-gallery__thumb-nav--prev',
    prevSymbol
  );
  prevBtn.type = 'button';
  prevBtn.setAttribute('aria-label', 'Previous thumbnail');

  const nextBtn = createEl(
    'button',
    'product-media-gallery__thumb-nav product-media-gallery__thumb-nav--next',
    nextSymbol
  );
  nextBtn.type = 'button';
  nextBtn.setAttribute('aria-label', 'Next thumbnail');

  return { prevBtn, nextBtn };
}

function createOverlay(trackAssets, state, config) {
  if (!trackAssets || !trackAssets.length) return null;
  const overlay = createEl('div', 'product-media-gallery__zoom-overlay');
  overlay.setAttribute('aria-hidden', 'true');

  const backdrop = createEl('div', 'product-media-gallery__zoom-backdrop');
  const content = createEl('div', 'product-media-gallery__zoom-content');

  const closeBtn = createEl('button', 'product-media-gallery__zoom-close', 'Close');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close viewer');

  content.append(closeBtn);

  let prevBtn;
  let nextBtn;

  if (trackAssets.length > 1) {
    prevBtn = createEl(
      'button',
      'product-media-gallery__zoom-nav product-media-gallery__zoom-nav--prev',
      '‹'
    );
    prevBtn.type = 'button';
    prevBtn.setAttribute('aria-label', 'Previous asset');

    nextBtn = createEl(
      'button',
      'product-media-gallery__zoom-nav product-media-gallery__zoom-nav--next',
      '›'
    );
    nextBtn.type = 'button';
    nextBtn.setAttribute('aria-label', 'Next asset');

    content.append(prevBtn);
  }

  const overlayMedia = buildOverlayMedia(trackAssets[state.activeIndex], config);
  content.append(overlayMedia);

  if (nextBtn) content.append(nextBtn);

  overlay.append(backdrop, content);

  const openOverlay = () => {
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('product-media-gallery-zoom-open');
    updateGallery(state);
  };

  const closeOverlay = () => {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('product-media-gallery-zoom-open');

    if (state.overlayMedia?.tagName === 'VIDEO') {
      state.overlayMedia.pause();
    }
  };

  closeBtn.addEventListener('click', closeOverlay);
  backdrop.addEventListener('click', closeOverlay);

  if (prevBtn) {
    prevBtn.addEventListener('click', () => moveToPrevAsset(state));
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => moveToNextAsset(state));
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeOverlay();
    }
  });

  state.zoomOverlay = overlay;
  state.overlayMedia = overlayMedia;
  state.openZoomOverlay = openOverlay;
  state.closeZoomOverlay = closeOverlay;

  return overlay;
}

function bindMainMediaOpen(state) {
    if (!state || !state.mainMedia) return;
  const mainMedia = state.mainMedia;
  if (!mainMedia) return;

  // overwrite safely to avoid repeated stacked listeners
  mainMedia.onclick = () => {
    const active = state.assets[state.activeIndex];
    if (active?.isVideo && !state.config.videoOverlay) return;
    state.openZoomOverlay();
  };

  mainMedia.onkeydown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const active = state.assets[state.activeIndex];
      if (active?.isVideo && !state.config.videoOverlay) return;
      state.openZoomOverlay();
    }
  };

  mainMedia.setAttribute('role', 'button');
  mainMedia.setAttribute('tabindex', '0');
  mainMedia.setAttribute('aria-label', 'Open media viewer');
}

function buildGallery(block, allAssets, config, productName) {
    if (!block || !block.append) return;
  block.innerHTML = '';

  const assets = config.singleAssetOnly ? allAssets.slice(0, 1) : allAssets;

  const isVertical = !!config.verticalView;
  const hasMultiple = assets.length > 1;

  const shouldShowThumbnails = hasMultiple && !!config.showThumbnails && !config.singleAssetOnly;
  const showThumbnailNavigation = shouldShowThumbnails
    && assets.length > config.carouselMinItems;

  const showMainNavigation = hasMultiple
    && !shouldShowThumbnails
    && !config.singleAssetOnly
    && assets.length > config.carouselMinItems;

  const canZoom = !!config.enableImageZoom;
  const shouldShowZoomButton = canZoom && !!config.showZoomButton;

  block.classList.add('product-media-gallery');
  block.classList.toggle('vertical-view', isVertical);
  block.classList.toggle('horizontal-view', !isVertical);
  block.classList.toggle('has-multiple-images', hasMultiple);
  block.classList.toggle('hide-thumbnails', !shouldShowThumbnails);
  block.classList.toggle('show-thumbnails', shouldShowThumbnails);
  block.classList.toggle('is-zoom-enabled', canZoom);
  block.classList.toggle('show-zoom-button', shouldShowZoomButton);
  block.classList.toggle('single-asset-only', !!config.singleAssetOnly);

  const wrapper = createEl(
    'div',
    `product-media-gallery__wrapper ${isVertical ? 'is-vertical' : 'is-horizontal'}`
  );

  const media = createEl('div', 'product-media-gallery__media');
  const mainStage = createEl('div', 'product-media-gallery__main-stage');

 if (!assets?.length) return;

const initialMain = buildMainMedia(assets[0], config);
  mainStage.append(initialMain);

  let zoomButton;
  let prevMainBtn;
  let nextMainBtn;

  if (showMainNavigation && prevMainBtn && nextMainBtn) {
    const nav = createMainGalleryNav(isVertical);
    prevMainBtn = nav.prevBtn;
    nextMainBtn = nav.nextBtn;
    mainStage.append(prevMainBtn, nextMainBtn);
  }

  if (shouldShowZoomButton) {
    zoomButton = createZoomButton();
    mainStage.append(zoomButton);
  }

  media.append(mainStage);

  let thumbsShell;
  let thumbsViewport;
  let prevThumbBtn;
  let nextThumbBtn;
  let thumbs = [];

  if (shouldShowThumbnails) {
    thumbsShell = createEl('div', 'product-media-gallery__thumbs-shell');
    thumbsViewport = createEl('div', 'product-media-gallery__thumbs');
    thumbsViewport.setAttribute('role', 'tablist');
    thumbsViewport.setAttribute('aria-label', `${productName} media thumbnails`);

    thumbs = assets.map((asset, index) => {
      const thumb = buildThumbButton(asset, index);
      thumbsViewport.append(thumb);
      return thumb;
    });

    if (showThumbnailNavigation && prevThumbBtn && nextThumbBtn) {
      const nav = createThumbnailNav(isVertical);
      prevThumbBtn = nav.prevBtn;
      nextThumbBtn = nav.nextBtn;
      thumbsShell.append(prevThumbBtn, thumbsViewport, nextThumbBtn);
    } else {
      thumbsShell.append(thumbsViewport);
    }
  }

  if (shouldShowThumbnails) {
    if (isVertical) {
      wrapper.append(thumbsShell, media);
    } else {
      wrapper.append(media, thumbsShell);
    }
  } else {
    wrapper.append(media);
  }

  block.append(wrapper);

  const state = {
    assets,
    thumbs,
    mainMedia: initialMain,
    activeIndex: 0,
    zoomOverlay: null,
    overlayMedia: null,
    openZoomOverlay: null,
    closeZoomOverlay: null,
    config,
  };

  if (canZoom) {
    const overlay = createOverlay(assets, state, config);
    block.append(overlay);

    if (zoomButton) {
      zoomButton.addEventListener('click', () => {
        state.openZoomOverlay();
      });
    } else if (!assets[0].isVideo || config.videoOverlay) {
      bindMainMediaOpen(state);
    }
  }


(thumbs || []).forEach((thumb, index) => {
  if (!thumb) return;
    thumb.addEventListener('click', () => {
      state.activeIndex = index;

      const active = state.assets[state.activeIndex];
      if (active?.isVideo && config.videoOverlay) {
        updateGallery(state);
        state.openZoomOverlay();
        return;
      }

      updateGallery(state);

      if (canZoom && !zoomButton && (!active?.isVideo || config.videoOverlay)) {
        bindMainMediaOpen(state);
      }
    });
  });

  if (showThumbnailNavigation && prevThumbBtn && nextThumbBtn) {
    prevThumbBtn.addEventListener('click', () => {
      moveToPrevAsset(state);

      const active = state.assets[state.activeIndex];
      if (canZoom && !zoomButton && (!active?.isVideo || config.videoOverlay)) {
        bindMainMediaOpen(state);
      }
    });

    nextThumbBtn.addEventListener('click', () => {
      moveToNextAsset(state);

      const active = state.assets[state.activeIndex];
      if (canZoom && !zoomButton && (!active?.isVideo || config.videoOverlay)) {
        bindMainMediaOpen(state);
      }
    });
  }

  if (showMainNavigation) {
    prevMainBtn.addEventListener('click', () => {
      moveToPrevAsset(state);

      const active = state.assets[state.activeIndex];
      if (canZoom && !zoomButton && (!active?.isVideo || config.videoOverlay)) {
        bindMainMediaOpen(state);
      }
    });

    nextMainBtn.addEventListener('click', () => {
      moveToNextAsset(state);

      const active = state.assets[state.activeIndex];
      if (canZoom && !zoomButton && (!active?.isVideo || config.videoOverlay)) {
        bindMainMediaOpen(state);
      }
    });
  }

  updateGallery(state);

  if (canZoom && !zoomButton) {
    const active = state.assets[state.activeIndex];
    if (!active?.isVideo || config.videoOverlay) {
      bindMainMediaOpen(state);
    }
  }
}
function normalizeGtin(value) {
  return String(value || '').trim();
}

function getProductGtin(product) {
  return normalizeGtin(
    product?.gtin
    || product?.sku
    || product?.id
    || product?.productId
    || product?.productData?.gtin
    || product?.productData?.sku
    || product?.productData?.id
    || product?.productData?.productId
    || product?.header?.gtin
    || product?.header?.sku
    || product?.header?.gtin13
    || ''
  );
}

function isProductMatchingGtin(product, gtin) {
  const selectedGtin = normalizeGtin(gtin);
  if (!selectedGtin || !product) return false;

  return getProductGtin(product) === selectedGtin;
}

function findProductByGtinInObject(source, gtin, seen = new WeakSet(), depth = 0) {
  if (!source || !gtin || depth > 8) return null;
  if (typeof source !== 'object') return null;

  if (seen.has(source)) return null;
  seen.add(source);

  if (isProductMatchingGtin(source, gtin)) {
    return source;
  }

  if (Array.isArray(source)) {
    for (const item of source) {
      const found = findProductByGtinInObject(item, gtin, seen, depth + 1);
      if (found) return found;
    }

    return null;
  }

  const likelyVariantCollections = [
    source.variants,
    source.productVariants,
    source.variantProducts,
    source.relatedProducts,
    source.items,
    source.products,
    source.productData?.variants,
    source.productData?.productVariants,
    source.productData?.variantProducts,
    source.productData?.items,
    source.productData?.products,
  ];

  for (const collection of likelyVariantCollections) {
    if (Array.isArray(collection)) {
      const found = findProductByGtinInObject(collection, gtin, seen, depth + 1);
      if (found) return found;
    }
  }

  const values = Object.values(source);

  for (const value of values) {
    if (value && typeof value === 'object') {
      const found = findProductByGtinInObject(value, gtin, seen, depth + 1);
      if (found) return found;
    }
  }

  return null;
}

function getVariantButtonAssets(button, productName) {
  if (!button) return [];

  const assetsJson = button.dataset.assets || button.dataset.media;

  if (assetsJson) {
    try {
      const parsedAssets = JSON.parse(assetsJson);

      if (Array.isArray(parsedAssets)) {
        return parsedAssets
          .map((asset, index) => normalizeMediaAsset(asset, index, productName))
          .filter(Boolean);
      }
    } catch (error) {
      console.warn('[product-media-gallery] Invalid variant data-assets JSON', error);
    }
  }

  const image = button.dataset.image
    || button.dataset.imageUrl
    || button.dataset.src
    || '';

  const thumbnail = button.dataset.thumbnail
    || button.dataset.thumb
    || image;

  if (!image) return [];

  return [
    {
      contentURL: image,
      previewURL: thumbnail,
      alt: button.textContent?.trim() || productName,
    },
  ]
    .map((asset, index) => normalizeMediaAsset(asset, index, productName))
    .filter(Boolean);
}

function getVariantAssetsFromInitialSkuResponse(initialResponse, gtin) {
  const variantProduct = findProductByGtinInObject(initialResponse, gtin);

  if (!variantProduct) {
    return {
      product: null,
      assets: [],
    };
  }

  return {
    product: variantProduct,
    assets: extractAssets(variantProduct),
  };
}

function updateVariantButtonState(selectedButton) {
  if (!selectedButton) return;

  const selector = selectedButton.closest('.variant-selector');

  const buttons = selector
    ? [...selector.querySelectorAll('.variant-selector-button[data-gtin]')]
    : [...document.querySelectorAll('.variant-selector-button[data-gtin]')];

  buttons.forEach((button) => {
    const isSelected = button === selectedButton;

    button.classList.toggle('is-selected', isSelected);
    button.setAttribute('aria-checked', isSelected ? 'true' : 'false');
  });
}

function renderGalleryFromVariantButton(block, config, button, initialSkuResponse) {
  if (!block || !button || !button.dataset) return;

  const gtin = normalizeGtin(button.dataset.gtin);
  if (!gtin) return;

  if (block.dataset?.activeGtin === gtin) return;

  block.dataset.activeGtin = gtin;
  block.classList?.add('is-variant-loading');

  try {
    let productName = button.textContent?.trim() || 'Product';

    // 1. from button
    let assets = getVariantButtonAssets(button, productName);

    // 2. from initial SKU response
    if (!assets?.length) {
      const variantResult = getVariantAssetsFromInitialSkuResponse(initialSkuResponse, gtin);

      if (variantResult?.product) {
        productName = extractProductName(variantResult.product);
      }

      assets = Array.isArray(variantResult?.assets) ? variantResult.assets : [];
    }

    // keep current if nothing found
    if (!assets?.length) {
      console.warn('[media-gallery] No variant media → keep existing');
      return;
    }

    buildGallery(block, assets, config, productName);
  } catch (error) {
    console.warn('[media-gallery] variant render failed', error);
  } finally {
    block.classList?.remove('is-variant-loading');
  }
}


function bindVariantSelector(block, config, initialSkuResponse) {
  if (!block || typeof document === 'undefined') return;

  // remove old listener
  if (block.__variantSelectorHandler) {
    document.removeEventListener('click', block.__variantSelectorHandler);
  }

  const handler = (event) => {
    if (!event || !(event.target instanceof Element)) return;

    const button = event.target.closest('.variant-selector-button[data-gtin]');
    if (!button || !button.dataset) return;

    const gtin = normalizeGtin(button.dataset.gtin);
    if (!gtin) return;

    updateVariantButtonState(button);

    renderGalleryFromVariantButton(block, config, button, initialSkuResponse);
  };

  block.__variantSelectorHandler = handler;
  document.addEventListener('click', handler);
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  renderLoading(block);

  try {
    const response = await getProduct();
    const product = extractProduct(response);
    const productName = extractProductName(product);
    const assets = extractAssets(response);

    if (!assets.length) {
      renderEmpty(block, 'No product media available for this SKU.');
      return;
    }

    /**
     * Default gallery = SKU media.
     */
    buildGallery(block, assets, config, productName);

    const skuGtin = getProductGtin(product);

    if (skuGtin) {
      block.dataset.activeGtin = skuGtin;
    }

    /**
     * Variant click:
     * No API call.
     * Uses variant selector data or already-loaded SKU response only.
     */
    bindVariantSelector(block, config, response);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('product-media-gallery error:', e);
    renderEmpty(block, 'Unable to load product media.');
  }
}
