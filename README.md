# My Personal Blog

[![GitHub license](https://img.shields.io/github/license/foliveira/blog?style=for-the-badge)][1]

The repository for my personal blog, where I share thoughts and opinions on
various topics. It is a small static site: Markdown posts rendered to plain HTML
by a single Node script with no dependencies, served under
https://blog.fabioo.live/ira. Content is licensed under Creative Commons
Attribution 4.0 International.

## Project structure

```
content/posts/*.md   Markdown posts with YAML frontmatter (the source you edit)
static/              files copied verbatim into the site
  style.css            the only stylesheet (~70 lines, light and dark)
  covers/  favicon/  avatar/  cover.png
build.mjs            the generator: Node standard library only, no packages
package.json         build and serve scripts; declares no dependencies
dist/                the generated site, committed so the host needs no build
  _redirects           sends / to /ira/ and legacy asset paths to /ira/...
  404.html             not-found page for the apex
  ira/                 the site itself, under the /ira subpath
    index.html           home (list of posts)
    posts/index.html     full post index
    posts/<slug>/        one folder per post, slug = the Markdown filename
    style.css  404.html  covers/  favicon/  avatar/  cover.png
```

The site lives under the `/ira` subpath, so `build.mjs` nests everything under
`dist/ira/` and writes `dist/_redirects` to send the apex `/` to `/ira/`.

Site title, tagline, and author identity (name, URL, and social profiles) are
constants at the top of `build.mjs`. Every page carries schema.org JSON-LD:
`WebSite`, `Blog`, and `Person` on the listings, and `BlogPosting` plus
`BreadcrumbList` on each post.

## Requirements

Node 18 or newer. There is nothing to install: the generator uses only the Node
standard library, so `npm install` is not needed.

## Building and previewing locally

```sh
node build.mjs       # rebuild dist/ from content/ and static/
npm run serve        # build, then serve dist/ at http://localhost:8000/ira/
```

`npm run serve` previews with Python's built-in HTTP server. Any static file
server pointed at `dist/` works the same way.

## Writing a post

Add a Markdown file to `content/posts/`. The filename without `.md` becomes the
URL slug, so `content/posts/2025-08-25-my-post.md` is served at
`/ira/posts/2025-08-25-my-post/`.

```markdown
---
title: 'My Post Title'
date: '2025-08-25T00:00:00.000Z'
excerpt: 'A one-line summary used for the listing and meta description.'
author: 'Fábio Oliveira'
coverImage: '/covers/my-cover.jpg'   # optional, file lives in static/covers/
tags: [tag-one, tag-two]             # optional
draft: false                         # optional, set true to leave a post out
---

Your Markdown content here.
```

Supported Markdown: headings (with anchor ids), paragraphs, bold and italic,
inline code and fenced code blocks, ordered and unordered lists, blockquotes,
images, inline and reference-style links, autolinked URLs, footnotes (`[^1]`
with matching `[^1]:` definitions), raw HTML, and smart typography. Put images in
`static/` and link them with absolute paths such as `/images/example.png`.

Rebuild and commit the result:

```sh
node build.mjs
git add -A && git commit -m "Add new post"
```

Committing the regenerated `dist/` is what publishes the change.

## Deployment (Cloudflare Pages)

`dist/` is committed, so the host serves it directly with no build step.

First-time setup:

1. In the Cloudflare dashboard, go to Workers & Pages, create a Pages project,
   and connect this GitHub repository.
2. Set the build configuration:
   - Framework preset: None
   - Build command: leave empty
   - Output directory: `dist`
3. Save and deploy. Cloudflare serves the committed `dist/`. The apex `/`
   redirects to `/ira/` via `dist/_redirects`, and `dist/404.html` is the
   not-found page.

Ongoing updates: edit a post, run `node build.mjs`, commit, and push. Cloudflare
redeploys automatically on each push.

Prefer to build on Cloudflare instead of committing output? Set the build
command to `node build.mjs`, keep the output directory `dist`, and add `/dist`
back to `.gitignore` so the generated files are no longer committed.

## License

The code is provided as a reference for building your own blog. The blog content
is licensed under [Creative Commons Attribution 4.0 International][1] and may not
be reused without attribution. Some photos are under the [Unsplash License][4].

## Contact

Questions or suggestions? Reach me via my [PGP key][3].

[1]: https://github.com/foliveira/blog/blob/master/LICENSE
[3]: https://keybase.io/foliveira
[4]: https://unsplash.com/license
