export interface PackageJson {
  name: string
  version: string

  description?: string
  author?: string
  license?: string
  private?: boolean

  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>

  workspaces?: string[] | {packages: string[]}
  repository?: {type: string; url: string}
}

export type RepoInfo = {
  username: string
  name: string
  branch: string
  filePath: string
}

/** @public */
export type ValidationResult = {
  isValid: boolean
  errors: string[]
}
