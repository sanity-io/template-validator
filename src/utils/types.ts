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

/** @public */
export type ValidationResult = {
  isValid: boolean
  errors: string[]
}

/** @public */
export type GitHubDirectoryEntry = {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string | null
  type: 'dir' | 'file'
  _links: {
    self: string
    git: string
    html: string
  }
}
