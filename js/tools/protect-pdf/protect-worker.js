// ==========================================
// protect-worker.js - Advanced AES-256 Backend (Fixed Syntax Code 2)
// ==========================================

self.onerror = function(message) {
    self.postMessage({ type: 'ERROR', message: "Fatal Worker Error: " + message });
    return true; 
};

// Config for WASM engine
const wasmConfig = {
    locateFile: function(path, prefix) {
        if (path.endsWith('.wasm')) {
            return '/js/tools/wasm/qpdf.wasm'; // Exact WASM path
        }
        return prefix + path;
    },
    print: function(text) { console.log("[QPDF Output]:", text); },
    printErr: function(text) { console.error("[QPDF Error]:", text); }
};

try {
    // Load the JS engine file
    self.importScripts('/js/tools/wasm/qpdf.js');

    // Boot up the Engine
    if (typeof Module === 'function') {
        Module(wasmConfig).then((instance) => {
            self.Module = instance; 
            console.log("QPDF WASM Engine Booted Successfully!");
            self.postMessage({ type: 'READY' }); 
        }).catch((err) => {
            console.error("Engine Boot Error:", err);
            self.postMessage({ type: 'ERROR', message: "Failed to boot QPDF Engine." });
        });
    } else {
        self.postMessage({ type: 'ERROR', message: "Engine format error. Module is not a function." });
    }
} catch (error) {
    console.error("Import Error:", error);
    self.postMessage({ type: 'ERROR', message: "qpdf.js failed to load." });
}

// Process data when UI sends it
self.onmessage = function(e) {
    const data = e.data;
    
    if (data.type === 'ENCRYPT') {
        const { arrayBuffer, userPassword, ownerPassword, permPrint, permCopy, permModify } = data;

        if (!arrayBuffer || !userPassword) {
            self.postMessage({ type: 'ERROR', message: "File or required password missing." });
            return;
        }

        try {
            if (!self.Module || !self.Module.FS) {
                throw new Error("WASM Engine not fully ready yet.");
            }

            // Write file to Virtual Memory
            const uint8Array = new Uint8Array(arrayBuffer);
            self.Module.FS.writeFile('/input.pdf', uint8Array);

            const finalOwnerPassword = ownerPassword || userPassword;

            // Strict AES-256 Encoding parameters
            const args = ['--encrypt', userPassword, finalOwnerPassword, '256'];

            // 🔥 FIX: Strict QPDF flags to fix Exit Code 2
            // Print -> full/none, Copy (extract) -> y/n, Modify -> all/none
            if (ownerPassword && ownerPassword !== userPassword) {
                args.push(permPrint ? '--print=full' : '--print=none');
                args.push(permCopy ? '--extract=y' : '--extract=n');
                args.push(permModify ? '--modify=all' : '--modify=none');
            }

            args.push('--', '/input.pdf', '/output.pdf');
            
            // Run the encryption command
            const exitCode = self.Module.callMain(args);
            
            if (exitCode !== 0) {
                throw new Error(`Encryption Engine failed with code ${exitCode}`);
            }

            const outData = self.Module.FS.readFile('/output.pdf');
            
            if (!outData || outData.length === 0) {
                throw new Error("Failed to process the PDF output.");
            }

            const exactPdfBytes = new Uint8Array(outData);
            
            // Send back success and the file
            self.postMessage({ 
                type: 'SUCCESS', 
                encryptedBuffer: exactPdfBytes.buffer 
            }, [exactPdfBytes.buffer]);

        } catch (error) {
            console.error("Worker Encryption Error:", error);
            self.postMessage({ type: 'ERROR', message: error.message || "Failed to encrypt." });
        } finally {
            // Clean up Virtual Memory
            if (self.Module && self.Module.FS) {
                try { self.Module.FS.unlink('/input.pdf'); } catch (e) {}
                try { self.Module.FS.unlink('/output.pdf'); } catch (e) {}
            }
        }
    }
};