require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// --- MONGODB CONNECTION ---
// If .env is missing, it will crash. Make sure .env exists!
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ DB Connection Error:', err));

// --- DATA MODEL ---
const NoteSchema = new mongoose.Schema({
    title: String,
    content: String,
    date: { type: Date, default: Date.now },
    favorite: { type: Boolean, default: false },
    folder: { type: String, default: 'General' },
    deleted: { type: Boolean, default: false }
});
const Note = mongoose.model('Note', NoteSchema);

// --- API ROUTES ---

// GET all notes
app.get('/api/notes', async (req, res) => {
    try {
        const notes = await Note.find().sort({ date: -1 });
        res.json(notes);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// CREATE note
app.post('/api/notes', async (req, res) => {
    try {
        const newNote = new Note({ title: 'Untitled Note', content: '<h1>Untitled Note</h1><p>Start writing...</p>' });
        await newNote.save();
        res.json(newNote);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// UPDATE note
app.put('/api/notes/:id', async (req, res) => {
    try {
        const updatedNote = await Note.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedNote);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE SINGLE NOTE PERMANENTLY
app.delete('/api/notes/:id', async (req, res) => {
    try {
        await Note.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted forever" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE FOLDER (Move contents to General)
app.post('/api/folders/delete', async (req, res) => {
    try {
        const { folderName } = req.body;
        if (folderName === 'General') return res.status(400).json({ error: "Cannot delete General" });
        await Note.updateMany({ folder: folderName }, { folder: 'General' });
        res.json({ message: "Folder deleted" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// NEW: EMPTY TRASH (Delete all marked as deleted)
app.delete('/api/notes/trash', async (req, res) => {
    try {
        await Note.deleteMany({ deleted: true });
        res.json({ message: "Trash emptied" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// SERVE UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});