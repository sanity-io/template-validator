import {fileURLToPath} from 'node:url'
import {join, dirname} from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const LOCAL_FIXTURES = join(__dirname, 'fixtures')
export const REMOTE_FIXTURES =
  'https://raw.githubusercontent.com/sanity-io/template-validator/main/test/fixtures'
