const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

const heroElement = document.querySelector('.hero');
const heroTitle = document.querySelector('.hero__title');
const heroDescription = document.querySelector('.hero__description');
const heroRating = document.querySelector('.hero__rating-value');
const trailerButton = document.querySelector('.hero__button--trailer');
const detailsButton = document.querySelector('.hero__button--details');

const apiKey = import.meta.env.VITE_TMDB_API_KEY;

let currentMovie = null;

function getToday() {
  return new Date().toISOString().split('T')[0];
}

async function fetchTrendingMovies() {
  if (!apiKey) {
    console.warn('TMDB API key is not configured yet.');
    return [];
  }

  const url =
    `${API_BASE_URL}/trending/movie/day` +
    `?api_key=${apiKey}&language=en-US`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status}`);
  }

  const data = await response.json();

  return data.results || [];
}

function getRandomMovie(movies) {
  const today = getToday();

  const availableMovies = movies.filter(movie => {
    return (
      movie.release_date &&
      movie.release_date <= today &&
      movie.backdrop_path
    );
  });

  if (!availableMovies.length) {
    return null;
  }

  const randomIndex = Math.floor(
    Math.random() * availableMovies.length
  );

  return availableMovies[randomIndex];
}

function renderHero(movie) {
  if (!movie) {
    renderFallbackHero();
    return;
  }

  currentMovie = movie;

  heroElement.style.backgroundImage =
    `url("${IMAGE_BASE_URL}${movie.backdrop_path}")`;

  heroTitle.textContent = movie.title || 'Untitled movie';

  heroDescription.textContent =
    movie.overview || 'No description available.';

  heroRating.textContent =
    movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
}

function renderFallbackHero() {
  currentMovie = null;

  heroElement.style.backgroundImage = '';

  heroTitle.textContent = 'Discover your next movie';

  heroDescription.textContent =
    'Explore trending movies and find something great to watch.';

  heroRating.textContent = 'N/A';
}

async function getHeroMovie() {
  try {
    const movies = await fetchTrendingMovies();
    const randomMovie = getRandomMovie(movies);

    renderHero(randomMovie);
  } catch (error) {
    console.error('Failed to load Hero movie:', error);
    renderFallbackHero();
  }
}

async function fetchTrailer(movieId) {
  if (!apiKey || !movieId) {
    return null;
  }

  const url =
    `${API_BASE_URL}/movie/${movieId}/videos` +
    `?api_key=${apiKey}&language=en-US`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Trailer request failed: ${response.status}`);
  }

  const data = await response.json();

  const trailer = data.results?.find(video => {
    return (
      video.site === 'YouTube' &&
      video.type === 'Trailer' &&
      video.official === true
    );
  });

  return trailer || null;
}

function openMovieModal(movie) {
  window.dispatchEvent(
    new CustomEvent('open-movie-modal', {
      detail: movie,
    })
  );
}

function openTrailerModal(trailer) {
  window.dispatchEvent(
    new CustomEvent('open-trailer-modal', {
      detail: trailer,
    })
  );
}

async function handleTrailerClick() {
  if (!currentMovie) {
    return;
  }

  try {
    const trailer = await fetchTrailer(currentMovie.id);

    if (!trailer) {
      window.dispatchEvent(
        new CustomEvent('trailer-not-found')
      );
      return;
    }

    openTrailerModal(trailer);
  } catch (error) {
    console.error('Failed to load trailer:', error);

    window.dispatchEvent(
      new CustomEvent('trailer-not-found')
    );
  }
}

function handleDetailsClick() {
  if (!currentMovie) {
    return;
  }

  openMovieModal(currentMovie);
}

trailerButton?.addEventListener('click', handleTrailerClick);
detailsButton?.addEventListener('click', handleDetailsClick);

getHeroMovie();
