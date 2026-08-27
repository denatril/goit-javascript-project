const libraryRefs = {
  genreSelect: document.querySelector('#library-genre'),
  movieList: document.querySelector('.library-movie-list'),
  emptyState: document.querySelector('.library-empty'),
  loadMoreButton: document.querySelector('.library-load-more'),
  scrollUpButton: document.querySelector('.library-page .scroll-up'),
  cardTemplate: document.querySelector('#library-movie-card-template'),
};

const libraryState = {
  movies: [],
  filteredMovies: [],
  activeGenre: '',
  visibleCount: 9,
};

const LIBRARY_STORAGE_KEYS = ['libraryMovies', 'myLibrary', 'movies'];
const TMDB_IMAGE_BASE_URL = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

function getStoredLibraryMovies() {
  for (const key of LIBRARY_STORAGE_KEYS) {
    const storedMovies = localStorage.getItem(key);

    if (!storedMovies) {
      continue;
    }

    try {
      const parsedMovies = JSON.parse(storedMovies);

      if (Array.isArray(parsedMovies)) {
        return parsedMovies;
      }
    } catch (error) {
      console.warn(`Invalid library data in localStorage key: ${key}`);
    }
  }

  return [];
}

function getLibraryMovieYear(movie) {
  if (movie.year) {
    return String(movie.year);
  }

  if (movie.release_date) {
    return movie.release_date.slice(0, 4);
  }

  return 'Year unknown';
}

function getLibraryMovieGenres(movie) {
  if (typeof movie.genres === 'string') {
    return movie.genres;
  }

  if (Array.isArray(movie.genres)) {
    return movie.genres
      .map(genre => (typeof genre === 'string' ? genre : genre.name))
      .filter(Boolean)
      .slice(0, 2)
      .join(', ');
  }

  return 'Genre unknown';
}

function getLibraryMoviePosterUrl(movie) {
  const posterUrl = movie.posterUrl || movie.poster || movie.poster_path || '';

  if (posterUrl.startsWith('/')) {
    return `${TMDB_IMAGE_BASE_URL}/w500${posterUrl}`;
  }

  return posterUrl;
}

function normalizeLibraryMovie(movie) {
  return {
    posterUrl: getLibraryMoviePosterUrl(movie),
    title: movie.title || movie.name || 'Untitled movie',
    genres: getLibraryMovieGenres(movie),
    year: getLibraryMovieYear(movie),
    rating: movie.rating || movie.vote_average || 'N/A',
  };
}

function getLibraryMovieRatingStars(rating) {
  const numericRating = Number(rating);

  if (Number.isNaN(numericRating)) {
    return 'N/A';
  }

  const activeStars = Math.max(0, Math.min(5, Math.round(numericRating / 2)));
  const inactiveStars = 5 - activeStars;

  return `${'★'.repeat(activeStars)}${'☆'.repeat(inactiveStars)}`;
}

function clearLibraryMovieList() {
  libraryRefs.movieList.innerHTML = '';
}

function setLibraryEmptyState(isEmpty) {
  libraryRefs.emptyState.hidden = !isEmpty;
}

function setLoadMoreVisibility(totalMovies) {
  libraryRefs.loadMoreButton.hidden = libraryState.visibleCount >= totalMovies;
}

function renderLibraryMovieCard(movie) {
  const card = libraryRefs.cardTemplate.content.firstElementChild.cloneNode(true);

  const image = card.querySelector('.library-movie-card-image');
  const title = card.querySelector('.library-movie-card-title');
  const genres = card.querySelector('.library-movie-card-genres');
  const year = card.querySelector('.library-movie-card-year');
  const rating = card.querySelector('.library-movie-card-rating-value');

  image.alt = movie.title;
  if (movie.posterUrl) {
    image.src = movie.posterUrl;
  } else {
    image.hidden = true;
    card.classList.add('is-missing-poster');
  }
  title.textContent = movie.title;
  genres.textContent = movie.genres;
  year.textContent = movie.year;
  rating.textContent = getLibraryMovieRatingStars(movie.rating);

  return card;
}

function renderLibraryMovieList(movies) {
  clearLibraryMovieList();

  const visibleMovies = movies.slice(0, libraryState.visibleCount);
  const movieCards = visibleMovies.map(renderLibraryMovieCard);

  libraryRefs.movieList.append(...movieCards);
  setLibraryEmptyState(movies.length === 0);
  setLoadMoreVisibility(movies.length);
}

function getLibraryGenres(movies) {
  const genres = movies.flatMap(movie =>
    movie.genres
      .split(',')
      .map(genre => genre.trim())
      .filter(genre => genre && genre !== 'Genre unknown')
  );

  return [...new Set(genres)].sort((firstGenre, secondGenre) =>
    firstGenre.localeCompare(secondGenre)
  );
}

function populateLibraryGenres(movies) {
  const genres = getLibraryGenres(movies);
  const genreOptions = genres.map(genre => {
    const option = document.createElement('option');

    option.value = genre;
    option.textContent = genre;

    return option;
  });

  libraryRefs.genreSelect.append(...genreOptions);
}

function filterLibraryMovies() {
  libraryState.activeGenre = libraryRefs.genreSelect.value;
  libraryState.visibleCount = 9;

  libraryState.filteredMovies = libraryState.activeGenre
    ? libraryState.movies.filter(movie =>
        movie.genres
          .split(',')
          .map(genre => genre.trim())
          .includes(libraryState.activeGenre)
      )
    : libraryState.movies;

  renderLibraryMovieList(libraryState.filteredMovies);
}

function handleLoadMore() {
  libraryState.visibleCount += 9;
  renderLibraryMovieList(libraryState.filteredMovies);
}

function updateScrollUpVisibility() {
  libraryRefs.scrollUpButton.classList.toggle('is-hidden', window.scrollY < 300);
}

function handleScrollUpClick() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

function initLibraryPage() {
  const storedMovies = getStoredLibraryMovies();
  const normalizedMovies = storedMovies.map(normalizeLibraryMovie);

  libraryState.movies = normalizedMovies;
  libraryState.filteredMovies = normalizedMovies;

  populateLibraryGenres(libraryState.movies);
  renderLibraryMovieList(libraryState.filteredMovies);
}

libraryRefs.genreSelect.addEventListener('change', filterLibraryMovies);
libraryRefs.loadMoreButton.addEventListener('click', handleLoadMore);
libraryRefs.scrollUpButton.addEventListener('click', handleScrollUpClick);
window.addEventListener('scroll', updateScrollUpVisibility);

initLibraryPage();
updateScrollUpVisibility();
