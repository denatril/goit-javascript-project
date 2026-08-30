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
  genres: [],
  page: 1,
  totalPages: 0,
  query: '',
  year: '',
  isLoading: false,
};

const FIRST_MOVIE_YEAR = 1900;
const CURRENT_YEAR = new Date().getFullYear();
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE_URL = import.meta.env.VITE_TMDB_BASE_URL;
const TMDB_IMAGE_BASE_URL = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

function buildTmdbUrl(path, params = {}) {
  const url = new URL(`${TMDB_BASE_URL}${path}`);

  url.searchParams.set('api_key', TMDB_API_KEY);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url;
}

async function fetchTmdb(path, params = {}) {
  const response = await fetch(buildTmdbUrl(path, params));

  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}`);
  }

  return response.json();
}

async function searchMovies({ query, year, page = 1 }) {
  return fetchTmdb('/search/movie', {
    query,
    year,
    page,
    include_adult: false,
    language: 'en-US',
  });
}

async function fetchTrendingMovies(page = 1) {
  return fetchTmdb('/trending/movie/week', {
    page,
    language: 'en-US',
  });
}

async function fetchMovieGenres() {
  const data = await fetchTmdb('/genre/movie/list', {
    language: 'en-US',
  });

  catalogState.genres = data.genres;
}

function getMovieYear(releaseDate) {
  return releaseDate ? releaseDate.slice(0, 4) : '';
}

function getMoviePosterUrl(posterPath) {
  return posterPath ? `${TMDB_IMAGE_BASE_URL}/w500${posterPath}` : '';
}

function getMovieGenres(genreIds) {
  const genres = genreIds
    .map(
      genreId => catalogState.genres.find(genre => genre.id === genreId)?.name
    )
    .filter(Boolean)
    .slice(0, 2);
  return genres.length > 0 ? genres.join(', ') : 'Genre unknown';
}

function normalizeMovie(movie) {
  return {
    ...movie,
    posterUrl: getMoviePosterUrl(movie.poster_path),
    title: movie.title,
    genres: getMovieGenres(movie.genre_ids || []),
    year: getMovieYear(movie.release_date),
    rating: movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A',
  };
}

function getMovieRatingStars(rating) {
  const numericRating = Number(rating);

  if (Number.isNaN(numericRating)) {
    return 'N/A';
  }

  const activeStars = Math.max(0, Math.min(5, Math.round(numericRating / 2)));
  const inactiveStars = 5 - activeStars;

  return `${'★'.repeat(activeStars)}${'☆'.repeat(inactiveStars)}`;
}

// Manual API smoke test:
// searchMovies({ query: 'batman', year: '2023' }).then(console.log).catch(console.error);

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

  cardElement.dataset.movieId = movie.id;
  cardElement.setAttribute('role', 'button');
  cardElement.setAttribute('tabindex', '0');
  cardElement.setAttribute('aria-label', `View details for ${movie.title}`);
  image.alt = movie.title || 'Movie poster';
  if (movie.posterUrl) {
    image.src = movie.posterUrl;
  } else {
    image.hidden = true;
    cardElement.classList.add('is-missing-poster');
  }
  title.textContent = movie.title || 'Untitled movie';
  genres.textContent = movie.genres || 'Genre unknown';
  year.textContent = movie.year || '';
  rating.textContent = getMovieRatingStars(movie.rating);

  return cardElement;
}

function renderMovieList(movies) {
  clearMovieList();

  const movieCards = movies.map(renderMovieCard);

  catalogRefs.movieList.append(...movieCards);
  setEmptyState(movies.length === 0);
}

function openMovieDetails(movie) {
  window.dispatchEvent(
    new CustomEvent('open-movie-modal', {
      detail: movie,
    })
  );
}

function getMovieFromCard(target) {
  const card = target.closest('.movie-list-item');

  if (!card) {
    return null;
  }

  return catalogState.movies.find(
    movie => String(movie.id) === card.dataset.movieId
  );
}

function handleMovieCardClick(event) {
  const movie = getMovieFromCard(event.target);

  if (movie) {
    openMovieDetails(movie);
  }
}

function handleMovieCardKeydown(event) {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  const movie = getMovieFromCard(event.target);

  if (movie) {
    event.preventDefault();
    openMovieDetails(movie);
  }
}

function getPageRange(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function renderPagination(currentPage, totalPages) {
  clearPagination();

  if (totalPages <= 1) {
    return;
  }

  let visiblePages = [];

  if (totalPages <= 10) {
    visiblePages = getPageRange(1, totalPages);
  } else if (currentPage <= 5) {
    visiblePages = [...getPageRange(1, 9), totalPages];
  } else if (currentPage >= totalPages - 4) {
    visiblePages = [1, ...getPageRange(totalPages - 8, totalPages)];
  } else {
    visiblePages = [
      1,
      ...getPageRange(currentPage - 3, currentPage + 3),
      totalPages,
    ];
  }

  const pages = [];

  const uniquePages = [...new Set(visiblePages)];

  for (const [index, page] of uniquePages.entries()) {
    const previousPage = uniquePages[index - 1];

    if (previousPage && page - previousPage > 1) {
      pages.push(`
        <li>
          <span class="pagination-dots">...</span>
        </li>
        `);
    }
    const isActive = page === currentPage;

    pages.push(`
      <li>
        <button
          class="pagination-button${isActive ? ' is-active' : ''}"
          type="button"
          data-page="${page}"
          aria-label="Go to page ${page}"
          ${isActive ? 'aria-current="page"' : ''}
        >
          ${page}
        </button>
      </li>
    `);
  }

  catalogRefs.paginationList.innerHTML = pages.join('');
  catalogRefs.pagination.hidden = false;
}

function updateClearButtonVisibility() {
  const hasQuery = catalogRefs.queryInput.value.trim() !== '';

  catalogRefs.clearButton.classList.toggle('is-hidden', !hasQuery);
}

async function handleClearSearch() {
  catalogRefs.queryInput.value = '';
  catalogRefs.queryInput.focus();

  updateClearButtonVisibility();

  catalogState.query = '';
  catalogState.year = '';
  catalogState.page = 1;
  catalogRefs.yearSelect.value = '';

  try {
    setLoadingState(true);
    clearMovieList();
    clearPagination();

    const data = await fetchTrendingMovies(catalogState.page);
    renderCatalogResponse(data);
  } catch (error) {
    clearMovieList();
    clearPagination();
    setEmptyState(true);
  } finally {
    setLoadingState(false);
  }
}

function renderCatalogResponse(data) {
  const movies = data.results.map(normalizeMovie);

  catalogState.movies = movies;
  catalogState.totalPages = data.total_pages;

  renderMovieList(movies);
  renderPagination(catalogState.page, catalogState.totalPages);
  setEmptyState(movies.length === 0);
}

async function handleSearchSubmit(event) {
  event.preventDefault();

  catalogState.query = catalogRefs.queryInput.value.trim();
  catalogState.year = catalogRefs.yearSelect.value;
  catalogState.page = 1;

  try {
    setLoadingState(true);
    clearMovieList();
    clearPagination();
    setEmptyState(false);

    const data = catalogState.query
      ? await searchMovies({
          query: catalogState.query,
          year: catalogState.year,
          page: catalogState.page,
        })
      : await fetchTrendingMovies(catalogState.page);

    renderCatalogResponse(data);
  } catch (error) {
    clearMovieList();
    clearPagination();
    setEmptyState(true);
  } finally {
    setLoadingState(false);
  }
}

async function handlePaginationClick(event) {
  const pageButton = event.target.closest('.pagination-button');

  if (!pageButton) {
    return;
  }

  const nextPage = Number(pageButton.dataset.page);

  if (nextPage === catalogState.page || catalogState.isLoading) {
    return;
  }

  try {
    setLoadingState(true);

    const data = catalogState.query
      ? await searchMovies({
          query: catalogState.query,
          year: catalogState.year,
          page: nextPage,
        })
      : await fetchTrendingMovies(nextPage);

    catalogState.page = nextPage;
    renderCatalogResponse(data);

    catalogRefs.resultsSection.scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    setEmptyState(true);
  } finally {
    setLoadingState(false);
  }
}

async function initCatalogPage() {
  populateYearSelect();

  try {
    setLoadingState(true);
    try {
      await fetchMovieGenres();
    } catch (error) {
      catalogState.genres = [];
    }

    const data = await fetchTrendingMovies(catalogState.page);
    renderCatalogResponse(data);
  } catch (error) {
    clearMovieList();
    clearPagination();
    setEmptyState(true);
  } finally {
    setLoadingState(false);
  }
}

initCatalogPage();

catalogRefs.queryInput.addEventListener('input', updateClearButtonVisibility);
catalogRefs.clearButton.addEventListener('click', handleClearSearch);
catalogRefs.form.addEventListener('submit', handleSearchSubmit);
catalogRefs.paginationList.addEventListener('click', handlePaginationClick);
catalogRefs.movieList.addEventListener('click', handleMovieCardClick);
catalogRefs.movieList.addEventListener('keydown', handleMovieCardKeydown);

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
