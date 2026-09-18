/**
 * patchGhPages.js
 * 1. Fixes asset paths in dist/index.html for GitHub Pages subdirectory deployment.
 * 2. Creates a 404.html that redirects unknown routes back to the SPA.
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = '/Mediunify-patient-side-application-';
const DIST = path.join(__dirname, '..', 'dist');
const INDEX_HTML = path.join(DIST, 'index.html');

// ── 1. Patch index.html paths ────────────────────────────────────────────────
let html = fs.readFileSync(INDEX_HTML, 'utf8');

// Fix JS bundle src: src="/_expo/... → src="/BASE_PATH/_expo/...
html = html.replace(/src="\/_expo\//g, `src="${BASE_PATH}/_expo/`);

// Fix CSS href: href="/_expo/...
html = html.replace(/href="\/_expo\//g, `href="${BASE_PATH}/_expo/`);

// Fix favicon
html = html.replace(/href="\/favicon\.ico"/g, `href="${BASE_PATH}/favicon.ico"`);

// Fix any other root-relative asset references
html = html.replace(/src="\/assets\//g, `src="${BASE_PATH}/assets/`);
html = html.replace(/href="\/assets\//g, `href="${BASE_PATH}/assets/`);

// Inject SPA redirect-from-404 handler (reads sessionStorage set by 404.html)
const redirectScript = `
  <script>
    // GitHub Pages SPA redirect — restore path from 404.html redirect
    (function() {
      var redirect = sessionStorage.redirect;
      delete sessionStorage.redirect;
      if (redirect && redirect !== location.href) {
        history.replaceState(null, null, redirect);
      }
    })();
  </script>`;

html = html.replace('</head>', redirectScript + '\n  </head>');

fs.writeFileSync(INDEX_HTML, html, 'utf8');
console.log(`✅ Patched dist/index.html with base path: ${BASE_PATH}`);

// ── 2. Create 404.html ───────────────────────────────────────────────────────
const notFoundHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>MediUnify</title>
  <script>
    // GitHub Pages SPA 404 redirect hack
    // Saves the current URL to sessionStorage and redirects to index.html
    var base = '${BASE_PATH}';
    sessionStorage.redirect = location.href;
    window.location.replace(base + '/?' + Date.now());
  </script>
</head>
<body>
  Redirecting...
</body>
</html>`;

fs.writeFileSync(path.join(DIST, '404.html'), notFoundHtml, 'utf8');
console.log('✅ Created dist/404.html for SPA routing support');
console.log('   Any unknown route → 404.html → redirects back to index with path preserved');
