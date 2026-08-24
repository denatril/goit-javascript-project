const catalogRefs = {
  form: document.querySelector('#catalog-search-form'),
  queryInput: document.querySelector('#movie-query'),
  yearSelect: document.querySelector('#movie-year'),
  clearButton: document.querySelector('.catalog-search-clear'),
  resultsSection: document.querySelector('.catalog-results'),
  movieList: document.querySelector('.movie-list'),
  emptyState: document.querySelector('.catalog-results-empty'),
  pagination: document.querySelector('.pagination'),
  paginationList: document.querySelector('.pagination-list'),
  loader: document.querySelector('.loader'),
  scrollUpButton: document.querySelector('.scroll-up'),
  cardTemplate: document.querySelector('#catalog-movie-card-template'),
};

function updateClearButtonVisibility() {
  const hasQuery = catalogRefs.queryInput.value.trim() !== '';

  catalogRefs.clearButton.classList.toggle('is-hidden', !hasQuery);
}

function handleClearSearch() {
  catalogRefs.queryInput.value = '';
  catalogRefs.queryInput.focus();

  updateClearButtonVisibility();
}

catalogRefs.queryInput.addEventListener('input', updateClearButtonVisibility);
catalogRefs.clearButton.addEventListener('click', handleClearSearch);

function updateScrollUpVisibility() {
  const shouldShowScrollUp = window.scrollY > 300;

  catalogRefs.scrollUpButton.classList.toggle('is-hidden', !shouldShowScrollUp);
}

function handleScrollUpClick() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

window.addEventListener('scroll', updateScrollUpVisibility);
catalogRefs.scrollUpButton.addEventListener('click', handleScrollUpClick);