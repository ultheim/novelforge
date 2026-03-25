# NovelForge

AI-powered novel writing app with OpenRouter integration. Runs entirely in your browser — your API key and writing never touch a server.

## Quick Start (Local)

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173/novelforge/`

## Deploy to GitHub Pages

### First time setup

1. Create a new repo on GitHub (e.g. `novelforge`)
2. Run these commands:

```bash
# Install dependencies
npm install

# Initialize git and push
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/novelforge.git
git push -u origin main

# Deploy to GitHub Pages
npm run deploy
```

3. Go to your repo on GitHub → **Settings** → **Pages**
4. Under "Build and deployment", set Source to **Deploy from a branch**
5. Set Branch to **gh-pages** / **(root)**
6. Click Save

Your app will be live at: `https://YOUR_USERNAME.github.io/novelforge/`

### Subsequent deploys

After making changes:

```bash
git add .
git commit -m "description of changes"
git push
npm run deploy
```

## If your repo has a different name

If your GitHub repo is named something other than `novelforge`, edit `vite.config.js` and change the `base` value:

```js
base: '/your-repo-name/',
```

## Loading your existing project data

If you have an exported `.json` project file from a previous session:

1. Open the app
2. Go to **Settings** tab
3. Click **Import** under Export & Import
4. Select your `.json` file

Your project will load with all chapters, characters, world-building, etc.

## How your API key is handled

- Stored in your browser's `localStorage` only
- Never sent to GitHub or any server other than OpenRouter
- Each device/browser needs its own key entered once
- API calls go directly from your browser → OpenRouter

## Moving data between devices

Export JSON on one device → transfer the file → Import JSON on the other device. The app saves to each browser's localStorage independently.
