/** @public */
export declare const ENV_FILE: {
  readonly TEMPLATE: '.env.template'
  readonly EXAMPLE: '.env.example'
  readonly LOCAL_EXAMPLE: '.env.local.example'
  readonly LOCAL_TEMPLATE: '.env.local.template'
}

/** @public */
export declare const ENV_TEMPLATE_FILES: readonly [
  '.env.template',
  '.env.example',
  '.env.local.example',
  '.env.local.template',
]

/** @public */
declare interface FileReader_2 {
  readFile(filePath: string): Promise<{
    exists: boolean
    content: string
  }>
}
export {FileReader_2 as FileReader}

/** @public */
export declare function getMonoRepo(fileReader: FileReader_2): Promise<string[] | undefined>

/** @public */
export declare class GitHubFileReader implements FileReader_2 {
  private baseUrl
  private headers
  constructor(baseUrl: string, headers?: Record<string, string>)
  readFile(filePath: string): Promise<{
    exists: boolean
    content: string
  }>
}

/** @public */
export declare class LocalFileReader implements FileReader_2 {
  private basePath
  constructor(basePath: string)
  readFile(filePath: string): Promise<{
    exists: boolean
    content: string
  }>
}

/** @public */
export declare const REQUIRED_ENV_VAR: {
  readonly PROJECT_ID: RegExp
  readonly DATASET: RegExp
}

/** @public */
export declare function validateLocal(directory: string): Promise<void>

/** @public */
export declare function validateSanityTemplate(
  fileReader: FileReader_2,
  packages?: string[],
): Promise<ValidationResult>

/** @public */
export declare type ValidationResult = {
  isValid: boolean
  errors: string[]
}

export {}
