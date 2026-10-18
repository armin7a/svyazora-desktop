// macOS: App ad-hoc signieren (ohne Apple-Zertifikat). Ohne Signatur meldet macOS auf Apple-Silicon-Macs
// „App ist beschädigt“; mit Ad-hoc-Signatur lässt sie sich über Systemeinstellungen → Datenschutz & Sicherheit öffnen.
const { execFileSync } = require('node:child_process')
const path = require('node:path')

exports.default = async function adhocSign(context) {
  if (context.electronPlatformName !== 'darwin') return
  const app = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`)
  console.log(`  • ad-hoc signing  ${app}`)
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', app], { stdio: 'inherit' })
  execFileSync('codesign', ['--verify', '--deep', '--strict', app], { stdio: 'inherit' })
}
