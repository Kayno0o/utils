build:
	bun run build

lint:
	bun run lint:fix

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

publish:
	npm publish

deploy: build lint

commit:
	git add -A
	@read -p "Enter commit message: " message; \
	git commit -m "$$message"

push:
	git push

full-patch: deploy commit patch publish push
full-minor: deploy commit minor publish push
full-major: deploy commit major publish push
