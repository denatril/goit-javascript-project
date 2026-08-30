const API_BASE_URL = import.meta.env.VITE_TMDB_BASE_URL;
const IMAGE_BASE_URL = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;
const heroElement = document.querySelector('.hero');
const heroTitle = document.querySelector('.hero__title');
const heroDescription = document.querySelector('.hero__description');
const heroRatingStarsFill = document.querySelector('.hero__rating-stars-fill');
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
    `${API_BASE_URL}/trending/movie/day` + `?api_key=${apiKey}&language=en-US`;

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
      movie.release_date && movie.release_date <= today && movie.backdrop_path
    );
  });

  if (!availableMovies.length) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * availableMovies.length);

  return availableMovies[randomIndex];
}

function renderHero(movie) {
  if (!movie) {
    renderFallbackHero();
    return;
  }

  currentMovie = movie;

  if (heroElement) {
    if (movie.backdrop_path) {
      console.log('BACKDROP PATH:', movie.backdrop_path);
      console.log('IMAGE BASE URL:', IMAGE_BASE_URL);
      const backdropUrl = `${IMAGE_BASE_URL}/w1280${movie.backdrop_path}`;

      heroElement.style.backgroundImage = `url("${backdropUrl}")`;
      heroElement.style.backgroundSize = 'cover';
      heroElement.style.backgroundPosition = 'center';
      heroElement.style.backgroundRepeat = 'no-repeat';
    } else {
      heroElement.style.backgroundImage = '';
    }
  }

  if (heroTitle) {
    heroTitle.textContent = movie.title || 'Untitled movie';
  }

  if (heroRatingStarsFill) {
    const rating = Number(movie.vote_average);

    const fillPercentage = Number.isFinite(rating)
      ? Math.min(Math.max(rating / 10, 0), 1) * 100
      : 0;

    heroRatingStarsFill.style.width = `${fillPercentage}%`;
  }

  if (heroDescription) {
    heroDescription.textContent = movie.overview || 'No description available.';
  }
}

function renderFallbackHero() {
  currentMovie = null;

  heroElement.style.backgroundImage = '';

  heroTitle.textContent = 'Discover your next movie';

  heroDescription.textContent =
    'Explore trending movies and find something great to watch.';

  if (heroRatingStarsFill) {
    heroRatingStarsFill.style.width = '0%';
  }
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

  const trailer = data.results
    ?.filter(video => video.site === 'YouTube' && video.key)
    .sort((a, b) => {
      const score = video => {
        if (video.type === 'Trailer' && video.official === true) return 3;
        if (video.type === 'Trailer') return 2;
        if (video.type === 'Teaser') return 1;
        return 0;
      };

      return score(b) - score(a);
    })[0];

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
      window.dispatchEvent(new CustomEvent('trailer-not-found'));
      return;
    }

    openTrailerModal(trailer);
  } catch (error) {
    console.error('Failed to load trailer:', error);

    window.dispatchEvent(new CustomEvent('trailer-not-found'));
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
