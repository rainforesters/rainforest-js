module.exports = {
	env: {
		node: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 12,
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint'],
	rules: {
		'@typescript-eslint/ban-types': [
			'error',
			{
				types: {
					Function: false,
				},
			},
		],
		'@typescript-eslint/explicit-module-boundary-types': 'error',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-non-null-assertion': 'off',
		'@typescript-eslint/no-unused-vars': 'error',
		indent: [
			'error',
			'tab',
			{
				SwitchCase: 1,
				offsetTernaryExpressions: true,
			},
		],
		'linebreak-style': ['error', 'unix'],
		'no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
		'no-unused-vars': 'off',
		quotes: ['error', 'single'],
		semi: ['error', 'never'],
	},
}
