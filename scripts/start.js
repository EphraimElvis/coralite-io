/**
 * Initializes a web development application with HTML, CSS, server, and change monitoring.
 *
 * @example
 * Run this command to initialise the application:
 * ```bash
 * node --experimental-vm-modules scripts/start.js
 * ```
 */
import colours from 'kleur'
import chokidar from 'chokidar'
import { broadcastMessage, server } from './server.js'
import { buildHTML } from './build-html.js'
import { buildCSS } from './build-css.js'
import { toMS, toTime } from './build-utils.js'

const htmlPath = {
  pages: 'src/pages',
  templates: 'src/templates',
  output: 'dist'
}
const cssPath = {
  filename: 'styles.css',
  input: 'assets/css',
  output: 'dist/css'
}

await buildHTML(htmlPath)
await buildCSS(cssPath)

// start server in port 3000
const webserver = await server()

// initialise watcher.
const watcher = chokidar.watch(['./src', './assets'])

/**
 * Recompile the application when a file changes or is added,
 * and send notification about it via broadcastMessage function
 * in 'src/broadcast-message' module if path ends with .html/.css
 * then rebuild HTML / CSS else do nothing for other files.
 * @param {string} path path to the file that has been changed or added
 */
async function rebuild (path) {
  let duration, dash = colours.gray(' ─ ')
  let start = process.hrtime()

  if (path.endsWith('.html')) {
    // rebuild HTML and send notification
    await buildHTML(htmlPath)

    // prints time and path to the file that has been changed or added.
    duration = process.hrtime(start)
    process.stdout.write(toTime() + colours.bgGreen('Rebuild HTML') + dash + toMS(duration) + dash + path + '\n')

    // broadcast message about the change in HTML file path to be updated by user or other scripts if needed.
    broadcastMessage(path)
  } else if (path.endsWith('.css')) {
    // rebuild CSS and send notification
    await buildCSS(cssPath)

    // Prints time and path to the file that has been changed or added.
    duration = process.hrtime(start)
    process.stdout.write(toTime() + colours.bgGreen('Rebuild CSS') + dash + toMS(duration) + dash + path + '\n')

    // broadcast message about the change in CSS file path to be updated by user or other scripts if needed.
    broadcastMessage(path)
  }
}

// listen for changes and add events to rebuild function when file is changed or unlinked
watcher.on('change', async (path) => {
  await rebuild(path)
})

watcher.on('unlink', async (path) => {
  await rebuild(path)
})

// listen for errors and handle them by trying to gracefully shut down the server when an error occurs
watcher.on('error', () => {
  // close server on error
  try {
    webserver.close()
  } catch (e) {
    console.error('Error closing server:', e)
  }
})
