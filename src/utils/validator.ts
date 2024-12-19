import {join} from 'node:path'
import {parse as parseYaml} from 'yaml'

import {ENV_TEMPLATE_FILES, REQUIRED_ENV_VAR} from './constants'
import type {FileReader} from './fileReader'
import type {ValidationResult} from './types'

/** @public */
export async function getMonoRepo(fileReader: FileReader): Promise<string[] | undefined> {
  const handlers = {
    'package.json': {
      check: (content: string) => {
        try {
          const pkg = JSON.parse(content)
          if (!pkg.workspaces) return undefined
          return Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces.packages
        } catch {
          return undefined
        }
      },
    },
    'pnpm-workspace.yaml': {
      check: (content: string) => {
        try {
          const config = parseYaml(content)
          return config.packages
        } catch {
          return undefined
        }
      },
    },
    'lerna.json': {
      check: (content: string) => {
        try {
          const config = JSON.parse(content)
          return config.packages
        } catch {
          return undefined
        }
      },
    },
    'rush.json': {
      check: (content: string) => {
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
    const result = handlers[check.file as keyof typeof handlers].check(check.content)
    if (result) return result
  }

  return undefined
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
}> {
  const errors: string[] = []

  const requiredFiles = [
    'package.json',
    'sanity.config.ts',
    'sanity.config.js',
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
    errors.push(`Package at ${packagePath || 'root'} must include a package.json file`)
  }

  let hasSanityDep = false
  if (packageJson?.exists) {
    try {
      const pkg = JSON.parse(packageJson.content)
      hasSanityDep = !!(pkg.dependencies?.sanity || pkg.devDependencies?.sanity)
    } catch {
      errors.push(`Invalid package.json file in ${packagePath || 'root'}`)
    }
  }

  const hasSanityConfig = fileChecks.some(
    (f) => f.exists && (f.file === 'sanity.config.ts' || f.file === 'sanity.config.js'),
  )

  const hasSanityCli = fileChecks.some(
    (f) => f.exists && (f.file === 'sanity.cli.ts' || f.file === 'sanity.cli.js'),
  )

  const envFile = fileChecks.find(
    (f) => f.exists && ENV_TEMPLATE_FILES.includes(f.file as (typeof ENV_TEMPLATE_FILES)[number]),
  )

  if (envFile) {
    const envContent = envFile.content
    const hasProjectId = envContent.match(REQUIRED_ENV_VAR.PROJECT_ID)
    const hasDataset = envContent.match(REQUIRED_ENV_VAR.DATASET)

    if (!hasProjectId || !hasDataset) {
      const missing = []
      if (!hasProjectId) missing.push('SANITY_PROJECT_ID or SANITY_STUDIO_PROJECT_ID')
      if (!hasDataset) missing.push('SANITY_DATASET or SANITY_STUDIO_DATASET')
      errors.push(
        `Environment template in ${
          packagePath || 'repo'
        } must include the following variables: ${missing.join(', ')}`,
      )
    }
  }

  return {
    hasSanityConfig,
    hasSanityCli,
    hasEnvFile: Boolean(envFile),
    hasSanityDep,
    errors,
  }
}

/** @public */
export async function validateSanityTemplate(
  fileReader: FileReader,
  packages: string[] = [''],
): Promise<ValidationResult> {
  const errors: string[] = []
  const validations = await Promise.all(packages.map((pkg) => validatePackage(fileReader, pkg)))

  for (const v of validations) {
    errors.push(...v.errors)
  }

  const hasSanityDep = validations.some((v) => v.hasSanityDep)
  if (!hasSanityDep) {
    errors.push('At least one package must include "sanity" as a dependency in package.json')
  }

  const hasSanityConfig = validations.some((v) => v.hasSanityConfig)
  if (!hasSanityConfig) {
    errors.push('At least one package must include a sanity.config.js or sanity.config.ts file')
  }

  const hasSanityCli = validations.some((v) => v.hasSanityCli)
  if (!hasSanityCli) {
    errors.push('At least one package must include a sanity.cli.js or sanity.cli.ts file')
  }

  const missingEnvPackages = packages.filter((_, i) => !validations[i].hasEnvFile)
  if (missingEnvPackages.length > 0) {
    errors.push(
      `The following packages are missing .env.template, .env.example, or .env.local.example files: ${missingEnvPackages
        .map((p) => p || 'root')
        .join(', ')}`,
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
