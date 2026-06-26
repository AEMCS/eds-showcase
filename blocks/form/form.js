export default async function decorate(block) {
  const selectedForm = block.textContent.trim();

  const container = document.createElement('div');
  container.className = 'form-container';

  const select = document.createElement('select');
  select.className = 'form-select';
  select.name = 'form-type';

  const options = ['Contact Us', 'Sign Up'];
  options.forEach((opt) => {
    const option = document.createElement('option');
    option.value = opt.toLowerCase().replace(/\s+/g, '-');
    option.textContent = opt;
    if (selectedForm.toLowerCase().includes(opt.toLowerCase())) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  container.appendChild(select);
  block.replaceChildren(container);
}
