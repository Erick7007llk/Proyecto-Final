/**
 * Orquesta capturas MCP → Figma para las 12 pantallas en figma-pantallas.json.
 * Requiere: npm start + agente con plugin Figma MCP (generate_figma_design).
 *
 * Uso (agente con MCP):
 *   node scripts/figma-mcp-capture-all.mjs --mcp-json captures.json
 *
 * captures.json: array de { id, captureId } generados por generate_figma_design
 * (uno por pantalla, outputMode existingFile, fileKey del manifest).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'figma-pantallas.json'), 'utf8')
);
const BASE = manifest.baseUrl || 'http://localhost:5500';

function openCapture(captureId, pagePath, delayMs) {
  const ep = encodeURIComponent(
    `https://mcp.figma.com/mcp/capture/${captureId}/submit`
  );
  const url = `${BASE}${pagePath}#figmacapture=${captureId}&figmaendpoint=${ep}&figmadelay=${delayMs || 4000}`;
  if (process.platform === 'win32') {
    execSync(`Start-Process "${url}"`, { shell: 'powershell.exe' });
  } else if (process.platform === 'darwin') {
    execSync(`open "${url}"`);
  } else {
    execSync(`xdg-open "${url}"`);
  }
  return url;
}

function parseArgs() {
  const i = process.argv.indexOf('--mcp-json');
  if (i === -1 || !process.argv[i + 1]) {
    console.error(`
Uso: node scripts/figma-mcp-capture-all.mjs --mcp-json <captures.json>

El agente debe:
1. generate_figma_design({ outputMode: "existingFile", fileKey: "${manifest.fileKey}" })
   → un captureId por pantalla (12 llamadas o batch según MCP).
2. Guardar captures.json: [{ "id": "inicio", "captureId": "..." }, ...]
3. Ejecutar este script para abrir cada URL en el navegador.
4. Poll generate_figma_design({ captureId }) cada 5s hasta completed.

Archivo Figma: ${manifest.fileUrl}
`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(path.resolve(process.argv[i + 1]), 'utf8'));
}

const captures = parseArgs();
const byId = new Map(captures.map((c) => [c.id, c.captureId]));

const results = [];
for (const p of manifest.pantallas) {
  const captureId = byId.get(p.id);
  if (!captureId) {
    results.push({ id: p.id, status: 'skipped', reason: 'missing captureId' });
    continue;
  }
  const url = openCapture(captureId, p.path, p.delay);
  results.push({ id: p.id, nombre: p.nombre, captureId, url, status: 'opened' });
  console.log('→', p.id, captureId.slice(0, 8) + '…');
}

fs.writeFileSync(
  path.join(__dirname, 'figma-capture-run.json'),
  JSON.stringify({ fileUrl: manifest.fileUrl, at: new Date().toISOString(), results }, null, 2)
);
console.log('\nAbierto', results.filter((r) => r.status === 'opened').length, 'de', manifest.pantallas.length);
console.log('Log:', path.join(__dirname, 'figma-capture-run.json'));
