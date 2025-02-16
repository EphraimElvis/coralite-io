import HyperExpress from 'hyper-express'
import LiveDirectory from 'live-directory'
import { resolve } from 'node:path'
import localAccess from 'local-access'
import colours from 'kleur'
import { toCode, toMS, toTime } from './build-utils.js'

const sse_streams = {}

/**
 * @import {MiddlewareHandler} from 'hyper-express'
 */

/**
 * Broadcasts messages to connected streams.
 *
 * @param {string} message - Unique identifier for the stream
 */
export function broadcastMessage (message) {
  // Send the message to each connection in our connections object
  Object.keys(sse_streams).forEach((id) => {
    sse_streams[id].send(id, 'rebuild', message)
  })
}

/**
 * Serves static assets from either LiveDirectory or resolve('public').
 *
 * @param {LiveDirectory} liveAsset - Function that loads files from a LiveDirectory instance
 * @param {string} [assetPath] - The path prefix for assets (e.g., '/assets')
 * @returns {MiddlewareHandler} Static asset handler function
 */
const staticAsset = (liveAsset, assetPath) => (request, response) => {
  /** @type {[number, number]} */
  let duration
  let uri, start, dash = colours.gray(' ─ ')
  let status = 200
  start = process.hrtime()

  response.once('finish', () => {
    duration = process.hrtime(start)
    uri = request.originalUrl || request.url

    // log the response time and status code
    process.stdout.write(toTime() + toCode(status) + dash + toMS(duration) + dash + uri + '\n')
  })

  // lookup LiveFile instance from our LiveDirectory instance.
  let path = request.path

  if (assetPath) {
    // strip away '/assets' from the request path to get asset relative path
    path = request.path.replace(assetPath, '')
  }

  if (path.endsWith('/')) {
    // handle slash '/' for index file
    path += 'index.html'
  } else {
    const fileParts = path.split('.')

    // append html to file path without extensions
    if (fileParts.length < 2) {
      path += '.html'
    }
  }

  const file = liveAsset.get(path)

  // return a 404 if no asset/file exists on the derived path
  if (file === undefined) {
    status = 404
    return response.status(status).send()
  }

  const fileParts = file.path.split('.')
  const extension = fileParts[fileParts.length - 1]

  // retrieve the file content and serve it depending on the type of content available for this file
  const content = file.content

  if (!content) {
    status = 404
    // handle case where no content is available for this file type and return a not found response.
    // This can happen if the asset was deleted or moved to another location in our live directory
    // structure but still exists on disk at that path (e.g., due to caching)
    return response.status(status).send()
  }

  if (content instanceof Buffer) {
    // set appropriate mime-type and serve file content Buffer as response body (This means that the file content was cached in memory)
    return response.type(extension).send(content)
  } else {
    /** @TODO Response.stream is missing type */
    // set the type and stream the content as the response body (This means that the file content was NOT cached in memory)
    //@ts-ignore
    return response.type(extension).stream(content)
  }
}

/**
 * Routes for server-side functionality
 *
 * @param {HyperExpress.Server} server - Web server
 */
function routes (server) {
  const liveAssets = new LiveDirectory(resolve('public'), {
    cache: {
      max_file_count: 250,
      max_file_size: 10000000 // 10 mb
    }
  })
  const livePages = new LiveDirectory(resolve('dist'))

  // Create static serve route to serve frontend assets
  server.get('/assets/*', staticAsset(liveAssets, '/assets'))

  // Serve html pages
  server.get('/*', staticAsset(livePages))

  // server-side event
  server.get('/_/rebuild', (request, response) => {
    // Check to ensure that SSE if available for this request
    if (response.sse) {
      // Looks like we're all good, let's open the stream
      response.sse.open()
      // OR you may also send a message which will open the stream automatically
      response.sse.send('Some initial message')

      // Assign a unique identifier to this stream and store it in our broadcast pool
      const sseId = crypto.randomUUID()
      sse_streams[sseId] = response.sse

      // Bind a 'close' event handler to cleanup this connection once it disconnects
      response.once('close', () => {
        // Delete the stream from our broadcast pool
        delete sse_streams[sseId]
      })
    } else {
      // End the response with some kind of error message as this request did not support SSE
      response.send('webserver-Sent Events Not Supported!')
    }
  })
}

/**
 * Starts server and listens for connections
 *
 * @param {number} port - The port to listen on, defaults to 3000
 * @returns {Promise<HyperExpress.Server>} Promise that resolves when server is ready
 */
export function server (port = 3000) {
  return new Promise((resolve, reject) => {
    const webserver = new HyperExpress.Server()
    // @ts-ignore
    const { local } = localAccess({ port })

    // add routes to server
    routes(webserver)

    webserver.listen(port)
      .then(() => {
        const PAD = '  '
        let border = '─'.repeat(Math.min(process.stdout.columns, 36) / 2)
        // print server status
        process.stdout.write('\n' + PAD + colours.green('Coralite is ready! 🚀\n\n'))
        process.stdout.write(PAD + `${colours.bold('- Local:')}      ${local}\n\n`)
        process.stdout.write(border + colours.inverse(' LOGS ') + border + '\n\n')

        // resolve web server
        resolve(webserver)
      })
      .catch((error) => reject(error))
  })
}

