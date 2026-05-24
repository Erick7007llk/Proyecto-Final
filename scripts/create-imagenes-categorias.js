/**
 * Crea imágenes SVG locales por categoría — node scripts/create-imagenes-categorias.js
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'IMG', 'categorias');

const CATEGORIAS = [
  { file: 'medicamentos', label: 'Medicamentos', color: '#0d9488', icon: '💊' },
  { file: 'vitaminas', label: 'Vitaminas', color: '#f59e0b', icon: '🍊' },
  { file: 'cardiovascular', label: 'Cardiovascular', color: '#dc2626', icon: '❤️' },
  { file: 'dermocosmetica', label: 'Dermocosmética', color: '#ec4899', icon: '✨' },
  { file: 'bebes', label: 'Bebés', color: '#3b82f6', icon: '👶' },
  { file: 'higiene', label: 'Higiene', color: '#10b981', icon: '🧴' },
  { file: 'equipos', label: 'Equipos', color: '#6366f1', icon: '🩺' },
  { file: 'default', label: 'Farmacia GBC', color: '#b91c1c', icon: '➕' }
];

function svg({ label, color, icon }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0.35"/>
    </linearGradient>
  </defs>
  <rect width="640" height="480" fill="#f8fafc"/>
  <rect width="640" height="480" fill="url(#bg)"/>
  <circle cx="520" cy="80" r="120" fill="${color}" opacity="0.12"/>
  <circle cx="100" cy="400" r="90" fill="${color}" opacity="0.1"/>
  <text x="320" y="200" text-anchor="middle" font-size="72">${icon}</text>
  <text x="320" y="270" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="700" fill="${color}">${label}</text>
  <text x="320" y="310" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="18" fill="#64748b">Farmacia GBC</text>
</svg>`;
}

fs.mkdirSync(OUT, { recursive: true });

for (const cat of CATEGORIAS) {
  const dest = path.join(OUT, `${cat.file}.svg`);
  fs.writeFileSync(dest, svg(cat), 'utf8');
  console.log('OK', path.basename(dest));
}
