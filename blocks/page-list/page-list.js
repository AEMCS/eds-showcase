const API_ENDPOINT = 'https://aemcs-dev.unileversolutions.com/bin/edsPageList';

function getConfig(block) {
  const cfg = {
    title: '',
    variation: 'fixed',
    fixedPaths: [],
    limit: 4,
    offset: 0,
  };

  const rows = [...block.querySelectorAll(':scope > div')];

  rows.forEach((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    if (cells.length < 2) return;

    const key = cells[0].textContent.trim().toLowerCase().replace(/\s+/g, '');
    const val = cells[1].textContent.trim();

    switch (key) {
      case 'title':
        cfg.title = val;
        break;
      case 'variation':
        cfg.variation = val || 'fixed';
        break;
      case 'fixedpaths':
      case 'contentpaths(commaseparated)':
        cfg.fixedPaths = val
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean);
        break;
      case 'numberofitems':
      case 'limit':
        cfg.limit = parseInt(val, 10) || 4;
        break;
      case 'offset':
        cfg.offset = parseInt(val, 10) || 0;
        break;
      default:
        break;
    }
  });

  return cfg;
}

function buildRequestBody(cfg) {
  return {
    mode: cfg.variation,
    fixedPaths: cfg.fixedPaths,
    limit: cfg.limit,
    offset: cfg.offset,
  };
}

async function fetchPages(cfg) {
  const body = buildRequestBody(cfg);

  const resp = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) throw new Error(`API error ${resp.status}`);

  const json = await resp.json();

  // ✅ Handles your exact response format: { total, offset, limit, items: [] }
  if (json.items && Array.isArray(json.items)) {
    return json.items;
  }

  // Fallback for plain array response
  if (Array.isArray(json)) {
    return json;
  }

  return [];
}

function renderCard(item) {
  const {
    path = '#',
    url = '',
    title = '',
    description = '',
    image = '',
  } = item;

  // Use the full url if available, otherwise fall back to path
  const href = url || path;

  const card = document.createElement('article');
  card.className = 'page-list-card';

  card.innerHTML = `
    ${image ? `
      <a href="${href}" class="page-list-card__image-wrap" tabindex="-1" aria-hidden="true">
        <img
          src="${image}"
          alt="${title}"
          loading="lazy"
          onerror="this.closest('.page-list-card__image-wrap').style.display='none'"
        />
      </a>` : ''}
    <div class="page-list-card__body">
      <h3 class="page-list-card__title">
        <a href="${href}">${title} <span aria-hidden="true">→</span></a>
      </h3>
      ${description
        ? `<p class="page-list-card__description">${description}</p>`
        : ''}
    </div>
  `;

  return card;
}

function renderSkeletons(count, grid) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('article');
    el.className = 'page-list-card page-list-card--skeleton';
    el.innerHTML = `
      <div class="page-list-card__skeleton-img"></div>
      <div class="page-list-card__body">
        <div class="page-list-card__skeleton-line" style="width:40%"></div>
        <div class="page-list-card__skeleton-line" style="width:80%"></div>
        <div class="page-list-card__skeleton-line" style="width:60%"></div>
      </div>`;
    grid.append(el);
  }
}

export default async function decorate(block) {
  const cfg = getConfig(block);

  // Clear raw authored table markup
  block.innerHTML = '';

  // Section heading
  if (cfg.title) {
    const heading = document.createElement('div');
    heading.className = 'page-list__heading';
    const parts = cfg.title.split(/\s*&\s*/);
    heading.innerHTML = parts.length === 2
      ? `<h2>${parts[0]} &amp; <em>${parts[1]}</em></h2>`
      : `<h2>${cfg.title}</h2>`;
    block.append(heading);
  }

  // Card grid
  const grid = document.createElement('div');
  grid.className = 'page-list__grid';
  block.append(grid);

  // Show skeletons while loading
  renderSkeletons(cfg.limit, grid);

  try {
    const items = await fetchPages(cfg);

    grid.innerHTML = '';

    if (!items.length) {
      grid.innerHTML = '<p class="page-list__empty">No pages found.</p>';
      return;
    }

    items.forEach((item) => grid.append(renderCard(item)));

  } catch (err) {
    grid.innerHTML = `
      <div class="page-list__error">
        <p>Could not load content: ${err.message}</p>
      </div>`;
  }
}