import {
  loadHeader,
  loadFooter,
  decorateButtons,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  getMetadata,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';
import { loadBlock, loadBrandSiteCss,loadBrandFonts } from './utils/override-theme.js';
import { isPDPPage, runProductSchema } from './api/product-schema.js';
import { getProduct } from './api/products.js';



/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

function autolinkModals(doc) {
  doc.addEventListener('click', async (e) => {
    const origin = e.target.closest('a');
    if (origin && origin.href && origin.href.includes('/modals/')) {
      e.preventDefault();
      const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
      openModal(origin.href);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

function a11yLinks(main) {
  const links = main.querySelectorAll('a');
  links.forEach((link) => {
    let label = link.textContent;
    if (!label && link.querySelector('span.icon')) {
      const icon = link.querySelector('span.icon');
      label = icon ? icon.classList[1]?.split('-')[1] : label;
    }
    link.setAttribute('aria-label', label);
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  // add aria-label to links
  a11yLinks(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  if (getMetadata('breadcrumbs').toLowerCase() === 'true') {
    doc.body.dataset.breadcrumbs = true;
  }
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

async function applyPDPMetadata() {
  try {
    if (!isPDPPage()) return;

    const response = await getProduct();
    const product = extractProduct(response);

    if (!product) return;
    const productName = extractProductName(product);

    // TITLE
    document.title =
      product?.meta_title ||
      productName ||
      'Product';

    // META DESCRIPTION
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      desc.setAttribute(
        'content',
        product?.meta_description || ''
      );
    }

    // OPEN GRAPH 
    const setMeta = (attr, key, value) => {
      if (!value) return;

      let tag = document.querySelector(`meta[${attr}="${key}"]`);

      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, key);
        document.head.appendChild(tag);
      }

      tag.setAttribute('content', value);
    };

    setMeta('property', 'og:title', product?.meta_title || productName);
    setMeta('property', 'og:description', product?.meta_description);

    setMeta('name', 'twitter:title', product?.meta_title || productName);
    setMeta('name', 'twitter:description', product?.meta_description);

  } catch (e) {
    console.error('PDP metadata error:', e);
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
 runProductSchema();
  autolinkModals(doc);

  const main = doc.querySelector('main');
  await loadSections(main);
  applyPDPMetadata();

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
  await loadBrandSiteCss();
  await loadBrandFonts();
  const blocks = [...main.querySelectorAll('[data-block-name]')];
  for (const block of blocks) {
    const blockName = block.dataset.blockName;
    if (blockName) {
      await loadBlock(blockName);
    }
  }

  await loadBlock('header');
  await loadBlock('footer');
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  window.setTimeout(() => import('./delayed.js'), 3000);
}
function showPageLoader() {
  if (document.getElementById('page-loader')) return;

  const loader = document.createElement('div');
  loader.id = 'page-loader';

  loader.innerHTML = `
    <div class="loader-spinner"></div>
  `;

  document.body.appendChild(loader);
}

function hidePageLoader() {
  const loader = document.getElementById('page-loader');
  if (loader) {
    loader.classList.add('fade-out');

    setTimeout(() => {
      loader.remove();
    }, 300);
  }
}
async function loadPage() {
  showPageLoader();

  try {
    await loadEager(document);

    await Promise.race([
      loadLazy(document),
      new Promise((resolve) => setTimeout(resolve, 4000)), // fallback
    ]);

  } catch (e) {
    console.warn('Page load error:', e);
  }

  hidePageLoader();
  loadDelayed();
}

loadPage();
