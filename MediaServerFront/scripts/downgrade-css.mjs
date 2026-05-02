// Post-procesa el CSS final para hacerlo compatible con Tizen 5 (Chromium 56):
// 1. Aplana @layer (cascade layers, requieren Chrome 99+) — quitando solo el wrapper.
// 2. Elimina @property (Chrome 85+; Chromium 56 los ignora pero ocupan bytes).
// 3. Elimina la declaración inicial `@layer foo, bar, baz;` (no soportada).

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dir = 'dist/assets'

function flattenLayers(css) {
  let out = ''
  let i = 0
  const n = css.length
  while (i < n) {
    if (css.startsWith('@layer', i) && /\s/.test(css[i + 6] ?? '')) {
      // Posición tras "@layer "
      let j = i + 6
      while (j < n && css[j] !== '{' && css[j] !== ';') j++
      if (css[j] === ';') {
        // Declaración de orden: `@layer foo, bar;` — descartar
        i = j + 1
        continue
      }
      if (css[j] === '{') {
        // Encontrar la } balanceada
        let depth = 1
        let k = j + 1
        while (k < n && depth > 0) {
          if (css[k] === '{') depth++
          else if (css[k] === '}') depth--
          if (depth === 0) break
          k++
        }
        // Volcar el contenido del layer y procesar recursivamente nestings
        const inner = css.slice(j + 1, k)
        out += flattenLayers(inner)
        i = k + 1
        continue
      }
    }
    out += css[i]
    i++
  }
  return out
}

function stripAtProperty(css) {
  return css.replace(/@property\s+--[\w-]+\s*\{[^}]*\}/g, '')
}

let processed = 0
for (const file of readdirSync(dir)) {
  if (!file.endsWith('.css')) continue
  const path = join(dir, file)
  const original = readFileSync(path, 'utf8')
  let code = flattenLayers(original)
  code = stripAtProperty(code)
  writeFileSync(path, code)
  processed++
  console.log(`[downgrade-css] ${file}: ${original.length}B -> ${code.length}B`)
}
console.log(`[downgrade-css] OK (${processed} archivos)`)
