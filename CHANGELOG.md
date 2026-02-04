<!-- markdownlint-disable --><!-- textlint-disable -->

# 📓 Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.0.0](https://github.com/sanity-io/template-validator/compare/sr-v2.4.5...sr-v3.0.0) (2026-02-04)

### ⚠ BREAKING CHANGES

- note: @actions/core@3.0.0 is ESM-only, but this package
  already uses ESM ("type": "module"), so no code changes are required.

Ref: https://github.com/advisories/GHSA-g9mf-h72j-4rw9

### Bug Fixes

- add missing `@types/node` package ([#18](https://github.com/sanity-io/template-validator/issues/18)) ([3489d8d](https://github.com/sanity-io/template-validator/commit/3489d8d02ef3c895a367227b259f832414bc23e6))
- update `@actions/core` to v3 to resolve undici vulnerability ([#17](https://github.com/sanity-io/template-validator/issues/17)) ([613875a](https://github.com/sanity-io/template-validator/commit/613875a3fb19f45ed20d8338035cbf3e2034c676))

## [2.4.6-rc.1](https://github.com/sanity-io/template-validator/compare/sr-v2.4.5...sr-v2.4.6-rc.1) (2026-02-03)

### Bug Fixes

- format with prettier ([28ac5fa](https://github.com/sanity-io/template-validator/commit/28ac5fa7a2b5a5f91d49ad587765dcde10b7dff7))
