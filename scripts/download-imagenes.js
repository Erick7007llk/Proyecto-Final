/**
 * Intenta descargar JPG; si falla, usa SVG locales — node scripts/download-imagenes.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUT = path.join(__dirname, '..', 'public', 'IMG', 'categorias');
const HERO = path.join(__dirname, '..', 'public', 'IMG', 'hero_pill.png');

const IMAGES = {
  'medicamentos.jpg': 'https://picsum.photos/seed/gbc-medicamentos/640/480',
  'vitaminas.jpg': 'https://picsum.photos/seed/gbc-vitaminas/640/480',
  'cardiovascular.jpg': 'https://picsum.photos/seed/gbc-cardiovascular/640/480',
  'dermocosmetica.jpg': 'https://picsum.photos/seed/gbc-dermocosmetica/640/480',
  'bebes.jpg': 'https://picsum.photos/seed/gbc-bebes/640/480',
  'higiene.jpg': 'https://picsum.photos/seed/gbc-higiene/640/480',
  'equipos.jpg': 'https://picsum.photos/seed/gbc-equipos/640/480',
  'default.jpg': 'https://picsum.photos/seed/gbc-farmacia/640/480'
};

function download(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'FarmaciaGBC/1.0' } }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && redirects < 5) {
        file.close();
        fs.unlink(dest, () => {});
        return download(res.headers.location, dest, redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error(`${url} → ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
    }).on('error', (err) => {
      file.close();
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

function copyHero(dest) {
  fs.copyFileSync(HERO, dest);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  let ok = 0;
  for (const [name, url] of Object.entries(IMAGES)) {
    const dest = path.join(OUT, name);
    try {
      await download(url, dest);
      console.log('OK', name);
      ok++;
    } catch (e) {
      console.warn('Fallo', name, e.message);
      if (fs.existsSync(HERO)) {
        copyHero(dest);
        console.log('  → copia hero_pill.png');
        ok++;
      }
    }
  }
  if (ok === 0) {
    console.log('Sin red: generando SVG locales…');
    execSync('node scripts/create-imagenes-categorias.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  }
})();
