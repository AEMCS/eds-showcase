export default async function decorate(block) {
  const rows = [...block.children];

  // Title
  const title = rows[0]?.textContent.trim();

  // Collect all configured article paths
  const fixedPaths = rows
    .slice(1)
    .map((row) => row.textContent.trim())
    .filter(Boolean);

  if (!fixedPaths.length) {
    return;
  }

  const payload = {
    mode: 'fixed',
    fixedPaths,
    limit: fixedPaths.length,
    offset: 0,
  };

  try {
    const response = await fetch(
      'https://aemcs-dev.unileversolutions.com/bin/edsPageList',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        //credentials: 'include', // sends cookies if required
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      throw new Error(`API failed: ${response.status}`);
    }

    const data = await response.json();

    console.log(data);

    renderArticles(block, title, data);
  } catch (e) {
    console.error('Failed to fetch related articles', e);
  }
}

function renderArticles(block, title, data) {
  block.innerHTML = `
    <div class="related-articles">
      <h2 class="related-articles__title">${title}</h2>
      <div class="related-articles__grid"></div>
    </div>
  `;

  const grid = block.querySelector('.related-articles__grid');

  data.items.forEach((article) => {
    grid.insertAdjacentHTML(
      'beforeend',
      `
      <article class="article-card">
        <a href="${article.url}" class="article-card__link">

          <div class="article-card__image">
            <img
              src="${article.image}"
              alt="${article.title}"
              loading="lazy">
          </div>

          <div class="article-card__content">

            <h3 class="article-card__title">
              ${article.title}
            </h3>

            <p class="article-card__description">
              ${article.description}
            </p>

          </div>

        </a>
      </article>
      `,
    );
  });
}
