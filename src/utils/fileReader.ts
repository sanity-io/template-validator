import fs from 'node:fs/promises'
import path from 'node:path'

export interface FileReader {
  readFile(filePath: string): Promise<{exists: boolean; content: string}>
}

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
}

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
}
