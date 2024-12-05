# Sanity Template Validator

A validation utility for Sanity.io template repositories. Use it as a dependency in your projects or as a GitHub Action to ensure your Sanity templates meet the required standards.

## Features

- Validates Sanity.io template structure and requirements
- Supports monorepo detection and validation
- Can be used as a Node.js dependency or GitHub Action
- Validates environment variables and configuration files
- TypeScript support with full type definitions

## Installation

```bash
npm install @sanity/template-validator
# or
yarn add @sanity/template-validator
# or
pnpm add @sanity/template-validator
```

## Usage

### As a Node.js Dependency

```typescript
import {validateSanityTemplate, getMonoRepo} from '@sanity/template-validator'

async function validateMyTemplate() {
  const baseUrl = 'https://raw.githubusercontent.com/owner/repo/branch'

  // Optional: Check if it's a monorepo
  const packages = await getMonoRepo(baseUrl) || ['']

  // Validate the template
  const result = await validateSanityTemplate(baseUrl, packages)

  if (result.isValid) {
    console.log('Template is valid!')
  } else {
    console.error('Validation failed:', result.errors)
  }
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
        uses: sanity-io/template-validator@v0.1.6
        with:
          repository: ${{ github.repository }}
```

## API Reference

### `validateSanityTemplate`

Validates a Sanity template repository against required criteria.

```typescript
async function validateSanityTemplate(
  baseUrl: string,
  packages?: string[],
  headers?: Record<string, string>
): Promise<ValidationResult>
```

Parameters:
- `baseUrl`: The base URL to the raw repository content
- `packages`: Array of package paths for monorepos (optional)
- `headers`: Custom headers for API requests (optional)

Returns:
```typescript
type ValidationResult = {
  isValid: boolean
  errors: string[]
}
```

### `getMonoRepo`

Detects if a repository is a monorepo by examining common configuration files.

```typescript
async function getMonoRepo(
  baseUrl: string,
  headers?: Record<string, string>
): Promise<string[] | undefined>
```

Parameters:
- `baseUrl`: The base URL to the raw repository content
- `headers`: Custom headers for API requests (optional)

Returns:
- An array of package paths if it's a monorepo
- `undefined` if it's not a monorepo

## Validation Rules

A valid Sanity template must meet the following criteria:

### For Single-Package Repositories:
- Must have a valid `package.json` with 'sanity' dependency
- Must have `sanity.config.js/ts` and `sanity.cli.js/ts`
- Must have one of: `.env.template`, `.env.example`, or `.env.local.example`

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
| `repository` | Repository to validate (owner/repo format) | Yes |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © Sanity.io

## Support

- [Create an issue](https://github.com/sanity-io/template-validator/issues)
- [Sanity Community](https://slack.sanity.io)
