import * as core from '@actions/core'
import * as github from '@actions/github'

import {getMonoRepo, validateSanityTemplate} from './validator'

async function run(): Promise<void> {
  try {
    const token = core.getInput('github_token', {required: true})
    const repository = core.getInput('repository', {required: true})
    const [owner, repo] = repository.split('/')

    const octokit = github.getOctokit(token)

    // Get default branch
    const {data: repoData} = await octokit.rest.repos.get({owner, repo})
    const branch = repoData.default_branch

    const baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`

    const packages = (await getMonoRepo(baseUrl, {
      Authorization: `Bearer ${token}`,
    })) || ['']

    const result = await validateSanityTemplate(baseUrl, packages, {
      Authorization: `Bearer ${token}`,
    })

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
