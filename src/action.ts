import * as core from '@actions/core'
import * as github from '@actions/github'

import {getMonoRepo, validateSanityTemplate} from './validator'

async function run(): Promise<void> {
  try {
    const {owner, repo} = github.context.repo
    const branch = github.context.ref.replace('refs/heads/', '')
    const directory = core.getInput('directory', {required: false}) || ''
    const baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${directory}`

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
