import getXfedsContent from '../../commonutils/xfedscontent.js';

const ASSET_BASE = 'https://assets.unileversolutions.com/v1/';

/* ================= utils ================= */

function decodeHtmlEntities(str = '') {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}

function expandTokens(html = '') {
  return (html || '').replace(/\{\{\s*dynamicYear\s*\}\}/g, String(new Date().getFullYear()));
}

function htmlToFragment(htmlString = '') {
  const tpl = document.createElement('template');
  tpl.innerHTML = (htmlString || '').trim();
  return tpl.content;
}

function getDirectFooterContainers(parent) {
  if (!parent) return [];
  return [...parent.children].filter((el) => el.classList && el.classList.contains('footer-container'));
}

function hasOwnRenderableContent(container) {
  if (!container) return false;
  return [...container.children].some((child) => {
    if (!child.classList) return true;
    return !child.classList.contains('footer-container');
  });
}

function isBottomLikeContainer(container) {
  if (!container) return false;
  return Boolean(
    container.querySelector('.footer-copyright-text')
    || container.querySelector('.footer-language')
  );
}

function hoistChildren(parent, wrapper) {
  const kids = [...wrapper.children];
  kids.forEach((child) => parent.insertBefore(child, wrapper));
  wrapper.remove();
}

/**
 * Append decoded HTML into parent and ensure scripts execute.
 */
function appendEmbedHtml(parent, rawHtml = '', idRegistry) {
  const decoded = expandTokens(decodeHtmlEntities(rawHtml || '')).trim();
  if (!decoded) return;

  const tpl = document.createElement('template');
  tpl.innerHTML = decoded;
  const frag = tpl.content;

  frag.querySelectorAll('script').forEach((oldScript) => {
    const s = document.createElement('script');
    [...oldScript.attributes].forEach((a) => s.setAttribute(a.name, a.value));
    s.text = oldScript.textContent || '';
    oldScript.replaceWith(s);
  });

  parent.appendChild(frag);
}

function buildAssetCandidates(sectionInfo = {}) {
  const id = sectionInfo.tabId || sectionInfo.imageId || sectionInfo.tabIdmobile;
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

function safeAssignId(el, desiredId, idRegistry) {
  if (!desiredId) return;
  if (!idRegistry.has(desiredId)) {
    el.id = desiredId;
    idRegistry.add(desiredId);
  } else {
    el.dataset.originalId = desiredId;
  }
}

function normalizeTarget(sectionInfo = {}) {
  const t = sectionInfo.linkTarget || sectionInfo.openNewTab;
  if (t === '_blank' || t === 'newtab') return '_blank';
  return '_self';
}

function resolveHref(sectionInfo = {}) {
  return sectionInfo.linkTo
    || sectionInfo.linkURL
    || sectionInfo.externalLink
    || '#';
}

/* ================= renderers ================= */

function renderButton(node) {
  const info = node.sectionInfo || {};
  const a = document.createElement('a');
  a.className = 'footer-btn';

  const href = resolveHref(info);
  a.href = href;
  a.target = normalizeTarget(info);

  const labelText = decodeHtmlEntities(info['jcr:title'] || info.title || 'Link');
  a.textContent = labelText;

  if (info.accessibilityLabel) a.setAttribute('aria-label', info.accessibilityLabel);
  if (info.id) a.dataset.buttonId = info.id;

  const labelLower = (labelText || '').toLowerCase();
  if (href === '#top' || labelLower.includes('back to top')) {
    a.classList.add('footer-backtotop');
  }

  return a;
}

function renderText(node) {
  const info = node.sectionInfo || {};
  const wrap = document.createElement('div');
  wrap.className = 'footer-text';

  if (info.anonymousText) {
    const html = expandTokens(decodeHtmlEntities(info.anonymousText || ''));
    const frag = htmlToFragment(html);

    const textContent = (frag.textContent || '').replace(/\s+/g, ' ').trim();
    const isCopyright =
      /©\s*\d{4}\b/i.test(textContent)
      && /(copyright|unilever|magnum|ice\s*cream\s*company)/i.test(textContent);

    if (isCopyright) {
      wrap.classList.add('footer-copyright');
      wrap.classList.add('footer-copyright-text');
    }

    wrap.appendChild(frag);
    return wrap;
  }

  if (info.type && (info.type === 'email' || info.type === 'text')) {
    wrap.classList.add('footer-field');

    const label = document.createElement('label');
    label.className = 'footer-field-label';
    label.textContent = info.title || info.helpMessage || info.name || 'Email';

    const input = document.createElement('input');
    input.className = 'footer-field-input';
    input.type = info.type;
    input.name = info.name || 'field';
    input.placeholder = info.helpMessage || info.title || '';

    if (info.requiredMessage) {
      input.setAttribute('aria-required', 'true');
      input.dataset.requiredMessage = info.requiredMessage;
    }

    wrap.append(label, input);
    return wrap;
  }

  return wrap;
}

function renderTabImage(node) {
  const info = node.sectionInfo || {};
  const wrap = document.createElement('div');
  wrap.className = 'footer-tabimage';

  const a = document.createElement('a');
  a.className = 'footer-img-link';
  a.href = info.linkURL || '/';
  a.target = normalizeTarget(info);

  const img = document.createElement('img');
  img.className = 'footer-img';
  img.alt = info.alt || '';
  img.decoding = 'async';
  img.loading = (info.disableLazyLoading === 'true' || info.disableLazyLoading === true) ? 'eager' : 'lazy';

  setImgWithFallback(img, buildAssetCandidates(info));

  a.appendChild(img);
  wrap.appendChild(a);

  return wrap;
}

function renderNavigationLinks(node) {
  const info = node.sectionInfo || {};
  const nav = document.createElement('nav');
  nav.className = 'footer-navlinks';

  const ul = document.createElement('ul');
  ul.className = 'footer-links';

  Object.entries(info.manualLinks || {}).forEach(([label, href]) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = decodeHtmlEntities(label);
    li.appendChild(a);
    ul.appendChild(li);
  });

  nav.appendChild(ul);
  return nav;
}

function renderLanguageNavigation(node) {
  const info = node.sectionInfo || {};
  const wrap = document.createElement('div');
  wrap.className = 'footer-language';

  const headingTag = info.headingHtmlTag || 'h2';
  const h = document.createElement(headingTag);
  h.className = 'footer-language-heading';
  h.textContent = info.headingLabel || info.languageHeadingLabel || 'Location';

  const a = document.createElement('a');
  a.className = 'footer-language-link';
  a.href = info.changeLocationLink || '#';
  a.textContent = info.changeLocationLinkLabel || 'Change location';

  if (info.accessibilityLabel) a.setAttribute('aria-label', info.accessibilityLabel);

  wrap.append(h, a);
  return wrap;
}

function renderEmbed(node, idRegistry) {
  const info = node.sectionInfo || {};
  const wrap = document.createElement('div');
  wrap.className = 'footer-embed';

  safeAssignId(wrap, info.id, idRegistry);
  appendEmbedHtml(wrap, info.html || '', idRegistry);
  return wrap;
}

function renderLiveChat(node) {
  const info = node.sectionInfo || {};
  const wrap = document.createElement('div');
  wrap.className = 'footer-livechat';
  if (info.provider) wrap.dataset.provider = info.provider;

  if (info.livechatScriptEmbed) {
    const inner = document.createElement('div');
    inner.className = 'footer-livechat-embed';
    inner.appendChild(htmlToFragment(decodeHtmlEntities(info.livechatScriptEmbed)));
    wrap.appendChild(inner);
  }

  return wrap;
}

function renderContainer(node, idRegistry, renderNode) {
  const info = node.sectionInfo || {};
  const wrap = document.createElement('div');
  wrap.className = 'footer-container';

  if (info.layout) wrap.dataset.layout = info.layout;
  if (info['sling:resourceType']) wrap.dataset.rt = info['sling:resourceType'];

  safeAssignId(wrap, info.id, idRegistry);

  (info.sections || []).forEach((child) => renderNode(child, wrap));
  return wrap;
}

/* ================= main render ================= */

function createFooterRoot(variation) {
  const root = document.createElement('div');
  root.className = 'footer-root';
  root.dataset.variation = String(variation);
  return root;
}

/* ================= variation 3 structure fix ================= */

function normalizeVariation3Structure(block) {
  const root = block.querySelector('.footer-root');
  if (!root) return;

  const getDirectContainers = (parent) => {
    if (!parent) return [];
    return [...parent.children].filter((el) => el.classList?.contains('footer-container'));
  };

  const isRenderableNode = (el) => {
    if (!el || !el.classList) return false;
    return (
      el.classList.contains('footer-text')
      || el.classList.contains('footer-btn')
      || el.classList.contains('footer-tabimage')
      || el.classList.contains('footer-embed')
      || el.classList.contains('footer-language')
      || el.classList.contains('footer-livechat')
      || el.classList.contains('footer-unknown')
    );
  };

  const hasOwnRenderableContent = (container) => {
    if (!container) return false;
    return [...container.children].some((child) => isRenderableNode(child));
  };

  const isBottomLike = (container) => {
    if (!container) return false;
    return Boolean(
      container.querySelector('.footer-copyright-text')
      || container.querySelector('.footer-language')
      || container.querySelector('.footer-backtotop')
    );
  };

  const hoistChildren = (parent, wrapper) => {
    const kids = [...wrapper.children];
    kids.forEach((child) => parent.insertBefore(child, wrapper));
    wrapper.remove();
  };

  const removeEmptyDirectContainers = (parent) => {
    getDirectContainers(parent).forEach((container) => {
      const hasText = (container.textContent || '').replace(/\s+/g, '').length > 0;
      const hasNested = getDirectContainers(container).length > 0;
      const hasRenderable = hasOwnRenderableContent(container);

      if (!hasText && !hasNested && !hasRenderable) {
        container.remove();
      }
    });
  };

  const getUsefulDirectChildren = (parent) => {
    return getDirectContainers(parent).filter((container) => {
      const hasText = (container.textContent || '').replace(/\s+/g, '').length > 0;
      const hasNested = getDirectContainers(container).length > 0;
      const hasRenderable = hasOwnRenderableContent(container);
      return hasText || hasNested || hasRenderable;
    });
  };

  /* -------------------------------------------------------
   * 1. Unwrap useless single root wrappers
   * ----------------------------------------------------- */
  let guard = 0;
  while (guard < 6) {
    guard += 1;

    const directContainers = getDirectContainers(root);
    if (directContainers.length !== 1) break;

    const only = directContainers[0];
    const nestedContainers = getDirectContainers(only);

    if (nestedContainers.length >= 2 && !hasOwnRenderableContent(only)) {
      hoistChildren(root, only);
      continue;
    }

    break;
  }

  /* -------------------------------------------------------
   * 2. Flatten structural-only wrappers under root
   * ----------------------------------------------------- */
  let changed = true;
  let pass = 0;

  while (changed && pass < 10) {
    changed = false;
    pass += 1;

    getDirectContainers(root).forEach((container) => {
      const nestedContainers = getDirectContainers(container);

      const shouldHoist =
        nestedContainers.length >= 1
        && !hasOwnRenderableContent(container)
        && !isBottomLike(container);

      if (shouldHoist) {
        hoistChildren(root, container);
        changed = true;
      }
    });
  }

  /* -------------------------------------------------------
   * 3. Ensure top wrapper exists
   * ----------------------------------------------------- */
  let topWrapper = root.querySelector(':scope > .footer-container--top-section');
  if (!topWrapper) {
    topWrapper = document.createElement('div');
    topWrapper.className = 'footer-container footer-container--top-section footer-container--separator';
    root.prepend(topWrapper);
  }

  /* -------------------------------------------------------
   * 4. Ensure bottom wrapper exists
   * ----------------------------------------------------- */
  let bottomSection = root.querySelector('#copyright-container');

  if (!bottomSection) {
    const directContainers = getDirectContainers(root);

    const copyrightLike = directContainers.find((c) =>
      c.querySelector('.footer-copyright-text')
    );

    const locationLike = directContainers.find((c) =>
      c.querySelector('.footer-language')
    );

    if (copyrightLike || locationLike) {
      bottomSection = document.createElement('div');
      bottomSection.className = 'footer-container footer-container--copyright';
      bottomSection.id = 'copyright-container';
      root.appendChild(bottomSection);

      if (copyrightLike) bottomSection.appendChild(copyrightLike);
      if (locationLike && locationLike !== copyrightLike) bottomSection.appendChild(locationLike);
    }
  }

  if (!bottomSection) return;

  /* -------------------------------------------------------
   * 5. Move obvious root-level non-bottom containers to top
   * ----------------------------------------------------- */
  getDirectContainers(root).forEach((container) => {
    if (container !== topWrapper && container !== bottomSection) {
      topWrapper.appendChild(container);
    }
  });

  removeEmptyDirectContainers(topWrapper);

  /* -------------------------------------------------------
   * 6. If top wrapper is empty, actual top content is trapped
   *    inside bottomSection mixed containers. Extract by structure.
   * ----------------------------------------------------- */
  const topHasUsefulChildren = getUsefulDirectChildren(topWrapper).length > 0;

  if (!topHasUsefulChildren) {
    const mixedContainers = getDirectContainers(bottomSection).filter((container) => {
      const nested = getDirectContainers(container);
      return nested.length >= 2;
    });

    mixedContainers.forEach((mixed) => {
      const directChildren = getDirectContainers(mixed);

      directChildren.forEach((child) => {
        const hasCopyright = Boolean(child.querySelector('.footer-copyright-text'));
        const hasLanguage = Boolean(child.querySelector('.footer-language'));
        const hasBackToTop = Boolean(child.querySelector('.footer-backtotop'));
        const hasSocial = Boolean(child.querySelector('.footer-tabimage'));
        const hasButtons = Boolean(child.querySelector('.footer-btn'));
        const hasText = Boolean(child.querySelector('.footer-text'));

        const isBottomBlock = hasCopyright || hasLanguage || hasBackToTop;
        const isTopBlock = !isBottomBlock && (hasSocial || hasButtons || hasText);

        if (isTopBlock) {
          topWrapper.appendChild(child);
        }
      });

      // Remove emptied mixed wrapper
      if (!hasOwnRenderableContent(mixed) && getDirectContainers(mixed).length === 0) {
        mixed.remove();
      }
    });
  }

  /* -------------------------------------------------------
   * 7. Flatten top wrapper one level if it still has
   *    structural-only wrappers
   * ----------------------------------------------------- */
  let flattenChanged = true;
  let flattenPass = 0;

  while (flattenChanged && flattenPass < 10) {
    flattenChanged = false;
    flattenPass += 1;

    getDirectContainers(topWrapper).forEach((container) => {
      const nested = getDirectContainers(container);

      const canFlatten =
        nested.length >= 1
        && !hasOwnRenderableContent(container)
        && !isBottomLike(container);

      if (canFlatten) {
        hoistChildren(topWrapper, container);
        flattenChanged = true;
      }
    });
  }

  /* -------------------------------------------------------
   * 8. Move external location block into bottom section
   * ----------------------------------------------------- */
  const externalLocation =
    [...root.querySelectorAll('.footer-container--location')]
      .find((container) => !bottomSection.contains(container));

  if (externalLocation) {
    bottomSection.appendChild(externalLocation);
  }

  /* -------------------------------------------------------
   * 9. Move external copyright-like block into bottom section
   * ----------------------------------------------------- */
  const externalCopyright =
    [...root.querySelectorAll('.footer-container')]
      .find((container) =>
        container !== bottomSection
        && !bottomSection.contains(container)
        && container.querySelector('.footer-copyright-text')
      );

  if (externalCopyright) {
    bottomSection.appendChild(externalCopyright);
  }

  /* -------------------------------------------------------
   * 10. Remove empty direct containers from top + bottom
   * ----------------------------------------------------- */
  removeEmptyDirectContainers(topWrapper);
  removeEmptyDirectContainers(bottomSection);
}

/**
 * Move location selector into bottom section if it was left in top area.
 */
function moveVariation3LocationIntoBottom(block) {
  const cc = block.querySelector('#copyright-container');
  if (!cc) return;

  if (cc.querySelector(':scope > .footer-container--location')) return;

  const root = block.querySelector('.footer-root');
  if (!root) return;

  const externalLocationContainer =
    [...root.querySelectorAll('.footer-container--location')]
      .find((container) => !cc.contains(container));

  if (externalLocationContainer) {
    cc.appendChild(externalLocationContainer);
  }
}

/** Group copyright + disclaimer texts into one wrapper column */
function groupCopyrightText(block) {
  const cc = block.querySelector('#copyright-container');
  if (!cc) return;

  const left =
    cc.querySelector(':scope > .footer-container--copyright-left')
    || getDirectFooterContainers(cc)[0];

  if (!left) return;
  if (left.querySelector(':scope > .footer-text-group')) return;

  const texts = [...left.children].filter((el) => el.classList?.contains('footer-text'));
  if (texts.length <= 1) return;

  const group = document.createElement('div');
  group.className = 'footer-text-group';

  texts.forEach((t) => group.appendChild(t));
  left.appendChild(group);
}

/** Make back-to-top global + smooth scroll */
function setupGlobalBackToTop(block) {
  const btn = block.querySelector('.footer-backtotop');
  if (!btn) return;

  const rightCol =
    block.querySelector('#copyright-container > .footer-container--copyright-right')
    || block.querySelector('#copyright-container > .footer-container:last-child')
    || block.querySelector('#copyright-container')
    || block;

  if (!rightCol.contains(btn)) rightCol.appendChild(btn);

  btn.classList.remove('footer-backtotop-floating');
  btn.style.display = 'inline-flex';

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * Apply classes on `.footer-container`
 */
function addFooterContainerClasses(block) {
  // tabimage -> container
  block.querySelectorAll('.footer-tabimage').forEach((el) => {
    const c = el.closest('.footer-container');
    if (c) c.classList.add('footer-container--tabimage');
  });

  // copyright text -> container
  block.querySelectorAll('.footer-copyright-text').forEach((el) => {
    const c = el.closest('.footer-container');
    if (c) c.classList.add('footer-container--copyright-text');
  });

  // language -> container
  block.querySelectorAll('.footer-language').forEach((el) => {
    const c = el.closest('.footer-container');
    if (c) c.classList.add('footer-container--location');
  });

  const cc = block.querySelector('#copyright-container');
  if (cc) {
    const direct = getDirectFooterContainers(cc);

    const leftCandidate =
      direct.find((c) => c.querySelector('.footer-copyright-text'))
      || direct[0];

    const rightCandidate =
      direct.find((c) => c.querySelector('.footer-language'))
      || direct[direct.length - 1];

    if (leftCandidate) leftCandidate.classList.add('footer-container--copyright-left');
    if (rightCandidate) rightCandidate.classList.add('footer-container--copyright-right');

    cc.classList.add('footer-container--copyright');
  }

  const topSection = block.querySelector('.footer-root > .footer-container--top-section');
  if (topSection) {
    topSection.classList.add('footer-container--top-section', 'footer-container--separator');
  }
}

export default async function decorate(block) {
  if (block.dataset.rendered === 'true') return;

  block.textContent = '';

  const data = await getXfedsContent();
  if (!data?.footer?.sections) return;

  const variation = Number(data.footer?.variation || 1);
  const locale = String(data.locale || '').toLowerCase();

  block.dataset.appliedBrand = String(data.brand || '').toLowerCase();
  block.dataset.appliedLocale = locale;
  block.dataset.appliedVariation = String(variation);

  const idRegistry = new Set();
  const root = createFooterRoot(variation);

  function renderNode(node, parent) {
    if (!node || !node.type) return;

    let el = null;

    switch (node.type) {
      case 'container':
        el = renderContainer(node, idRegistry, renderNode);
        break;
      case 'text':
        el = renderText(node);
        break;
      case 'button':
        el = renderButton(node);
        break;
      case 'tabimage':
        el = renderTabImage(node);
        break;
      case 'navigationlinks':
        el = renderNavigationLinks(node);
        break;
      case 'languagenavigation':
        el = renderLanguageNavigation(node);
        break;
      case 'embed':
        el = renderEmbed(node, idRegistry);
        break;
      case 'livechat':
        el = renderLiveChat(node);
        break;
      default: {
        el = document.createElement('div');
        el.className = 'footer-unknown';
        el.dataset.type = node.type;
        break;
      }
    }

    if (el) parent.appendChild(el);
  }

  data.footer.sections.forEach((section) => renderNode(section, root));
  block.appendChild(root);

  // Variation 3 normalization first
  if (variation === 3) {
    normalizeVariation3Structure(block);
  }

  // Apply container classes
  addFooterContainerClasses(block);

  // Variation 3 post-processing
  if (variation === 3) {
    moveVariation3LocationIntoBottom(block);
    addFooterContainerClasses(block); // re-tag after moving location
    groupCopyrightText(block);
    setupGlobalBackToTop(block);
  }

  block.dataset.rendered = 'true';

  const rootEl = block.querySelector('.footer-root');
  rootEl?.querySelector('.footer-field-input')?.closest('.footer-container')?.classList.add('footer-v2-left');
  rootEl?.querySelector('.footer-navlinks')?.closest('.footer-container')?.classList.add('footer-v2-right');
  rootEl?.querySelector('.footer-container--copyright-text')?.closest('.footer-container')?.classList.add('footer-v2-bottom');
}