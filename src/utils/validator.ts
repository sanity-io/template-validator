import {join} from 'node:path'

import {parse as parseYaml} from 'yaml'

import {ENV_TEMPLATE_FILES, REQUIRED_ENV_VAR} from './constants'
import type {FileReader} from './fileReader'
import type {PackageJson, ValidationResult} from './types'

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
  const packageName = packagePath || 'root package'
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
    errors.push(`Package at ${packageName} must include a package.json file`)
  }

  let hasSanityDep = false
  if (packageJson?.exists) {
    try {
      const pkg: PackageJson = JSON.parse(packageJson.content)
      hasSanityDep = Boolean(pkg.dependencies?.['sanity'] || pkg.devDependencies?.['sanity'])
    } catch {
      errors.push(`Invalid package.json file in ${packageName}`)
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
    const hasSpacesBeforeEqual = /\w+\s+=/.test(envContent)
    if (hasSpacesBeforeEqual) {
      errors.push(
        `Environment template in ${packageName} contains invalid environment variable syntax. Please see https://dotenvx.com/docs/env-file for proper formatting.`,
      )
    }

    const missingVars = Object.entries(REQUIRED_ENV_VAR).filter((obj) => !envContent.match(obj[1]))
    if (missingVars.length > 0) {
      errors.push(
        `Environment template in ${packageName} must include the following variables: ${missingVars.map(([name]) => name).join(', ')}`,
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
export async function validateTemplate(
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

  const packagesWithMissingEnvFile = packages.filter((_, i) => !validations[i].hasEnvFile)
  if (packagesWithMissingEnvFile.length > 0) {
    const envOptionsString = ENV_TEMPLATE_FILES.join(', ')
    const packagesString = packagesWithMissingEnvFile.map((p) => p || 'root').join(', ')
    errors.push(`Missing env template file [${envOptionsString}] in packages: ${packagesString}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
