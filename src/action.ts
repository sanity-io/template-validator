import * as core from '@actions/core'
import * as github from '@actions/github'

import {GitHubFileReader} from './utils/fileReader'
import {getMonoRepo, validateSanityTemplate} from './utils/validator'

async function run(): Promise<void> {
  try {
    const {owner, repo} = github.context.repo
    const branch = github.context.ref.replace('refs/heads/', '')
    const directory = core.getInput('directory', {required: false}) || ''
    const baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${directory}`

    const fileReader = new GitHubFileReader(baseUrl)
    const packages = (await getMonoRepo(fileReader)) || ['']
    const result = await validateSanityTemplate(fileReader, packages)

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
