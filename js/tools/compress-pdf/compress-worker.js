const baseUrl = self.location.origin;

// FIX: Added 'components' to the path
importScripts(baseUrl + '/js/tools/wasm/qpdf.js');

self.onmessage = async function(e) {
    const { fileBuffer, level } = e.data;
    
    self.postMessage({ status: 'progress', message: 'Waking up Smart WASM Engine...', percent: 10 });

    try {
        self.postMessage({ status: 'progress', message: 'Loading Core...', percent: 30 });
        
        const qpdf = await Module({
            locateFile: function(path) {
                if (path.endsWith('.wasm')) {
                    // FIX: Added 'components' to the path
                    return baseUrl + '/js/tools/wasm/qpdf.wasm';
                }
                return path;
            }
        });
        
        self.postMessage({ status: 'progress', message: 'Engine Ready. Analyzing PDF structure...', percent: 50 });
        
        qpdf.FS.writeFile('input.pdf', new Uint8Array(fileBuffer));
        
        self.postMessage({ status: 'progress', message: 'Deeply Compressing Objects...', percent: 75 });
        
        let command = [];
        
        if (level === 'extreme') {
            command = [
                '--linearize', 
                '--optimize-images', 
                '--stream-data=compress', 
                '--recompress-flate', 
                '--compression-level=9',
                'input.pdf', 
                'output.pdf'
            ];
        } else {
            command = [
                '--linearize', 
                '--optimize-images', 
                'input.pdf', 
                'output.pdf'
            ];
        }
        
        qpdf.callMain(command);
        
        self.postMessage({ status: 'progress', message: 'Finalizing PDF...', percent: 90 });

        const optimizedData = qpdf.FS.readFile('output.pdf');
        
        qpdf.FS.unlink('input.pdf');
        qpdf.FS.unlink('output.pdf');

        self.postMessage({ 
            status: 'done', 
            compressedBuffer: optimizedData.buffer 
        });

    } catch (error) {
        self.postMessage({ status: 'error', error: error.message });
    }
};