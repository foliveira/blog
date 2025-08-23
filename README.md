# 🌐 📰 My Personal Blog

[![GitHub license](https://img.shields.io/github/license/foliveira/blog?style=for-the-badge)][1]
[![GitHub repo size](https://img.shields.io/github/repo-size/foliveira/blog?style=for-the-badge)][2]
[![KeyBaste PGP](https://img.shields.io/keybase/pgp/foliveira?style=for-the-badge)][3]

👋 This is the repository for My Personal Blog 📝 where I share my thoughts and opinions on various topics. The blog has been migrated to Astro (a modern static site generator) and is deployed to Cloudflare Pages or GitHub Pages under https://blog.fabioo.live/ira (main site: https://fabioo.live/ira). The blog is licensed under Creative Commons Attribution 4.0 International.

## 💻 Features
 * Astro static site (served under /ira), deployable to Cloudflare Pages or GitHub Pages
 * Content under Creative Commons Attribution 4.0 International license
 * Personal blog with my own personal views

## 🛠️ Local development (Astro)

Quickstart:
```
npm install
npm run dev
# open http://localhost:4321/ira/
```

- Requirements: Node 18+.
- Start dev server: `npm run dev` (open http://localhost:4321/ira/ — root "/" redirects to /ira/)
- Build for production: `npm run build` (outputs to `dist/`)
- Preview production build: `npm run preview`
- Write posts as Markdown in `src/content/posts/` with frontmatter (`title`, `date`, etc.).

## 🔗 Base path and URLs

- This site is served under the `/ira` subpath.
- `astro.config.mjs` is configured with:
  - `site: https://blog.fabioo.live`
  - `base: '/ira'`
- Main website: https://fabioo.live/ira

## 🖼️ Images and covers under /ira

- Place assets in:
  - `public/images/` → served at `/ira/images/...`
  - `public/covers/` → served at `/ira/covers/...`
  - `public/favicon/` → served at `/ira/favicon/...`
- In Markdown posts, prefer linking with absolute paths under `/ira` to avoid redirects, for example:
  - `![Alt text](/ira/images/example.png)`
  - Cover images in frontmatter can remain as `/covers/...` — the Post layout auto-prefixes with `/ira/` at render time.
- Legacy paths without `/ira` (like `/images/...`, `/covers/...`, `/favicon/...`) are redirected to their `/ira/...` equivalents via `public/_redirects`.
- If you change the deploy subpath, update `site` and `base` in `astro.config.mjs` and adjust asset references accordingly.

## 🌐 Deployment

- Cloudflare Pages: Framework “Astro” (or “None”), Build command `npm run build`, Output directory `dist`, Node 18+. The site is served under `/ira` via `base: '/ira'`; a `_redirects` file is included to send `/` → `/ira/` and legacy asset paths to `/ira/...`.
- GitHub Pages: GitHub Actions workflow at `.github/workflows/deploy.yml` builds and publishes the static `dist/` folder.

## 📄 License

This project is licensed under the Creative Commons Attribution 4.0 International license. Please see the LICENSE file for more details.

### 📋 Usage

Feel free to use the code in this repository as a reference for building your own blog. However, please note that the content of the blog is licensed under Creative Commons Attribution 4.0 International and cannot be used without proper attribution.

### 📸 Credits

Some photos on this repository and blog are under the [Unsplash License][4].

## 📧 Contact

If you have any questions or suggestions, feel free to contact [me][3] using my PGP key above.

[1]: https://github.com/foliveira/blog/blob/master/LICENSE
[2]: https://github.com/foliveira/blog
[3]: https://keybase.io/foliveira
[4]: https://unsplash.com/license
