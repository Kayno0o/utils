fix:
	bun run lint:fix
	bun run check

build: fix
	bun run build

patch: # v0.0.X
	npm version patch
	git push
	git push --tags

minor: # v0.X.0
	npm version minor
	git push
	git push --tags

major: # vX.0.0
	npm version major
	git push
	git push --tags
