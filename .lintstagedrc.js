module.exports = {
	'*.{js,ts}': ['prettier --write --use-tabs', 'eslint'],
	'*.{json,yml}': 'prettier --write',
	'!(*.api).md': 'prettier --write',
}
