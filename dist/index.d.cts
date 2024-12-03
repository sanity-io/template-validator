/** @public */
export declare function getMonoRepo(
  baseUrl: string,
  headers?: Record<string, string>,
): Promise<string[] | undefined>

/** @public */
export declare function validateSanityTemplate(
  baseUrl: string,
  packages?: string[],
  headers?: Record<string, string>,
): Promise<ValidationResult>

/** @public */
export declare type ValidationResult = {
  isValid: boolean
  errors: string[]
}

export {}
