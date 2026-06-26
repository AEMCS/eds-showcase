import getXfedsContent from '../../commonutils/xfedscontent.js';

const ASSET_BASE = 'https://assets.unileversolutions.com/v1/';

function decodeHtmlEntities(str = '') {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

function htmlToFragment(htmlString = '') {
  const tpl = document.createElement('template');
  tpl.innerHTML = (htmlString || '').trim();
  return tpl.content;
}

/* ================= finders ================= */

function findContainerById(sections = [], id) {
  return (sections || []).find((s) => s?.type === 'container' && s?.sectionInfo?.id === id);
}

function findMainHeaderContainer(sections = []) {
  const containers = (sections || []).filter(
    (s) => s?.type === 'container' && Array.isArray(s?.sectionInfo?.sections),
  );

  return containers.find((c) => (c.sectionInfo.sections || []).some((x) => x?.type === 'globalnavigation'))
    || containers.find((c) => (c.sectionInfo.sections || []).some((x) => x?.type === 'tabimage'))
    || containers[0];
}

function findChildByType(arr = [], type) {
  return (arr || []).find((x) => x?.type === type);
}

function findFirst(arr = [], predicate) {
  return (arr || []).find(predicate);
}

function collectAllByTypeDeep(nodes = [], type, out = []) {
  (nodes || []).forEach((n) => {
    if (!n) return;
    if (n.type === type) out.push(n);
    const child = n.sectionInfo?.sections;
    if (Array.isArray(child)) collectAllByTypeDeep(child, type, out);
  });
  return out;
}

/* ================= assets ================= */

function buildAssetCandidates(sectionInfo = {}) {
  const id = sectionInfo.tabId || sectionInfo.imageId;
  if (!id) return [];
  return [
    `${ASSET_BASE}${id}.png`,
    `${ASSET_BASE}${id}.jpg`,
    `${ASSET_BASE}${id}.jpeg`,
    `${ASSET_BASE}${id}.webp`,
  ];
}

function setImgWithFallback(img, urls = []) {
  let i = 0;
  const tryNext = () => {
    if (i >= urls.length) return;
    img.src = urls[i];
    i += 1;
  };
  img.onerror = tryNext;
  tryNext();
}

/* ================= render pieces ================= */

function createSkipLinks(containerSection) {
  const wrap = document.createElement('div');
  wrap.className = 'header-skiplinks';

  const inner = document.createElement('div');
  inner.className = 'header-skiplinks-inner';

  const label = document.createElement('p');
  label.className = 'header-skiplinks-label';
  label.textContent = 'Skip to :';
  inner.appendChild(label);

  const items = containerSection?.sectionInfo?.sections || [];

  items.forEach((it) => {
    if (it?.type === 'text') {
      const frag = htmlToFragment(decodeHtmlEntities(it?.sectionInfo?.anonymousText || ''));
      frag.querySelectorAll?.('a')?.forEach((a) => {
        a.classList.add('header-skiplink');
        a.setAttribute('tabindex', '0');
        inner.appendChild(a);
      });
    }

    if (it?.type === 'button') {
      const a = document.createElement('a');
      a.className = 'header-skiplink';
      a.href = it?.sectionInfo?.linkURL || '#';
      a.textContent = it?.sectionInfo?.['jcr:title'] || 'Skip';
      a.setAttribute('tabindex', '0');
      inner.appendChild(a);
    }
  });

  wrap.appendChild(inner);
  return wrap;
}

function createTopUtilityBar(topContainer) {
  const bar = document.createElement('div');
  bar.className = 'header-topbar';

  (topContainer?.sectionInfo?.sections || []).forEach((it) => {
    if (it?.type === 'text') {
      bar.appendChild(htmlToFragment(decodeHtmlEntities(it?.sectionInfo?.anonymousText || '')));
    }
  });

  return bar;
}

function createHamburgerButton(buttonSection) {
  const btn = document.createElement('button');
  btn.className = 'header-hamburger';
  btn.type = 'button';
  btn.setAttribute('aria-label', buttonSection?.sectionInfo?.accessibilityLabel || 'Menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span class="hamburger-lines" aria-hidden="true"></span>';
  return btn;
}

function createBrandLogo(tabImageSection) {
  const wrap = document.createElement('div');
  wrap.className = 'header-brand';

  const a = document.createElement('a');
  a.className = 'header-logo-link';
  a.href = tabImageSection?.sectionInfo?.linkURL || '/';
  a.setAttribute('aria-label', tabImageSection?.sectionInfo?.alt || 'Home');

  const img = document.createElement('img');
  img.className = 'header-logo';
  img.alt = tabImageSection?.sectionInfo?.alt || 'Logo';
  img.loading = 'eager';
  img.decoding = 'async';

  setImgWithFallback(img, buildAssetCandidates(tabImageSection?.sectionInfo || {}));

  a.appendChild(img);
  wrap.appendChild(a);
  return wrap;
}

function createSearch(searchSection) {
  const container = document.createElement('div');
  container.className = 'header-search';

  const input = document.createElement('input');
  input.className = 'header-search-input';
  input.id = 'headerSearchInput';
  input.type = 'search';
  input.setAttribute('aria-label', searchSection?.sectionInfo?.searchHeadingText || 'Search');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'header-search-btn';
  btn.textContent = searchSection?.sectionInfo?.searchLabelText || 'Search';

  container.appendChild(input);
  container.appendChild(btn);
  return container;
}

function renderNavigationLinks(manualLinks = {}) {
  const ul = document.createElement('ul');
  ul.className = 'mega-links';

  Object.entries(manualLinks || {}).forEach(([label, href]) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    li.appendChild(a);
    ul.appendChild(li);
  });

  return ul;
}

function renderTeaser(teaserInfo = {}) {
  const card = document.createElement('div');
  card.className = 'mega-teaser';

  const img = document.createElement('img');
  img.loading = 'lazy';
  img.decoding = 'async';
  img.alt = teaserInfo.altText || '';
  setImgWithFallback(img, buildAssetCandidates(teaserInfo));
  card.appendChild(img);

  const titleWrap = document.createElement('div');
  titleWrap.className = 'mega-teaser-title';
  titleWrap.appendChild(htmlToFragment(decodeHtmlEntities(teaserInfo.richTextTitle || '')));
  card.appendChild(titleWrap);

  const cta = (teaserInfo.callToActions || [])[0];
  if (cta?.url && cta?.label) {
    const a = document.createElement('a');
    a.className = 'mega-teaser-cta';
    a.href = cta.url;
    a.textContent = cta.label;
    card.appendChild(a);
  }

  return card;
}

/* ================= variation renderers ================= */

/** Extract “VIEW ALL …” as a separate block */
function extractViewAllNode(sections = []) {
  const texts = collectAllByTypeDeep(sections, 'text', []);
  const node = texts.find((t) => {
    const html = decodeHtmlEntities(t.sectionInfo?.anonymousText || '');
    return /VIEW ALL/i.test(html);
  });
  return node ? decodeHtmlEntities(node.sectionInfo.anonymousText || '') : '';
}

function findFirstTeaser(sections = []) {
  const teasers = collectAllByTypeDeep(sections, 'teaser', []);
  return teasers[0]?.sectionInfo || null;
}

/** variation 3 desktop mega menu */
function renderMegaMenu(sections = []) {
  const wrap = document.createElement('div');
  wrap.className = 'mega-panel-inner';

  const viewAllHtml = extractViewAllNode(sections);

  const grid = document.createElement('div');
  grid.className = 'mega-grid';

  const collected = [];

  const walk = (arr) => {
    (arr || []).forEach((node) => {
      if (!node) return;
      if (node.type === 'container') walk(node.sectionInfo?.sections);

      if (node.type === 'text') {
        const html = decodeHtmlEntities(node.sectionInfo?.anonymousText || '');
        if (/VIEW ALL/i.test(html)) return;
        collected.push({ kind: 'heading', html });
      }

      if (node.type === 'navigationlinks') {
        collected.push({ kind: 'links', links: node.sectionInfo?.manualLinks || {} });
      }
    });
  };

  walk(sections);

  for (let i = 0; i < collected.length; i += 1) {
    const item = collected[i];

    if (item.kind === 'heading') {
      const col = document.createElement('div');
      col.className = 'mega-col';
      col.appendChild(htmlToFragment(item.html));

      const next = collected[i + 1];
      if (next?.kind === 'links' && Object.keys(next.links || {}).length) {
        col.appendChild(renderNavigationLinks(next.links));
        i += 1;
      }

      grid.appendChild(col);
      continue;
    }

    if (item.kind === 'links' && Object.keys(item.links || {}).length) {
      const col = document.createElement('div');
      col.className = 'mega-col';
      col.appendChild(renderNavigationLinks(item.links));
      grid.appendChild(col);
    }
  }

  const teaserInfo = findFirstTeaser(sections);
  if (teaserInfo) {
    const tcol = document.createElement('div');
    tcol.className = 'mega-col mega-col--teaser';

    const top = document.createElement('div');
    top.className = 'mega-toplabel';
    top.textContent = 'TOP RECIPE';

    tcol.appendChild(top);
    tcol.appendChild(renderTeaser(teaserInfo));
    grid.appendChild(tcol);
  }

  wrap.appendChild(grid);

  if (viewAllHtml) {
    const viewAll = document.createElement('div');
    viewAll.className = 'mega-viewall';
    viewAll.appendChild(htmlToFragment(viewAllHtml));
    wrap.appendChild(viewAll);
  }

  return wrap;
}

/** variation 2 desktop dropdown */
function renderDropdownMenu(sections = []) {
  const wrap = document.createElement('div');
  wrap.className = 'mega-panel-inner';

  const navNodes = collectAllByTypeDeep(sections, 'navigationlinks', []);
  const merged = {};

  navNodes.forEach((n) => {
    const links = n.sectionInfo?.manualLinks || {};
    Object.entries(links).forEach(([label, url]) => {
      if (!merged[label]) merged[label] = url;
    });
  });

  const listCol = document.createElement('div');
  listCol.className = 'mega-col';
  listCol.appendChild(renderNavigationLinks(merged));

  wrap.appendChild(listCol);
  return wrap;
}

/* ================= mobile nav - variation 3 ================= */

function stripHtmlText(html = '') {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').trim();
}

function parseVariation3Groups(sections = []) {
  const groups = [];
  let viewAllHtml = '';
  let teaserInfo = null;

  const walk = (arr = []) => {
    for (let i = 0; i < arr.length; i += 1) {
      const node = arr[i];
      if (!node) continue;

      if (node.type === 'container' && Array.isArray(node.sectionInfo?.sections)) {
        walk(node.sectionInfo.sections);
        continue;
      }

      if (node.type === 'teaser' && !teaserInfo) {
        teaserInfo = node.sectionInfo;
        continue;
      }

      if (node.type === 'text') {
        const html = decodeHtmlEntities(node.sectionInfo?.anonymousText || '');
        const label = stripHtmlText(html);

        if (!label) continue;

        if (/VIEW ALL/i.test(label)) {
          if (!viewAllHtml) viewAllHtml = html;
          continue;
        }

        const next = arr[i + 1];
        if (next?.type === 'navigationlinks') {
          groups.push({
            title: label,
            links: next.sectionInfo?.manualLinks || {},
          });
          i += 1;
          continue;
        }
      }

      if (node.type === 'navigationlinks') {
        const links = node.sectionInfo?.manualLinks || {};
        if (Object.keys(links).length) {
          groups.push({
            title: '',
            links,
          });
        }
      }
    }
  };

  walk(sections);

  return { groups, viewAllHtml, teaserInfo };
}

function renderVariation3ChildLinksPanel({ title, links = {}, panelId, parentId }) {
  const panel = document.createElement('div');
  panel.className = 'mobile-v3-panel';
  panel.dataset.panelId = panelId;

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'mobile-v3-back';
  back.dataset.targetPanel = parentId;
  back.innerHTML = '<span class="mobile-v3-back-icon">‹</span><span>Back</span>';
  panel.appendChild(back);

  const titleEl = document.createElement('div');
  titleEl.className = 'mobile-v3-title';
  titleEl.textContent = title;
  panel.appendChild(titleEl);

  const ul = document.createElement('ul');
  ul.className = 'mobile-v3-links';

  Object.entries(links || {}).forEach(([label, href]) => {
    const li = document.createElement('li');
    li.className = 'mobile-v3-links-item';

    const a = document.createElement('a');
    a.className = 'mobile-v3-link';
    a.href = href;
    a.textContent = label;

    li.appendChild(a);
    ul.appendChild(li);
  });

  panel.appendChild(ul);
  return panel;
}

function renderVariation3StructuredPanel({
  title,
  sections = [],
  panelId,
  parentId = 'root',
  viewport,
  panelMap,
}) {
  const panel = document.createElement('div');
  panel.className = 'mobile-v3-panel';
  panel.dataset.panelId = panelId;

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'mobile-v3-back';
  back.dataset.targetPanel = parentId;
  back.innerHTML = '<span class="mobile-v3-back-icon">‹</span><span>Back</span>';
  panel.appendChild(back);

  const titleEl = document.createElement('div');
  titleEl.className = 'mobile-v3-title';
  titleEl.textContent = title;
  panel.appendChild(titleEl);

  const { groups, viewAllHtml, teaserInfo } = parseVariation3Groups(sections);

  const titledGroups = groups.filter(
    (group) => group.title && Object.keys(group.links || {}).length,
  );

  const directLinkGroups = groups.filter(
    (group) => !group.title && Object.keys(group.links || {}).length,
  );

  if (titledGroups.length) {
    const groupList = document.createElement('ul');
    groupList.className = 'mobile-v3-groups';

    titledGroups.forEach((group, idx) => {
      const li = document.createElement('li');
      li.className = 'mobile-v3-groups-item';

      const childId = `${panelId}-group-${idx}`;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mobile-v3-group-btn';
      btn.dataset.targetPanel = childId;
      btn.innerHTML = `<span class="mobile-v3-group-label">${group.title}</span>`;
      li.appendChild(btn);

      const childPanel = renderVariation3ChildLinksPanel({
        title: group.title,
        links: group.links,
        panelId: childId,
        parentId: panelId,
      });

      viewport.appendChild(childPanel);
      panelMap.set(childId, childPanel);

      groupList.appendChild(li);
    });

    panel.appendChild(groupList);
  }

  if (directLinkGroups.length) {
    const directList = document.createElement('ul');
    directList.className = 'mobile-v3-directlinks';

    directLinkGroups.forEach((group) => {
      Object.entries(group.links || {}).forEach(([label, href]) => {
        const li = document.createElement('li');
        li.className = 'mobile-v3-directlinks-item';

        const a = document.createElement('a');
        a.className = 'mobile-v3-directlink';
        a.href = href;
        a.textContent = label;

        li.appendChild(a);
        directList.appendChild(li);
      });
    });

    panel.appendChild(directList);
  }

if (viewAllHtml) {
  const viewAllWrap = document.createElement('div');
  viewAllWrap.className = 'mobile-v3-viewall';
  viewAllWrap.appendChild(htmlToFragment(viewAllHtml));

  const viewAllLink = viewAllWrap.querySelector('a');
  if (viewAllLink) {
    viewAllLink.classList.add('mobile-v3-viewall-link');
  }

  panel.appendChild(viewAllWrap);
}

if (teaserInfo) {
  const teaserWrap = document.createElement('div');
  teaserWrap.className = 'mobile-v3-teaser-wrap';

  const label = document.createElement('div');
  label.className = 'mobile-v3-teaser-label';
  label.textContent = 'TOP RECIPE';
  teaserWrap.appendChild(label);

  const teaserCard = renderTeaser(teaserInfo);
  teaserCard.classList.add('mobile-v3-teaser-card');
  teaserWrap.appendChild(teaserCard);

  panel.appendChild(teaserWrap);
}

  return panel;
}

function createVariation3MobileNav(globalNavSection) {
  const nav = document.createElement('nav');
  nav.className = 'header-mobile-nav header-mobile-nav--v3';
  nav.setAttribute(
    'aria-label',
    globalNavSection?.sectionInfo?.accessibilityLabel || 'mobile navigation',
  );

  const viewport = document.createElement('div');
  viewport.className = 'mobile-v3-viewport';
  nav.appendChild(viewport);

  const panelMap = new Map();

  const rootPanel = document.createElement('div');
  rootPanel.className = 'mobile-v3-panel is-active';
  rootPanel.dataset.panelId = 'root';

  const rootList = document.createElement('ul');
  rootList.className = 'mobile-v3-root-list';

  const items = globalNavSection?.sectionInfo?.sections || [];

  items.forEach((item, idx) => {
    const info = item?.sectionInfo || {};
    const title = info['cq:panelTitle'] || info['cq:panelTitle']?.[0] || '';
    const href = info.navLinkUrl || info.linkURL || '#';
    const childSections = Array.isArray(info.sections) ? info.sections : [];
    const hasChildren = childSections.length > 0;

    if (!title) return;

    const li = document.createElement('li');
    li.className = 'mobile-v3-root-item';

    if (hasChildren) {
      const panelId = `root-${idx}`;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mobile-v3-root-btn';
      btn.dataset.targetPanel = panelId;
      btn.innerHTML = `<span class="mobile-v3-root-label">${title}</span>`;
      li.appendChild(btn);

      const structuredPanel = renderVariation3StructuredPanel({
        title,
        sections: childSections,
        panelId,
        parentId: 'root',
        viewport,
        panelMap,
      });

      viewport.appendChild(structuredPanel);
      panelMap.set(panelId, structuredPanel);
    } else {
      const a = document.createElement('a');
      a.className = 'mobile-v3-root-link';
      a.href = href;
      a.textContent = title;
      li.appendChild(a);
    }

    rootList.appendChild(li);
  });

  rootPanel.appendChild(rootList);
  viewport.appendChild(rootPanel);
  panelMap.set('root', rootPanel);

  function openPanel(targetId) {
    viewport.querySelectorAll('.mobile-v3-panel').forEach((panel) => {
      panel.classList.remove('is-active');
    });

    const target = panelMap.get(targetId);
    if (target) target.classList.add('is-active');
  }

  nav.addEventListener('click', (e) => {
    const trigger = e.target.closest('button[data-target-panel]');
    if (!trigger) return;

    e.preventDefault();
    e.stopPropagation();

    openPanel(trigger.dataset.targetPanel);
  });

  nav.resetToRoot = () => openPanel('root');

  return nav;
}

/* ================= generic mobile nav (variation 1 & 2) ================= */
function linksToNodes(links = {}) {
  return Object.entries(links || {}).map(([label, href]) => ({
    label,
    href,
    children: [],
  }));
}

function buildMobileTreeFromSections(sections = []) {
  const out = [];

  for (let i = 0; i < sections.length; i += 1) {
    const node = sections[i];
    if (!node) continue;

    const info = node.sectionInfo || {};

    if (node.type === 'navigationlinks') {
      out.push(...linksToNodes(info.manualLinks || {}));
      continue;
    }

    if (node.type === 'text') {
      const label = stripHtmlText(decodeHtmlEntities(info.anonymousText || ''));
      if (!label || /view all/i.test(label)) continue;

      const next = sections[i + 1];
      let children = [];

      if (next?.type === 'navigationlinks') {
        children = linksToNodes(next.sectionInfo?.manualLinks || {});
        i += 1;
      } else if (Array.isArray(next?.sectionInfo?.sections)) {
        children = buildMobileTreeFromSections(next.sectionInfo.sections);
        i += 1;
      }

      if (children.length) {
        out.push({ label, children });
      } else if (info.linkURL) {
        out.push({ label, href: info.linkURL, children: [] });
      }

      continue;
    }

    if (node.type === 'container' && Array.isArray(info.sections)) {
      const nested = buildMobileTreeFromSections(info.sections);
      out.push(...nested);
      continue;
    }

    if (Array.isArray(info.sections) && info.sections.length) {
      const label = info['cq:panelTitle'] || info.title || '';
      const href = info.navLinkUrl || info.linkURL || '#';
      const children = buildMobileTreeFromSections(info.sections);

      if (label && children.length) {
        out.push({ label, href, children });
      } else {
        out.push(...children);
      }
    }
  }

  return out;
}

function buildTopLevelMobileTree(globalNavSection) {
  const items = globalNavSection?.sectionInfo?.sections || [];

  return items
    .map((item) => {
      const info = item?.sectionInfo || {};
      const label = info['cq:panelTitle'] || info.title || '';
      const href = info.navLinkUrl || info.linkURL || '#';
      const children = Array.isArray(info.sections)
        ? buildMobileTreeFromSections(info.sections)
        : [];

      if (!label) return null;

      return {
        label,
        href,
        children,
      };
    })
    .filter(Boolean);
}

function createMobileNav(globalNavSection) {
  const nav = document.createElement('nav');
  nav.className = 'header-mobile-nav';
  nav.setAttribute(
    'aria-label',
    globalNavSection?.sectionInfo?.accessibilityLabel || 'mobile navigation',
  );

  const viewport = document.createElement('div');
  viewport.className = 'mobile-nav-viewport';
  nav.appendChild(viewport);

  const tree = buildTopLevelMobileTree(globalNavSection);
  const panelMap = new Map();

  function makePanel(items = [], panelId = 'root', parentId = '', title = '') {
    const panel = document.createElement('div');
    panel.className = 'mobile-nav-panel';
    panel.dataset.panelId = panelId;

    if (panelId === 'root') panel.classList.add('is-active');

    if (parentId) {
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'mobile-nav-back';
      back.dataset.targetPanel = parentId;
      back.innerHTML = '<span class="mobile-nav-back-icon">‹</span><span>Back</span>';
      panel.appendChild(back);
    }

    if (title && parentId) {
      const heading = document.createElement('div');
      heading.className = 'mobile-nav-title';
      heading.textContent = title;
      panel.appendChild(heading);
    }

    const list = document.createElement('ul');
    list.className = 'mobile-nav-list';

    items.forEach((item, idx) => {
      const li = document.createElement('li');
      li.className = 'mobile-nav-item';

      const hasChildren = Array.isArray(item.children) && item.children.length > 0;

      if (hasChildren) {
        const childId = `${panelId}-${idx}`;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mobile-nav-forward';
        btn.dataset.targetPanel = childId;

        const label = document.createElement('span');
        label.className = 'mobile-nav-forward-label';
        label.textContent = item.label;

        btn.appendChild(label);
        li.appendChild(btn);

        const childPanel = makePanel(item.children, childId, panelId, item.label);
        viewport.appendChild(childPanel);
      } else {
        const a = document.createElement('a');
        a.className = 'mobile-nav-link';
        a.href = item.href || '#';
        a.textContent = item.label;
        li.appendChild(a);
      }

      list.appendChild(li);
    });

    panel.appendChild(list);
    panelMap.set(panelId, panel);
    return panel;
  }

  viewport.appendChild(makePanel(tree, 'root'));

  function openPanel(targetId) {
    viewport.querySelectorAll('.mobile-nav-panel').forEach((panel) => {
      panel.classList.remove('is-active');
    });

    const target = panelMap.get(targetId);
    if (target) target.classList.add('is-active');
  }

  nav.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-target-panel]');
    if (!trigger) return;

    e.preventDefault();
    e.stopPropagation();

    const targetId = trigger.dataset.targetPanel;
    openPanel(targetId);
  });

  nav.resetToRoot = () => {
    openPanel('root');
  };

  return nav;
}

/* ================= nav with open/close ================= */

function createPrimaryNav(globalNavSection, variation, locale) {
  const nav = document.createElement('nav');
  nav.className = 'header-nav';
  nav.setAttribute('aria-label', globalNavSection?.sectionInfo?.accessibilityLabel || 'main navigation');

  const ul = document.createElement('ul');
  ul.className = 'header-navlist';

  let openLi = null;

  const closeLi = (li) => {
    if (!li) return;
    li.classList.remove('is-open');
    const b = li.querySelector('.nav-trigger');
    if (b) b.setAttribute('aria-expanded', 'false');
    if (openLi === li) openLi = null;
  };

  const closeAll = () => {
    ul.querySelectorAll('.header-navitem.is-open').forEach(closeLi);
    openLi = null;
  };

  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeAll();
  });

  nav.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (a) closeAll();
  });

  const items = globalNavSection?.sectionInfo?.sections || [];
  items.forEach((item, idx) => {
    const info = item?.sectionInfo || {};
    const title = (info['cq:panelTitle'] || info['cq:panelTitle']?.[0] || '');
    const href = info.navLinkUrl || info.linkURL || '#';
    const hasChildren = Array.isArray(info.sections) && info.sections.length > 0;

    if (!title) return;

    const li = document.createElement('li');
    li.className = 'header-navitem';

    // variation 1: no dropdowns (always flat links)
    if (variation === 1 || !hasChildren) {
      const a = document.createElement('a');
      a.className = 'nav-link';
      a.href = href;
      a.textContent = title;
      li.appendChild(a);
      ul.appendChild(li);
      return;
    }

    const toggleId = `nav-panel-${idx}`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-trigger';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', toggleId);
    btn.textContent = title;

    const panel = document.createElement('div');
    panel.className = 'mega-panel';
    panel.id = toggleId;

    // locale override: gb-en should behave like dropdown (UK style) even if variation mis-set
    const effectiveVariation = (locale === 'gb-en') ? 2 : variation;

    if (effectiveVariation === 3) panel.appendChild(renderMegaMenu(info.sections));
    if (effectiveVariation === 2) panel.appendChild(renderDropdownMenu(info.sections));

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const willOpen = !li.classList.contains('is-open');
      if (openLi && openLi !== li) closeLi(openLi);

      li.classList.toggle('is-open', willOpen);
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      openLi = willOpen ? li : null;
    });

    li.appendChild(btn);
    li.appendChild(panel);
    ul.appendChild(li);
  });

  nav.appendChild(ul);
  return nav;
}

/* ================= decorate ================= */

export default async function decorate(block) {
  if (block.dataset.rendered === 'true') return;

  block.textContent = '';

  const data = await getXfedsContent();
  if (!data?.header?.sections) return;

  const variation = Number(data.header?.variation || 3);
  const locale = String(data.locale || '').toLowerCase();

  block.dataset.appliedBrand = String(data.brand || '').toLowerCase();
  block.dataset.appliedLocale = locale;
  block.dataset.appliedVariation = String(variation);

  const root = document.createElement('div');
  root.className = 'header-root';

  const sections = data.header.sections;

  const topLabel = findContainerById(sections, 'top-label');
  if (topLabel) root.appendChild(createTopUtilityBar(topLabel));

  const mainContainer = findMainHeaderContainer(sections);
  const mainSections = mainContainer?.sectionInfo?.sections || [];

  const skipContainer = findFirst(
    mainSections,
    (s) => s?.type === 'container'
      && (s.sectionInfo?.sections || []).some(
        (x) => x?.type === 'button' && (x.sectionInfo?.linkURL || '').startsWith('#'),
      ),
  );
  if (skipContainer) root.appendChild(createSkipLinks(skipContainer));

  const menuBtnSection = findChildByType(mainSections, 'button');
  const logoSection = findChildByType(mainSections, 'tabimage');
  const globalNavSection = findChildByType(mainSections, 'globalnavigation');
  const searchSection = findChildByType(mainSections, 'searchinput');

  const mainBar = document.createElement('div');
  mainBar.className = 'header-mainbar';

  let desktopNav = null;
  let mobileNav = null;

 if (globalNavSection) {
  desktopNav = createPrimaryNav(globalNavSection, variation, locale);
  desktopNav.classList.add('header-nav--desktop');

  const effectiveVariation = (locale === 'gb-en') ? 2 : variation;

  mobileNav = effectiveVariation === 3
    ? createVariation3MobileNav(globalNavSection)
    : createMobileNav(globalNavSection);
}

 const hamburger = createHamburgerButton(menuBtnSection);

hamburger.addEventListener('click', () => {
  const open = root.classList.toggle('nav-open');

  hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');

  document.body.classList.toggle('mobile-nav-open', open);

  if (open && mobileNav?.resetToRoot) {
    mobileNav.resetToRoot();
  }

  if (!open && mobileNav?.resetToRoot) {
    mobileNav.resetToRoot();
  }
});

  mainBar.appendChild(hamburger);

  if (logoSection) mainBar.appendChild(createBrandLogo(logoSection));
  if (desktopNav) mainBar.appendChild(desktopNav);
  if (searchSection) mainBar.appendChild(createSearch(searchSection));

  root.appendChild(mainBar);

  if (mobileNav) {
    root.appendChild(mobileNav);
  }

  block.appendChild(root);
  block.dataset.rendered = 'true';
}