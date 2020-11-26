import path from 'path'
import ts from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

const outputCfg = {
	sourcemap: true,
}

export default {
	input: 'src/index.ts',
	output: [
		{
			format: 'cjs',
			file: pkg.main,
			...outputCfg,
		},
		{
			format: 'es',
			file: pkg.module,
			...outputCfg,
		},
		{
			format: 'iife',
			file: pkg.unpkg,
			name: path.basename(pkg.unpkg).replace(/\..*$/, '').replace(/-.*$/, ''),
			plugins: [terser()],
			...outputCfg,
		},
	],
	plugins: [ts()],
}
