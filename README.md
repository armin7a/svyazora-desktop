# Svyazora Desktop

Svyazora als eigenes Programm für **Windows 10/11** und **macOS** (Apple Silicon und Intel).

## Herunterladen

| System | Download |
|---|---|
| Windows 10/11 | [Svyazora-Windows-Setup.exe](https://github.com/armin7a/svyazora-desktop/releases/latest/download/Svyazora-Windows-Setup.exe) |
| macOS | [Svyazora-macOS.dmg](https://github.com/armin7a/svyazora-desktop/releases/latest/download/Svyazora-macOS.dmg) |

Die App ist nicht mit einem kostenpflichtigen Entwickler-Zertifikat signiert. Deshalb fragt das System beim ersten Start nach:

- **Windows:** „Der Computer wurde durch Windows geschützt“ → *Weitere Informationen* → *Trotzdem ausführen*.
- **macOS:** DMG öffnen, Svyazora in *Programme* ziehen, starten. Erscheint eine Warnung: *Systemeinstellungen* → *Datenschutz & Sicherheit* → bei Svyazora *Dennoch öffnen*.

## Wie die App aktuell bleibt

Die App lädt immer die Web-App von <https://svyazora.netlify.app>. Jede Änderung an Svyazora ist damit sofort auch in der App, ohne Update.
Ist die App lange geöffnet, erscheint bei einer neuen Version der Hinweis „Neu laden“.

Nur das App-Gerüst selbst (dieses Repository) wird selten aktualisiert: unter Windows automatisch im Hintergrund, unter macOS mit einem Hinweis und Download-Link.

## Entwickeln

```bash
npm install
npm start                                       # App starten (lädt die Live-Seite)
SVYAZORA_URL=http://127.0.0.1:4173 npm start    # gegen eine lokale Vorschau
npm run icons                                   # Symbole aus dem Logo neu erzeugen
npm run dist:win                                # Windows-Installer lokal bauen
```

## Neue Version veröffentlichen

1. `version` in `package.json` erhöhen, z. B. `1.0.1`.
2. Committen, Tag setzen und pushen:
   ```bash
   git commit -am "Version 1.0.1"
   git tag v1.0.1
   git push origin main v1.0.1
   ```
3. GitHub Actions baut beide Installer (ca. 10 Min.) und veröffentlicht sie als Release. Die Download-Links oben zeigen automatisch auf die neueste Version.
