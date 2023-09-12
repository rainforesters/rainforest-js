export default {
	preset: 'ts-jest/presets/default-esm',
	transform: {
		'.ts': [
			'ts-jest',
			{
				useESM: true,
				isolatedModules: true,
				tsconfig: {
					moduleResolution: 'node',
				},
			},
		],
	},
	collectCoverage: true,
}
