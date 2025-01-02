import terser from '@rollup/plugin-terser'
import path from 'path'
import { defineConfig } from 'rollup'
import ts from 'rollup-plugin-typescript2'
import pkg from './package.json' assert { type: 'json' }

const outputCfg = {
	sourcemap: true,
}

export default defineConfig({
	input: 'src/index.ts',
	output: [
		{
			format: 'es',
			file: pkg.module,
			...outputCfg,
		},
		{
			format: 'cjs',
			file: pkg.main,
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
})
