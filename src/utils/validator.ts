import {join} from 'node:path'

import {parse as parseYaml} from 'yaml'

import {
  ENV_TEMPLATE_FILES,
  REQUIRED_ENV_VAR_APP,
  REQUIRED_ENV_VAR_STUDIO,
  ROOT_PACKAGE_NAME,
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

/** @public */
async function validatePackage(
  fileReader: FileReader,
  packagePath: string,
): Promise<{
  hasSanityConfig: boolean
  hasSanityCli: boolean
  hasEnvFile: boolean
  hasSanityDep: boolean
  hasSanitySdkDep: boolean
  errors: string[]
}> {
  const packageName = packagePath || ROOT_PACKAGE_NAME
  const errors: string[] = []

  const requiredFiles = [
    'package.json',
    'sanity.config.ts',
    'sanity.config.js',
    'sanity.config.tsx',
    'sanity.config.jsx',
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
  let hasSanitySdkDep = false
  if (packageJson?.exists) {
    try {
      const pkg: PackageJson = JSON.parse(packageJson.content)
      hasSanityDep = Boolean(pkg.dependencies?.['sanity'] || pkg.devDependencies?.['sanity'])
      hasSanitySdkDep = Boolean(pkg.dependencies?.['@sanity/sdk-react'])
    } catch {
      errors.push(`Invalid package.json file in ${packageName}`)
    }
  }

  const hasSanityConfig = fileChecks.some(
    ({exists, file}) =>
      exists &&
      (file === 'sanity.config.ts' ||
        file === 'sanity.config.js' ||
        file === 'sanity.config.tsx' ||
        file === 'sanity.config.jsx'),
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

    const requiredVars = hasSanityConfig
      ? REQUIRED_ENV_VAR_STUDIO
      : hasSanityCli
        ? REQUIRED_ENV_VAR_APP
        : null

    if (requiredVars) {
      for (const [name, pattern] of Object.entries(requiredVars)) {
        if (!envContent.match(pattern)) {
          errors.push(
            `Environment template in ${packageName} is missing required variable: ${name}`,
          )
        }
      }
    }
  }

  return {
    hasSanityConfig,
    hasSanityCli,
    hasEnvFile: Boolean(envFile),
    hasSanityDep,
    hasSanitySdkDep,
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

  const hasSanityConfig = validations.some((v) => v.hasSanityConfig)
  const hasSanityCli = validations.some((v) => v.hasSanityCli)
  const hasSanityDep = validations.some((v) => v.hasSanityDep)
  const hasSanitySdkDep = validations.some((v) => v.hasSanitySdkDep)

  const isStudio = hasSanityConfig && hasSanityDep
  const isApp = hasSanityCli && hasSanityDep && hasSanitySdkDep

  if (!isStudio && !isApp) {
    if (hasSanityConfig) {
      errors.push('Studio templates must include "sanity" as a dependency in package.json')
    } else if (hasSanityCli) {
      if (!hasSanityDep) {
        errors.push('App templates must include "sanity" as a dependency in package.json')
      }

      if (!hasSanitySdkDep) {
        errors.push(
          'App templates must include "@sanity/sdk-react" as a dependency in package.json',
        )
      }
    } else {
      errors.push(
        'Template must be a studio (requires sanity.config.[js|ts|jsx|tsx] and "sanity" dependency) or a SDK app (requires sanity.cli.[js|ts], "sanity", and "@sanity/sdk-react" dependencies)',
      )
    }
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

  return {
    isValid: errors.length === 0,
    errors,
  }
}
