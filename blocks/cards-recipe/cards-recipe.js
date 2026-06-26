import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function resolveExternalImages(block) {
  block.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    if (href && /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(href)) {
      const pic = document.createElement('picture');
      const img = document.createElement('img');
      img.src = href;
      img.alt = a.textContent === href ? '' : a.textContent;
      img.loading = 'lazy';
      pic.appendChild(img);
      a.replaceWith(pic);
    }
  });
}

export default function decorate(block) {
  resolveExternalImages(block);
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-recipe-card-image';
      else div.className = 'cards-recipe-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    if (img.src.startsWith('/') && !img.src.startsWith('//')) {
      const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
      moveInstrumentation(img, optimizedPic.querySelector('img'));
      img.closest('picture').replaceWith(optimizedPic);
    }
  });
  block.textContent = '';
  block.append(ul);
}
