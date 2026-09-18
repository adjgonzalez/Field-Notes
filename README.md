# Ruben's Madrid Notes

A static, phone-first blog about Ruben's time in Madrid, designed for GitHub Pages. It has a lightweight local capture flow for writing notes and adding photos from a phone camera.

## Run locally

Open `index.html` directly, or serve the folder with any static server:

```powershell
py -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish with GitHub Pages

This repository includes a GitHub Actions workflow in `.github/workflows/pages.yml`.

1. Create an empty GitHub repository, for example `rubens-field-notes`.
2. In this folder, run `git init`, `git add .`, and `git commit -m "Create field notes site"`.
3. Add the repository as `origin`, then run `git branch -M main` and `git push -u origin main`.
4. In GitHub, open **Settings → Pages** and choose **GitHub Actions** as the source.
5. The site will be available at `https://YOUR-USERNAME.github.io/rubens-field-notes/` after the workflow finishes.

## Firebase setup

Published notes are stored in the Firebase project configured in `app.js`, so they are shared between browsers and phones. In the Firebase console:

1. Open **Build → Firestore Database** and click **Create database**.
2. Choose a location and select **Start in test mode** while setting up.
3. Create a free Cloudinary account and create an unsigned upload preset named `field-notes`.
4. The Cloudinary cloud name and preset are configured in `app.js`. Photos are compressed in the browser and uploaded to Cloudinary; Firestore stores their URLs.
5. Open **Build → Firestore Database → Rules** and replace the temporary rules before the test period ends.

The site must be opened from `http://localhost:8000` or the GitHub Pages URL. Opening `index.html` directly with a `file://` URL will block the Firebase module imports.

## How posting works

Published note text and Cloudinary photo URLs are stored in Firestore, so they appear on every device. Drafts remain in the browser's `localStorage` until they are published.

For permanent public posts, add a new article card in `index.html` and copy any image into the repository (for example, an `images/` folder), then push the change to GitHub. This keeps your blog fully static and free to host.

The image input uses `capture="environment"` on supported phones, which opens the rear camera from the Add a photo control.
