/**
 * Abre cada pantalla en el navegador con captura directa a Figma (sin guardar PNG en el proyecto).
 * Requiere: npm start + plugin Figma conectado en Cursor para obtener capture IDs.
 *
 * Uso con agente: pedir "ejecuta node scripts/push-to-figma-capture.mjs con MCP Figma"
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'figma-pantallas.json'), 'utf8'));
const BASE = manifest.baseUrl || 'http://localhost:5500';
const FILE_KEY = manifest.fileKey;

console.log(`
=== Captura directa a Figma ===
Archivo: ${manifest.fileUrl}
Pantallas: ${manifest.pantallas.length}

Este script abre el navegador con la URL de captura Figma.
Los capture IDs deben generarse con la herramienta MCP "generate_figma_design"
(outputMode: existingFile, fileKey: ${FILE_KEY}).

Sin MCP Figma activo en Cursor, pide al agente que ejecute las capturas.
`);

function openCapture(captureId, pagePath, delayMs) {
  const ep = encodeURIComponent(`https://mcp.figma.com/mcp/capture/${captureId}/submit`);
  const url = `${BASE}${pagePath}#figmacapture=${captureId}&figmaendpoint=${ep}&figmadelay=${delayMs || 4000}`;
  if (process.platform === 'win32') {
    execSync(`start "" "${url}"`, { shell: true });
  } else if (process.platform === 'darwin') {
    execSync(`open "${url}"`);
  } else {
    execSync(`xdg-open "${url}"`);
  }
}

export { manifest, openCapture, BASE, FILE_KEY };
