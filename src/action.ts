import * as core from '@actions/core'
import * as github from '@actions/github'

import {getMonoRepo, validateSanityTemplate} from './validator'

async function run(): Promise<void> {
  try {
    const repository = core.getInput('repository', {required: true})
    const token = core.getInput('github_token', {required: false})
    const [owner, repo] = repository.split('/')

    const octokit = github.getOctokit(token)

    // Get default branch
    const {data: repoData} = await octokit.rest.repos.get({owner, repo})
    const branch = repoData.default_branch

    const baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`

    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const packages = (await getMonoRepo(baseUrl, headers)) || ['']
    const result = await validateSanityTemplate(baseUrl, packages, headers)

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
