#!/usr/bin/env node

import {validateLocal} from './local'

const directory = process.argv[2] || process.cwd()
validateLocal(directory)
