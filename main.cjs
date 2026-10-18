// Svyazora Desktop – lädt immer die aktuelle Web-App, dadurch ist jede Änderung sofort auch in der App.
const { app, BrowserWindow, Menu, dialog, nativeTheme, net, session, shell } = require('electron')
const fs = require('node:fs')
const path = require('node:path')

const APP_URL = process.env.SVYAZORA_URL || 'https://svyazora.netlify.app'
const APP_ORIGIN = new URL(APP_URL).origin
const RELEASES_API = 'https://api.github.com/repos/armin7a/svyazora-desktop/releases/latest'
const DOWNLOAD_PAGE = 'https://github.com/armin7a/svyazora-desktop/releases/latest'

let win = null

// Nur eine Instanz: ein zweiter Start holt das vorhandene Fenster nach vorne
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!win) return
    if (win.isMinimized()) win.restore()
    win.focus()
  })
  app.whenReady().then(start)
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (!win) createWindow()
})

function start() {
  // Die Web-App erkennt daran die Desktop-App (z. B. um Download-Hinweise auszublenden)
  session.defaultSession.setUserAgent(`${session.defaultSession.getUserAgent()} SvyazoraDesktop/${app.getVersion()}`)
  // Kamera, Mikrofon, Standort usw. braucht Svyazora nicht – nur das Kopieren in die Zwischenablage
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => callback(permission === 'clipboard-sanitized-write'))

  Menu.setApplicationMenu(buildMenu())
  createWindow()
  checkForAppUpdate()
}

// ---------------------------------------------------------------- Fenster

const stateFile = () => path.join(app.getPath('userData'), 'window-state.json')

function loadWindowState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile(), 'utf8'))
  } catch {
    return { width: 1280, height: 840 }
  }
}

function saveWindowState() {
  if (!win || win.isDestroyed()) return
  try {
    fs.writeFileSync(stateFile(), JSON.stringify({ ...win.getNormalBounds(), maximized: win.isMaximized() }))
  } catch {
    /* nicht kritisch */
  }
}

function createWindow() {
  const state = loadWindowState()
  win = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: 380,
    minHeight: 500,
    show: false,
    title: 'Svyazora',
    autoHideMenuBar: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0b0b0c' : '#fafafa',
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  })
  if (state.maximized) win.maximize()

  win.once('ready-to-show', () => win.show())
  win.on('close', saveWindowState)
  win.on('closed', () => {
    win = null
  })

  const wc = win.webContents

  // Fremde Adressen (Favoriten, Links in Notizen, E-Mail, Telefon) im Standardprogramm öffnen
  wc.setWindowOpenHandler(({ url }) => {
    openExternal(url)
    return { action: 'deny' }
  })
  wc.on('will-navigate', (event, url) => {
    if (isAppUrl(url)) return
    event.preventDefault()
    openExternal(url)
  })

  // Ohne Internet: eigene Seite mit „Erneut versuchen“ statt Fehlerseite
  wc.on('did-fail-load', (_event, code, _desc, url, isMainFrame) => {
    if (!isMainFrame || code === -3 /* abgebrochen */) return
    win.loadFile(path.join(__dirname, 'offline.html'), { query: { url: isAppUrl(url) ? url : APP_URL } })
  })

  win.loadURL(APP_URL)
}

function isAppUrl(url) {
  try {
    const { origin, protocol } = new URL(url)
    return origin === APP_ORIGIN || protocol === 'file:'
  } catch {
    return false
  }
}

function openExternal(url) {
  try {
    const { protocol } = new URL(url)
    if (['https:', 'http:', 'mailto:', 'tel:'].includes(protocol)) shell.openExternal(url)
  } catch {
    /* ungültige Adresse ignorieren */
  }
}

// ---------------------------------------------------------------- Menü

function buildMenu() {
  const isMac = process.platform === 'darwin'
  return Menu.buildFromTemplate([
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about', label: 'Über Svyazora' },
              { type: 'separator' },
              { role: 'hide', label: 'Svyazora ausblenden' },
              { role: 'hideOthers', label: 'Andere ausblenden' },
              { role: 'unhide', label: 'Alle einblenden' },
              { type: 'separator' },
              { role: 'quit', label: 'Svyazora beenden' },
            ],
          },
        ]
      : [{ label: 'Datei', submenu: [{ role: 'quit', label: 'Beenden' }] }]),
    {
      label: 'Bearbeiten',
      submenu: [
        { role: 'undo', label: 'Widerrufen' },
        { role: 'redo', label: 'Wiederholen' },
        { type: 'separator' },
        { role: 'cut', label: 'Ausschneiden' },
        { role: 'copy', label: 'Kopieren' },
        { role: 'paste', label: 'Einfügen' },
        { role: 'selectAll', label: 'Alles auswählen' },
      ],
    },
    {
      label: 'Ansicht',
      submenu: [
        { role: 'reload', label: 'Neu laden' },
        { role: 'forceReload', label: 'Neu laden (ohne Cache)' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Originalgröße' },
        { role: 'zoomIn', label: 'Vergrößern' },
        { role: 'zoomOut', label: 'Verkleinern' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Vollbild' },
        ...(app.isPackaged ? [] : [{ role: 'toggleDevTools' }]),
      ],
    },
    { role: 'windowMenu', label: 'Fenster' },
    {
      label: 'Hilfe',
      submenu: [
        { label: 'Svyazora im Browser öffnen', click: () => shell.openExternal(APP_URL) },
        { label: 'Nach App-Updates suchen', click: () => checkForAppUpdate(true) },
      ],
    },
  ])
}

// ---------------------------------------------------------------- App-Updates
// Inhalte und Design kommen immer frisch von der Website. Nur das App-Gerüst selbst wird selten
// aktualisiert: unter Windows automatisch im Hintergrund, unter macOS per Hinweis mit Download-Link
// (automatische Updates setzen dort ein kostenpflichtiges Apple-Zertifikat voraus).

function checkForAppUpdate(manual = false) {
  if (!app.isPackaged) return
  if (process.platform === 'win32') {
    const { autoUpdater } = require('electron-updater')
    autoUpdater.autoInstallOnAppQuit = true
    autoUpdater.logger = null
    if (!autoUpdater.listenerCount('error')) autoUpdater.on('error', () => {}) // Fehler meldet das Promise unten
    autoUpdater
      .checkForUpdates()
      .then((result) => {
        if (manual && !result?.isUpdateAvailable) info('Svyazora ist auf dem neuesten Stand.')
        if (manual && result?.isUpdateAvailable) info('Ein Update wird geladen und beim nächsten Beenden installiert.')
      })
      .catch(() => manual && info('Die Suche nach Updates ist fehlgeschlagen. Bitte später erneut versuchen.'))
    return
  }
  net
    .fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
    .then(async (release) => {
      const latest = String(release.tag_name || '').replace(/^v/, '')
      if (!isNewer(latest, app.getVersion())) {
        if (manual) info('Svyazora ist auf dem neuesten Stand.')
        return
      }
      const { response } = await dialog.showMessageBox(win, {
        type: 'info',
        message: `Svyazora ${latest} ist verfügbar`,
        detail: 'Lade die neue Version herunter und ersetze damit die App im Programme-Ordner.',
        buttons: ['Herunterladen', 'Später'],
        defaultId: 0,
        cancelId: 1,
      })
      if (response === 0) shell.openExternal(DOWNLOAD_PAGE)
    })
    .catch(() => manual && info('Die Suche nach Updates ist fehlgeschlagen. Bitte später erneut versuchen.'))
}

function isNewer(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0)
  }
  return false
}

function info(message) {
  dialog.showMessageBox(win, { type: 'info', message, buttons: ['OK'] })
}
