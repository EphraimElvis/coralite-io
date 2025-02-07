import atImport from 'postcss-import'

export default {
  plugins: [
    atImport({
      path: ['src/css']
    })
  ]
}
