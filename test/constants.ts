import path from 'node:path'

export const LOCAL_TEST_TEMPLATE = path.join(__dirname, 'fixtures/test-template')
export const REMOTE_TEST_TEMPLATE =
  'https://raw.githubusercontent.com/sanity-io/template-validator/main/test/fixtures/test-template'
