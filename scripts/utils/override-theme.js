import { brand, language, country, store } from './context.js';

// scripts.js
import { BLOCK_MANIFEST } from '../block-manifest.js';

function ensureStylesheet(href) {
  if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) return null;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.setAttribute('data-site-css', href);
  document.head.appendChild(link);
  return link;
}

function loadCSS(path) {
  if (document.querySelector(`link[href="${path}"]`)) return Promise.resolve();
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = path;
    link.onload = resolve;
    link.onerror = resolve;
    document.head.appendChild(link);
  });
}

function loadJS(path) {
  if (document.querySelector(`script[src="${path}"]`)) return Promise.resolve();
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = path;
    script.onload = resolve;
    script.onerror = resolve;
    document.head.appendChild(script);
  });
}

// detect if running locally
const isDev = window.location.hostname === 'localhost';

/**
 * ✅ Load global brand CSS immediately
 */
async function loadBrandSiteCss() {
  try {
    if (!brand) return;
    ensureStylesheet(cssPath);
  } catch (e) {
    console.warn('[override-loader] Failed to load site CSS', e);
  }
}

/**
 * ✅ Load brand font CSS if available.
 * ✅ If brand font CSS is missing, fallback to /styles/fonts.css.
 */
async function loadBrandFonts() {
  try {
    if (!brand || brand === 'default') {
      await loadCSS('/styles/fonts.css');
      return;
    }

    const brandFontPath = `/src/BrandFonts/${brand}/fonts.css`;

    const brandFontLoaded = await loadCSS(brandFontPath);
    if (!brandFontLoaded) {
      await loadCSS('/styles/fonts.css');
    }
  } catch (e) {
    console.warn('[override-loader] Failed to load fonts', e);
    await loadCSS('/styles/fonts.css');
  }
}

loadBrandFonts();

async function loadBlock(blockName, block) {
  const blockManifest = BLOCK_MANIFEST[blockName];
  if (!blockManifest) return;

  const marketKey = `${brand}/${country}/${language}`;
  const levels = ['platform', 'brand', 'market'];
  let blockModule = null;

  for (const level of levels) {
    let levelManifest;
    let jsPath = null;
    let cssPath = null;

    if (level === 'platform') {
      //levelManifest = blockManifest.platform;

      // in dev, AEM serves platform submodule files directly from disk
      // in prod, fstab.yaml maps /platform to the platform repo
      const platformBase = isDev ? '/blocks' : '/blocks';
      jsPath  = `${platformBase}/${blockName}/${blockName}.js`;
      cssPath = `${platformBase}/${blockName}/${blockName}.css`;
    } else if (level === 'brand') {
      levelManifest = blockManifest.brand?.[brand];
      jsPath  = `/src/${brand}/${blockName}/${blockName}.js`;
      cssPath = `/src/${brand}/${blockName}/${blockName}.css`;
    } else if (level === 'market') {
      levelManifest = blockManifest.market?.[marketKey];
      jsPath  = `/src/${brand}/${country}/${language}/${blockName}/${blockName}.js`;
      cssPath = `/src/${brand}/${country}/${language}/${blockName}/${blockName}.css`;
    }

    if (!levelManifest) continue;

    const [module] = await Promise.all([
      levelManifest.js
        ? import(jsPath).catch((err) => {
            console.warn(`Failed to load module for ${blockName} at ${level}:`, err);
            return null;
          })
        : Promise.resolve(null),

      levelManifest.css
        ? loadCSS(cssPath)
        : Promise.resolve(),
    ]);

    if (module) {
      blockModule = { ...blockModule, ...module };
    }
  }

  if (!blockModule) return;

  if (typeof blockModule.default === 'function') {
    await blockModule.default(block);
  }

  return blockModule;
}

export { loadBlock, loadBrandSiteCss,loadBrandFonts};
