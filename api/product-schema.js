import { getProductData } from './product-data.js';

const NUTRIENT_TYPE_CODE_MAP = {
  'ENER-COMBINED': 'calories',
  'ENER-': 'calories',
  FAT: 'fatContent',
  FASAT: 'saturatedFatContent',
  TRANSFAT: 'transFatContent',
  FIBTG: 'fiberContent',
  CHOAVL: 'carbohydrateContent',
  CHOCAVL: 'carbohydrateContent',
  'SUGAR-': 'sugarContent',
  'PRO-': 'proteinContent',
  SALTEQ: 'sodiumContent',
  CHOL: 'cholesterolContent',
  VITC: 'vitaminCContent',
  CALC: 'calciumContent',
  IRON: 'ironContent',
};

/**
 * PDP detection using URL + meta + DOM
 */
function isPDPPage() {
  try {
    const pathname = window.location.pathname.toLowerCase();

    // URL check
    const urlCheck = pathname.includes('/p/');

    // Meta/template check
    const template =
      document.querySelector('meta[name="template"]')?.content?.toLowerCase();
    const pageType =
      document.querySelector('meta[name="pagetype"]')?.content?.toLowerCase();

    const templateCheck =
      template === 'product-detail' || pageType === 'pdp';

    // DOM/content check
    const domCheck =
      document.querySelector('[data-product-id]') ||
      document.querySelector('[data-product-sku]') ||
      document.querySelector('.product-detail');

    const result = urlCheck || templateCheck || Boolean(domCheck);

    console.log('PDP Detection:', {
      urlCheck,
      templateCheck,
      domCheck: Boolean(domCheck),
      result,
      pathname,
    });

    return true;
  } catch (error) {
    console.error('PDP detection failed:', error);
    return false;
  }
}

function getSource(data) {
  return (
    data?.hits?.hits?.[0]?._source ||
    data?.response?.hits?.hits?.[0]?._source ||
    null
  );
}

function normalizeUnit(unit) {
  if (!unit) return unit;

  switch (unit.toLowerCase()) {
    case 'grams':
    case 'gram':
    case 'gms':
      return 'g';
    case 'milligrams':
    case 'milligram':
    case 'mg':
      return 'mg';
    case 'kilograms':
    case 'kg':
      return 'kg';
    case 'kilocalorie':
    case 'kcal':
      return 'kcal';
    case 'kilojoule':
    case 'kj':
      return 'kJ';
    case 'milliliters':
    case 'ml':
      return 'ml';
    case 'liters':
    case 'l':
      return 'l';
    default:
      return unit;
  }
}

function mapNutrientToSchema(nutrientTypeCode) {
  if (!nutrientTypeCode) return null;

  const code = nutrientTypeCode.toUpperCase();

  return Object.entries(NUTRIENT_TYPE_CODE_MAP).find(
    ([key]) => code === key || code.startsWith(key),
  )?.[1] || null;
}

function updateSchemaType(schema) {
  if (!schema?.['@type']) return;

  const currentType = schema['@type'];

  if (Array.isArray(currentType)) {
    if (!currentType.some((t) => String(t).toLowerCase() === 'menuitem')) {
      currentType.push('MenuItem');
    }
  } else {
    schema['@type'] = [currentType, 'MenuItem'];
  }
}

function ensureAdditionalProperty(schema) {
  if (!Array.isArray(schema.additionalProperty)) {
    schema.additionalProperty = [];
  }
  return schema.additionalProperty;
}

function ensurePropertyValue(schema, name, value) {
  if (!value) return;

  const props = ensureAdditionalProperty(schema);

  const exists = props.some(
    (item) => item?.name?.toLowerCase() === name.toLowerCase(),
  );

  if (!exists) {
    props.push({
      '@type': 'PropertyValue',
      name,
      value,
    });
  }
}

function enrichIngredients(schema, source) {
  const productData = source?.productData || {};

  const value =
    productData.foodIngredientStatement ||
    productData.ingredientStatement ||
    productData.upstreamIngredientStatement;

  if (!value) return;

  ensurePropertyValue(
    schema,
    'Ingredients',
    value.startsWith('Ingredients:') ? value : `Ingredients: ${value}`,
  );
}

function enrichHowToUse(schema, source) {
  const productData = source?.productData || {};
  const retailerData = source?.retailerProductData || {};

  const value =
    retailerData.retailerHowToUseDescription ||
    productData.howToUseDescription ||
    productData.howToUseText;

  if (!value) return;

  ensurePropertyValue(schema, 'HowToUse', value);
}

function buildNutritionSchema(source) {
  const nutrients =
    source?.productData?.nutritionalInformation?.nutrientDetail || [];

  if (!nutrients.length) return null;

  const perServing = nutrients.filter(
    (item) =>
      String(item.servingInstance || '').toLowerCase() === 'per serving',
  );

  const items = perServing.length ? perServing : nutrients;

  const nutrition = {
    '@type': 'NutritionInformation',
    servingSize: 'Amount Per Portion',
  };

  items.forEach((item) => {
    if (
      String(item.nutrientTypeCode).toUpperCase() === 'ENER-COMBINED'
    ) return;

    const field = mapNutrientToSchema(item.nutrientTypeCode);
    if (!field) return;

    let value =
      item.upstreamQuantityContained || item.quantityContained;
    if (!value) return;

    if (
      item.measurementPrecisionCode === 'LESS_THAN' &&
      !String(value).startsWith('<')
    ) {
      value = `<${value}`;
    }

    if (
      item.measurementPrecisionCode === 'GREATER_THAN' &&
      !String(value).startsWith('>')
    ) {
      value = `>${value}`;
    }

    const unit = normalizeUnit(item.quantityContainedUOM);

    nutrition[field] = unit ? `${value} ${unit}` : `${value}`;
  });

  return Object.keys(nutrition).length > 2 ? nutrition : null;
}

function enrichProductSchema(baseSchema, source) {
  if (!baseSchema) return null;

  const schema = JSON.parse(JSON.stringify(baseSchema));

  updateSchemaType(schema);
  enrichIngredients(schema, source);
  enrichHowToUse(schema, source);

  const nutrition = buildNutritionSchema(source);
  if (nutrition) {
    schema.nutrition = nutrition;
  }

  return schema;
}

function injectSchema(schema) {
  if (!schema) return;

  document.querySelector('#product-schema')?.remove();

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'product-schema';

  script.textContent = JSON.stringify(schema, null, 2)
    .replace(/<\/script/gi, '<\\/script');

  document.head.appendChild(script);
}

export async function runProductSchema() {
  try {
    if (!isPDPPage()) {
      console.log('Not a PDP page → skipping schema');
      return;
    }

    const data = await getProductData();
    const source = getSource(data);

    if (!source?.header) {
      console.warn('No product header schema found');
      return;
    }

    const finalSchema = enrichProductSchema(
      source.header,
      source,
    );

    injectSchema(finalSchema);
    console.log('Schema injected for PDP');

  } catch (error) {
    console.error('Schema error:', error);
  }
}
