/**
 * patchGhPages.js
 * 
 * 1. Flattens font and nav assets out of node_modules/ into /assets/fonts/ and /assets/nav/
 *    - Git and GitHub Pages ignore "node_modules", which broke icon fonts and caused 404s.
 * 2. Patches asset paths inside the JS bundle to point to /assets/fonts/ and /assets/nav/
 * 3. Injects @font-face rules into dist/index.html so icons are recognized immediately
 * 4. Injects history.pushState interceptor into dist/index.html to preserve base path
 * 5. Creates dist/404.html for SPA routing on GitHub Pages
 * 6. Ensures .nojekyll exists so GitHub Pages doesn't ignore underscore directories
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = '/Mediunify-patient-side-application-';
const DIST = path.join(__dirname, '..', 'dist');
const INDEX_HTML = path.join(DIST, 'index.html');

console.log('🚀 Starting GitHub Pages patch...');

// ── Helper: recursively copy directory ───────────────────────────────────────
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ── Helper: find all files matching an extension ─────────────────────────────
function findFiles(dir, ext, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findFiles(fullPath, ext, fileList);
    } else if (entry.name.endsWith(ext)) {
      fileList.push({ name: entry.name, fullPath });
    }
  }
  return fileList;
}

// ── 1. Flatten font files out of node_modules ────────────────────────────────
const FONTS_DEST = path.join(DIST, 'assets', 'fonts');
const FONTS_ROOT_DEST = path.join(DIST, 'fonts');
fs.mkdirSync(FONTS_DEST, { recursive: true });
fs.mkdirSync(FONTS_ROOT_DEST, { recursive: true });

const nodeModulesAssets = path.join(DIST, 'assets', 'node_modules');
const ttfFiles = findFiles(nodeModulesAssets, '.ttf');

console.log(`📦 Found ${ttfFiles.length} TTF font files in node_modules`);

let fontFaceCss = '';

ttfFiles.forEach(({ name, fullPath }) => {
  // Copy hashed filename to dist/assets/fonts/ and dist/fonts/
  fs.copyFileSync(fullPath, path.join(FONTS_DEST, name));
  fs.copyFileSync(fullPath, path.join(FONTS_ROOT_DEST, name));

  // Extract font family name (e.g. Ionicons from Ionicons.b4eb097d...ttf)
  const family = name.split('.')[0];
  const unhashedName = `${family}.ttf`;
  fs.copyFileSync(fullPath, path.join(FONTS_DEST, unhashedName));
  fs.copyFileSync(fullPath, path.join(FONTS_ROOT_DEST, unhashedName));

  // Generate @font-face CSS rule
  fontFaceCss += `
    @font-face {
      font-family: '${family}';
      src: url('${BASE_PATH}/assets/fonts/${name}') format('truetype'),
           url('${BASE_PATH}/fonts/${name}') format('truetype');
      font-display: auto;
    }`;
});

// ── 2. Flatten navigation assets out of node_modules ─────────────────────────
const NAV_DEST = path.join(DIST, 'assets', 'nav');
fs.mkdirSync(NAV_DEST, { recursive: true });
const navSrc = path.join(nodeModulesAssets, '@react-navigation', 'elements', 'lib', 'module', 'assets');
if (fs.existsSync(navSrc)) {
  copyDirSync(navSrc, NAV_DEST);
  console.log('✅ Copied React Navigation assets to dist/assets/nav/');
}

// ── 3. Clean up node_modules in dist so git never ignores them ────────────────
if (fs.existsSync(nodeModulesAssets)) {
  try {
    fs.rmSync(nodeModulesAssets, { recursive: true, force: true });
    console.log('✅ Removed dist/assets/node_modules/ (assets successfully relocated)');
  } catch (err) {
    console.warn('⚠️ Could not remove dist/assets/node_modules:', err.message);
  }
}

// ── 4. Patch dist/index.html ─────────────────────────────────────────────────
if (fs.existsSync(INDEX_HTML)) {
  let html = fs.readFileSync(INDEX_HTML, 'utf8');

  // Strip previously injected headScripts if any
  html = html.replace(/<script data-gh-patch="true">[\s\S]*?<\/script>/g, '');
  html = html.replace(/<style data-gh-font-patch="true">[\s\S]*?<\/style>/g, '');

  html = html.replace(/src="\/_expo\//g,        `src="${BASE_PATH}/_expo/`);
  html = html.replace(/href="\/_expo\//g,       `href="${BASE_PATH}/_expo/`);
  html = html.replace(/href="\/favicon\.ico"/g, `href="${BASE_PATH}/favicon.ico"`);
  html = html.replace(/src="\/assets\//g,       `src="${BASE_PATH}/assets/`);
  html = html.replace(/href="\/assets\//g,      `href="${BASE_PATH}/assets/`);

  // Injected head scripts and @font-face CSS
  const headAdditions = `
  <style data-gh-font-patch="true">
    ${fontFaceCss}
  </style>
  <script data-gh-patch="true">
    (function() {
      var BASE = '${BASE_PATH}';

      // ── A: Restore path from 404.html redirect ──
      var redirect = sessionStorage.redirect;
      delete sessionStorage.redirect;
      if (redirect && redirect !== location.href) {
        history.replaceState(null, null, redirect);
      }

      // ── B: Fix React Navigation stripping base path ──
      function fixPath(url) {
        if (!url) return url;
        var s = String(url);
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

  html = html.replace('</head>', headAdditions + '\n  </head>');
  fs.writeFileSync(INDEX_HTML, html, 'utf8');
  console.log('✅ Patched dist/index.html with asset paths, fonts CSS, and history interceptor');
}

// ── 5. Patch JS bundle ───────────────────────────────────────────────────────
const jsBundleDir = path.join(DIST, '_expo', 'static', 'js', 'web');

if (fs.existsSync(jsBundleDir)) {
  const jsFiles = fs.readdirSync(jsBundleDir).filter(f => f.endsWith('.js'));

  jsFiles.forEach(file => {
    const filePath = path.join(jsBundleDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Rewrite base paths for _expo and assets
    content = content.replace(/"\/_expo\/static\//g, `"${BASE_PATH}/_expo/static/`);
    content = content.replace(/'\/_expo\/static\//g, `'${BASE_PATH}/_expo/static/`);
    content = content.replace(/"\/_expo\//g,          `"${BASE_PATH}/_expo/`);
    content = content.replace(/'\/_expo\//g,          `'${BASE_PATH}/_expo/`);

    // Rewrite font asset paths: from node_modules/@expo/vector-icons/.../Fonts/ to assets/fonts/
    content = content.replace(
      /(?:"|')(?:\/assets|\/Mediunify-patient-side-application-\/assets)?\/node_modules\/@expo\/vector-icons\/build\/vendor\/react-native-vector-icons\/Fonts\/([^"']+\.ttf)(?:"|')/g,
      `"${BASE_PATH}/assets/fonts/$1"`
    );
    content = content.replace(
      /\/node_modules\/@expo\/vector-icons\/build\/vendor\/react-native-vector-icons\/Fonts\//g,
      `${BASE_PATH}/assets/fonts/`
    );

    // Rewrite navigation asset paths: from node_modules/@react-navigation/elements/... to assets/nav/
    content = content.replace(
      /(?:"|')(?:\/assets|\/Mediunify-patient-side-application-\/assets)?\/node_modules\/@react-navigation\/elements\/lib\/module\/assets\/([^"']+\.png)(?:"|')/g,
      `"${BASE_PATH}/assets/nav/$1"`
    );
    content = content.replace(
      /\/node_modules\/@react-navigation\/elements\/lib\/module\/assets\//g,
      `${BASE_PATH}/assets/nav/`
    );

    // Generic assets replacement
    content = content.replace(/"\/assets\//g, `"${BASE_PATH}/assets/`);
    content = content.replace(/'\/assets\//g, `'${BASE_PATH}/assets/`);

    // Catch any remaining /node_modules/ asset paths
    content = content.replace(
      /(?:"|')(?:\/assets|\/Mediunify-patient-side-application-\/assets)?\/node_modules\/([^"']+)(?:"|')/g,
      `"${BASE_PATH}/assets/$1"`
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Patched JS bundle: ${file}`);
  });
}

// ── 6. Create dist/404.html ──────────────────────────────────────────────────
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
<body>Redirecting to MediUnify...</body>
</html>`;

fs.writeFileSync(path.join(DIST, '404.html'), notFoundHtml, 'utf8');
console.log('✅ Created dist/404.html');

// ── 7. Ensure .nojekyll exists ────────────────────────────────────────────────
fs.writeFileSync(path.join(DIST, '.nojekyll'), '', 'utf8');
console.log('✅ Created dist/.nojekyll');

// ── 8. Ensure dist/.gitignore allows all files ────────────────────────────────
fs.writeFileSync(path.join(DIST, '.gitignore'), "!*\n!**/*\n", 'utf8');
console.log('✅ Created dist/.gitignore (unignoring all build output)');

console.log('\n🎉 Patching completed successfully!');
