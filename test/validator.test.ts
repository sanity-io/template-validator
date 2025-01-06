import {describe, expect, it} from 'vitest'

import {validateLocalTemplate} from '../src/local'
import {validateRemoteTemplate} from '../src/remote'
import {GitHubFileReader, LocalFileReader} from '../src/utils/fileReader'
import {getMonoRepo, validateTemplate} from '../src/utils/validator'
import {LOCAL_TEST_TEMPLATE, REMOTE_TEST_TEMPLATE} from './constants'

describe('Template Validator', () => {
  describe('Local Template Tests', () => {
    const fileReader = new LocalFileReader(LOCAL_TEST_TEMPLATE)

    it('should validate template using helper successfully', async () => {
      const result = await validateLocalTemplate(LOCAL_TEST_TEMPLATE)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate template successfully', async () => {
      const packages = await getMonoRepo(fileReader)
      const result = await validateTemplate(fileReader, packages)

      console.log(result)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect package.json workspaces', async () => {
      const packages = await getMonoRepo(fileReader)

      expect(packages).toBeDefined()
      expect(packages?.sort()).toEqual(['astro-app', 'studio'].sort())
    })
  })

  describe('Remote Template Tests', () => {
    const fileReader = new GitHubFileReader(REMOTE_TEST_TEMPLATE)

    it('should validate remote template successfully', async () => {
      const result = await validateRemoteTemplate(REMOTE_TEST_TEMPLATE)

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
      expect(packages?.sort()).toEqual(['astro-app', 'studio'].sort())
    })
  })
})
