/**
 * patchGhPages.js
 * 1. Patches asset paths in dist/index.html
 * 2. Patches asset paths inside the JS bundle (so logo, fonts etc. load correctly)
 * 3. Creates dist/404.html for SPA client-side routing support
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = '/Mediunify-patient-side-application-';
const DIST = path.join(__dirname, '..', 'dist');
const INDEX_HTML = path.join(DIST, 'index.html');

// ── 1. Patch index.html paths ────────────────────────────────────────────────
let html = fs.readFileSync(INDEX_HTML, 'utf8');

html = html.replace(/src="\/_expo\//g,   `src="${BASE_PATH}/_expo/`);
html = html.replace(/href="\/_expo\//g,  `href="${BASE_PATH}/_expo/`);
html = html.replace(/href="\/favicon\.ico"/g, `href="${BASE_PATH}/favicon.ico"`);
html = html.replace(/src="\/assets\//g,  `src="${BASE_PATH}/assets/`);
html = html.replace(/href="\/assets\//g, `href="${BASE_PATH}/assets/`);

// Inject SPA redirect-from-404 handler
const redirectScript = `
  <script>
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
console.log('✅ Patched dist/index.html');

// ── 2. Patch JS bundle asset paths ──────────────────────────────────────────
// Assets & fonts inside the bundle are referenced with root-relative paths.
// We must rewrite them to include the GitHub Pages base path.
const jsBundleDir = path.join(DIST, '_expo', 'static', 'js', 'web');

if (fs.existsSync(jsBundleDir)) {
  const jsFiles = fs.readdirSync(jsBundleDir).filter(f => f.endsWith('.js'));

  jsFiles.forEach(file => {
    const filePath = path.join(jsBundleDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace all root-relative asset paths with base-path-prefixed ones
    // These are the patterns Expo uses inside the bundle:
    const before = content.length;

    // Font files and static media: "/_expo/static/media/
    content = content.replace(/"\/_expo\/static\//g,  `"${BASE_PATH}/_expo/static/`);
    content = content.replace(/'\/_expo\/static\//g,  `'${BASE_PATH}/_expo/static/`);

    // Image assets: "/assets/
    content = content.replace(/"\/assets\//g, `"${BASE_PATH}/assets/`);
    content = content.replace(/'\/assets\//g, `'${BASE_PATH}/assets/`);

    // Any other /_expo/ references
    content = content.replace(/"\/_expo\//g, `"${BASE_PATH}/_expo/`);
    content = content.replace(/'\/_expo\//g, `'${BASE_PATH}/_expo/`);

    fs.writeFileSync(filePath, content, 'utf8');
    const replaced = before !== content.length;
    console.log(`✅ Patched JS bundle: ${file} (assets rewritten: ${replaced})`);
  });
} else {
  console.log('⚠️  No JS bundle directory found — skipping bundle patch');
}

// ── 3. Create 404.html for SPA routing ──────────────────────────────────────
const notFoundHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>MediUnify</title>
  <script>
    var base = '${BASE_PATH}';
    sessionStorage.redirect = location.href;
    window.location.replace(base + '/?' + Date.now());
  </script>
</head>
<body>Redirecting...</body>
</html>`;

fs.writeFileSync(path.join(DIST, '404.html'), notFoundHtml, 'utf8');
console.log('✅ Created dist/404.html for SPA routing');
console.log('\n🎉 All done! Deploy should now work without 404 asset errors.');
