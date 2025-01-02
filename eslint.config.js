// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		rules: {
			'@typescript-eslint/explicit-module-boundary-types': 'error',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',
			'linebreak-style': ['error', 'unix'],
			'no-unexpected-multiline': 'off',
		},
	},
	{
		ignores: ['**/dist/', '**/temp/', '**/coverage/', '.idea/'],
	}
)
