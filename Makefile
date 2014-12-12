ifeq ($(words $(MAKECMDGOALS)), 1)
	LEVEL = minor
else
	LEVEL = $(filter-out $@,$(MAKECMDGOALS))
endif

release: package.json
	git pull --rebase
	npm test
	npm version $(LEVEL)
	npm publish
	git push --follow-tags

%:
	@:
