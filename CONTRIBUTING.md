# Contributing

## Commands

```sh
bun run format
bun run lint
bun run typecheck
bun run test
bun run build
```

## Commits

Use Conventional Commits:

```txt
feat: add range selection state
fix: preserve focus after month navigation
test: cover disabled date navigation
chore: update release workflow
```

Lefthook runs formatting, linting, type checking and tests on pre-commit.
Commit messages are checked with commitlint on `commit-msg`.

## Changesets

Run `bun run changeset` when a change affects published packages.

All public `@litopis/*` packages are configured as one fixed release group.
