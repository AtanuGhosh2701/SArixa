// js/tools/organise-worker.js

importScripts('../wasm/qpdf.js');

self.onmessage = async function(e) {
    const { action, fileData, password, fileName } = e.data;

    if (action === 'decrypt') {
        try {
            // Initialize C++ QPDF WASM Engine
            const qpdfModule = await Module({
                locateFile: function(path) {
                    if (path.endsWith('.wasm')) {
                        return '../wasm/qpdf.wasm';
                    }
                    return path;
                }
            });

            const FS = qpdfModule.FS;

            const inputName = 'input_locked.pdf';
            const outputName = 'output_unlocked.pdf';

            FS.writeFile(inputName, new Uint8Array(fileData));

            const args = ['--password=' + password, '--decrypt', inputName, outputName];
            const exitCode = qpdfModule.callMain(args);

            if (exitCode === 0) {
                const unlockedData = FS.readFile(outputName);

                FS.unlink(inputName);
                FS.unlink(outputName);

                self.postMessage({
                    status: 'success',
                    data: unlockedData.buffer,
                    fileName: fileName
                }, [unlockedData.buffer]);
            } else {
                try { FS.unlink(inputName); } catch (err) {}
                self.postMessage({ status: 'error', message: 'Decryption failed. Incorrect password provided.' });
            }

        } catch (error) {
            self.postMessage({ status: 'error', message: error.message });
        }
    }
};