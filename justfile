fix:
	bun run lint:fix
	bun run check

build: fix
	bun run build

patch: (release "patch") # v0.0.X

minor: (release "minor") # v0.X.0

major: (release "major") # vX.0.0

# bump, then push the branch and its new tag in one atomic push; a rejected push drops the bump so a retry starts clean
release level:
	#!/usr/bin/env bash
	set -euo pipefail
	npm version {{level}}
	tag=$(git tag --points-at HEAD)
	if ! git push --atomic origin HEAD "$tag"; then
	  git tag -d "$tag"
	  git reset --keep HEAD~1
	  exit 1
	fi
