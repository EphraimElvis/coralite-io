import { cpSync } from 'node:fs';

const sourceFolderPath = './website';
const destinationFolderPath = './dist';

try {
  cpSync(sourceFolderPath, destinationFolderPath, {
    recursive: true,
    force: true
  })
} catch (error) {
  console.log(error.message);
}
