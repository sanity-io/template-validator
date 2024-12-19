import path from 'node:path'

import {LocalFileReader} from './utils/fileReader'
import {getMonoRepo, validateSanityTemplate} from './utils/validator'

async function validateLocal(directory: string): Promise<void> {
  const fileReader = new LocalFileReader(directory)

  try {
    const packages = (await getMonoRepo(fileReader)) || ['']
    const result = await validateSanityTemplate(fileReader, packages)

    if (!result.isValid) {
      console.error('Validation failed:')
      result.errors.forEach((error) => console.error(`- ${error}`))
      process.exit(1)
    } else {
      console.log('Validation successful!')
    }
  } catch (error) {
    console.error('Validation failed:', error)
    process.exit(1)
  }
}

// When running directly
if (require.main === module) {
  const directory = process.argv[2] || process.cwd()
  validateLocal(path.resolve(directory))
}

export {validateLocal}
