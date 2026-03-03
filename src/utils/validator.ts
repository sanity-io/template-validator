import {join} from 'node:path'

import {parse as parseYaml} from 'yaml'

import {
  ENV_TEMPLATE_FILES,
  REQUIRED_ENV_VAR,
  ROOT_PACKAGE_NAME,
  SEED_DATA_EXTENSIONS,
  SEED_DIR,
  SEED_DIR_VALID_DATA_FILES,
} from './constants'
import type {FileReader} from './fileReader'
import type {PackageJson, ValidationResult} from './types'

/** @public */
export async function getMonoRepo(fileReader: FileReader): Promise<string[] | undefined> {
  const expandWildcards = async (patterns: string[]): Promise<string[]> => {
    return Promise.all(
      patterns.map(async (pattern) => {
        if (!pattern.includes('*')) return pattern.replace(/\/$/, '')
        const [baseDirRaw = ''] = pattern.split('/*')
        const baseDir = baseDirRaw.replace(/\/$/, '')
        const contents = await fileReader.readDir(baseDir).catch(() => [])
        return contents.map((dir) => join(baseDir, dir))
      }),
    ).then((results) => results.flat())
  }

  const handlers = {
    'package.json': {
      check: async (content: string) => {
        try {
          const pkg = JSON.parse(content)
          if (!pkg.workspaces) return undefined
          const patterns = Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces.packages
          return patterns ? await expandWildcards(patterns) : undefined
        } catch {
          return undefined
        }
      },
    },
    'pnpm-workspace.yaml': {
      check: async (content: string) => {
        try {
          const config = parseYaml(content)
          return config.packages ? await expandWildcards(config.packages) : undefined
        } catch {
          return undefined
        }
      },
    },
    'lerna.json': {
      check: async (content: string) => {
        try {
          const config = JSON.parse(content)
          return config.packages ? await expandWildcards(config.packages) : undefined
        } catch {
          return undefined
        }
      },
    },
    'rush.json': {
      check: async (content: string) => {
        try {
          const config = JSON.parse(content)
          return config.projects?.map((p: {packageName: string}) => p.packageName)
        } catch {
          return undefined
        }
      },
    },
  } as const

  const fileChecks = await Promise.all(
    Object.keys(handlers).map(async (file) => {
      const result = await fileReader.readFile(file)
      return {file, ...result}
    }),
  )

  for (const check of fileChecks) {
    if (!check.exists) continue
    const result = await handlers[check.file as keyof typeof handlers].check(check.content)
    if (result) return result
  }

  return undefined
}

async function validateSeedData(
  fileReader: FileReader,
  packagePath: string,
): Promise<{errors: string[]; notices: string[]}> {
  const errors: string[] = []
  const notices: string[] = []
  const packageName = packagePath || ROOT_PACKAGE_NAME
  const seedExtensions: readonly string[] = SEED_DATA_EXTENSIONS

  // Check files next to sanity.config for unrecognized seed data files
  const rootFiles = await fileReader.listFiles(packagePath || '')
  const recognizedRootFiles = ['seed.tar.gz', 'seed.ndjson']

  for (const file of rootFiles) {
    const hasSeedExtension = seedExtensions.some((ext) => file.endsWith(ext))
    if (!hasSeedExtension) continue

    if (!recognizedRootFiles.includes(file)) {
      const filePath = packagePath ? `${packagePath}/${file}` : file
      notices.push(
        `Found "${filePath}" which won't be recognized by sanity init. To use as seed data, rename to: seed.tar.gz, seed.ndjson, seed/data.tar.gz, or seed/data.ndjson.`,
      )
    }
  }

  // Check if seed/ directory exists and validate its contents
  const packageDirs = await fileReader.readDir(packagePath || '')
  if (packageDirs.includes(SEED_DIR)) {
    const seedDirPath = packagePath ? join(packagePath, SEED_DIR) : SEED_DIR
    const seedFiles = await fileReader.listFiles(seedDirPath)
    const validDataFiles: readonly string[] = SEED_DIR_VALID_DATA_FILES

    for (const file of seedFiles) {
      const hasSeedExtension = seedExtensions.some((ext) => file.endsWith(ext))
      if (!hasSeedExtension) continue

      if (!validDataFiles.includes(file)) {
        errors.push(
          `Unrecognized file "${file}" in ${packageName}/${SEED_DIR}/. Rename to data.tar.gz or data.ndjson.`,
        )
      }
    }
  }

  return {errors, notices}
}

async function validateRootSeedData(fileReader: FileReader): Promise<string[]> {
  const notices: string[] = []
  const rootFiles = await fileReader.listFiles('')
  const seedExtensions: readonly string[] = SEED_DATA_EXTENSIONS
  const recognizedSeedNames = ['seed.tar.gz', 'seed.ndjson']

  for (const file of rootFiles) {
    const hasSeedExtension = seedExtensions.some((ext) => file.endsWith(ext))
    if (!hasSeedExtension) continue

    if (recognizedSeedNames.includes(file)) {
      notices.push(
        `Found "${file}" at repository root which won't be recognized by sanity init. Move it next to a sanity.config file in a studio package.`,
      )
    } else {
      notices.push(
        `Found "${file}" at repository root which won't be recognized by sanity init. Seed data should be next to a sanity.config file and named: seed.tar.gz, seed.ndjson, seed/data.tar.gz, or seed/data.ndjson.`,
      )
    }
  }

  return notices
}

/** @public */
async function validatePackage(
  fileReader: FileReader,
  packagePath: string,
): Promise<{
  hasSanityConfig: boolean
  hasSanityCli: boolean
  hasEnvFile: boolean
  hasSanityDep: boolean
  errors: string[]
  notices: string[]
}> {
  const packageName = packagePath || ROOT_PACKAGE_NAME
  const errors: string[] = []

  const requiredFiles = [
    'package.json',
    'sanity.config.ts',
    'sanity.config.js',
    'sanity.config.tsx',
    'sanity.cli.ts',
    'sanity.cli.js',
    ...ENV_TEMPLATE_FILES,
  ]

  const fileChecks = await Promise.all(
    requiredFiles.map(async (file) => {
      const filePath = packagePath ? join(packagePath, file) : file
      const result = await fileReader.readFile(filePath)
      return {file, ...result}
    }),
  )

  const packageJson = fileChecks.find((f) => f.file === 'package.json')
  if (!packageJson?.exists) {
    errors.push(`Package at ${packageName} must include a package.json file`)
  }

  let hasSanityDep = false
  if (packageJson?.exists) {
    try {
      const pkg: PackageJson = JSON.parse(packageJson.content)
      hasSanityDep = Boolean(
        pkg.dependencies?.['sanity'] ||
        pkg.dependencies?.['next-sanity'] ||
        pkg.dependencies?.['@sanity/client'],
      )
    } catch {
      errors.push(`Invalid package.json file in ${packageName}`)
    }
  }

  const hasSanityConfig = fileChecks.some(
    ({exists, file}) =>
      exists &&
      (file === 'sanity.config.ts' || file === 'sanity.config.js' || file === 'sanity.config.tsx'),
  )

  const hasSanityCli = fileChecks.some(
    ({exists, file}) => exists && (file === 'sanity.cli.ts' || file === 'sanity.cli.js'),
  )

  const envFile = fileChecks.find(
    ({exists, file}) =>
      exists && ENV_TEMPLATE_FILES.includes(file as (typeof ENV_TEMPLATE_FILES)[number]),
  )

  if (envFile) {
    const envContent = envFile.content
    const hasSpacesBeforeEqual = /\w+\s+=/.test(envContent)
    if (hasSpacesBeforeEqual) {
      errors.push(
        `Environment template in ${packageName} contains invalid environment variable syntax. Please see https://dotenvx.com/docs/env-file for proper formatting.`,
      )
    }

    for (const [name, pattern] of Object.entries(REQUIRED_ENV_VAR)) {
      if (!envContent.match(pattern)) {
        errors.push(`Environment template in ${packageName} is missing required variable: ${name}`)
      }
    }
  }

  // Validate seed data for studio packages (those with sanity.config)
  let seedErrors: string[] = []
  let seedWarnings: string[] = []
  if (hasSanityConfig) {
    const seedResult = await validateSeedData(fileReader, packagePath)
    seedErrors = seedResult.errors
    seedWarnings = seedResult.notices
  }

  return {
    hasSanityConfig,
    hasSanityCli,
    hasEnvFile: Boolean(envFile),
    hasSanityDep,
    errors: [...errors, ...seedErrors],
    notices: seedWarnings,
  }
}

/** @public */
export async function validateTemplate(
  fileReader: FileReader,
  packages: string[] = [''],
): Promise<ValidationResult> {
  const errors: string[] = []
  const notices: string[] = []
  const validations = await Promise.all(packages.map((pkg) => validatePackage(fileReader, pkg)))

  for (const v of validations) {
    errors.push(...v.errors)
    notices.push(...v.notices)
  }

  const hasSanityDep = validations.some((v) => v.hasSanityDep)
  if (!hasSanityDep) {
    errors.push('At least one package must include "sanity" as a dependency in package.json')
  }

  const hasSanityConfig = validations.some((v) => v.hasSanityConfig)
  if (!hasSanityConfig) {
    errors.push('At least one package must include a sanity.config.[js|ts|tsx] file')
  }

  const hasSanityCli = validations.some((v) => v.hasSanityCli)
  if (!hasSanityCli) {
    errors.push('At least one package must include a sanity.cli.[js|ts] file')
  }

  const missingEnvTemplates = packages
    .filter((_, i) => validations[i] && validations[i].hasSanityDep && !validations[i].hasEnvFile)
    .map((p) => p || ROOT_PACKAGE_NAME)
  const envExamples = ENV_TEMPLATE_FILES.join(', ')
  const missingTemplatesStr = missingEnvTemplates.join(', ')
  if (missingEnvTemplates.length) {
    errors.push(`Missing env template in packages: ${missingTemplatesStr}. [${envExamples}]`)
  } else if (!validations.some((v) => v.hasEnvFile)) {
    errors.push(`At least one package must include an env template file [${envExamples}]`)
  }

  // Scan repo root for misplaced seed data in monorepos
  const isMonoRepo = packages.length > 1 || (packages.length === 1 && packages[0] !== '')
  if (isMonoRepo) {
    const rootSeedWarnings = await validateRootSeedData(fileReader)
    notices.push(...rootSeedWarnings)
  }

  return {
    isValid: errors.length === 0,
    errors,
    notices,
  }
}
