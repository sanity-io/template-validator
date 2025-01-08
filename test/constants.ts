import {fileURLToPath} from 'node:url'
import {join, dirname} from 'node:path'
import * as github from '@actions/github'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const branch = github?.context?.payload?.pull_request?.head?.ref ?? 'main'

export const LOCAL_FIXTURES = join(__dirname, 'fixtures')
// export const REMOTE_FIXTURES = `https://raw.githubusercontent.com/sanity-io/template-validator/${branch}/test/fixtures`
export const REMOTE_FIXTURES = `https://raw.githubusercontent.com/sanity-io/template-validator/feat/get-monorepo-wildcard-directories/test/fixtures`
