export default {
	'*.{js,ts}': ['prettier --write', 'eslint'],
	'*.{json,yml}': 'prettier --write',
	'!(*.api).md': 'prettier --write',
}
