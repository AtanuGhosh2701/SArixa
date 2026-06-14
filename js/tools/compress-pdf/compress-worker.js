// Load the C++ wrapper from the local folder
importScripts('./wasm/qpdf.js');

self.onmessage = async function(e) {
    const { fileBuffer, level } = e.data;
    
    self.postMessage({ status: 'progress', message: 'Waking up Smart WASM Engine...', percent: 10 });

    try {
        self.postMessage({ status: 'progress', message: 'Loading C++ Core...', percent: 30 });
        
        const qpdf = await Module({
            locateFile: function(path) {
                if (path.endsWith('.wasm')) {
                    // 🔥 THE FIX: Dynamic Absolute Path for Vercel/Netlify 🔥
                    const workerPath = self.location.href;
                    const basePath = workerPath.substring(0, workerPath.lastIndexOf('/'));
                    return basePath + '/wasm/qpdf.wasm';
                }
                return path;
            }
        });
        
        self.postMessage({ status: 'progress', message: 'Engine Ready. Analyzing PDF structure...', percent: 50 });
        
        // Write the dropped file to virtual memory
        qpdf.FS.writeFile('input.pdf', new Uint8Array(fileBuffer));
        
        self.postMessage({ status: 'progress', message: 'Deeply Compressing Objects (Text safe)...', percent: 75 });
        
        // 🔥 THE ULTIMATE QPDF COMMANDS FOR DEEP COMPRESSION 🔥
        let command = [];
        
        if (level === 'extreme') {
            // Extreme mode: Force re-compress all flate streams, optimize images, and linearize
            command = [
                '--linearize', 
                '--optimize-images', 
                '--stream-data=compress', 
                '--recompress-flate', 
                '--compression-level=9', // Max ZLIB compression
                'input.pdf', 
                'output.pdf'
            ];
        } else {
            // Recommended mode: Standard optimization
            command = [
                '--linearize', 
                '--optimize-images', 
                'input.pdf', 
                'output.pdf'
            ];
        }
        
        // Run QPDF C++ command directly!
        qpdf.callMain(command);
        
        self.postMessage({ status: 'progress', message: 'Finalizing PDF...', percent: 90 });

        // Read the compressed output file
        const optimizedData = qpdf.FS.readFile('output.pdf');
        
        // Free up memory (Crucial!)
        qpdf.FS.unlink('input.pdf');
        qpdf.FS.unlink('output.pdf');

        // Send the compressed file back to the main UI
        self.postMessage({ 
            status: 'done', 
            compressedBuffer: optimizedData.buffer 
        });

    } catch (error) {
        self.postMessage({ status: 'error', error: error.message });
    }
};