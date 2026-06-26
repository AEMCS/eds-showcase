import {
  createElement,
  createRelatedProductItem,
  getClassNumber,
  getRelatedProductConfig,
  getRelatedProducts,
} from './rp-common.js';

const DEFAULT_LIST_INITIAL_ITEMS = 4;
const DEFAULT_LIST_LOAD_MORE_ITEMS = 4;
const DEFAULT_LIST_VISIBLE_ITEMS = {
  mobile: 1,
  tablet: 2,
  desktop: 4,
};

function getListVisibleItems(block) {
  return {
    mobile: getClassNumber(block, 'carousel-mobile-', DEFAULT_LIST_VISIBLE_ITEMS.mobile),
    tablet: getClassNumber(block, 'carousel-tablet-', DEFAULT_LIST_VISIBLE_ITEMS.tablet),
    desktop: getClassNumber(block, 'carousel-desktop-', DEFAULT_LIST_VISIBLE_ITEMS.desktop),
  };
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

function applyListLayout(block) {
  const visibleItems = getListVisibleItems(block);

  block.style.setProperty('--related-product-mobile-items', visibleItems.mobile);
  block.style.setProperty('--related-product-tablet-items', visibleItems.tablet);
  block.style.setProperty('--related-product-desktop-items', visibleItems.desktop);
}

function updateVisibleProducts(block, visibleCount) {
  const products = [...block.querySelectorAll(':scope > .related-product-item')];

  products.forEach((product, index) => {
    product.hidden = index >= visibleCount;
  });

  return products.length;
}

function createLoadMoreButton() {
  return createElement('button', {
    class: 'related-product-load-more',
    type: 'button',
  }, 'Load More');
}

function initLoadMore(block) {
  const products = [...block.querySelectorAll(':scope > .related-product-item')];
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

export default async function render(block) {
  try {
    const config = getRelatedProductConfig(block);
    const products = await getRelatedProducts(config);

    clearAuthoringRows(block);
    renderHeading(block, config);
    renderProducts(block, products, config);
    applyListLayout(block);
    initLoadMore(block);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('failed to render related product list', error);
  }
}
