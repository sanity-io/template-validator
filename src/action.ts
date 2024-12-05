import * as core from '@actions/core'
import * as github from '@actions/github'

import {getMonoRepo, validateSanityTemplate} from './validator'

async function run(): Promise<void> {
  try {
    const repository = core.getInput('repository', {required: true})
    const [owner, repo] = repository.split('/')

    const context = github.context
    const branch = context.ref.replace('refs/heads/', '')

    const baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`

    const packages = (await getMonoRepo(baseUrl)) || ['']
    const result = await validateSanityTemplate(baseUrl, packages)

    if (!result.isValid) {
      core.setFailed(result.errors.join('\n'))
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run()
