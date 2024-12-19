import {GitHubFileReader} from './utils/fileReader'
import type {ValidationResult} from './utils/types'
import {getMonoRepo, validateTemplate} from './utils/validator'

/** @public */
export async function validateRemoteTemplate(
  baseUrl: string,
  headers: Record<string, string> = {},
): Promise<ValidationResult> {
  const fileReader = new GitHubFileReader(baseUrl, headers)
  const packages = (await getMonoRepo(fileReader)) || ['']
  return validateTemplate(fileReader, packages)
}
