import { defineConfig } from "astro/config";

export default defineConfig({
  // Canonical site URL (no trailing slash). Important for SEO and RSS.
  site: "https://blog.fabioo.live",

  // Deploying under a subpath (/ira)
  base: "/ira",

  // Static site output (default, but explicit here)
  output: "static",

  // Minimal Shiki setup; can be adjusted later
  markdown: {
    shikiConfig: {
      theme: "css-variables",
    },
  },
});
