import { readFileSync } from 'node:fs';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve as resolve } from '@rollup/plugin-node-resolve';
import common from '@rollup/plugin-commonjs';
import { default as terser } from '@rollup/plugin-terser';
import declaration from 'rollup-plugin-dts'

const { main, iife, module, types } = JSON.parse(readFileSync('./package.json'));

const defaults = {
	name: 'Decoy',
	sourcemap: false,
};

function configure(...args) {
	return args.reduce((carry, options) => {
		const basic = { ...defaults, ...options };
		const min = {
			...basic,
			file: basic.file.replace(/(\.[a-z]+)$/, '.min$1'),
			plugins: [terser({ format: { comments: false } })],
		};

		return carry.concat(basic, min);
	}, []);
}

export default [
	{
		input: 'source/main.ts',
		output: configure(
			{ file: main, format: 'cjs' },
			{ file: iife, format: 'iife' },
			{ file: module, format: 'es' },
		),
		plugins: [resolve(), common(), typescript(), common()],
	},
	{
		input: 'temp/main.d.ts',
		output: { file: types, format: 'es' },
		plugins: [declaration()],
	}
];
