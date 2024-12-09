.PHONY: deploy
deploy:
	firebase deploy --project savantlyworks --only hosting:cookie-block-demo

.PHONY: serve
serve:
	firebase serve --project savantlyworks --only hosting:cookie-block-demo