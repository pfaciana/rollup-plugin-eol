import {createFilter} from '@rollup/pluginutils';
import path from 'path';
import {fileURLToPath} from 'url';
import process from 'process';
import {Worker} from 'worker_threads';
import {glob} from 'glob'
import chalk from 'chalk';

const pwf = fileURLToPath(import.meta.url);
const pwd = path.dirname(pwf);

async function awaitPromises(promises) {
	if (promises.length) {
		try {
			await Promise.all(promises);
		} catch (error) {
			console.log(error);
		}
	}
}

async function validateFiles(files, dir = process.cwd()) {
	let validatedFiles = [];

	const promises = files.map(file => {
		return new Promise((resolve, reject) => {
			const worker = new Worker(path.join(pwd, './file-exists.js'));
			worker.postMessage({file, dir});
			worker.on('message', response => {
				response.file && validatedFiles.push(response.file);
			});
			worker.on('exit', exitCode => {
				resolve(exitCode)
			});
		});
	});

	await awaitPromises(promises);

	return validatedFiles;
}

async function processFiles(files, options) {
	const promises = files.map(file => {
		return new Promise((resolve, reject) => {
			const worker = new Worker(path.join(pwd, './process-file.js'));
			const {eol, encoding} = options;
			worker.postMessage({file, options: {eol, encoding}});
			worker.on('message', ({status, file, error = null}) => {
				if (options.debug || status !== 'ignored') {
					if (status !== 'error') {
						console.log(`${chalk.bold.yellow(`EOL ${status}: ${file}`)}`);
					} else {
						console.log(`${chalk.bold.red.bold(`EOL ${status}: ${file}`)}`);
					}
				}
			});
			worker.on('exit', exitCode => {
				resolve(exitCode)
			});
		});
	});

	await awaitPromises(promises);
}

async function processOutputFiles(outputOptions, bundle, options) {
	const outputDir = outputOptions.dir || path.dirname(outputOptions.file);
	const outputFiles = Object.keys(bundle).map(file => {
		file = path.isAbsolute(file) ? file : path.join(outputDir, file);
		return options.filter(file) ? file : false;
	}).filter(Boolean);
	const validatedFiles = await validateFiles(outputFiles);
	return await processFiles(validatedFiles, options);
}

async function processWatchFiles(watchFiles, options) {
	const validatedFiles = await validateFiles(watchFiles);
	return await processFiles(validatedFiles, options);
}

async function processGlobPatterns(options) {
	let patternFiles = await glob(options.globPattern, options.globPatternOptions);
	patternFiles.map(file => options.filter(file) ? file : false).filter(Boolean);
	const validatedFiles = await validateFiles(patternFiles);
	return await processFiles(validatedFiles, options);
}

const defaultOptions = {
	eol: `\n`,
	encoding: 'utf8',
	debug: false,
	outputFiles: true,
	watchFiles: false,
	globPattern: false,
	globPatternOptions: {
		ignore: 'node_modules/**',
	},
};

export default function eol(options = {}) {
	options.filter = createFilter(options.include, options.exclude);
	options = {...defaultOptions, ...options};

	return {
		name: 'rollup-plugin-eol',

		async writeBundle(outputOptions, bundle) {
			let promises = [];
			options.outputFiles && promises.push(processOutputFiles(outputOptions, bundle, options));
			await awaitPromises(promises);
		},

		async closeBundle() {
			let promises = [];
			options.watchFiles && promises.push(processWatchFiles(this.getWatchFiles(), options));
			options.globPattern && promises.push(processGlobPatterns(options));
			await awaitPromises(promises);
		},
	};
}

export function eolOutput(options = {}) {
	options.filter = createFilter(options.include, options.exclude);
	options = {...defaultOptions, ...options};

	return {
		name: 'rollup-plugin-eol-output',

		async writeBundle(outputOptions, bundle) {
			let promises = [];
			options.outputFiles && promises.push(processOutputFiles(outputOptions, bundle, options));
			options.watchFiles && promises.push(processWatchFiles(this.getWatchFiles(), options));
			options.globPattern && promises.push(processGlobPatterns(options));
			await awaitPromises(promises);
		},
	};
}
