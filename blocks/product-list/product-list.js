import { getProducts } from '../../api/products.js';
import { initCarousel } from '../../commonutils/carousel.js';
import {
  DEFAULT_PRODUCT_IMAGE,
  enhanceListingWithRatings,
} from '../../commonutils/ratings.js';

const DEFAULT_CAROUSEL_OPTIONS = {
  visibleItems: {
    mobile: 1,
    tablet: 2,
    desktop: 4,
  },
  navigation: true,
  indicators: 'count',
  itemSelector: '.product-item',
  loop: true,
  autoplay: false,
};

const DEFAULT_LIST_INITIAL_ITEMS = 4;
const DEFAULT_LIST_LOAD_MORE_ITEMS = 4;

function getClassValue(block, prefix, fallback) {
  const className = [...block.classList].find((name) => name.startsWith(prefix));
  return className ? className.substring(prefix.length) : fallback;
}

function getClassNumber(block, prefix, fallback) {
  const number = parseInt(getClassValue(block, prefix, fallback), 10);
  return Number.isNaN(number) ? fallback : number;
}

function getVisibleItems(block) {
  return {
    mobile: getClassNumber(block, 'carousel-mobile-', DEFAULT_CAROUSEL_OPTIONS.visibleItems.mobile),
    tablet: getClassNumber(block, 'carousel-tablet-', DEFAULT_CAROUSEL_OPTIONS.visibleItems.tablet),
    desktop: getClassNumber(block, 'carousel-desktop-', DEFAULT_CAROUSEL_OPTIONS.visibleItems.desktop),
  };
}

function getIndicators(block) {
  if (block.classList.contains('indicators-dots')) return 'dots';
  if (block.classList.contains('indicators-none')) return 'none';
  return DEFAULT_CAROUSEL_OPTIONS.indicators;
}

function getCarouselOptions(block) {
  return {
    ...DEFAULT_CAROUSEL_OPTIONS,
    visibleItems: getVisibleItems(block),
    navigation: !block.classList.contains('carousel-no-navigation'),
    indicators: getIndicators(block),
    loop: !block.classList.contains('carousel-no-loop'),
    autoplay: block.classList.contains('carousel-autoplay'),
  };
}

function getAuthoredHeading(block) {
  const heading = block.children[0]?.textContent?.trim();
  return heading || '';
}

function getListInitialItems(block) {
  return getClassNumber(block, 'list-initial-', DEFAULT_LIST_INITIAL_ITEMS);
}

function getListLoadMoreItems(block) {
  return getClassNumber(block, 'list-load-more-', DEFAULT_LIST_LOAD_MORE_ITEMS);
}

function clearAuthoringRows(block) {
  block.textContent = '';
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

function createProductItem(product) {
  const name = product.name || product.title || '';
  const item = createElement('div', { class: 'product-item' });

  const link = createElement('a', {
    href: getProductUrl(product),
    'aria-label': `View details for ${name}`,
  });

  const image = createElement('img', {
    src: product.image || product.thumbnail || product.imageUrl || DEFAULT_PRODUCT_IMAGE,
    alt: product.altText || product.alt || name,
  });

  const title = createElement('h2', {}, name);

  const description = createElement(
    'div',
    { class: 'product-description' },
    product.description || product.summary || '',
  );

  const cta = createElement('span', { class: 'product-link' }, 'View Details');

  link.append(image, title, description, cta);
  item.append(link);

  return item;
}

function renderProducts(block, products) {
  const fragment = document.createDocumentFragment();

  products.forEach((product) => {
    fragment.append(createProductItem(product));
  });

  block.append(fragment);
}

function renderHeading(block, heading) {
  if (!heading) return;

  const headingElement = createElement(
    'h2',
    { class: 'product-list-heading' },
    heading,
  );

  block.before(headingElement);
}

function applyListLayout(block) {
  const visibleItems = getVisibleItems(block);

  block.style.setProperty('--product-list-mobile-items', visibleItems.mobile);
  block.style.setProperty('--product-list-tablet-items', visibleItems.tablet);
  block.style.setProperty('--product-list-desktop-items', visibleItems.desktop);
}

function shouldInitializeCarousel(block) {
  return block.classList.contains('slider');
}

function updateVisibleProducts(block, visibleCount) {
  const products = [...block.querySelectorAll(':scope > .product-item')];

  products.forEach((product, index) => {
    product.hidden = index >= visibleCount;
  });

  return products.length;
}

function createLoadMoreButton() {
  return createElement(
    'button',
    {
      class: 'load-more-button',
      type: 'button',
    },
    'Load More',
  );
}

function initLoadMore(block) {
  const products = [...block.querySelectorAll(':scope > .product-item')];
  const initialItems = getListInitialItems(block);
  const loadMoreItems = getListLoadMoreItems(block);

  if (products.length <= initialItems) return;

  let visibleCount = initialItems;
  updateVisibleProducts(block, visibleCount);

  const button = createLoadMoreButton();
  block.after(button);

  button.addEventListener('click', () => {
    visibleCount += loadMoreItems;
    const productCount = updateVisibleProducts(block, visibleCount);

    if (visibleCount >= productCount) {
      button.remove();
    }
  });
}

export default async function decorate(block) {
  const carouselOptions = getCarouselOptions(block);
  const heading = getAuthoredHeading(block);

  clearAuthoringRows(block);
  renderHeading(block, heading);

  try {
    const products = await getProducts();

    console.log('[productlist] products:', products);

    renderProducts(block, products);
    applyListLayout(block);

    // Ratings after product cards render, before carousel wraps/changes DOM.
    await enhanceListingWithRatings({
      block,
      products,
      itemSelector: ':scope > .product-item',
      linkSelector: 'a',
      insertBeforeSelector: '.product-link',
    });

    if (block.children.length > 0 && shouldInitializeCarousel(block)) {
      block.classList.add('carousel');
      initCarousel(block, carouselOptions);
    } else {
      initLoadMore(block);
    }
  } catch (error) {
    console.warn('[productlist] failed to load product list', error);
  }
}