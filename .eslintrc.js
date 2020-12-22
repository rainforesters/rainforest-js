module.exports = {
	env: {
		node: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier',
		'prettier/@typescript-eslint',
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
		'@typescript-eslint/explicit-module-boundary-types': [
			'warn',
			{
				allowArgumentsExplicitlyTypedAsAny: true,
			},
		],
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-empty-interface': 'off',
		'@typescript-eslint/no-non-null-assertion': 'off',
		'no-unused-vars': 'error',
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
		quotes: ['error', 'single'],
		semi: ['error', 'never'],
	},
}
