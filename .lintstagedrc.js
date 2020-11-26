module.exports = {
	'*.{js,ts}': ['prettier --write --use-tabs', 'eslint --no-ignore'],
	'*.{json,yml}': 'prettier --write',
	'!(*.api).md': 'prettier --write',
}
