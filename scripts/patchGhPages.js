/**
 * patchGhPages.js
 * 1. Patches asset paths in dist/index.html
 * 2. Injects a history.pushState interceptor to fix SPA navigation base path
 * 3. Patches asset paths inside the JS bundle (fonts, images)
 * 4. Creates dist/404.html for direct URL access support
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = '/Mediunify-patient-side-application-';
const DIST = path.join(__dirname, '..', 'dist');
const INDEX_HTML = path.join(DIST, 'index.html');

// ── 1. Patch index.html paths + inject history interceptor ──────────────────
let html = fs.readFileSync(INDEX_HTML, 'utf8');

html = html.replace(/src="\/_expo\//g,        `src="${BASE_PATH}/_expo/`);
html = html.replace(/href="\/_expo\//g,       `href="${BASE_PATH}/_expo/`);
html = html.replace(/href="\/favicon\.ico"/g, `href="${BASE_PATH}/favicon.ico"`);
html = html.replace(/src="\/assets\//g,       `src="${BASE_PATH}/assets/`);
html = html.replace(/href="\/assets\//g,      `href="${BASE_PATH}/assets/`);

// Inject two critical scripts into <head>:
// Script A: Restore path saved by 404.html redirect
// Script B: Intercept history.pushState/replaceState to always include base path
//           This fixes React Navigation navigating to /login instead of /BASE/login
const headScripts = `
  <script>
    (function() {
      var BASE = '${BASE_PATH}';

      // ── A: Restore path from 404.html redirect ──
      var redirect = sessionStorage.redirect;
      delete sessionStorage.redirect;
      if (redirect && redirect !== location.href) {
        history.replaceState(null, null, redirect);
      }

      // ── B: Fix React Navigation stripping base path ──
      // Intercept pushState & replaceState so /login becomes /BASE/login
      function fixPath(url) {
        if (!url) return url;
        var s = String(url);
        // Only fix root-relative paths that are missing the base
        if (s.charAt(0) === '/' && s.indexOf(BASE) !== 0) {
          return BASE + s;
        }
        return s;
      }

      var _push    = history.pushState.bind(history);
      var _replace = history.replaceState.bind(history);

      history.pushState = function(state, title, url) {
        return _push(state, title, fixPath(url));
      };
      history.replaceState = function(state, title, url) {
        return _replace(state, title, fixPath(url));
      };
    })();
  </script>`;

html = html.replace('</head>', headScripts + '\n  </head>');

fs.writeFileSync(INDEX_HTML, html, 'utf8');
console.log('✅ Patched dist/index.html (paths + history interceptor injected)');

// ── 2. Patch JS bundle asset paths ──────────────────────────────────────────
const jsBundleDir = path.join(DIST, '_expo', 'static', 'js', 'web');

if (fs.existsSync(jsBundleDir)) {
  const jsFiles = fs.readdirSync(jsBundleDir).filter(f => f.endsWith('.js'));

  jsFiles.forEach(file => {
    const filePath = path.join(jsBundleDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    content = content.replace(/"\/_expo\/static\//g, `"${BASE_PATH}/_expo/static/`);
    content = content.replace(/'\/_expo\/static\//g, `'${BASE_PATH}/_expo/static/`);
    content = content.replace(/"\/assets\//g,         `"${BASE_PATH}/assets/`);
    content = content.replace(/'\/assets\//g,         `'${BASE_PATH}/assets/`);
    content = content.replace(/"\/_expo\//g,          `"${BASE_PATH}/_expo/`);
    content = content.replace(/'\/_expo\//g,          `'${BASE_PATH}/_expo/`);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Patched JS bundle: ${file}`);
  });
}

// ── 3. Create 404.html for direct URL access ─────────────────────────────────
const notFoundHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>MediUnify</title>
  <script>
    // Save the full requested URL then redirect to the app root
    var base = '${BASE_PATH}';
    sessionStorage.redirect = location.href;
    window.location.replace(base + '/?' + Date.now());
  </script>
</head>
<body>Redirecting to MediUnify...</body>
</html>`;

fs.writeFileSync(path.join(DIST, '404.html'), notFoundHtml, 'utf8');
console.log('✅ Created dist/404.html');
console.log('\n🎉 All done! No more 404 navigation errors.');
