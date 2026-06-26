function resolveExternalImages(block) {
  block.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (href && /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(href)) {
      const pic = document.createElement('picture');
      const img = document.createElement('img');
      img.src = href;
      img.alt = a.textContent === href ? '' : a.textContent;
      img.loading = 'eager';
      pic.appendChild(img);
      a.replaceWith(pic);
    }
  });
}

export default function decorate(block) {
  resolveExternalImages(block);
}
