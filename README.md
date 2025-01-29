# Sanity Template Validator

[![npm stat](https://img.shields.io/npm/dm/@sanity/template-validator.svg?style=flat-square)](https://npm-stat.com/charts.html?package=@sanity/template-validator)
[![npm version](https://img.shields.io/npm/v/@sanity/template-validator.svg?style=flat-square)](https://www.npmjs.com/package/@sanity/template-validator)

A validation utility for Sanity.io template repositories. Use it as a dependency in your projects or as a GitHub Action to ensure your Sanity templates meet the required standards.

## Features

- Validates Sanity.io template structure and requirements
- Supports monorepo detection and validation
- Can be used as a Node.js dependency, GitHub Action, or CLI tool
- Validates environment variables and configuration files
- TypeScript support with full type definitions
- Local directory validation support

## Installation

```bash
npm install @sanity/template-validator
# or
yarn add @sanity/template-validator
# or
pnpm add @sanity/template-validator
```

## Usage

### As a CLI Tool

The package includes a CLI tool that can validate local directories:

```bash
# Install globally
npm install -g @sanity/template-validator

# Validate current directory
sanity-template-validate

# Validate specific directory
sanity-template-validate path/to/template

# Using Npx
npx @sanity/template-validator
```

#### Adding as a Dev Dependency

The recommended way to use the validator in your template project is to add it as a dev dependency and create a validation script:

1. Add to your project:
```bash
npm install --save-dev @sanity/template-validator
```

2. Add a script to your `package.json`:
```json
{
  "scripts": {
    "validate": "sanity-template-validate"
  }
}
```

3. Run the validation:
```bash
npm run validate
```

### As a Node.js Dependency

```typescript
import {validateLocalTemplate, validateRemoteTemplate} from '@sanity/template-validator'

// Validate a local directory
async function validateLocal() {
  const result = await validateLocalTemplate('/path/to/template')

  if (result.isValid) {
    console.log('Template is valid!')
  } else {
    console.error('Validation failed:', result.errors)
  }
}

// Validate a remote repository
async function validateRemote() {
  const baseUrl = 'https://raw.githubusercontent.com/owner/repo/branch'
  const result = await validateRemoteTemplate(baseUrl)

  if (result.isValid) {
    console.log('Template is valid!')
  } else {
    console.error('Validation failed:', result.errors)
  }
}

// Advanced usage with FileReader
import {LocalFileReader, getMonoRepo} from '@sanity/template-validator'

async function advancedValidation() {
  const fileReader = new LocalFileReader('/path/to/template')
  const packages = await getMonoRepo(fileReader)
  // Use packages for further processing
}
```

### As a GitHub Action

```yaml
name: Validate Template
on: push

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Validate Sanity Template
        uses: sanity-io/template-validator@v2
```

## API Reference

### `validateLocalTemplate`

Validates a local Sanity template directory.

```typescript
async function validateLocalTemplate(directory: string): Promise<ValidationResult>
```

Parameters:
- `directory`: Path to the template directory

### `validateRemoteTemplate`

Validates a remote Sanity template repository.

```typescript
async function validateRemoteTemplate(
  baseUrl: string,
  headers?: Record<string, string>
): Promise<ValidationResult>
```

Parameters:
- `baseUrl`: The base URL to the raw repository content
- `headers`: Custom headers for API requests (optional)

Returns:
```typescript
type ValidationResult = {
  isValid: boolean
  errors: string[]
}
```

### File Readers

The package provides two file reader classes for advanced usage:

```typescript
class LocalFileReader implements FileReader {
  constructor(basePath: string)
  readFile(filePath: string): Promise<{exists: boolean; content: string}>
}

class GitHubFileReader implements FileReader {
  constructor(baseUrl: string, headers?: Record<string, string>)
  readFile(filePath: string): Promise<{exists: boolean; content: string}>
}
```

### `getMonoRepo`

Helper function to detect monorepo configuration.

```typescript
async function getMonoRepo(fileReader: FileReader): Promise<string[] | undefined>
```

## Validation Rules

A valid Sanity template must meet the following criteria:

### For Single-Package Repositories:
- Must have a valid `package.json` with 'sanity' dependency
- Must have `sanity.config.js/ts/tsx` and `sanity.cli.js/ts`
- Must have one of: `.env.template`, `.env.example`, `.env.local.template`, or `.env.local.example`

### For Monorepos:
- Each package must have a valid `package.json`
- At least one package must include 'sanity' in dependencies
- At least one package must have Sanity configuration files
- Each package must have appropriate environment template files

### Environment Files Must Include:
- `SANITY_PROJECT_ID` or `SANITY_STUDIO_PROJECT_ID`
- `SANITY_DATASET` or `SANITY_STUDIO_DATASET`

## GitHub Action Inputs

| Input | Description | Required |
|-------|-------------|----------|
| `directory` | The directory to validate. Use this if you have multiple templates in a repository. | No |
| `token` | GitHub token for accessing and validating private repositories. | No |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © Sanity.io

## Support

- [Create an issue](https://github.com/sanity-io/template-validator/issues)
- [Sanity Community](https://slack.sanity.io)
