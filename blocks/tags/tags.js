export default function decorate(block) {
  const rows = [...block.children];

  const headings = rows[0]?.textContent?.trim() || '';
  const subheading = rows[1]?.textContent?.trim() || '';

  block.innerHTML = `
    <div class="tags">
      <h2>${headings}</h2>
      <p>${subheading}</p>
    </div>
  `;
}
