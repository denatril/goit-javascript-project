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

const catalogState = {
  movies: [],
  page: 1,
  totalPages: 0,
  query: '',
  year: '',
  isLoading: false,
};

const FIRST_MOVIE_YEAR = 1900;
const CURRENT_YEAR = new Date().getFullYear();

function setLoadingState(isLoading) {
  catalogState.isLoading = isLoading;
  catalogRefs.resultsSection.setAttribute('aria-busy', String(isLoading));
  catalogRefs.loader.classList.toggle('is-hidden', !isLoading);
}

function setEmptyState(isEmpty) {
  catalogRefs.emptyState.hidden = !isEmpty;
}

function clearMovieList() {
  catalogRefs.movieList.innerHTML = '';
}

function clearPagination() {
  catalogRefs.pagination.hidden = true;
  catalogRefs.paginationList.innerHTML = '';
}

function populateYearSelect() {
  const years = [];

  for (let year = CURRENT_YEAR; year >= FIRST_MOVIE_YEAR; year -= 1) {
    years.push(`<option value="${year}">${year}</option>`);
  }

  catalogRefs.yearSelect.insertAdjacentHTML('beforeend', years.join(''));
}

function renderMovieCard(movie) {
  const cardElement =
    catalogRefs.cardTemplate.content.firstElementChild.cloneNode(true);

  const image = cardElement.querySelector('.movie-card-image');
  const title = cardElement.querySelector('.movie-card-title');
  const genres = cardElement.querySelector('.movie-card-genres');
  const year = cardElement.querySelector('.movie-card-year');
  const rating = cardElement.querySelector('.movie-card-rating-value');

  image.src = movie.posterUrl || '';
  image.alt = movie.title || 'Movie poster';
  title.textContent = movie.title || 'Untitled movie';
  genres.textContent = movie.genres || 'Genre unknown';
  year.textContent = movie.year || '';
  rating.textContent = movie.rating || 'N/A';

  return cardElement;
}

function renderMovieList(movies) {
  clearMovieList();

  const movieCards = movies.map(renderMovieCard);

  catalogRefs.movieList.append(...movieCards);
  setEmptyState(movies.length === 0);
}

function updateClearButtonVisibility() {
  const hasQuery = catalogRefs.queryInput.value.trim() !== '';

  catalogRefs.clearButton.classList.toggle('is-hidden', !hasQuery);
}

function handleClearSearch() {
  catalogRefs.queryInput.value = '';
  catalogRefs.queryInput.focus();

  updateClearButtonVisibility();
}

function handleSearchSubmit(event) {
  event.preventDefault();

  catalogState.query = catalogRefs.queryInput.value.trim();
  catalogState.year = catalogRefs.yearSelect.value;
  catalogState.page = 1;

  clearMovieList();
  clearPagination();
  setEmptyState(false);
}

populateYearSelect();
catalogRefs.queryInput.addEventListener('input', updateClearButtonVisibility);
catalogRefs.clearButton.addEventListener('click', handleClearSearch);
catalogRefs.form.addEventListener('submit', handleSearchSubmit);

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
