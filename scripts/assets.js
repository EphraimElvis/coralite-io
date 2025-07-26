import { cpSync } from 'node:fs'

try {
  cpSync('./assets', './dist/assets', {
    recursive: true,
    force: true
  })
} catch (error) {
  console.log(error.message)
}
