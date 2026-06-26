import { getProduct } from '../../api/products.js';

const ROOT_FIELD_MAP = {
  productdata: 'productData',
  retailerproductdata: 'retailerProductData',
};

const RETAILER_TO_PRODUCT_FALLBACK_MAP = {
  'retailerproductdata/retailer1votecommercetitle': 'productdata/productName',
  'retailerproductdata/retailerproductdescription': 'productdata/productDescription',
  'retailerproductdata/retaileringredientsdisclaimer': 'productdata/ingredientsDisclaimer',
  'retailerproductdata/retaileringredientstatement': 'productdata/ingredientStatement',
  'retailerproductdata/retaileraboutthisproductdescription': 'productdata/productFormDescription',
  'retailerproductdata/retailerhowtousedescription': 'productdata/preparationInstructions',
  'retailerproductdata/retailercategory': 'productdata/category',
  'retailerproductdata/retailersubcategory': 'productdata/subcategory',
  'retailerproductdata/retailerlongproductdescription': 'productdata/productFormDescription',
  'retailerproductdata/retailerallergy': 'productdata/allergenStatement',
  'retailerproductdata/retailersize': 'productdata/descriptiveSize',
};

function normalizeKey(key) {
  return key.trim().replace(/^\/+|\/+$/g, '').toLowerCase();
}

function isEmptyValue(value) {
  return value === undefined || value === null || value === '';
}

function getFallbackProductKey(retailerKey) {
  return RETAILER_TO_PRODUCT_FALLBACK_MAP[normalizeKey(retailerKey)];
}

function isProductInfoKey(value) {
  const [root, field] = normalizeKey(value).split('/');
  return Boolean(ROOT_FIELD_MAP[root] && field);
}

function getFirstProductSource(response) {
  const hits = response?.hits?.hits;
  return Array.isArray(hits) && hits.length ? hits[0]._source : {};
}

function getMappedValue(source, key) {
  const parts = normalizeKey(key).split('/').filter(Boolean);
  const [rootKey, ...path] = parts;
  const mappedRoot = ROOT_FIELD_MAP[rootKey];

  if (!mappedRoot || !path.length) return undefined;

  let result = source[mappedRoot];

  for (const p of path) {
    if (!result) return undefined;
    const match = Object.keys(result).find(
      (k) => k.toLowerCase() === p.toLowerCase(),
    );
    result = match ? result[match] : undefined;
  }

  return result;
}

function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function getTextNodes(element) {
  const nodes = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

function getElementType(item) {
  const allowed = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div'];
  const nodes = getTextNodes(item);

  for (const node of nodes) {
    const val = node.textContent.trim().toLowerCase();
    if (allowed.includes(val)) return val;
  }

  return 'p';
}

function getAttributeKeys(item) {
  return getTextNodes(item)
    .map((n) => n.textContent.trim())
    .filter(isProductInfoKey);
}

//structure the item
function prepareItemStructure(item) {
  const keys = getAttributeKeys(item);
  //if (!keys.length) return;

  const tag = getElementType(item);

  const el = document.createElement(tag);
  el.classList.add('product-info-item__item');

  el.dataset.keys = JSON.stringify(keys);
  el.textContent = 'Product Info Item';

  item.innerHTML = '';
  item.appendChild(el);
}
function isAuthorMode() {
  return Boolean(
    window.Granite?.author
    || window.location.search.includes('wcmmode=')
    || window.location.hostname.includes('author')
  );
}
// Data binding logic
function replaceRowText(item, source) {
  const el = item.querySelector('.product-info-item__item');
  if (!el) return;

  let keys = [];
  try {
    keys = JSON.parse(el.dataset.keys || '[]');
  } catch {
    keys = [];
  }

  if (!keys.length) return;

  let finalValue = '';
  let selectedKey;

  keys.forEach((key) => {
    if (finalValue) return;

    const normalized = normalizeKey(key);

    // Check retailer value exists
    if (normalized.startsWith('retailerproductdata')) {
      const retailerValue = getMappedValue(source, key);

      if ( retailerValue !== undefined && retailerValue !== null && retailerValue !== '') {
        finalValue = retailerValue;
        selectedKey = key;
        return;
      }

      // fallback to productdata if retailer value missing
      const fallbackKey = getFallbackProductKey(key);

      if (fallbackKey) {
        const productValue = getMappedValue(source, fallbackKey);

        if (productValue !== undefined && productValue !== null && productValue !== '') {
          finalValue = productValue;
          selectedKey = key;
        }
      }
    }
  });

  // if no retailer/productdata value found
  if (finalValue === undefined || finalValue === null || finalValue === '') {
  if (isAuthorMode()) {
    el.textContent = 'Product Info Item';
  } else {
    item.style.display = 'none';
  }
}

  el.textContent = formatValue(finalValue);

  // add attribute class
  if (selectedKey) {
    const field = selectedKey.split('/').pop();
    if (field) el.classList.add(field);
  }
}

function renderProductInfo(block, source) {
  [...block.children].forEach((item) => {
    replaceRowText(item, source);
  });
}

// main entry
export default async function decorate(block) {
  [...block.children].forEach((item) => {
    prepareItemStructure(item);
  });

  try {
    const product = await getProduct();
    renderProductInfo(block, getFirstProductSource(product));
  } catch (e) {
    console.warn('failed to load product info', e);
  }
}
