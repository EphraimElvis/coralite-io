import postcss from 'postcss/lib/postcss'
import atImport from 'postcss-import'
import mergeQueries from 'postcss-merge-queries'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Builds CSS files from PostCSS processed source files.
 *
 * @param {Object} options
 * @param {string} options.filename - The name of the file to process (relative from input).
 * @param {string} options.input – Directory containing CSS files, defaults to cwd if not provided.
 * @param {string} options.output Path where processed css will be saved in a format suitable for serving static assets or embedding into HTML via `<style>` tag (relative from input).
 */
export function buildCSS ({ filename, input, output }) {
  return new Promise((resolve, reject) => {
    const from = join(input, filename)

    readFile(from, { encoding: 'utf8' })
      .then(css => {
        // process the CSS with PostCSS.
        postcss()
          .use(atImport())
          .use(mergeQueries())
          .process(css, { from })
          .then((result) => {
            const mkdirPromise = []

            if (!existsSync(output)) {
              // create output directory if it doesn't exist.
              mkdirPromise.push(mkdir(output))
            }

            Promise.all(mkdirPromise)
              .then(() => {
                // write processed CSS to file.
                writeFile(join(output, filename), result.css)
                  .then(() => resolve())
                  .catch(error => reject(error))
              })
              .catch(error => reject(error))
          })
          .catch(error => reject(error))
      })
      .catch(error => reject(error))
  })
}
