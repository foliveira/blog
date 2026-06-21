#!/usr/bin/env node
// Static blog generator. Node standard library only, no dependencies.
// Reads Markdown from content/posts/, copies static/, writes HTML to dist/.
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  rmSync,
  cpSync,
} from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const CONTENT = join(ROOT, "content", "posts");
const STATIC = join(ROOT, "static");
const OUT = join(ROOT, "dist");

const BASE = "/ira"; // site is served under this subpath
const SITE = "https://blog.fabioo.live";
const SITE_TITLE = "Off the Main Thread";
const TAGLINE = "Notes on software, leadership, and the occasional tangent.";
const AUTHOR = "Fábio Oliveira";
const AUTHOR_URL = "https://fabioo.live/ira";
const AUTHOR_SAMEAS = [
  "https://github.com/foliveira",
  "https://keybase.io/foliveira",
];
const DEFAULT_IMAGE = `${SITE}${BASE}/cover.png`;
const YEAR = new Date().getUTCFullYear();
const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

// ---------------------------------------------------------------- helpers ---
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");

// Light SmartyPants: curly quotes, dashes, ellipsis. Run on plain text only.
function smart(s) {
  return s
    .replace(/---/g, "—")
    .replace(/--/g, "–")
    .replace(/\.\.\./g, "…")
    .replace(/(^|[\s([{<—–])"/g, "$1“")
    .replace(/"/g, "”")
    .replace(/(^|[\s([{<—–])'/g, "$1‘")
    .replace(/'/g, "’");
}
const text2html = (s) => smart(esc(s));

// Prefix root-absolute local paths with the base; leave external/anchor URLs.
function assetUrl(u) {
  if (/^(https?:)?\/\//.test(u) || /^(mailto:|tel:|#|data:)/.test(u)) return u;
  if (u.startsWith(BASE + "/")) return u;
  if (u.startsWith("/")) return BASE + u;
  return u;
}

// GitHub-style heading slug, de-duplicated per page.
function slugify(text, seen) {
  let s = text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const n = seen.get(s) || 0;
  seen.set(s, n + 1);
  return n ? `${s}-${n}` : s;
}

function fmtDate(d) {
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, "0")}, ${d.getUTCFullYear()}`;
}

// ------------------------------------------------------------ frontmatter ---
function parseFrontmatter(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const mm = /^(\w+):\s*(.*)$/.exec(line);
    if (!mm) continue;
    const key = mm[1];
    let v = mm[2].trim();
    if (v.startsWith("[") && v.endsWith("]")) {
      data[key] = v
        .slice(1, -1)
        .split(",")
        .map((x) => x.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
    } else {
      data[key] = v.replace(/^['"]|['"]$/g, "");
    }
  }
  if (!data.description && data.excerpt) data.description = data.excerpt;
  return { data, body: raw.slice(m[0].length) };
}

// -------------------------------------------------------- inline rendering ---
const BLOCK_TAGS =
  /^<\/?(address|article|aside|blockquote|details|dialog|div|dl|dt|dd|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|iframe|main|menu|nav|ol|p|pre|section|summary|table|tbody|td|tfoot|th|thead|tr|ul|li|script|style)\b/i;

function inline(text, ctx) {
  const stash = [];
  const Z = String.fromCharCode(0); // sentinel that never appears in Markdown
  const hold = (html) => `${Z}${stash.push(html) - 1}${Z}`;

  // backslash escapes (\_  \*  etc.) -> literal char, protected from parsing
  text = text.replace(/\\([\\`*_{}\[\]()#+.!>~|-])/g, (_, c) => hold(esc(c)));
  // inline code
  text = text.replace(/`([^`\n]+)`/g, (_, c) => hold(`<code>${esc(c)}</code>`));
  // reference-style image  ![alt][id]
  text = text.replace(/!\[([^\]]*)\]\[([^\]]*)\]/g, (m, alt, id) => {
    const url = ctx.linkDefs[(id || alt).toLowerCase()];
    return url
      ? hold(`<img src="${escAttr(assetUrl(url))}" alt="${escAttr(alt)}" loading="lazy">`)
      : m;
  });
  // inline image  ![alt](src)
  text = text.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_, alt, src) =>
      hold(`<img src="${escAttr(assetUrl(src))}" alt="${escAttr(alt)}" loading="lazy">`),
  );
  // footnote reference  [^id]
  text = text.replace(/\[\^([^\]]+)\]/g, (m, id) => {
    if (!(id in ctx.fnDefs)) return m;
    let num = ctx.fnNums.get(id);
    if (num == null) {
      num = ++ctx.fnCounter;
      ctx.fnNums.set(id, num);
      ctx.fnOrder.push(id);
    }
    const count = (ctx.fnRefCount.get(id) || 0) + 1;
    ctx.fnRefCount.set(id, count);
    const refId = count === 1 ? `fnref-${num}` : `fnref-${num}-${count}`;
    return hold(`<sup id="${refId}"><a href="#fn-${num}">${num}</a></sup>`);
  });
  // reference-style link  [text][id]  or  [text][]
  text = text.replace(/\[([^\]]+)\]\[([^\]]*)\]/g, (m, t, id) => {
    const url = ctx.linkDefs[(id || t).toLowerCase()];
    return url ? hold(`<a href="${escAttr(assetUrl(url))}">${smart(t)}</a>`) : m;
  });
  // inline link  [text](url)
  text = text.replace(
    /\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_, t, url) => hold(`<a href="${escAttr(assetUrl(url))}">${smart(t)}</a>`),
  );
  // raw HTML tags pass through verbatim (protects attributes too)
  text = text.replace(/<\/?[a-zA-Z][^>]*>/g, (m) => hold(m));
  // autolink bare URLs (before escaping, so the raw & in query strings survives once)
  text = text.replace(
    /(^|[\s(])(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g,
    (_, pre, url) => pre + hold(`<a href="${escAttr(url)}">${esc(url)}</a>`),
  );
  // escape stray angle brackets / ampersands, but keep HTML entities
  text = text
    .replace(/&(?!#?[a-zA-Z0-9]+;)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // bold then italic
  text = text.replace(/\*{2,}(?=\S)(.+?)\*{2,}/g, (_, t) => hold(`<strong>${smart(t)}</strong>`));
  text = text.replace(
    /(?<![\w])_(?=\S)(.+?)_(?![\w])/g,
    (_, t) => hold(`<em>${smart(t)}</em>`),
  );
  text = text.replace(
    /(?<![\w*])\*(?=\S)([^*]+?)\*(?!\*)/g,
    (_, t) => hold(`<em>${smart(t)}</em>`),
  );
  // typography
  text = smart(text);
  // restore protected fragments (placeholders may nest)
  let prev;
  do {
    prev = text;
    text = text.replace(new RegExp(Z + "(\\d+)" + Z, "g"), (_, n) => stash[+n]);
  } while (text !== prev && new RegExp(Z + "\\d+" + Z).test(text));
  return text;
}

// --------------------------------------------------------- block rendering ---
function startsBlock(t) {
  return (
    t === "" ||
    /^(#{1,6})\s/.test(t) ||
    /^(```|~~~)/.test(t) ||
    /^>/.test(t) ||
    /^(-{3,}|\*{3,}|_{3,})$/.test(t) ||
    /^[*+-]\s+/.test(t) ||
    /^\d+[.)]\s+/.test(t) ||
    BLOCK_TAGS.test(t)
  );
}

function renderBlocks(lines, ctx) {
  const out = [];
  let i = 0;
  const N = lines.length;
  while (i < N) {
    const t = lines[i].trim();
    if (t === "") {
      i++;
      continue;
    }

    // fenced code
    let m = /^(```|~~~)\s*([\w-]*)\s*$/.exec(t);
    if (m) {
      const fence = m[1];
      const buf = [];
      i++;
      while (i < N && lines[i].trim().slice(0, 3) !== fence) buf.push(lines[i++]);
      i++; // closing fence
      const cls = m[2] ? ` class="language-${m[2]}"` : "";
      out.push(`<pre><code${cls}>${esc(buf.join("\n"))}\n</code></pre>`);
      continue;
    }

    // heading
    m = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(t);
    if (m) {
      const lvl = m[1].length;
      const id = slugify(m[2], ctx.slugs);
      out.push(`<h${lvl} id="${id}">${inline(m[2], ctx)}</h${lvl}>`);
      i++;
      continue;
    }

    // horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) {
      out.push("<hr>");
      i++;
      continue;
    }

    // raw HTML block (block-level tag) -> verbatim until a blank line
    if (BLOCK_TAGS.test(t)) {
      const buf = [];
      while (i < N && lines[i].trim() !== "") buf.push(lines[i++]);
      out.push(buf.join("\n"));
      continue;
    }

    // blockquote
    if (/^>/.test(t)) {
      const buf = [];
      while (i < N && /^>/.test(lines[i].trim()))
        buf.push(lines[i++].replace(/^\s*>\s?/, ""));
      out.push(`<blockquote>\n${renderBlocks(buf, ctx)}\n</blockquote>`);
      continue;
    }

    // list (ordered or unordered)
    const ordered = /^\d+[.)]\s+/.test(t);
    if (ordered || /^[*+-]\s+/.test(t)) {
      const items = [];
      let loose = false;
      let blank = false;
      while (i < N) {
        const lt = lines[i].trim();
        if (lt === "") {
          blank = true;
          i++;
          continue;
        }
        const im = ordered
          ? /^\d+[.)]\s+(.*)$/.exec(lt)
          : /^[*+-]\s+(.*)$/.exec(lt);
        if (im) {
          if (blank && items.length) loose = true;
          blank = false;
          items.push(im[1]);
          i++;
        } else if (/^\s+\S/.test(lines[i]) && items.length) {
          items[items.length - 1] += "\n" + lines[i].replace(/^\s+/, "");
          i++;
        } else {
          break;
        }
      }
      const tag = ordered ? "ol" : "ul";
      const lis = items
        .map((it) => {
          const inner = inline(it, ctx);
          return `<li>${loose ? `<p>${inner}</p>` : inner}</li>`;
        })
        .join("\n");
      out.push(`<${tag}>\n${lis}\n</${tag}>`);
      continue;
    }

    // paragraph
    const buf = [];
    while (i < N && !startsBlock(lines[i].trim())) buf.push(lines[i++]);
    out.push(`<p>${inline(buf.join("\n"), ctx)}</p>`);
  }
  return out.join("\n");
}

function renderFootnotes(ctx) {
  if (!ctx.fnOrder.length) return "";
  const items = ctx.fnOrder.map((id) => {
    const num = ctx.fnNums.get(id);
    const refs = ctx.fnRefCount.get(id) || 1;
    const content = inline(ctx.fnDefs[id].replace(/\\([&_*\[\]()])/g, "$1"), ctx);
    let back = "";
    for (let k = 1; k <= refs; k++) {
      const rid = k === 1 ? `fnref-${num}` : `fnref-${num}-${k}`;
      const sup = k === 1 ? "" : `<sup>${k}</sup>`;
      back += ` <a class="footnote-backref" href="#${rid}" aria-label="Back to content">↩${sup}</a>`;
    }
    return `<li id="fn-${num}"><p>${content}${back}</p></li>`;
  });
  return `<section class="footnotes">\n<h2 class="sr-only" id="footnotes-label">Footnotes</h2>\n<ol>\n${items.join("\n")}\n</ol>\n</section>`;
}

// Convert a full post body: pull out definitions, then render.
function markdown(body, ctx) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const kept = [];
  for (let i = 0; i < lines.length; i++) {
    let m = /^\[\^([^\]]+)\]:\s?(.*)$/.exec(lines[i]);
    if (m) {
      const id = m[1];
      const content = [m[2]];
      while (
        i + 1 < lines.length &&
        lines[i + 1].trim() !== "" &&
        /^(\s{2,}|\t)/.test(lines[i + 1])
      )
        content.push(lines[++i].replace(/^\s+/, ""));
      ctx.fnDefs[id] = content.join("\n").trim();
      continue;
    }
    m = /^\[([^\]^][^\]]*)\]:\s+(\S+)(?:\s+["'(].*)?$/.exec(lines[i]);
    if (m) {
      ctx.linkDefs[m[1].toLowerCase()] = m[2];
      continue;
    }
    kept.push(lines[i]);
  }
  return renderBlocks(kept, ctx) + "\n" + renderFootnotes(ctx);
}

function newCtx() {
  return {
    linkDefs: {},
    fnDefs: {},
    fnNums: new Map(),
    fnOrder: [],
    fnCounter: 0,
    fnRefCount: new Map(),
    slugs: new Map(),
  };
}

// ------------------------------------------------------------- templates ----
function page({ title, description, path, ogImage, body, article, jsonLd }) {
  const pageTitle = title ? `${title} · ${SITE_TITLE}` : SITE_TITLE;
  const desc = description || TAGLINE;
  const canonical = SITE + path;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${escAttr(pageTitle)}</title>
<meta name="description" content="${escAttr(desc)}">
<link rel="canonical" href="${escAttr(canonical)}">
<meta property="og:type" content="${article ? "article" : "website"}">
<meta property="og:site_name" content="${SITE_TITLE}">
<meta property="og:title" content="${escAttr(pageTitle)}">
<meta property="og:description" content="${escAttr(desc)}">
<meta property="og:url" content="${escAttr(canonical)}">${
    ogImage ? `\n<meta property="og:image" content="${escAttr(ogImage)}">` : ""
  }
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${BASE}/favicon/favicon.ico" sizes="any">
<link rel="icon" type="image/png" href="${BASE}/favicon/favicon-32x32.png" sizes="32x32">
<link rel="icon" type="image/png" href="${BASE}/favicon/favicon-16x16.png" sizes="16x16">
<link rel="apple-touch-icon" href="${BASE}/favicon/apple-touch-icon.png">
<link rel="manifest" href="${BASE}/favicon/site.webmanifest">
<link rel="stylesheet" href="${BASE}/style.css">${jsonLd ? "\n" + jsonLd : ""}
</head>
<body>
<div class="wrap">
<header class="site">
<a class="brand" href="${BASE}/">${SITE_TITLE}</a>
<nav><a href="${BASE}/">Home</a> <a href="${BASE}/posts/">Posts</a> <a href="https://fabioo.live" rel="noopener">Main site</a></nav>
</header>
<main>
${body}
</main>
<footer class="site">
<span>© ${YEAR} · ${SITE_TITLE}</span>
<span>Licensed under <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener">CC BY 4.0</a></span>
</footer>
</div>
</body>
</html>
`;
}

function postBody(post) {
  const d = post.data;
  const cover = d.coverImage
    ? `<figure class="cover"><img src="${escAttr(assetUrl(d.coverImage))}" alt="${escAttr(d.title)}"></figure>`
    : "";
  const meta = `<p class="post-meta"><time datetime="${post.iso}">${fmtDate(post.date)}</time>${
    d.author ? ` · ${text2html(d.author)}` : ""
  }${d.tags && d.tags.length ? ` · ${d.tags.map(text2html).join(", ")}` : ""}</p>`;
  const excerpt = d.description
    ? `<p class="excerpt">${text2html(d.description)}</p>`
    : "";
  return `<article>
<header class="post-header">
<h1>${text2html(d.title)}</h1>
${meta}
</header>
${cover}
${excerpt}
${post.html}
</article>`;
}

function listMarkup(posts) {
  return posts
    .map(
      (p) => `<li>
<time class="muted" datetime="${p.iso}">${fmtDate(p.date)}</time>
<h2><a href="${BASE}/posts/${p.slug}/">${text2html(p.data.title)}</a></h2>${
        p.data.description
          ? `\n<p class="muted">${text2html(p.data.description)}</p>`
          : ""
      }
</li>`,
    )
    .join("\n");
}

// --------------------------------------------------------------- json-ld ----
// Shared nodes referenced by @id so they are declared once per page.
const personNode = {
  "@type": "Person",
  "@id": `${SITE}${BASE}/#person`,
  name: AUTHOR,
  url: AUTHOR_URL,
  sameAs: AUTHOR_SAMEAS,
};
const siteNode = {
  "@type": "WebSite",
  "@id": `${SITE}${BASE}/#website`,
  name: SITE_TITLE,
  url: `${SITE}${BASE}/`,
  description: TAGLINE,
  inLanguage: "en",
  publisher: { "@id": personNode["@id"] },
};

function jsonLdScript(nodes) {
  const graph = { "@context": "https://schema.org", "@graph": nodes };
  // Escape "<" so a value can never close the <script> element early.
  const json = JSON.stringify(graph).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

// Blog node listing the posts, used on the home and posts index pages.
function blogNode(posts) {
  return {
    "@type": "Blog",
    "@id": `${SITE}${BASE}/#blog`,
    name: SITE_TITLE,
    url: `${SITE}${BASE}/`,
    description: TAGLINE,
    inLanguage: "en",
    publisher: { "@id": personNode["@id"] },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.data.title,
      url: `${SITE}${BASE}/posts/${p.slug}/`,
      datePublished: p.iso,
      author: { "@id": personNode["@id"] },
    })),
  };
}

// Full structured data for a single post: the article + breadcrumb trail.
function postJsonLd(post) {
  const d = post.data;
  const url = `${SITE}${BASE}/posts/${post.slug}/`;
  const img = d.ogImage || d.coverImage;
  const article = {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: d.title,
    description: d.description || TAGLINE,
    image: img ? `${SITE}${assetUrl(img)}` : DEFAULT_IMAGE,
    datePublished: post.iso,
    dateModified: d.updated ? new Date(d.updated).toISOString() : post.iso,
    author: { "@id": personNode["@id"] },
    publisher: { "@id": personNode["@id"] },
    isPartOf: { "@id": siteNode["@id"] },
    mainEntityOfPage: url,
    url,
    inLanguage: "en",
  };
  if (d.tags && d.tags.length) article.keywords = d.tags.join(", ");
  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}${BASE}/` },
      { "@type": "ListItem", position: 2, name: "Posts", item: `${SITE}${BASE}/posts/` },
      { "@type": "ListItem", position: 3, name: d.title, item: url },
    ],
  };
  return jsonLdScript([article, breadcrumb, siteNode, personNode]);
}

// ----------------------------------------------------------------- build ----
function write(rel, html) {
  const file = join(OUT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

function build() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(join(OUT, BASE), { recursive: true });
  cpSync(STATIC, join(OUT, BASE), { recursive: true });

  const posts = readdirSync(CONTENT)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const { data, body } = parseFrontmatter(
        readFileSync(join(CONTENT, f), "utf8"),
      );
      const date = new Date(data.date);
      const ctx = newCtx();
      return {
        slug: basename(f, ".md"),
        data,
        date,
        iso: date.toISOString(),
        html: markdown(body, ctx),
      };
    })
    .filter((p) => p.data.draft !== "true" && p.data.draft !== true)
    .sort((a, b) => b.date - a.date);

  // posts
  for (const p of posts) {
    const ogRel = p.data.ogImage || p.data.coverImage;
    write(
      `${BASE}/posts/${p.slug}/index.html`,
      page({
        title: p.data.title,
        description: p.data.description,
        path: `${BASE}/posts/${p.slug}/`,
        ogImage: ogRel ? SITE + assetUrl(ogRel) : undefined,
        article: true,
        body: postBody(p),
        jsonLd: postJsonLd(p),
      }),
    );
  }

  // home
  write(
    `${BASE}/index.html`,
    page({
      description: TAGLINE,
      path: `${BASE}/`,
      body: `<h1>Latest posts</h1>\n<ul class="post-list">\n${listMarkup(posts)}\n</ul>`,
      jsonLd: jsonLdScript([siteNode, blogNode(posts), personNode]),
    }),
  );

  // posts index
  write(
    `${BASE}/posts/index.html`,
    page({
      title: "Posts",
      description: "Browse all posts",
      path: `${BASE}/posts/`,
      body: `<h1>All posts</h1>\n<p class="muted">${posts.length} ${
        posts.length === 1 ? "post" : "posts"
      }</p>\n<ul class="post-list">\n${listMarkup(posts)}\n</ul>`,
      jsonLd: jsonLdScript([siteNode, blogNode(posts), personNode]),
    }),
  );

  // 404 (one under /ira for links, one at root for Cloudflare's default handler)
  const notFound = page({
    title: "404",
    description: "Page not found",
    path: `${BASE}/404.html`,
    body: `<h1>404 — Page not found</h1>
<p class="muted">The page you’re looking for doesn’t exist, was moved, or the URL might be incorrect.</p>
<p><a href="${BASE}/">Go home</a> · <a href="${BASE}/posts/">All posts</a></p>`,
  });
  write(`${BASE}/404.html`, notFound);
  write(`404.html`, notFound);

  // redirects: apex -> /ira, plus legacy asset paths
  write(
    "_redirects",
    `/            ${BASE}/              301
${BASE}         ${BASE}/              301
/posts/*     ${BASE}/posts/:splat   301
/covers/*    ${BASE}/covers/:splat  301
/favicon/*   ${BASE}/favicon/:splat 301
/avatar/*    ${BASE}/avatar/:splat  301
`,
  );

  console.log(`Built ${posts.length} posts -> ${OUT}`);
}

build();
