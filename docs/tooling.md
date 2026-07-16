# Tooling

## Build

Library packages use `tsdown`.

Reasons:

- It is designed for TypeScript libraries instead of applications.
- It supports ESM, CJS, IIFE and UMD outputs.
- It generates declaration files.
- It is powered by Rolldown and Oxc, which fits the speed and efficiency goal.

Docs use Vite because the docs app is a browser playground, not a package build.
The docs are static HTML pages so GitHub Pages can host them without a server
fallback.

## Releases

Releases use Changesets with a fixed package group.

Reasons:

- Changesets is built for multi-package repositories.
- It creates version PRs and changelogs.
- It can publish all affected packages through GitHub Actions.
- The fixed group keeps `@litopis/*` versions synchronized.

## References

- tsdown: https://tsdown.dev/guide/
- Changesets: https://github.com/changesets/changesets
- Changesets with package manager workflows: https://pnpm.io/using-changesets
- Vite playground pattern for library repos: https://gist.github.com/manzt/222c8e8f4ed35e74514eb756e4ba09bc
- Calendar and date-picker research: ./research.md
