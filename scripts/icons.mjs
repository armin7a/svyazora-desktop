// Erzeugt die App-Symbole aus dem Logo: build/icon.png (macOS, mit Rand nach Apple-Vorlage)
// und build/icon-win.png (Windows, randlos). Aufruf: npm run icons
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const out = (name) => path.join(root, 'build', name)

// Logo-Inhalt auf 64er-Raster (wie public/favicon.svg der Web-App)
const mark = `
  <path d="M42 22a10 10 0 1 0-10 10a10 10 0 1 1-10 10" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
  <circle cx="42" cy="22" r="4.5" fill="#5f5cf0" stroke="#fff" stroke-width="3"/>
  <circle cx="22" cy="42" r="4.5" fill="#5753e9" stroke="#fff" stroke-width="3"/>`
const gradient = `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7b7bf7"/><stop offset="1" stop-color="#4f46e5"/></linearGradient>`

// Windows: randlos, abgerundet
const win = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs>${gradient}</defs>
  <rect width="64" height="64" rx="14" fill="url(#g)"/>${mark}</svg>`

// macOS: 824er Fläche auf 1024er Leinwand, mit leichtem Schatten
const mac = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><defs>${gradient}
  <filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="12" stdDeviation="14" flood-opacity="0.22"/></filter></defs>
  <rect x="100" y="100" width="824" height="824" rx="185" fill="url(#g)" filter="url(#s)"/>
  <g transform="translate(100 100) scale(12.875)">${mark}</g></svg>`

fs.mkdirSync(path.join(root, 'build'), { recursive: true })
fs.writeFileSync(out('logo.svg'), win)
await sharp(Buffer.from(mac), { density: 300 }).resize(1024, 1024).png().toFile(out('icon.png'))
await sharp(Buffer.from(win), { density: 600 }).resize(512, 512).png().toFile(out('icon-win.png'))
console.log('Symbole erzeugt: build/icon.png, build/icon-win.png, build/logo.svg')
