/** @public */
export const REQUIRED_ENV_VAR = {
  PROJECT_ID: /SANITY(?:_STUDIO)?_PROJECT_ID/,
  DATASET: /SANITY(?:_STUDIO)?_DATASET/,
} as const

/** @public */
export const ENV_FILE = {
  TEMPLATE: '.env.template',
  EXAMPLE: '.env.example',
  LOCAL_EXAMPLE: '.env.local.example',
  LOCAL_TEMPLATE: '.env.local.template',
} as const

/** @public */
export const ENV_TEMPLATE_FILES = [
  ENV_FILE.TEMPLATE,
  ENV_FILE.EXAMPLE,
  ENV_FILE.LOCAL_EXAMPLE,
  ENV_FILE.LOCAL_TEMPLATE,
] as const

/** @public */
export const ROOT_PACKAGE_NAME = 'root package' as const
