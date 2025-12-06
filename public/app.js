import { Editor } from 'https://esm.sh/@tiptap/core';
import StarterKit from 'https://esm.sh/@tiptap/starter-kit';
import Placeholder from 'https://esm.sh/@tiptap/extension-placeholder';

// --- STATE ---
let allNotes = [];
let activeNoteId = null;
let currentFilter = 'all'; 
let folders = new Set(['General', 'Personal', 'Work']); 
let notePendingDeletion = null;
let folderPendingDeletion = null;
let notePendingMove = null;

// --- 1. EDITOR ---
const editor = new Editor({
  element: document.querySelector('#editor'),
  extensions: [ StarterKit, Placeholder.configure({ placeholder: 'Start writing...' }) ],
  content: '',
  editorProps: { attributes: { class: 'prose-editor' } },
  onUpdate: ({ editor }) => { saveCurrentNote(); updateStats(editor); },
  onSelectionUpdate: ({ editor }) => updateStats(editor)
});

// --- 2. API CALLS ---
async function fetchNotes() {
    if (allNotes.length === 0) renderSkeleton();
    try {
        const response = await fetch('/api/notes');
        allNotes = await response.json();
        allNotes.forEach(note => { if (note.folder) folders.add(note.folder); });
        renderFolders();
        renderNoteList();
        if (getFilteredNotes().length > 0 && !activeNoteId) {
            const first = getFilteredNotes()[0];
            selectNote(first._id, first.content);
        }
    } catch (e) { console.error(e); }
}

async function createNewNote() {
    if (currentFilter === 'trash') { showToast("⚠️ Switch to Workspace to create notes.", "error"); return; }
    const response = await fetch('/api/notes', { method: 'POST' });
    const newNote = await response.json();
    if (currentFilter.startsWith('folder-')) {
        const folderName = currentFilter.replace('folder-', '');
        newNote.folder = folderName;
        await updateNoteInDb(newNote._id, { folder: folderName });
    }
    await fetchNotes(); selectNote(newNote._id, newNote.content); showToast("New note created", "success");
}

async function updateNoteInDb(id, data) {
    await fetch(`/api/notes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const note = allNotes.find(n => n._id === id);
    if (note) Object.assign(note, data);
    renderNoteList(document.querySelector('.search-input').value);
}

let timeoutId = null;
function saveCurrentNote() {
    if (!activeNoteId || currentFilter === 'trash') return;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
        const content = editor.getHTML();
        const title = extractTitle(content);
        await updateNoteInDb(activeNoteId, { title, content });
    }, 1000);
}

// --- 3. UI RENDERING ---
function getFilteredNotes() {
    let filtered = [];
    if (currentFilter === 'all') filtered = allNotes.filter(n => !n.deleted);
    else if (currentFilter === 'favorites') filtered = allNotes.filter(n => n.favorite && !n.deleted);
    else if (currentFilter === 'trash') filtered = allNotes.filter(n => n.deleted);
    else if (currentFilter.startsWith('folder-')) filtered = allNotes.filter(n => n.folder === currentFilter.replace('folder-', '') && !n.deleted);
    return filtered;
}

function renderNoteList(searchTerm = '') {
    const container = document.getElementById('notes-container');
    container.innerHTML = '';
    let filtered = getFilteredNotes();
    if (searchTerm) {
        searchTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(n => n.title.toLowerCase().includes(searchTerm) || n.content.toLowerCase().includes(searchTerm));
    }

    const headerWrapper = document.querySelector('.list-header-wrapper');
    const headerTitle = currentFilter === 'all' ? 'All Notes' : currentFilter.toUpperCase().replace('FOLDER-', '');
    let extraBtn = currentFilter === 'trash' ? `<button class="empty-trash-btn" onclick="window.confirmEmptyTrash()">Empty Trash</button>` : '';
    headerWrapper.innerHTML = `<div class="list-header">${headerTitle}</div>${extraBtn}`;

    filtered.forEach(note => {
        const div = document.createElement('div');
        div.className = `note-item ${note._id === activeNoteId ? 'selected' : ''}`;
        div.onclick = (e) => { if (e.target.closest('.action-btn')) return; selectNote(note._id, note.content); };
        const preview = note.content.replace(/<[^>]*>?/gm, '').substring(0, 40);
        
        let btns = '';
        if (note.deleted) {
             btns = `<button class="action-btn" onclick="window.restoreNote('${note._id}')" title="Restore"><i class="ri-arrow-go-back-fill" style="color:#10B981"></i></button>
                     <button class="action-btn" onclick="window.deleteNote('${note._id}')" title="Delete Forever"><i class="ri-delete-bin-line" style="color:#ef4444"></i></button>`;
        } else {
             btns = `<button class="action-btn" onclick="window.moveNote('${note._id}')" title="Move Folder"><i class="ri-folder-transfer-line" style="color:var(--icon-color)"></i></button>
                     <button class="action-btn" onclick="window.toggleFav('${note._id}')" title="Favorite"><i class="${note.favorite ? 'ri-star-fill' : 'ri-star-line'}" style="color: ${note.favorite ? '#fbbf24' : 'var(--icon-color)'}"></i></button>
                     <button class="action-btn" onclick="window.deleteNote('${note._id}')" title="Trash"><i class="ri-delete-bin-line" style="color:var(--icon-color)"></i></button>`;
        }

        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <h3 style="margin:0;">${note.title || 'Untitled'}</h3>
                <div>${btns}</div>
            </div>
            <p>${preview}...</p>
            <span class="date">${new Date(note.date).toLocaleDateString()} &bull; ${note.folder}</span>
        `;
        container.appendChild(div);
    });
}

function renderFolders() {
    const folderList = document.getElementById('folder-list');
    folderList.innerHTML = ''; 
    folders.forEach(folder => {
        const div = document.createElement('div');
        div.className = `nav-item ${currentFilter === 'folder-'+folder ? 'active' : ''}`;
        div.onclick = () => setFilter(`folder-${folder}`);
        const delIcon = folder === 'General' ? '' : `<i class="ri-close-line delete-folder-btn" onclick="window.deleteFolder(event, '${folder}')"></i>`;
        div.innerHTML = `<div class="folder-label"><i class="ri-folder-3-line"></i> ${folder}</div>${delIcon}`;
        folderList.appendChild(div);
    });
}

function selectNote(id, content) {
    activeNoteId = id;
    if (editor.getHTML() !== content) editor.commands.setContent(content);
    renderNoteList(document.querySelector('.search-input').value);
    updateStats(editor);
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (filter === 'all') document.getElementById('nav-all').classList.add('active');
    else if (filter === 'favorites') document.getElementById('nav-fav').classList.add('active');
    else if (filter === 'trash') document.getElementById('nav-trash').classList.add('active');
    else renderFolders(); 
    document.querySelector('.search-input').value = '';
    editor.commands.setContent('');
    activeNoteId = null;
    renderNoteList();
}

function renderSkeleton() {
    document.getElementById('notes-container').innerHTML = `<div class="skeleton-item"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div></div><div class="skeleton-item"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div></div>`;
}

// --- 4. DARK MODE ---
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('i');
const themeText = themeToggle.querySelector('span');
if (localStorage.getItem('theme') === 'dark') enableDarkMode();
themeToggle.addEventListener('click', () => document.body.getAttribute('data-theme') === 'dark' ? disableDarkMode() : enableDarkMode());
function enableDarkMode() { document.body.setAttribute('data-theme', 'dark'); localStorage.setItem('theme', 'dark'); themeIcon.className = 'ri-sun-line'; themeText.innerText = 'Light Mode'; }
function disableDarkMode() { document.body.removeAttribute('data-theme'); localStorage.setItem('theme', 'light'); themeIcon.className = 'ri-moon-line'; themeText.innerText = 'Dark Mode'; }

// --- 5. EXPOSED ACTIONS ---
window.toggleFav = async (id) => { const note = allNotes.find(n => n._id === id); if(!note) return; await updateNoteInDb(id, { favorite: !note.favorite }); };
window.deleteNote = async (id) => { const note = allNotes.find(n => n._id === id); if(!note) return; if (note.deleted) { notePendingDeletion = id; toggleModal('delete-modal', true); } else { await updateNoteInDb(id, { deleted: true }); showToast("Moved to Trash", "info"); } };
window.restoreNote = async (id) => { await updateNoteInDb(id, { deleted: false }); if(currentFilter === 'trash') renderNoteList(); showToast("Note restored", "success"); };
window.deleteFolder = (e, name) => { e.stopPropagation(); folderPendingDeletion = name; document.getElementById('del-folder-name').innerText = name; toggleModal('delete-folder-modal', true); };
window.confirmEmptyTrash = () => { if (allNotes.filter(n=>n.deleted).length === 0) { showToast("Trash is already empty", "info"); return; } toggleModal('empty-trash-modal', true); };
window.moveNote = (id) => { notePendingMove = id; const select = document.getElementById('folder-select'); select.innerHTML = ''; folders.forEach(f => { const option = document.createElement('option'); option.value = f; option.innerText = f; select.appendChild(option); }); toggleModal('move-note-modal', true); }

// --- 6. MODALS ---
function toggleModal(id, show) { const m = document.getElementById(id); show ? m.classList.remove('hidden') : m.classList.add('hidden'); }

document.getElementById('cancel-delete-btn').onclick = () => toggleModal('delete-modal', false);
document.getElementById('confirm-delete-btn').onclick = async () => { if (notePendingDeletion) { await fetch(`/api/notes/${notePendingDeletion}`, { method: 'DELETE' }); allNotes = allNotes.filter(n => n._id !== notePendingDeletion); renderNoteList(); showToast("Deleted forever", "success"); toggleModal('delete-modal', false); } };

document.getElementById('cancel-folder-btn').onclick = () => toggleModal('delete-folder-modal', false);
document.getElementById('confirm-folder-btn').onclick = async () => { if (folderPendingDeletion) { await fetch('/api/folders/delete', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({folderName: folderPendingDeletion}) }); folders.delete(folderPendingDeletion); allNotes.forEach(n => {if(n.folder===folderPendingDeletion) n.folder='General'}); if(currentFilter===`folder-${folderPendingDeletion}`) setFilter('all'); else renderFolders(); showToast("Folder deleted", "success"); toggleModal('delete-folder-modal', false); } };

document.getElementById('add-folder-btn').onclick = () => toggleModal('create-folder-modal', true);
document.getElementById('cancel-create-folder-btn').onclick = () => toggleModal('create-folder-modal', false);
document.getElementById('confirm-create-folder-btn').onclick = () => { const input = document.getElementById('new-folder-input'); const name = input.value.trim(); if(!name || folders.has(name)) { showToast("Invalid name", "error"); return; } folders.add(name); renderFolders(); showToast("Folder created", "success"); toggleModal('create-folder-modal', false); input.value = ''; };

document.getElementById('cancel-empty-trash-btn').onclick = () => toggleModal('empty-trash-modal', false);
document.getElementById('confirm-empty-trash-btn').onclick = async () => { await fetch('/api/notes/trash', { method: 'DELETE' }); allNotes = allNotes.filter(n => !n.deleted); renderNoteList(); showToast("Trash Emptied", "success"); toggleModal('empty-trash-modal', false); };

document.getElementById('cancel-move-btn').onclick = () => toggleModal('move-note-modal', false);
document.getElementById('confirm-move-btn').onclick = async () => { const folder = document.getElementById('folder-select').value; if (notePendingMove && folder) { await updateNoteInDb(notePendingMove, { folder: folder }); showToast(`Moved to ${folder}`, "success"); toggleModal('move-note-modal', false); } };

// Helpers
function showToast(msg, type='info') { const c = document.getElementById('toast-container'); const t = document.createElement('div'); t.className = `toast ${type}`; t.innerHTML = `<span>${msg}</span>`; c.appendChild(t); setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.remove(),300); }, 3000); }
function extractTitle(html) { const d = document.createElement('div'); d.innerHTML=html; const h1=d.querySelector('h1'); const p=d.querySelector('p'); return h1&&h1.innerText.trim()?h1.innerText : (p&&p.innerText.trim()?p.innerText.substring(0,20):'Untitled Note'); }
// Helper Function
function updateStats(editor) {
    // Safety check: if editor isn't loaded yet, stop.
    if (!editor) return; 

    const text = editor.getText();
    
    // Count words (splitting by spaces)
    const wordCount = text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
    const charCount = text.length;

    const wcEl = document.getElementById('word-count');
    const ccEl = document.getElementById('char-count');

    if (wcEl) wcEl.innerText = `${wordCount} words`;
    if (ccEl) ccEl.innerText = `${charCount} chars`;
}

// Listeners
document.querySelector('.search-input').oninput = (e) => renderNoteList(e.target.value);
document.getElementById('nav-all').onclick = () => setFilter('all');
document.getElementById('nav-fav').onclick = () => setFilter('favorites');
document.getElementById('nav-trash').onclick = () => setFilter('trash');
document.querySelector('.new-note-btn').onclick = createNewNote;
const btnIds = {'boldBtn': 'toggleBold', 'italicBtn': 'toggleItalic', 'strikeBtn': 'toggleStrike', 'h1Btn': {level:1}, 'h2Btn': {level:2}, 'listBtn': 'toggleBulletList'};
Object.keys(btnIds).forEach(id => { document.getElementById(id).onclick = () => { const action = btnIds[id]; if(typeof action === 'string') editor.chain().focus()[action]().run(); else if (id === 'listBtn') editor.chain().focus().toggleBulletList().run(); else editor.chain().focus().toggleHeading(action).run(); }; });

fetchNotes();