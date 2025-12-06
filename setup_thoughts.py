import os

# Define the folder name
project_name = "Thoughts-App"

# Define the file contents
package_json = """{
  "name": "thoughts-app",
  "version": "1.0.0",
  "description": "A minimalist note-taking app",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "npx nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}"""

server_js = """const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Thoughts App running at http://localhost:${PORT}`);
});
"""

index_html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thoughts</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css" rel="stylesheet">
</head>
<body>

    <div class="container">
        <div class="sidebar">
            <div class="brand">
                <div class="logo-square"></div>
                <h2>Thoughts</h2>
            </div>
            
            <button class="new-note-btn">+ New Note</button>
            
            <div class="nav-section">
                <div class="nav-label">WORKSPACE</div>
                <div class="nav-item active"><i class="ri-file-list-line"></i> All Notes</div>
                <div class="nav-item"><i class="ri-star-line"></i> Favorites</div>
            </div>

            <div class="nav-section">
                <div class="nav-label">FOLDERS <span class="add-folder">+</span></div>
                <div class="empty-msg">No folders created yet</div>
            </div>
        </div>

        <div class="list-panel">
            <div class="search-wrapper">
                <i class="ri-search-line"></i>
                <input type="text" placeholder="Search for what to add..." class="search-input">
            </div>
            
            <div class="list-header">All Stories</div>
            
            <div class="note-item selected">
                <h3>The Creative Process</h3>
                <p>It starts with a blank canvas and a single thought...</p>
                <span class="date">10 mins ago</span>
            </div>
            
            <div class="note-item">
                <h3>Meeting Notes: Q4</h3>
                <p>Discuss marketing strategy and new hiring plans.</p>
                <span class="date">Yesterday</span>
            </div>
        </div>

        <div class="editor-panel">
            <div class="toolbar">
                <button id="boldBtn" title="Bold"><i class="ri-bold"></i></button>
                <button id="italicBtn" title="Italic"><i class="ri-italic"></i></button>
                <button id="strikeBtn" title="Strikethrough"><i class="ri-strikethrough"></i></button>
                <span class="divider">|</span>
                <button id="h1Btn" title="Heading 1"><i class="ri-h-1"></i></button>
                <button id="h2Btn" title="Heading 2"><i class="ri-h-2"></i></button>
                <button id="listBtn" title="Bullet List"><i class="ri-list-unordered"></i></button>
            </div>
            
            <div class="editor-content" id="editor"></div>
        </div>
    </div>

    <script type="module" src="app.js"></script>
</body>
</html>
"""

style_css = """@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&display=swap');

body { margin: 0; font-family: 'Inter', sans-serif; height: 100vh; overflow: hidden; color: #333; }

.container { display: flex; height: 100%; }

/* --- Sidebar (Left) --- */
.sidebar { 
    width: 240px; 
    background: #fbfbfb; 
    padding: 24px; 
    border-right: 1px solid #eaeaea; 
    display: flex; 
    flex-direction: column;
}

.brand { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
.logo-square { width: 24px; height: 24px; background: #000; border-radius: 4px; }
.brand h2 { font-size: 18px; font-weight: 600; margin: 0; font-family: 'Merriweather', serif; }

.new-note-btn { 
    width: 100%; 
    background: #0F172A; 
    color: white; 
    padding: 10px; 
    border: none; 
    border-radius: 6px; 
    cursor: pointer; 
    font-weight: 500;
    margin-bottom: 30px; 
    transition: background 0.2s;
}
.new-note-btn:hover { background: #334155; }

.nav-section { margin-bottom: 24px; }
.nav-label { font-size: 11px; font-weight: 600; color: #999; margin-bottom: 10px; letter-spacing: 0.5px; display: flex; justify-content: space-between; }
.add-folder { cursor: pointer; }
.nav-item { 
    padding: 8px 12px; 
    margin-left: -12px;
    border-radius: 6px; 
    cursor: pointer; 
    color: #555; 
    font-size: 14px; 
    display: flex; 
    align-items: center; 
    gap: 8px; 
}
.nav-item.active { background: #f0f0f0; color: #000; font-weight: 500; }
.nav-item:hover:not(.active) { background: #f7f7f7; }
.empty-msg { font-size: 13px; color: #bbb; font-style: italic; }

/* --- List Panel (Middle) --- */
.list-panel { 
    width: 320px; 
    border-right: 1px solid #eaeaea; 
    padding: 24px; 
    background: #fff;
    display: flex;
    flex-direction: column;
}

.search-wrapper { position: relative; margin-bottom: 24px; }
.search-wrapper i { position: absolute; left: 0; top: 2px; color: #aaa; font-size: 18px; }
.search-input { 
    width: 100%; 
    border: none; 
    border-bottom: 1px solid #eaeaea; 
    padding: 4px 4px 8px 26px; 
    font-size: 14px; 
    outline: none; 
}
.search-input::placeholder { color: #ccc; font-family: 'Merriweather', serif; font-style: italic; }

.list-header { font-size: 12px; color: #888; margin-bottom: 16px; }

.note-item { 
    padding: 16px; 
    border-radius: 8px; 
    cursor: pointer; 
    margin-bottom: 8px; 
    transition: all 0.2s;
}
.note-item:hover { background: #f9f9f9; }
.note-item.selected { background: #f3f4f6; }
.note-item h3 { margin: 0 0 6px 0; font-size: 15px; font-weight: 600; color: #1f2937; }
.note-item p { margin: 0 0 8px 0; font-size: 13px; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.date { font-size: 11px; color: #9ca3af; }

/* --- Editor Panel (Right) --- */
.editor-panel { 
    flex: 1; 
    display: flex; 
    flex-direction: column; 
    background: #fff;
}

.toolbar { 
    padding: 16px 40px; 
    border-bottom: 1px solid #f0f0f0; 
    display: flex; 
    gap: 8px; 
    align-items: center;
}
.toolbar button { 
    background: none; 
    border: none; 
    font-size: 18px; 
    cursor: pointer; 
    padding: 6px; 
    color: #9ca3af; 
    border-radius: 4px; 
    transition: color 0.2s;
}
.toolbar button:hover { color: #333; background: #f5f5f5; }
.divider { color: #e5e7eb; margin: 0 4px; }

.editor-content { 
    flex: 1; 
    overflow-y: auto; 
    padding: 40px 80px; 
    cursor: text;
}

/* Tiptap Prose Styling */
.ProseMirror { outline: none; }
.ProseMirror p { font-family: 'Merriweather', serif; font-size: 18px; line-height: 1.8; color: #374151; margin-bottom: 1.5em; }
.ProseMirror h1 { font-family: 'Inter', sans-serif; font-size: 2.5em; font-weight: 700; color: #111827; margin-top: 0; line-height: 1.2; }
.ProseMirror h2 { font-family: 'Inter', sans-serif; font-size: 1.75em; font-weight: 600; color: #1f2937; margin-top: 1.5em; margin-bottom: 0.5em; }
.ProseMirror ul { padding-left: 1.5em; }
.ProseMirror li { font-family: 'Merriweather', serif; margin-bottom: 0.5em; }
.ProseMirror blockquote { border-left: 3px solid #e5e7eb; padding-left: 1em; color: #6b7280; font-style: italic; }

/* Placeholder */
.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}
"""

app_js = """// Import Tiptap from CDN (No build step needed)
import { Editor } from 'https://esm.sh/@tiptap/core';
import StarterKit from 'https://esm.sh/@tiptap/starter-kit';
import Placeholder from 'https://esm.sh/@tiptap/extension-placeholder';

// Initialize Editor
const editor = new Editor({
  element: document.querySelector('#editor'),
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: 'Start writing your thoughts...',
    }),
  ],
  content: `
    <h1>The Beginning of a Thought</h1>
    <p>This is your new canvas. It's clean, simple, and distraction-free.</p>
    <p>Try using <strong>markdown shortcuts</strong>:</p>
    <ul>
      <li>Type <code>#</code> and space for a big heading</li>
      <li>Type <code>-</code> and space for a bullet list</li>
    </ul>
    <blockquote>"Creativity is intelligence having fun."</blockquote>
  `,
  editorProps: {
    attributes: {
      class: 'prose-editor',
    },
  },
});

// Button Logic
const buttons = {
    boldBtn: () => editor.chain().focus().toggleBold().run(),
    italicBtn: () => editor.chain().focus().toggleItalic().run(),
    strikeBtn: () => editor.chain().focus().toggleStrike().run(),
    h1Btn: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    h2Btn: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    listBtn: () => editor.chain().focus().toggleBulletList().run(),
};

Object.keys(buttons).forEach(id => {
    document.getElementById(id).addEventListener('click', buttons[id]);
});
"""

# Create Directory Structure
os.makedirs(project_name, exist_ok=True)
os.makedirs(os.path.join(project_name, "public"), exist_ok=True)

# Write Files
with open(os.path.join(project_name, "package.json"), "w") as f:
    f.write(package_json)

with open(os.path.join(project_name, "server.js"), "w") as f:
    f.write(server_js)

with open(os.path.join(project_name, "public", "index.html"), "w") as f:
    f.write(index_html)

with open(os.path.join(project_name, "public", "style.css"), "w") as f:
    f.write(style_css)

with open(os.path.join(project_name, "public", "app.js"), "w") as f:
    f.write(app_js)

print(f"✅ Successfully created '{project_name}' folder!")
print(f"👉 To run the app:")
print(f"   1. cd {project_name}")
print(f"   2. npm install")
print(f"   3. node server.js")