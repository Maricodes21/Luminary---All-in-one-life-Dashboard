const fs = require('node:fs');
const path = require('node:path');

const indexPath = path.resolve(__dirname, '../dist/index.html');
let html = fs.readFileSync(indexPath, 'utf8');
const metadata = `
    <meta name="theme-color" content="#0c0e10" />
    <meta name="application-name" content="Luminary" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Luminary" />
    <meta name="description" content="Luminary is your connected daily companion for reflection, health, meals, money and music." />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />`;

if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', `${metadata}\n  </head>`);
}

html = html.replace('<script src="/_expo/', '<script type="module" src="/_expo/');
fs.writeFileSync(indexPath, html);

for (const relativePath of [
  'manifest.webmanifest',
  'service-worker.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
]) {
  if (!fs.existsSync(path.resolve(__dirname, '../dist', relativePath))) {
    throw new Error(`Web export is missing ${relativePath}`);
  }
}

console.log('Luminary web install metadata verified.');
