import * as core from '@actions/core'
import * as github from '@actions/github'

import {validateRemoteTemplate} from './remote'

async function run(): Promise<void> {
  try {
    const {owner, repo} = github.context.repo
    const branch = github.context.ref.replace('refs/heads/', '')
    const directory = core.getInput('directory', {required: false}) || ''
    const token = core.getInput('token', {required: false})

    const baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${directory}`
    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    const result = await validateRemoteTemplate(baseUrl, headers)

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
