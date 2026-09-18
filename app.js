import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { addDoc, collection, deleteDoc, doc, getFirestore, onSnapshot, orderBy, query, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyABaNnzRLmXvtWSh_vEDjjEWsnBq4_d7ao',
  authDomain: 'fieldnotes-4bcd8.firebaseapp.com',
  projectId: 'fieldnotes-4bcd8',
  storageBucket: 'fieldnotes-4bcd8.firebasestorage.app',
  messagingSenderId: '891910049433',
  appId: '1:891910049433:web:587239fab394b4b4e67208',
};

const app = initializeApp(firebaseConfig);
const database = getFirestore(app);
const notesCollection = collection(database, 'notes');
const cloudinaryCloudName = 'xmpt1lso';
const cloudinaryUploadPreset = 'field-notes';
const captureDialog = document.querySelector('#capture-dialog');
const captureForm = document.querySelector('#capture-form');
const imageInput = document.querySelector('#post-image');
const cameraInput = document.querySelector('#camera-image');
const imageEditor = document.querySelector('#image-editor');
const previewImage = document.querySelector('#preview-image');
const imageList = document.querySelector('#image-list');
const cropZoom = document.querySelector('#crop-zoom');
const cropX = document.querySelector('#crop-x');
const cropY = document.querySelector('#crop-y');
const notesGrid = document.querySelector('#notes-grid');
const emptyState = document.querySelector('#empty-state');
const carousel = document.querySelector('#notes-grid');
const previousButton = document.querySelector('[data-carousel-prev]');
const nextButton = document.querySelector('[data-carousel-next]');
const noteDialog = document.querySelector('#note-dialog');
const viewerImageWrap = document.querySelector('#viewer-image-wrap');
const viewerImage = document.querySelector('#viewer-image');
const viewerMeta = document.querySelector('#viewer-meta');
const viewerTitle = document.querySelector('#note-dialog-title');
const viewerCopy = document.querySelector('#viewer-copy');
const uploadStatus = document.querySelector('#upload-status');
const draftKey = 'rubens-field-note-draft';
let selectedImage = '';
let selectedImages = [];
let thumbnailCrop = { zoom: 100, x: 50, y: 50 };
let posts = [];
let dragStart = null;

const openCapture = () => {
  const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
  if (draft) {
    document.querySelector('#post-title').value = draft.title || '';
    document.querySelector('#post-location').value = draft.location || '';
    document.querySelector('#post-date').value = draft.date || '';
    document.querySelector('#post-body').value = draft.body || '';
  }
  openDialog(captureDialog);
};
document.querySelectorAll('[data-open-capture]').forEach((button) => button.addEventListener('click', openCapture));
document.querySelector('[data-close-capture]').addEventListener('click', () => closeDialog(captureDialog));

document.querySelector('[data-save-draft]').addEventListener('click', () => {
  const data = formData();
  localStorage.setItem(draftKey, JSON.stringify(data));
  const button = document.querySelector('[data-save-draft]');
  button.textContent = 'Draft saved';
  setTimeout(() => { button.textContent = 'Save draft'; }, 1600);
});
document.querySelector('[data-export-note]').addEventListener('click', () => {
  const data = formData();
  const markdown = `---\ntitle: "${data.title.replace(/"/g, '\\"')}"\ndate: ${data.date || new Date().toISOString().slice(0, 10)}\nlocation: "${data.location.replace(/"/g, '\\"')}"\n---\n\n${data.body}\n`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown' }));
  link.download = `${(data.title || 'field-note').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.md`;
  link.click();
  URL.revokeObjectURL(link.href);
});

imageInput.addEventListener('change', () => addFiles(imageInput.files));
cameraInput.addEventListener('change', () => addFiles(cameraInput.files));
function addFiles(files) {
  if (!files.length) return;
  uploadStatus.textContent = 'Processing photos...';
  Promise.all([...files].map(compressImage)).then((images) => {
    selectedImages.push(...images);
    if (selectedImages.length) {
      selectedImage ||= selectedImages[0].src;
      thumbnailCrop = { zoom: 100, x: 50, y: 50 };
    }
    renderImageEditor();
    uploadStatus.textContent = `${selectedImages.length} photo${selectedImages.length === 1 ? '' : 's'} ready`;
  }).catch((error) => {
    uploadStatus.textContent = 'A photo could not be processed. Try another image.';
    console.error(error);
  });
}
document.querySelector('[data-clear-image]').addEventListener('click', clearImages);
cropZoom.addEventListener('input', updateCrop);
cropX.addEventListener('input', updateCrop);
cropY.addEventListener('input', updateCrop);
document.querySelector('.crop-box').addEventListener('pointerdown', (event) => {
  event.preventDefault();
  dragStart = { x: event.clientX, y: event.clientY, cropX: thumbnailCrop.x, cropY: thumbnailCrop.y };
  event.currentTarget.setPointerCapture(event.pointerId);
  event.currentTarget.classList.add('is-dragging');
});
document.querySelector('.crop-box').addEventListener('pointermove', (event) => {
  if (!dragStart) return;
  event.preventDefault();
  const box = event.currentTarget.getBoundingClientRect();
  thumbnailCrop.x = clamp(dragStart.cropX + ((event.clientX - dragStart.x) / box.width) * 100, 0, 100);
  thumbnailCrop.y = clamp(dragStart.cropY + ((event.clientY - dragStart.y) / box.height) * 100, 0, 100);
  applyCropStyles();
});
document.querySelector('.crop-box').addEventListener('pointerup', endCropDrag);
document.querySelector('.crop-box').addEventListener('pointercancel', endCropDrag);
function endCropDrag(event) {
  event.preventDefault();
  dragStart = null;
  event.currentTarget.classList.remove('is-dragging');
  cropX.value = thumbnailCrop.x;
  cropY.value = thumbnailCrop.y;
}
function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('error', () => reject(reader.error));
    reader.addEventListener('load', () => {
      const image = new Image();
      image.addEventListener('error', () => reject(new Error('Image could not be decoded')));
      image.addEventListener('load', () => {
      const scale = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Image compression failed'));
          return;
        }
        resolve({ src: canvas.toDataURL('image/jpeg', .72), blob, name: file.name });
      }, 'image/jpeg', .72);
    });
    image.src = reader.result;
  });
  reader.readAsDataURL(file);
  });
}
function renderImageEditor() {
  imageEditor.hidden = selectedImages.length === 0;
  previewImage.src = selectedImage;
  applyCropStyles();
  cropZoom.value = thumbnailCrop.zoom;
  cropX.value = thumbnailCrop.x;
  cropY.value = thumbnailCrop.y;
  imageList.replaceChildren();
  selectedImages.forEach((image, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `image-choice${image.src === selectedImage ? ' is-selected' : ''}`;
    button.dataset.imageIndex = index;
    button.innerHTML = `<img src="${image.src}" alt="${escapeHtml(image.name)}"><span>${index + 1}</span>`;
    imageList.append(button);
  });
}
function applyCropStyles() {
  previewImage.style.objectPosition = `${thumbnailCrop.x}% ${thumbnailCrop.y}%`;
  previewImage.style.transform = `scale(${thumbnailCrop.zoom / 100})`;
}
imageList.addEventListener('click', (event) => {
  const choice = event.target.closest('[data-image-index]');
  if (!choice) return;
  selectedImage = selectedImages[Number(choice.dataset.imageIndex)].src;
  thumbnailCrop = { zoom: 100, x: 50, y: 50 };
  renderImageEditor();
});
function updateCrop() {
  thumbnailCrop = { zoom: Number(cropZoom.value), x: Number(cropX.value), y: Number(cropY.value) };
  renderImageEditor();
}
function clearImages() {
  selectedImage = '';
  selectedImages = [];
  imageInput.value = '';
  cameraInput.value = '';
  imageEditor.hidden = true;
  uploadStatus.textContent = '';
}
notesGrid.addEventListener('click', async (event) => {
  const deleteButton = event.target.closest('[data-delete-note]');
  if (deleteButton) {
    if (!confirm('Delete this note?')) return;
    try {
      await deleteDoc(doc(database, 'notes', deleteButton.dataset.deleteNote));
    } catch (error) {
      alert('The note could not be deleted. Check your Firebase connection.');
      console.error(error);
    }
    return;
  }
  const noteButton = event.target.closest('[data-open-note]');
  if (noteButton) openNote(noteButton.dataset.openNote);
});
document.querySelector('[data-close-note]').addEventListener('click', () => closeDialog(noteDialog));
previousButton.addEventListener('click', () => carousel.scrollBy({ left: -carousel.clientWidth * .82, behavior: 'smooth' }));
nextButton.addEventListener('click', () => carousel.scrollBy({ left: carousel.clientWidth * .82, behavior: 'smooth' }));

captureForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const publishButton = captureForm.querySelector('[type="submit"]');
  publishButton.disabled = true;
  try {
    if (imageInput.files.length && selectedImages.length !== imageInput.files.length) {
      uploadStatus.textContent = 'Please wait for the photos to finish processing.';
      return;
    }
    uploadStatus.textContent = 'Uploading note...';
    const uploadedImages = await Promise.all(selectedImages.map(uploadToCloudinary));
    const thumbnailIndex = Math.max(0, selectedImages.findIndex((image) => image.src === selectedImage));
    await addDoc(notesCollection, {
      ...formData(),
      image: uploadedImages[thumbnailIndex] || '',
      images: uploadedImages,
      cropZoom: thumbnailCrop.zoom,
      cropX: thumbnailCrop.x,
      cropY: thumbnailCrop.y,
      createdAt: serverTimestamp(),
    });
    localStorage.removeItem(draftKey);
    captureForm.reset();
    selectedImage = '';
    clearImages();
    closeDialog(captureDialog);
    uploadStatus.textContent = '';
    document.querySelector('#notes').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    uploadStatus.textContent = 'Publish failed. Check Cloudinary and Firestore setup.';
    alert('The note could not be published. Check that Cloudinary and Firestore are configured.');
    console.error(error);
  } finally {
    publishButton.disabled = false;
  }
});

function formData() {
  return {
    title: document.querySelector('#post-title').value,
    location: document.querySelector('#post-location').value,
    date: document.querySelector('#post-date').value,
    body: document.querySelector('#post-body').value,
  };
}
async function uploadToCloudinary(image) {
  const formData = new FormData();
  formData.append('file', image.blob, image.name);
  formData.append('upload_preset', cloudinaryUploadPreset);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error(`Cloudinary upload failed: ${response.status}`);
  const result = await response.json();
  return result.secure_url;
}
function prettyDate(date) {
  if (!date) return 'JUST NOW';
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
}
function renderPosts() {
  notesGrid.replaceChildren();
  posts.forEach((post) => {
    const card = document.createElement('article');
    card.className = `note-card ${post.image ? 'note-card-photo' : 'note-card-plain'}`;
    card.dataset.openNote = post.id;
    const image = post.image ? `<div class="note-image" style="background-image:url('${post.image}'); background-position:${post.cropX || 50}% ${post.cropY || 50}%; background-size:${post.cropZoom || 100}%" role="img" aria-label="Photo from ${escapeHtml(post.title)}"></div>` : '';
    card.innerHTML = `${image}<div class="note-content"><button class="note-open" type="button" data-open-note="${post.id}"><p class="post-meta">${prettyDate(post.date)} <span>•</span> ${escapeHtml(post.location || 'FIELD NOTE')}</p><h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.body).slice(0, 100)}${post.body.length > 100 ? '…' : ''}</p></button><button class="delete-note" type="button" data-delete-note="${post.id}">Delete</button><span class="note-arrow">↗</span></div>`;
    notesGrid.prepend(card);
  });
  emptyState.hidden = posts.length > 0;
  previousButton.hidden = posts.length < 2;
  nextButton.hidden = posts.length < 2;
}
function openNote(noteId) {
  const post = posts.find((note) => note.id === noteId);
  if (!post) return;
  viewerMeta.textContent = `${prettyDate(post.date)}  •  ${post.location || 'FIELD NOTE'}`;
  viewerTitle.textContent = post.title;
  viewerCopy.textContent = post.body;
  const images = post.images?.length ? post.images : (post.image ? [post.image] : []);
  viewerImageWrap.hidden = images.length === 0;
  viewerImageWrap.replaceChildren();
  images.forEach((image, index) => {
    const imageElement = document.createElement('img');
    imageElement.src = image;
    imageElement.alt = `${post.title}, image ${index + 1}`;
    viewerImageWrap.append(imageElement);
  });
  openDialog(noteDialog);
}
function openDialog(dialog) {
  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
    return;
  }
  dialog.setAttribute('open', '');
  dialog.classList.add('dialog-fallback-open');
}
function closeDialog(dialog) {
  if (typeof dialog.close === 'function') {
    dialog.close();
    return;
  }
  dialog.removeAttribute('open');
  dialog.classList.remove('dialog-fallback-open');
}
function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}
const notesQuery = query(notesCollection, orderBy('createdAt', 'desc'));
onSnapshot(notesQuery, (snapshot) => {
  posts = snapshot.docs.map((note) => ({ id: note.id, ...note.data() }));
  renderPosts();
}, (error) => {
  emptyState.hidden = false;
  emptyState.textContent = 'Notes are unavailable. Check the Firebase setup.';
  console.error(error);
});
