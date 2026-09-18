/**
 * patchGhPages.js
 * Fixes asset paths in dist/index.html for GitHub Pages subdirectory deployment.
 * Replaces root-relative paths (/_expo/, /favicon.ico) with the correct base path.
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = '/Mediunify-patient-side-application-';
const INDEX_HTML = path.join(__dirname, '..', 'dist', 'index.html');

let html = fs.readFileSync(INDEX_HTML, 'utf8');

// Fix JS bundle src: src="/_expo/... → src="/BASE_PATH/_expo/...
html = html.replace(/src="\/_expo\//g, `src="${BASE_PATH}/_expo/`);

// Fix CSS href: href="/_expo/... → href="/BASE_PATH/_expo/...
html = html.replace(/href="\/_expo\//g, `href="${BASE_PATH}/_expo/`);

// Fix favicon: href="/favicon.ico" → href="/BASE_PATH/favicon.ico"
html = html.replace(/href="\/favicon\.ico"/g, `href="${BASE_PATH}/favicon.ico"`);

// Fix any other root-relative asset references
html = html.replace(/src="\/assets\//g, `src="${BASE_PATH}/assets/`);
html = html.replace(/href="\/assets\//g, `href="${BASE_PATH}/assets/`);

fs.writeFileSync(INDEX_HTML, html, 'utf8');

console.log(`✅ Patched dist/index.html with base path: ${BASE_PATH}`);
console.log('   Fixed: /_expo/ → ' + BASE_PATH + '/_expo/');
console.log('   Fixed: /favicon.ico → ' + BASE_PATH + '/favicon.ico');
