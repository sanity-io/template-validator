import {fileURLToPath} from 'node:url'
import {join, dirname} from 'node:path'
import * as github from '@actions/github'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const branch = github?.context?.ref?.replace('refs/heads/', '') ?? 'main'

export const LOCAL_FIXTURES = join(__dirname, 'fixtures')
export const REMOTE_FIXTURES = `https://raw.githubusercontent.com/sanity-io/template-validator/${branch}/test/fixtures`
