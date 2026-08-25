const modal = document.querySelector('#movie-modal');
const modalOverlay = modal?.querySelector('.modal__overlay');
const closeButton = modal?.querySelector('.modal__close');

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
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
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
  if (!modalOverlay || !event.target) {
    return;
  }

  if (
    event.target === modalOverlay ||
    event.target.closest('[data-modal-close]')
  ) {
    closeModal();
  }
}

function handleEscape(event) {
  if (event.key === 'Escape') {
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

function handleOpenMovieModal(event) {
  renderMovie(event.detail);
  openModal();
}

modalOverlay?.addEventListener('click', handleModalClose);
closeButton?.addEventListener('click', closeModal);
libraryButton?.addEventListener('click', handleLibraryClick);

window.addEventListener('keydown', handleEscape);

window.addEventListener(
  'open-movie-modal',
  handleOpenMovieModal
);
