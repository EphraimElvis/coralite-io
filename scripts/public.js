import { cpSync } from 'node:fs'

try {
  cpSync('./public', './dist/assets', {
    recursive: true,
    force: true
  })
} catch (error) {
  console.log(error.message)
}
