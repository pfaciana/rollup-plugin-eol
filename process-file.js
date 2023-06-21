import fs from 'fs';
import {parentPort} from 'worker_threads';

parentPort.on('message', async ({file, options}) => {
	try {
		const originalContent = fs.readFileSync(file).toString();
		let content = originalContent;

		if (options.eol) {
			content = content.replace(/\r\n|\r|\n/g, options.eol);
		}

		if (content !== originalContent) {
			try {
				fs.writeFileSync(file, content, options.encoding || 'utf8');
				// file was successfully updated
				parentPort.postMessage({status: 'updated', file});
			} catch (err) {
				// can't write file
				parentPort.postMessage({status: 'error', error: err, file});
			}
		} else {
			// file is the same
			parentPort.postMessage({status: 'ignored', file});
		}
	} catch (error) {
		// can't read file
		parentPort.postMessage({status: 'error', error, file});
	}

	parentPort.close();
});
