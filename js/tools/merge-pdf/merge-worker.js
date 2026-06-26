// js/tools/merge-pdf/merge-worker.js

// Smart Path Resolution: Sharing the existing WASM engine wrapper from compress-pdf
importScripts('../compress-pdf/wasm/qpdf.js');

self.onmessage = async function(e) {
    const { action, fileData, password, fileName } = e.data;

    if (action === 'decrypt') {
        try {
            // Initializing the C++ Engine using the correct Module instance
            const qpdfModule = await Module({
                locateFile: function(path) {
                    if (path.endsWith('.wasm')) {
                        // Dynamic absolute path structure for absolute execution on Vercel/Netlify
                        const workerPath = self.location.href;
                        const basePath = workerPath.substring(0, workerPath.lastIndexOf('/'));
                        // Points to: js/tools/compress-pdf/wasm/qpdf.wasm
                        return basePath + '/../compress-pdf/wasm/qpdf.wasm';
                    }
                    return path;
                }
            });

            const FS = qpdfModule.FS; // Virtual File System injection

            const inputName = 'input_locked.pdf';
            const outputName = 'output_unlocked.pdf';
            
            // Writing the file array buffer securely to the virtual disk
            FS.writeFile(inputName, new Uint8Array(fileData));

            // Executing the standard C++ raw command to bypass structural lock
            const args = ['--password=' + password, '--decrypt', inputName, outputName];
            const exitCode = qpdfModule.callMain(args);

            if (exitCode === 0) {
                // Read the successfully processed data stream
                const unlockedData = FS.readFile(outputName);
                
                // Clear the workspace from internal memory leaks
                FS.unlink(inputName);
                FS.unlink(outputName);

                // Transfer the raw memory ownership back to the main file interface
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