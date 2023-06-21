# Line Endings (EOL) Rollup Plugin

## Description

This is a rollup plugin that is used to convert line endings (EOL) characters. It works on output files, input files (via rollup watchers), and custom glob patterns that allow users to define any file or directories of their choice.

There are two functions return `eol` and `eolOutput`. The only difference being that `eolOutput` can be run on the output files of a rollup build. This is useful if you want to convert the line endings of a particular output file(s). However, the cleanup must happen in the output generation hooks, instead after the entire build is completed. So use  `eol` unless do not want this to run for one of the output builds.

## Installation

You can install the plugin via npm or Yarn:

```shell
npm install rollup-plugin-eol --save-dev
```

or

```shell
yarn add rollup-plugin-eol --dev
```

## Example Usage

```javascript
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import eol, {eolOutput} from 'rollup-plugin-eol';

export default [
	// Example 1 - As a `Build` plugin
	{
		input: 'js/src/**/*.js',
		output: [
			{dir: 'js/dist'},
			{dir: 'js/dist', chunkFileNames: '[name].min.js', plugins: [terser()]},
		],
		plugins: [
			resolve(),
			babel({presets: [['@babel/preset-env']], babelHelpers: 'bundled'}),
			eol({
				outputFiles: true,
				watchFiles: true,
				globPattern: ['css/src/**/*.scss', 'template/**/*.html'],
			}),
		],
	},
	// Example 2 - As an `Output Generation` plugin
	{
		input: 'react/src/**/*.js',
		output: [
			{dir: 'react/dist'},
			{dir: 'react/dist', chunkFileNames: '[name].min.js', plugins: [terser(), eolOutput({eol: `\r\n`})]},
		],
		plugins: [
			resolve(),
			babel({presets: [['@babel/preset-env'], ['@babel/preset-react']], babelHelpers: 'bundled'}),
		],
	},
];
```

### Options

Here are the options you can pass to the plugin:

- `eol`: Desired end of line character(s). Technically can be any string, but it is recommended stick with `\r\n` (Windows style) or `\n` (Linux style).
    - Defaults to `\n` (Linux style).

- `encoding`: Desired encoding for reading and writing files.
    - Defaults to `'utf8'`.

- `outputFiles`: A boolean which, if true, applies the EOL conversion to the output files.
    - Defaults to `true`.

- `watchFiles`: A boolean which, if true, applies the EOL conversion to the files watched by Rollup.
    - Defaults to `false`.

- `globPattern`: A glob pattern(s) to select additional files for EOL conversion (uses the [glob](https://www.npmjs.com/package/glob) npm package).
    - Defaults to `false`.

- `globPatternOptions`: An object to customize the behavior of the glob pattern matching.
    - Defaults to `{ignore: 'node_modules/**'}`.

- `include`: A picomatch pattern, or array of patterns, specifying the files to include.
    - By default all files are included.

- `exclude`: A picomatch pattern, or array of patterns, specifying the files to exclude.
    - By default no files are excluded.

- `debug`: A boolean that controls whether debug messages are printed to the console.
    - Defaults to `false`.