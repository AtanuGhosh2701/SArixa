// js/tools/merge-pdf/merge-worker.js

importScripts('/js/tools/wasm/qpdf.js');

self.onmessage = async function(e) {
    const { action, fileData, password, fileName } = e.data;

    if (action === 'decrypt') {
        try {
            // Initialize C++ Engine
            const qpdfModule = await Module({
                locateFile: function(path) {
                    if (path.endsWith('.wasm')) {
                        // Use absolute path for the WASM file
                        return '/js/tools/wasm/qpdf.wasm'; 
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
                FS.unlink(inputName);
                self.postMessage({ status: 'error', message: 'Decryption failed. Incorrect password provided.' });
            }

        } catch (error) {
            self.postMessage({ status: 'error', message: error.message });
        }
    }
};