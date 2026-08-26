const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = import.meta.env.VITE_TMDB_BASE_URL;
const IMAGE_BASE_URL = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

const weeklyList = document.querySelector('[data-weekly-list]');
const upcomingContainer = document.querySelector('[data-upcoming]');

const LIBRARY_KEY = 'my-library';

let genresMap = new Map();

async function fetchFromTMDB(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);

  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'en-US');

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status}`);
  }

  return response.json();
}

async function fetchGenres() {
  const data = await fetchFromTMDB('/genre/movie/list');

  genresMap = new Map(
    data.genres.map(genre => [genre.id, genre.name])
  );
}

function getGenreNames(genreIds = []) {
  if (!genreIds.length) {
    return 'Unknown';
  }

  return genreIds
    .slice(0, 2)
    .map(id => genresMap.get(id))
    .filter(Boolean)
    .join(', ');
}

function getMovieYear(releaseDate) {
  if (!releaseDate) {
    return 'N/A';
  }

  return releaseDate.slice(0, 4);
}

function createStarRating(voteAverage = 0) {
  const rating = Math.round(voteAverage / 2);

  return Array.from({ length: 5 }, (_, index) =>
    index < rating ? '★' : '☆'
  ).join('');
}

function getImageUrl(path, size = 'w500') {
  if (!path) {
    return '';
  }

  return `${IMAGE_BASE_URL}/${size}${path}`;
}

function createWeeklyMovieCard(movie) {
  const item = document.createElement('li');
  item.className = 'weekly-trends__item';
  item.dataset.movieId = movie.id;

  const genres = getGenreNames(movie.genre_ids);
  const year = getMovieYear(movie.release_date);
  const rating = createStarRating(movie.vote_average);

  item.innerHTML = `
    <article class="weekly-trends__card">
      <div class="weekly-trends__image-wrapper">
        <img
          class="weekly-trends__image"
          src="${getImageUrl(movie.poster_path, 'w500')}"
          alt="${movie.title}"
          loading="lazy"
        />

        <div class="weekly-trends__gradient"></div>

        <div class="weekly-trends__info">
          <div>
            <h3 class="weekly-trends__movie-title">
              ${movie.title}
            </h3>

            <p class="weekly-trends__meta">
              ${genres} | ${year}
            </p>
          </div>

          <div
            class="weekly-trends__rating"
            aria-label="Rating ${movie.vote_average.toFixed(1)} out of 10"
          >
            ${rating}
          </div>
        </div>
      </div>
    </article>
  `;

  return item;
}

function renderWeeklyMovies(movies) {
  weeklyList.innerHTML = '';

  if (!movies.length) {
    weeklyList.innerHTML =
      '<li class="weekly-trends__empty">No trending movies found.</li>';
    return;
  }

  const visibleMovies = movies.slice(0, 3);

  visibleMovies.forEach(movie => {
    weeklyList.append(createWeeklyMovieCard(movie));
  });
}

async function loadWeeklyTrends() {
  const data = await fetchFromTMDB('/trending/movie/week');

  renderWeeklyMovies(data.results || []);
}

function getCurrentMonthUpcomingMovies(movies) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  return movies.filter(movie => {
    if (!movie.release_date) {
      return false;
    }

    const releaseDate = new Date(movie.release_date);

    return (
      releaseDate.getFullYear() === currentYear &&
      releaseDate.getMonth() === currentMonth
    );
  });
}

function getRandomMovie(movies) {
  if (!movies.length) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * movies.length);
  return movies[randomIndex];
}

function formatReleaseDate(releaseDate) {
  if (!releaseDate) {
    return 'Unknown';
  }

  const date = new Date(releaseDate);

  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

function getLibraryMovies() {
  try {
    return JSON.parse(localStorage.getItem(LIBRARY_KEY)) || [];
  } catch {
    return [];
  }
}

function saveLibraryMovies(movies) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(movies));
}

function isMovieInLibrary(movieId) {
  return getLibraryMovies().some(movie => movie.id === movieId);
}

function toggleMovieInLibrary(movie) {
  const libraryMovies = getLibraryMovies();

  const movieIndex = libraryMovies.findIndex(
    libraryMovie => libraryMovie.id === movie.id
  );

  if (movieIndex >= 0) {
    libraryMovies.splice(movieIndex, 1);
  } else {
    libraryMovies.push(movie);
  }

  saveLibraryMovies(libraryMovies);
}

function getLibraryButtonText(movieId) {
  return isMovieInLibrary(movieId)
    ? 'Remove from my library'
    : 'Add to my library';
}

function renderUpcomingMovie(movie) {
  if (!movie) {
    upcomingContainer.innerHTML = `
      <p class="upcoming__empty">
        There are no upcoming movies for this month.
      </p>
    `;
    return;
  }

  const genres = getGenreNames(movie.genre_ids);

  upcomingContainer.innerHTML = `
    <div class="upcoming__media">
      <img
        class="upcoming__image"
        src="${getImageUrl(movie.backdrop_path || movie.poster_path, 'original')}"
        alt="${movie.title}"
      />
    </div>

    <div class="upcoming__info">
      <h3 class="upcoming__title">${movie.title}</h3>

      <div class="upcoming__details">
        <div class="upcoming__row">
          <span class="upcoming__label">Release date</span>
          <span class="upcoming__value upcoming__release">
            ${formatReleaseDate(movie.release_date)}
          </span>
        </div>

        <div class="upcoming__row">
          <span class="upcoming__label">Vote / Votes</span>
          <span class="upcoming__value">
            ${movie.vote_average.toFixed(1)} / ${movie.vote_count}
          </span>
        </div>

        <div class="upcoming__row">
          <span class="upcoming__label">Popularity</span>
          <span class="upcoming__value">
            ${movie.popularity.toFixed(1)}
          </span>
        </div>

        <div class="upcoming__row">
          <span class="upcoming__label">Genre</span>
          <span class="upcoming__value">
            ${genres}
          </span>
        </div>
      </div>

      <h4 class="upcoming__about-title">About</h4>

      <p class="upcoming__description">
        ${movie.overview || 'No description available.'}
      </p>

      <button
        class="upcoming__button"
        type="button"
        data-library-button
      >
        ${getLibraryButtonText(movie.id)}
      </button>
    </div>
  `;

  const libraryButton = upcomingContainer.querySelector(
    '[data-library-button]'
  );

  libraryButton.addEventListener('click', () => {
    toggleMovieInLibrary(movie);
    libraryButton.textContent = getLibraryButtonText(movie.id);
  });
}

async function loadUpcomingMovie() {
  const data = await fetchFromTMDB('/movie/upcoming', {
    page: 1,
  });

  const currentMonthMovies = getCurrentMonthUpcomingMovies(
    data.results || []
  );

  const selectedMovie = getRandomMovie(currentMonthMovies);

  renderUpcomingMovie(selectedMovie);
}

function renderError(container, message) {
  container.innerHTML = `
    <p class="home-error">
      ${message}
    </p>
  `;
}

async function initHome() {
  if (!API_KEY || !BASE_URL || !IMAGE_BASE_URL) {
    renderError(
      weeklyList,
      'TMDB configuration is missing.'
    );

    renderError(
      upcomingContainer,
      'TMDB configuration is missing.'
    );

    return;
  }

  try {
    await fetchGenres();
  } catch (error) {
    console.error(error);
  }

  try {
    await loadWeeklyTrends();
  } catch (error) {
    console.error(error);

    renderError(
      weeklyList,
      'Weekly trends could not be loaded.'
    );
  }

  try {
    await loadUpcomingMovie();
  } catch (error) {
    console.error(error);

    renderError(
      upcomingContainer,
      'Upcoming movie could not be loaded.'
    );
  }
}

initHome();