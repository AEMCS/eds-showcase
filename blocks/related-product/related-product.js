import { loadCSS } from '../../scripts/aem.js';
import { enhanceListingWithRatings } from '../../commonutils/ratings.js';

const VARIATIONS = {
  list: {
    css: '/blocks/related-product/styles/list.css',
    render: () => import('./scripts/rp-list.js'),
  },
  carousel: {
    css: '/blocks/related-product/styles/carousel.css',
    render: () => import('./scripts/rp-carousel.js'),
  },
};

function getVariation(block) {
  if (block?.classList.contains('carousel')) return 'carousel';
  return 'list';
}

function normalizeProducts(result, block) {
  if (Array.isArray(result)) return result;

  if (Array.isArray(result?.products)) return result.products;

  if (Array.isArray(result?.items)) return result.items;

  if (Array.isArray(block?._products)) return block._products;

  if (Array.isArray(block?.dataset?.products)) {
    try {
      return JSON.parse(block.dataset.products);
    } catch (e) {
      console.warn('[related-product] unable to parse dataset products', e);
    }
  }

  return [];
}

async function injectRatings(block, products = []) {
  if (!block) {
    console.warn('[related-product] ratings skipped: block missing');
    return;
  }

  const cards = block.querySelectorAll('.related-product-item');

  if (!cards.length) {
    console.warn('[related-product] ratings skipped: no cards found');
    return;
  }

  try {
    await enhanceListingWithRatings({
      block,
      products,
      itemSelector: '.related-product-item',
      linkSelector: '.related-product-content, .related-product-details, .related-product-info, .card-item--details, .product-card-content',
      insertBeforeSelector: '.related-product-title, .title',
    });

    console.log('[related-product] ratings injected ✅');
  } catch (e) {
    console.warn('[related-product] ratings failed', e);
  }
}

function injectRatingsWithRetries(block, products) {
  // Related-product carousel/list can finish DOM updates after render promise.
  // These retries are safe because ratings.js prevents duplicate injection.
  requestAnimationFrame(() => injectRatings(block, products));

  window.setTimeout(() => injectRatings(block, products), 300);
  window.setTimeout(() => injectRatings(block, products), 1000);
}

export default async function decorate(block) {
  if (!block) return;

  const variation = getVariation(block);
  const config = VARIATIONS[variation] || VARIATIONS.list;

  try {
    const [{ default: render }] = await Promise.all([
      config.render(),
      loadCSS(config.css),
    ]);

    const result = await render(block);
    const products = normalizeProducts(result, block);

    block._products = products;

    console.log('[related-product] products:', products);

    injectRatingsWithRetries(block, products);

    const loadMoreBtn = document.querySelector('.related-product-load-more');

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        injectRatingsWithRetries(block, block._products || products);
      });
    }
  } catch (error) {
    console.warn('[related-product] failed to render block', error);
  }
}