import coralite from 'coralite'
import { existsSync } from 'node:fs'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { getSubDirectory } from 'coralite/utils'

/**
 * Builds HTML files from Coralite templates and pages.
 *
 * @param {Object} options
 * @param {string} options.pages - Path to pages directory
 * @param {string} options.templates - Path to templates directory
 * @param {string} options.output - Output path for HTML files
 */
export async function buildHTML ({ pages, templates, output }) {
  const documents = await coralite({
    templates,
    pages
  })

  for (let i = 0; i < documents.length; i++) {
    const document = documents[i]
    // get pages sub directory
    const subDir = getSubDirectory(pages, document.item.parentPath)
    const dir = join(output, subDir)

    try {
      if (!existsSync(dir)) {
        // create directory if it doesn't exist
        await mkdir(dir)
      }

      // write the HTML file
      await writeFile(join(dir, document.item.name), document.html)
    // file written successfully
    } catch (err) {
      throw err
    }
  }
}

