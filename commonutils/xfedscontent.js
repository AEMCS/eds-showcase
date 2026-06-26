import { brand, language, country } from '../scripts/utils/context.js';

let xfedsPromise = null;

function normalizeToString(value) {
  if (typeof value === 'string') return value.trim();
  if (value == null) return '';

  if (Array.isArray(value)) {
    return normalizeToString(value[0]);
  }

  if (typeof value === 'object') {
    return normalizeToString(value.value ?? value.text ?? value.title ?? '');
  }

  return String(value).trim();
}

function normalizeHeaderNode(node) {
  if (!node || typeof node !== 'object') return;

  const info = node.sectionInfo;
  if (!info || typeof info !== 'object') return;

  if (Object.prototype.hasOwnProperty.call(info, 'cq:panelTitle')) {
    info['cq:panelTitle'] = normalizeToString(info['cq:panelTitle']);
  }

  if (Array.isArray(info.sections)) {
    info.sections.forEach(normalizeHeaderNode);
  }
}

function normalizeXfedsData(data) {
  if (!data || typeof data !== 'object') return data;

  const clone =
    typeof structuredClone === 'function'
      ? structuredClone(data)
      : JSON.parse(JSON.stringify(data));

  if (Array.isArray(clone?.header?.sections)) {
    clone.header.sections.forEach(normalizeHeaderNode);
  }

  return clone;
}

function getBrandLocalePn() {
  const qs = new URLSearchParams(window.location.search);
  const locale = `${country}-${language}`;

  let pn = (qs.get('pn') || '').trim();

  if (!pn) {
    const key = `xfeds:pn:${brand}:${locale}`;
    pn = sessionStorage.getItem(key);

    if (!pn) {
      pn = String(Math.floor(100000 + Math.random() * 900000));
      sessionStorage.setItem(key, pn);
    }
  }

  return { brand, locale, pn };
}

function buildXfedsApiUrl() {
  const { brand, locale, pn } = getBrandLocalePn();

  return `https://aemcs-dev.unileversolutions.com/bin/xfedscontent?brand=${encodeURIComponent(
    brand,
  )}&locale=${encodeURIComponent(locale)}&pn=${encodeURIComponent(pn)}`;
}

async function fetchJson(url) {
  const resp = await fetch(url, {
    method: 'GET',
    credentials: 'omit',
    cache: 'no-store',
  });

  if (!resp.ok) {
    throw new Error(`xfedscontent failed: ${resp.status}`);
  }

  return resp.json();
}

async function fetchXfeds() {
  const { brand, locale, pn } = getBrandLocalePn();
  const url = buildXfedsApiUrl();

  let json;

  try {
    json = await fetchJson(url);
  } catch (error) {
    console.error('[xfeds] fetch failed:', error);
    throw error;
  }

  // normalize envelope
  json.brand = json.brand || brand;
  json.locale = json.locale || locale;
  json.pn = json.pn || pn;

  const normalized = normalizeXfedsData(json);

  window.__xfedsHeaderData = normalized;

  document.dispatchEvent(
    new CustomEvent('xfedscontent:loaded', { detail: normalized }),
  );

  return normalized;
}

/**
 * ✅ Cached getter (prevents duplicate calls)
 */
export default async function getXfedsContent() {
  if (window.__xfedsHeaderData) {
    return window.__xfedsHeaderData;
  }

  if (!xfedsPromise) {
    xfedsPromise = fetchXfeds().catch((err) => {
      xfedsPromise = null;
      throw err;
    });
  }

  return xfedsPromise;
}