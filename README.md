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

## How posting works

The capture form stores drafts and published notes in the browser's `localStorage`, so it works without a backend and remains usable on GitHub Pages. Those posts are private to that browser/device until you export them as Markdown and commit them to the repository.

For permanent public posts, add a new article card in `index.html` and copy any image into the repository (for example, an `images/` folder), then push the change to GitHub. This keeps your blog fully static and free to host.

The image input uses `capture="environment"` on supported phones, which opens the rear camera from the Add a photo control.
