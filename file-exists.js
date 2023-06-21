import fs from 'fs';
import path from 'path';
import {parentPort} from 'worker_threads';
import {normalizePath} from '@rollup/pluginutils';

parentPort.on('message', async ({file, dir}) => {
	if (!path.isAbsolute(file)) {
		file = path.join(dir, file);
	}
	fs.existsSync(file = normalizePath(file)) && parentPort.postMessage({file});
	parentPort.close();
});
