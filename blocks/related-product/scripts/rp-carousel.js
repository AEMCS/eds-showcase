import { initCarousel } from '../../../commonutils/carousel.js';
import {
  createElement,
  createRelatedProductItem,
  getClassNumber,
  getRelatedProductConfig,
  getRelatedProducts,
} from './rp-common.js';

const DEFAULT_CAROUSEL_OPTIONS = {
  visibleItems: {
    mobile: 1,
    tablet: 2,
    desktop: 4,
  },
  navigation: true,
  indicators: 'count',
  itemSelector: '.related-product-item',
  loop: true,
  autoplay: false,
};

function getIndicators(block) {
  if (block.classList.contains('indicators-dots')) return 'dots';
  if (block.classList.contains('indicators-none')) return 'none';
  return DEFAULT_CAROUSEL_OPTIONS.indicators;
}

function getCarouselVisibleItems(block) {
  return {
    mobile: getClassNumber(
      block,
      'carousel-mobile-',
      DEFAULT_CAROUSEL_OPTIONS.visibleItems.mobile,
    ),
    tablet: getClassNumber(
      block,
      'carousel-tablet-',
      DEFAULT_CAROUSEL_OPTIONS.visibleItems.tablet,
    ),
    desktop: getClassNumber(
      block,
      'carousel-desktop-',
      DEFAULT_CAROUSEL_OPTIONS.visibleItems.desktop,
    ),
  };
}

function getCarouselOptions(block) {
  return {
    ...DEFAULT_CAROUSEL_OPTIONS,
    visibleItems: getCarouselVisibleItems(block),
    navigation: !block.classList.contains('carousel-no-navigation'),
    indicators: getIndicators(block),
    loop: block.classList.contains('carousel-loop'),
    autoplay: block.classList.contains('carousel-autoplay'),
  };
}

function clearAuthoringRows(block) {
  block.textContent = '';
}

function renderHeading(block, config) {
  if (!config.title && !config.subtitle) return;

  const heading = createElement('div', { class: 'related-product-heading' });

  if (config.title) {
    heading.append(createElement('h2', {}, config.title));
  }

  if (config.subtitle) {
    heading.append(createElement('p', {}, config.subtitle));
  }

  block.before(heading);
}

function renderProducts(block, products, config) {
  const fragment = document.createDocumentFragment();

  products.forEach((product) => {
    fragment.append(createRelatedProductItem(product, config));
  });

  block.append(fragment);
}

export default async function render(block) {
  try {
    const carouselOptions = getCarouselOptions(block);
    const config = getRelatedProductConfig(block);
    const products = await getRelatedProducts(config);

    clearAuthoringRows(block);
    renderHeading(block, config);
    renderProducts(block, products, config);

    if (block.children.length > 0) {
      initCarousel(block, carouselOptions);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('failed to render related product carousel', error);
  }
}
