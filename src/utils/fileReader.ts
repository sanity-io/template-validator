import fs from 'node:fs/promises'
import path from 'node:path'

import type {GitHubDirectoryEntry} from './types'

/** @public */
export interface FileReader {
  readFile(filePath: string): Promise<{exists: boolean; content: string}>
  readDir(dirPath: string): Promise<string[]>
}

/** @public */
export class GitHubFileReader implements FileReader {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string> = {},
  ) {}

  async readFile(filePath: string): Promise<{exists: boolean; content: string}> {
    const response = await fetch(`${this.baseUrl}/${filePath}`, {headers: this.headers})
    return {
      exists: response.status === 200,
      content: await response.text(),
    }
  }

  async readDir(dirPath: string): Promise<string[]> {
    try {
      // Convert raw GitHub URL to API URL for directory listing
      // From: https://raw.githubusercontent.com/owner/repo/branch/path
      // To: https://api.github.com/repos/owner/repo/contents/path?ref=branch
      const url = new URL(this.baseUrl)
      const [, owner, repo, branch, ...rest] = url.pathname.split('/')
      const dirSlug = path.join(`repos/${owner}/${repo}/contents`, ...rest, dirPath)
      const apiUrl = new URL(dirSlug, 'https://api.github.com')
      apiUrl.searchParams.set('ref', branch) // Set branch ref

      const response = await fetch(apiUrl, {headers: this.headers})
      if (!response.ok) return []

      const data: GitHubDirectoryEntry[] = await response.json()
      return Array.isArray(data)
        ? data.filter((item) => item.type === 'dir').map((item) => item.name)
        : []
    } catch {
      return []
    }
  }
}

/** @public */
export class LocalFileReader implements FileReader {
  constructor(private basePath: string) {}

  async readFile(filePath: string): Promise<{exists: boolean; content: string}> {
    try {
      const fullPath = path.join(this.basePath, filePath)
      const content = await fs.readFile(fullPath, 'utf-8')
      return {
        exists: true,
        content,
      }
    } catch (error) {
      return {
        exists: false,
        content: '',
      }
    }
  }

  async readDir(dirPath: string): Promise<string[]> {
    try {
      const fullPath = path.join(this.basePath, dirPath)
      const entries = await fs.readdir(fullPath, {withFileTypes: true})
      return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
    } catch {
      return []
    }
  }
}
