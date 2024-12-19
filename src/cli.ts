#!/usr/bin/env node

import {validateLocalTemplate} from './local'

async function validateWithCli() {
  const directory = process.argv[2] || process.cwd()

  try {
    const result = await validateLocalTemplate(directory)

    if (!result.isValid) {
      console.error('Validation failed:')
      for (const error of result.errors) {
        console.error(`- ${error}`)
      }
      process.exit(1)
    } else {
      console.log('Template validated successfully')
    }
  } catch (error) {
    console.error('Validation failed:', error)
    process.exit(1)
  }
}

validateWithCli()
