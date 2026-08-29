const IMAGE_BASE_URL = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;
const API_BASE_URL = import.meta.env.VITE_TMDB_BASE_URL;
const apiKey = import.meta.env.VITE_TMDB_API_KEY;

const modal = document.querySelector('#movie-modal');
const modalOverlay = modal?.querySelector('.modal__overlay');
const closeButton = modal?.querySelector('.modal__close');

const trailerModal = document.querySelector('#trailer-modal');
const trailerModalOverlay = trailerModal?.querySelector(
  '.trailer-modal__overlay'
);
const trailerCloseButton = trailerModal?.querySelector(
  '.trailer-modal__close'
);
const trailerVideo = trailerModal?.querySelector(
  '.trailer-modal__video'
);

const poster = modal?.querySelector('.modal__poster');
const title = modal?.querySelector('.modal__title');
const rating = modal?.querySelector('.modal__rating-value');
const popularity = modal?.querySelector('.modal__popularity-value');
const overview = modal?.querySelector('.modal__overview');
const libraryButton = modal?.querySelector('.modal__library-btn');

const LIBRARY_KEY = 'cinemania-library';

let currentMovie = null;

function getLibrary() {
  try {
    return JSON.parse(localStorage.getItem(LIBRARY_KEY)) || [];
  } catch (error) {
    console.error('Failed to read library:', error);
    return [];
  }
}

function saveLibrary(library) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
}

function isMovieInLibrary(movieId) {
  return getLibrary().some(movie => movie.id === movieId);
}

function updateLibraryButton() {
  if (!libraryButton || !currentMovie) {
    return;
  }

  libraryButton.textContent = isMovieInLibrary(currentMovie.id)
    ? 'Remove from My Library'
    : 'Add to My Library';
}

function renderMovie(movie) {
  if (!movie) {
    return;
  }

  currentMovie = movie;

  if (poster) {
    poster.src = movie.poster_path
  ? `${IMAGE_BASE_URL}/w500${movie.poster_path}`
  : '';
    poster.alt = movie.title || 'Movie poster';
  }

  if (title) {
    title.textContent = movie.title || 'Untitled movie';
  }

  if (rating) {
    rating.textContent = Number.isFinite(movie.vote_average)
      ? movie.vote_average.toFixed(1)
      : 'N/A';
  }

  if (popularity) {
    popularity.textContent = Number.isFinite(movie.popularity)
      ? movie.popularity.toFixed(1)
      : 'N/A';
  }

  if (overview) {
    overview.textContent =
      movie.overview || 'No description available.';
  }

  updateLibraryButton();
}

function openModal() {
  if (!modal) {
    return;
  }

  modal.classList.remove('is-hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (!modal) {
    return;
  }

  modal.classList.add('is-hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function handleModalClose(event) {
  if (!modalOverlay) {
    return;
  }

  if (event.target === modalOverlay) {
    closeModal();
  }
}

function handleLibraryClick() {
  if (!currentMovie) {
    return;
  }

  const library = getLibrary();
  const movieIndex = library.findIndex(
    movie => movie.id === currentMovie.id
  );

  if (movieIndex === -1) {
    library.push(currentMovie);
  } else {
    library.splice(movieIndex, 1);
  }

  saveLibrary(library);
  updateLibraryButton();

  window.dispatchEvent(
    new CustomEvent('library-updated', {
      detail: {
        movie: currentMovie,
        library: getLibrary(),
      },
    })
  );
}

async function fetchMovieDetails(movieId) {
  const url = `${API_BASE_URL}/movie/${movieId}?api_key=${apiKey}&language=en-US`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TMDB movie details request failed: ${response.status}`);
  }

  return response.json();
}


async function handleOpenMovieModal(event) {
  const movie = event.detail;

  if (!movie) {
    return;
  }

  try {
    openModal();

    const detailedMovie = await fetchMovieDetails(movie.id);

    renderMovie(detailedMovie);
  } catch (error) {
    console.error('Failed to load movie details:', error);

    renderMovie(movie);
  }
}

window.addEventListener(
  'open-movie-modal',
  handleOpenMovieModal
);

modalOverlay?.addEventListener('click', handleModalClose);
closeButton?.addEventListener('click', closeModal);
libraryButton?.addEventListener('click', handleLibraryClick);
function handleEscape(event) {
  if (event.key === 'Escape') {
    closeModal();
  }
}


window.addEventListener('keydown', handleEscape);

function openTrailerModal(trailer) {
  if (!trailerModal || !trailerVideo || !trailer?.key) {
    return;
  }

  trailerVideo.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;

  trailerModal.classList.remove('is-hidden');
  trailerModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeTrailerModal() {
  if (!trailerModal || !trailerVideo) {
    return;
  }

  trailerVideo.src = '';
  trailerModal.classList.add('is-hidden');
  trailerModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

trailerModalOverlay?.addEventListener('click', event => {
  if (
    event.target === trailerModalOverlay ||
    event.target.closest('[data-trailer-modal-close]')
  ) {
    closeTrailerModal();
  }
});

trailerCloseButton?.addEventListener('click', closeTrailerModal);

window.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeTrailerModal();
  }
});

window.addEventListener(
  'open-trailer-modal',
  event => {
    openTrailerModal(event.detail);
  }
);

