import atImport from 'postcss-import'
import mergeQueries from 'postcss-merge-queries'

export default {
  plugins: [
    atImport({
      path: ['src/css']
    }),
    mergeQueries()
  ]
}
