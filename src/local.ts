import {LocalFileReader} from './utils/fileReader'
import type {ValidationResult} from './utils/types'
import {getMonoRepo, validateTemplate} from './utils/validator'

/** @public */
export async function validateLocalTemplate(directory: string): Promise<ValidationResult> {
  const fileReader = new LocalFileReader(directory)
  const packages = (await getMonoRepo(fileReader)) || ['']
  return validateTemplate(fileReader, packages)
}
