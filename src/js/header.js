/* Mobile Menu Toggle */
const menuButton = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');
const overlay = document.querySelector('.mobile-menu-overlay');

const currentPage = window.location.pathname.split('/').pop() || 'index.html';
const menuLinks = document.querySelectorAll('.nav-menu a, .mobile-menu-list a');

menuLinks.forEach(link => {
  const linkPage = new URL(link.href).pathname.split('/').pop() || 'index.html';

  if (linkPage === currentPage) {
    link.closest('li').classList.add('active');
  }
});

menuButton.addEventListener('click', () => {
  mobileMenu.classList.toggle('is-open');
  overlay.classList.toggle('is-open');
});

overlay.addEventListener('click', () => {
  mobileMenu.classList.remove('is-open');
  overlay.classList.remove('is-open');
});

/* Theme Switch */
const themeSwitch = document.querySelector('.theme-switch');
const savedTheme = localStorage.getItem('theme') || 'dark';
document.body.classList.add(`${savedTheme}-theme`);

themeSwitch.addEventListener('click', () => {
  const currentTheme = document.body.classList.contains('dark-theme')
    ? 'dark'
    : 'light';

  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

  document.body.classList.remove('dark-theme', 'light-theme');
  document.body.classList.add(`${newTheme}-theme`);

  localStorage.setItem('theme', newTheme);
});
