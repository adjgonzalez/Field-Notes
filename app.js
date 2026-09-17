const captureDialog = document.querySelector('#capture-dialog');
const readDialog = document.querySelector('#read-dialog');
const captureForm = document.querySelector('#capture-form');
const imageInput = document.querySelector('#post-image');
const imagePreview = document.querySelector('#image-preview');
const previewImage = document.querySelector('#preview-image');
const notesGrid = document.querySelector('#notes-grid');
const emptyState = document.querySelector('#empty-state');
const draftKey = 'rubens-field-note-draft';
const postsKey = 'rubens-field-notes';
let selectedImage = '';

const openCapture = () => {
  const draft = JSON.parse(localStorage.getItem(draftKey) || 'null');
  if (draft) {
    document.querySelector('#post-title').value = draft.title || '';
    document.querySelector('#post-location').value = draft.location || '';
    document.querySelector('#post-date').value = draft.date || '';
    document.querySelector('#post-body').value = draft.body || '';
  }
  captureDialog.showModal();
};
document.querySelectorAll('[data-open-capture]').forEach((button) => button.addEventListener('click', openCapture));
document.querySelector('[data-close-capture]').addEventListener('click', () => captureDialog.close());

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

imageInput.addEventListener('change', () => {
  const [file] = imageInput.files;
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    selectedImage = reader.result;
    previewImage.src = selectedImage;
    imagePreview.hidden = false;
  });
  reader.readAsDataURL(file);
});
document.querySelector('[data-clear-image]').addEventListener('click', () => {
  selectedImage = '';
  imageInput.value = '';
  imagePreview.hidden = true;
});
notesGrid.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('[data-delete-note]');
  if (!deleteButton || !confirm('Delete this note?')) return;
  const posts = JSON.parse(localStorage.getItem(postsKey) || '[]');
  const remainingPosts = posts.filter((post) => String(post.id) !== deleteButton.dataset.deleteNote);
  localStorage.setItem(postsKey, JSON.stringify(remainingPosts));
  renderPosts();
});

captureForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const post = { ...formData(), image: selectedImage, id: Date.now() };
  const posts = JSON.parse(localStorage.getItem(postsKey) || '[]');
  posts.unshift(post);
  localStorage.setItem(postsKey, JSON.stringify(posts));
  localStorage.removeItem(draftKey);
  captureForm.reset();
  selectedImage = '';
  imagePreview.hidden = true;
  captureDialog.close();
  renderPosts();
  document.querySelector('#notes').scrollIntoView({ behavior: 'smooth' });
});

function formData() {
  return {
    title: document.querySelector('#post-title').value,
    location: document.querySelector('#post-location').value,
    date: document.querySelector('#post-date').value,
    body: document.querySelector('#post-body').value,
  };
}
function prettyDate(date) {
  if (!date) return 'JUST NOW';
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
}
function renderPosts() {
  const posts = JSON.parse(localStorage.getItem(postsKey) || '[]');
  notesGrid.replaceChildren();
  posts.forEach((post) => {
    const card = document.createElement('article');
    card.className = `note-card ${post.image ? 'note-card-photo' : 'note-card-plain'}`;
    const image = post.image ? `<div class="note-image" style="background-image:url('${post.image}')" role="img" aria-label="Photo from ${post.title}"></div>` : '';
    card.innerHTML = `${image}<div class="note-content"><p class="post-meta">${prettyDate(post.date)} <span>•</span> ${post.location || 'FIELD NOTE'}</p><h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.body).slice(0, 100)}${post.body.length > 100 ? '…' : ''}</p><button class="delete-note" type="button" data-delete-note="${post.id}">Delete</button><span class="note-arrow">↗</span></div>`;
    notesGrid.prepend(card);
  });
  emptyState.hidden = posts.length > 0;
}
function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}
renderPosts();
