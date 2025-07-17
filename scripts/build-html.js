import Coralite from 'coralite'
import aggregation from 'coralite-plugin-aggregation'

/**
 * Builds HTML files from Coralite templates and pages.
 *
 * @param {Object} options
 * @param {string} options.pages - Path to pages directory
 * @param {string} options.templates - Path to templates directory
 * @param {string} options.output - Output path for HTML files
 */
export async function buildHTML ({ pages, templates, output }) {
  const coralite = new Coralite({
    templates,
    pages,
    plugins: [aggregation]
  })
  await coralite.initialise()

  const document = await coralite.compile()

  await coralite.save(document, output)
}

