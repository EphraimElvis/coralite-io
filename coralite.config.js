import inlineCSS from 'coralite-plugin-inline-css'
import aggregation from 'coralite-plugin-aggregation'

export default {
  plugins: [
    aggregation,
    inlineCSS({
      minify: true,
      atImport: true,
      path: 'dist' 
    })
  ]
}
