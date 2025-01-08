import {describe, expect, it} from 'vitest'
import {validateRemoteTemplate} from '../src/remote'
import {GitHubFileReader} from '../src/utils/fileReader'
import {validateTemplate, getMonoRepo} from '../src/utils/validator'
import {REMOTE_FIXTURES} from './constants'

describe('Remote Template Tests', () => {
  describe('npm-workspace-monorepo', () => {
    const fileReader = new GitHubFileReader(`${REMOTE_FIXTURES}/npm-workspace-monorepo`)

    it('should validate template using helper successfully', async () => {
      const result = await validateRemoteTemplate(`${REMOTE_FIXTURES}/npm-workspace-monorepo`)
      console.log('REMOTE_FIXTURES', REMOTE_FIXTURES)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate template successfully', async () => {
      const packages = await getMonoRepo(fileReader)
      const result = await validateTemplate(fileReader, packages)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect package.json workspaces', async () => {
      const packages = await getMonoRepo(fileReader)

      expect(packages).toBeDefined()
      expect(packages?.sort()).toEqual(['app', 'studio'].sort())
    })
  })

  describe('flat-repo', () => {
    const fileReader = new GitHubFileReader(`${REMOTE_FIXTURES}/flat-repo`)

    it('should validate template using helper successfully', async () => {
      const result = await validateRemoteTemplate(`${REMOTE_FIXTURES}/flat-repo`)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate template successfully', async () => {
      const packages = await getMonoRepo(fileReader)
      const result = await validateTemplate(fileReader, packages)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle non-monorepo structure', async () => {
      const packages = await getMonoRepo(fileReader)

      expect(packages).toBeUndefined()
    })
  })

  describe('invalid-repo', () => {
    const fileReader = new GitHubFileReader(`${REMOTE_FIXTURES}/invalid-repo`)

    it('should fail validation using helper', async () => {
      const result = await validateRemoteTemplate(`${REMOTE_FIXTURES}/invalid-repo`)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should fail validation', async () => {
      const packages = await getMonoRepo(fileReader)
      const result = await validateTemplate(fileReader, packages)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBe(4)
    })

    it('should handle non-monorepo structure', async () => {
      const packages = await getMonoRepo(fileReader)

      expect(packages).toBeUndefined()
    })
  })

  describe('pnpm-wildcard-monorepo', () => {
    const fileReader = new GitHubFileReader(`${REMOTE_FIXTURES}/pnpm-wildcard-monorepo`)

    it('should validate template using helper successfully', async () => {
      const result = await validateRemoteTemplate(`${REMOTE_FIXTURES}/pnpm-wildcard-monorepo`)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate template successfully', async () => {
      const packages = await getMonoRepo(fileReader)
      const result = await validateTemplate(fileReader, packages)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect pnpm workspace packages', async () => {
      const packages = await getMonoRepo(fileReader)

      expect(packages).toBeDefined()
      expect(packages?.sort()).toEqual(['packages/app', 'packages/studio'].sort())
    })
  })
})
