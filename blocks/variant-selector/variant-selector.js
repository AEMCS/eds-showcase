import { getProduct } from '../../api/products.js';

const ATTRIBUTE_CONFIG = {
  descriptiveSize: ['descriptiveSize'],
  name: ['name', 'productName', 'title'],
  description: ['description', 'shortDescription', 'variantDescription'],
  retailerSize: ['retailerSize', 'retailerProductSize', 'retailerPackSize'],
  size: ['size', 'variantSize', 'packSize'],
};

let variantSelectorId = 0;

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

function getHits(response) {
  const hits = response?.hits?.hits;
  return Array.isArray(hits) ? hits : [];
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object') return [value];
  return [];
}

function getFirstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '') || '';
}

function getCaseInsensitiveValue(source, key) {
  if (!source || typeof source !== 'object') return undefined;

  const matchingKey = Object.keys(source).find(
    (sourceKey) => sourceKey.toLowerCase() === key.toLowerCase(),
  );

  return matchingKey ? source[matchingKey] : undefined;
}

function getValueFromSources(keys, ...sources) {
  return keys.reduce((value, key) => (
    value || sources.map((source) => getCaseInsensitiveValue(source, key)).find(Boolean)
  ), '');
}

function getHeaderImageUrl(image) {
  if (typeof image === 'string') return image;
  if (typeof image?.url === 'string') return image.url;
  if (typeof image?.url?.['@id'] === 'string') return image.url['@id'];
  if (typeof image?.['@id'] === 'string') return image['@id'];
  return '';
}

function getVariantGtin(variant, productData, retailerProductData, header) {
  return getFirstValue(
    variant?.gtin,
    variant?.GTIN,
    variant?.retailerGTIN,
    variant?.retailerGtin,
    productData?.gtin,
    retailerProductData?.gtin,
    header?.gtin,
  );
}

function normalizeVariant(variant = {}, source = {}, isCurrent = false) {
  const header = variant.header || source.header || {};
  const productData = variant.productData || source.productData || {};
  const retailerProductData = variant.retailerProductData || source.retailerProductData || {};
  const sources = [variant, productData, retailerProductData, header];
  const gtin = getVariantGtin(variant, productData, retailerProductData, header);
  const name = getFirstValue(
    getValueFromSources(ATTRIBUTE_CONFIG.name, ...sources),
    header.name,
  );
  const description = getFirstValue(
    getValueFromSources(ATTRIBUTE_CONFIG.description, ...sources),
    header.description,
  );
  const descriptiveSize = getValueFromSources(ATTRIBUTE_CONFIG.descriptiveSize, ...sources);
  const retailerSize = getValueFromSources(ATTRIBUTE_CONFIG.retailerSize, ...sources);
  const size = getFirstValue(
    descriptiveSize,
    retailerSize,
    getValueFromSources(ATTRIBUTE_CONFIG.size, ...sources),
  );
  const url = getFirstValue(variant.url, variant.path, header.url, source.path);

  return {
    gtin,
    name,
    description,
    descriptiveSize,
    retailerSize,
    size,
    url,
    image: getHeaderImageUrl(variant.image || header.image),
    current: isCurrent,
  };
}

function getRetailerVariantGroups(source) {
  const retailerProductData = source?.retailerProductData || {};

  return [
    ...toArray(retailerProductData.retailerVariantsSummary),
    ...toArray(retailerProductData.retailerVariants),
  ];
}

function dedupeVariants(variants) {
  const seen = new Set();

  return variants.filter((variant) => {
    const key = variant.gtin || `${variant.name}|${variant.size}|${variant.description}`;
    if (!key || seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function getUniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function shouldUseRetailerSize(variants) {
  const descriptiveSizes = variants.map((variant) => variant.descriptiveSize);
  const retailerSizes = variants.map((variant) => variant.retailerSize);
  const uniqueDescriptiveSizes = getUniqueValues(descriptiveSizes);
  const uniqueRetailerSizes = getUniqueValues(retailerSizes);

  return variants.length > 1
    && descriptiveSizes.every(Boolean)
    && uniqueDescriptiveSizes.length === 1
    && uniqueRetailerSizes.length > 0;
}

function resolveVariantSizes(variants) {
  if (!shouldUseRetailerSize(variants)) return variants;

  return variants.map((variant) => ({
    ...variant,
    size: variant.retailerSize || variant.size,
  }));
}

function getCurrentProductSource(productResponse) {
  const hit = getHits(productResponse)[0];
  // eslint-disable-next-line no-underscore-dangle
  return hit?._source || {};
}

function getVariants(productResponse) {
  const source = getCurrentProductSource(productResponse);
  const currentVariant = normalizeVariant(source, source, true);
  const currentGtin = currentVariant.gtin;
  const relatedVariants = getRetailerVariantGroups(source).map((variant) => (
    normalizeVariant(variant, source, variant?.gtin === currentGtin)
  ));

  const variants = dedupeVariants([currentVariant, ...relatedVariants]).map((variant) => ({
    ...variant,
    current: variant.current || Boolean(currentGtin && variant.gtin === currentGtin),
  }));

  return resolveVariantSizes(variants);
}

function getSelectedAttribute(block) {
  if (block.classList.contains('attribute-name')) return 'name';
  if (block.classList.contains('attribute-description')) return 'description';
  return 'size';
}

function getVariantLabel(variant, attribute) {
  return variant[attribute] || variant.size || variant.name || variant.description || variant.gtin;
}

// updated
// Reference for other blocks:
// document.addEventListener('variant-selector:change', (event) => {
//   const { variant, variants, attribute } = event.detail;
//   // Use selected variant data to update product media, info, price, etc.
// });
function dispatchVariantChange(block, variant, variants, attribute) {
  block.dispatchEvent(new CustomEvent('variant-selector:change', {
    bubbles: true,
    detail: {
      attribute,
      variant,
      variants,
    },
  }));
}

function renderDropdown(block, variants, attribute) {
  const selectId = `variant-selector-${variantSelectorId}`;
  const field = createElement('div', { class: 'variant-selector-field' });
  const label = createElement('label', { for: selectId }, 'Select variant');
  const select = createElement('select', { id: selectId, class: 'variant-selector-select' });

  variants.forEach((variant, index) => {
    const option = createElement('option', {
      value: variant.gtin || String(index),
      selected: variant.current ? 'selected' : undefined,
    }, getVariantLabel(variant, attribute));

    select.append(option);
  });

  select.addEventListener('change', () => {
    const selectedVariant = variants.find((variant, index) => (
      (variant.gtin || String(index)) === select.value
    ));

    if (selectedVariant) dispatchVariantChange(block, selectedVariant, variants, attribute);
  });

  field.append(label, select);
  block.append(field);
}

function renderButtons(block, variants, attribute) {
  const groupLabelId = `variant-selector-${variantSelectorId}-label`;
  const label = createElement('span', { id: groupLabelId, class: 'variant-selector-label' }, 'Select variant');
  const group = createElement('div', {
    class: 'variant-selector-buttons',
    role: 'radiogroup',
    'aria-labelledby': groupLabelId,
  });

  variants.forEach((variant) => {
    const button = createElement('button', {
      type: 'button',
      class: 'variant-selector-button',
      role: 'radio',
      'aria-checked': variant.current ? 'true' : 'false',
      'data-gtin': variant.gtin,
    }, getVariantLabel(variant, attribute));

    if (variant.current) button.classList.add('is-selected');

    button.addEventListener('click', () => {
      group.querySelectorAll('.variant-selector-button').forEach((item) => {
        item.classList.remove('is-selected');
        item.setAttribute('aria-checked', 'false');
      });

      button.classList.add('is-selected');
      button.setAttribute('aria-checked', 'true');
      dispatchVariantChange(block, variant, variants, attribute);
    });

    group.append(button);
  });

  block.append(label, group);
}

function renderEmptyState(block) {
  block.append(createElement('p', { class: 'variant-selector-empty' }, 'No variants available.'));
}

function renderVariantSelector(block, variants) {
  const attribute = getSelectedAttribute(block);

  block.textContent = '';
  variantSelectorId += 1;

  if (variants.length === 0) {
    renderEmptyState(block);
    return;
  }

  if (block.classList.contains('buttons-view')) {
    renderButtons(block, variants, attribute);
    return;
  }

  renderDropdown(block, variants, attribute);
}

export default async function decorate(block) {
  block.setAttribute('aria-busy', 'true');

  try {
    const productResponse = await getProduct();
    renderVariantSelector(block, getVariants(productResponse));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('failed to load product variants', error);
    block.textContent = '';
    renderEmptyState(block);
  } finally {
    block.removeAttribute('aria-busy');
  }
}
