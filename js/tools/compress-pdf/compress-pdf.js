document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById('fileInput');
    const previewBox = document.getElementById('previewBox');
    const emptyState = document.getElementById('emptyState');
    const fileCard = document.getElementById('fileCard');
    const displayFileName = document.getElementById('displayFileName');
    const displayFileSize = document.getElementById('displayFileSize');
    const removeFileBtn = document.getElementById('removeFileBtn');
    
    const compressBtn = document.getElementById('compressBtn');
    const compressionLevel = document.getElementById('compressionLevel');
    const engineSelect = document.getElementById('engineSelect');
    
    const targetSizeContainer = document.getElementById('targetSizeContainer');
    const targetSizeInput = document.getElementById('targetSizeInput');

    const finalActionArea = document.getElementById('finalActionArea');
    const previewBtn = document.getElementById('previewBtn');
    const fileNameInput = document.getElementById('fileNameInput');
    const downloadBtn = document.getElementById('downloadBtn');
    const outputBox = document.getElementById('outputBox');

    let currentFile = null;
    let originalSizeBytes = 0;
    let compressedBlob = null;
    let isPreviewOpen = false;
    let hasShownDownloadMsg = false;

    // Toast Notification
    function showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); 
            background: #00e676; color: #012f28; padding: 12px 24px; border-radius: 50px; 
            font-weight: 700; font-size: 0.95rem; box-shadow: 0 5px 15px rgba(0, 230, 118, 0.4); 
            z-index: 99999; opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease; pointer-events: none;
        `;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(-50%) translateY(-10px)'; }, 10);
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(0)'; setTimeout(() => toast.remove(), 300); }, 4000);
    }

    // Number Counter Animation
    function animateValue(objId, start, end, duration, suffix = "") {
        const obj = document.getElementById(objId);
        if (!obj) return;
        const startNum = parseFloat(start) || 0;
        const endNum = parseFloat(end) || 0;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const currentVal = (progress * (endNum - startNum) + startNum).toFixed(2);
            obj.innerHTML = currentVal + " <span style='font-size:0.5em'>" + suffix + "</span>";
            if (progress < 1) window.requestAnimationFrame(step);
            else obj.innerHTML = endNum.toFixed(2) + " <span style='font-size:0.5em'>" + suffix + "</span>";
        };
        window.requestAnimationFrame(step);
    }

    // UI Logic: Target Size Dropdown
    if (compressionLevel) {
        compressionLevel.addEventListener('change', (e) => {
            if (e.target.value === 'target') {
                targetSizeContainer.style.display = 'block';
                if (engineSelect && engineSelect.value !== 'canvas') {
                    engineSelect.value = 'canvas'; // Force to Scanned mode
                    showToast("Target Size requires 'Scanned Document' mode. Switched automatically.");
                }
            } else {
                targetSizeContainer.style.display = 'none';
            }
        });
    }

    // File Handling
    function processSelectedFile(file) {
        if (file && file.type === "application/pdf") {
            currentFile = file;
            originalSizeBytes = file.size;
            displayFileName.textContent = file.name;
            displayFileSize.textContent = (file.size / (1024 * 1024)).toFixed(2) + " MB";
            if (fileNameInput) fileNameInput.value = file.name.replace(/\.[^/.]+$/, "") + "-compressed";

            emptyState.style.display = "none";
            fileCard.style.display = "flex";
            compressBtn.disabled = false;
            
            if (outputBox) outputBox.style.display = "none";
            if (finalActionArea) finalActionArea.style.display = "none";
            
            const existingViewer = document.getElementById('pdfViewerContainer');
            if (existingViewer) existingViewer.remove();
            isPreviewOpen = false;
            if (previewBtn) previewBtn.innerHTML = "Preview PDF";
        } else {
            alert("Please select a valid PDF file.");
        }
    }

    if (fileInput) fileInput.addEventListener('change', (e) => processSelectedFile(e.target.files[0]));

    if (previewBox) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            previewBox.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            previewBox.addEventListener(eventName, () => {
                if (window.matchMedia("(pointer: coarse)").matches) return; 
                previewBox.classList.add('drag-active');
            }, false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            previewBox.addEventListener(eventName, () => previewBox.classList.remove('drag-active'), false);
        });
        previewBox.addEventListener('drop', (e) => {
            if (window.matchMedia("(pointer: coarse)").matches) return; 
            processSelectedFile(e.dataTransfer.files[0]);
        }, false);
    }

    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', () => {
            currentFile = null; compressedBlob = null; fileInput.value = "";
            fileCard.style.display = "none"; emptyState.style.display = "block";
            compressBtn.disabled = true;
            
            if (outputBox) outputBox.style.display = "none";
            if (finalActionArea) finalActionArea.style.display = "none";
            const progressContainer = document.getElementById('progressContainer');
            if (progressContainer) progressContainer.style.display = "none";
            
            const existingViewer = document.getElementById('pdfViewerContainer');
            if (existingViewer) existingViewer.remove();
            isPreviewOpen = false;
        });
    }

    // Binary Search Compression for Target Size (For Canvas Mode)
    async function compressToTargetSizeCanvas(canvas, targetBytes) {
        let minQ = 0.05, maxQ = 0.95, quality = 0.8;
        let dataURL = canvas.toDataURL('image/jpeg', quality);
        let size = Math.round((dataURL.length * 3) / 4);

        if (size <= targetBytes) return dataURL;

        for (let i = 0; i < 6; i++) {
            quality = (minQ + maxQ) / 2;
            dataURL = canvas.toDataURL('image/jpeg', quality);
            size = Math.round((dataURL.length * 3) / 4);
            if (size > targetBytes) maxQ = quality;
            else minQ = quality;
        }

        size = Math.round((dataURL.length * 3) / 4);
        if (size > targetBytes) {
            let ratio = Math.sqrt(targetBytes / size);
            if (ratio < 0.1) ratio = 0.1;
            let scCanvas = document.createElement('canvas');
            scCanvas.width = canvas.width * ratio;
            scCanvas.height = canvas.height * ratio;
            let scCtx = scCanvas.getContext('2d');
            scCtx.drawImage(canvas, 0, 0, scCanvas.width, scCanvas.height);
            dataURL = scCanvas.toDataURL('image/jpeg', quality);
        }
        return dataURL;
    }

    // Main Compression Logic
    if (compressBtn) {
        compressBtn.addEventListener('click', async () => {
            if (!currentFile) return;

            const progressContainer = document.getElementById('progressContainer');
            const progressBar = document.getElementById('progressBar');
            const progressText = document.getElementById('progressText');
            const progressStatus = document.getElementById('progressStatus');

            const compLevel = compressionLevel ? compressionLevel.value : 'recommended';
            let selectedEngine = engineSelect ? engineSelect.value : 'wasm';
            let targetKB = null;

            // Validate Target Input
            if (compLevel === 'target') {
                selectedEngine = 'canvas'; // Force canvas mode 
                targetKB = parseFloat(targetSizeInput.value);
                if (!targetKB || targetKB <= 0) {
                    alert("Please enter a valid target size in KB!");
                    return;
                }
            }

            compressBtn.disabled = true;
            if (progressContainer) progressContainer.style.display = "block";
            if (outputBox) outputBox.style.display = "none";
            if (finalActionArea) finalActionArea.style.display = "none";
            
            const existingViewer = document.getElementById('pdfViewerContainer');
            if (existingViewer) existingViewer.remove();
            isPreviewOpen = false;
            if (previewBtn) previewBtn.innerHTML = "Preview PDF";

            if (progressBar) progressBar.style.width = "5%";

            try {
                const arrayBuffer = await currentFile.arrayBuffer();

                if (selectedEngine === 'canvas') {
                    // ==========================================
                    // ENGINE 1: SCANNED DOCUMENT (CANVAS/TARGET)
                    // ==========================================
                    if (progressStatus) progressStatus.textContent = "Rasterizing Document...";
                    if (progressBar) progressBar.style.width = "15%";

                    const loadingTask = pdfjsLib.getDocument(arrayBuffer);
                    const pdf = await loadingTask.promise;
                    const totalPages = pdf.numPages;

                    const { PDFDocument } = PDFLib;
                    const newPdf = await PDFDocument.create();
                    
                    const metaToggle = document.getElementById('metaToggle');
                    if(metaToggle && metaToggle.checked) {
                        newPdf.setTitle('SArixa Compressed Document');
                        newPdf.setCreator('SArixa Core');
                    }

                    // Configuration
                    let scaleFactor = 1.5; 
                    let imageQuality = 0.8;
                    let targetBytesPerPage = 0;

                    if (compLevel === 'extreme') { scaleFactor = 1.0; imageQuality = 0.5; } 
                    else if (compLevel === 'low') { scaleFactor = 2.0; imageQuality = 0.9; }
                    else if (compLevel === 'target') {
                        scaleFactor = 1.5; // Fixed base scale for target calculations
                        // Aim 2KB below target for safety margin against PDF structural overhead
                        const safeTargetBytes = Math.max(1024, (targetKB * 1024) - 2048);
                        targetBytesPerPage = safeTargetBytes / totalPages;
                    }

                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });

                    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                        if (progressStatus) progressStatus.textContent = `Processing Page ${pageNum} of ${totalPages}...`;
                        let currentProgress = 15 + ((pageNum / totalPages) * 70);
                        if (progressBar) progressBar.style.width = `${currentProgress}%`;
                        if (progressText) progressText.textContent = Math.round(currentProgress) + "%";

                        const page = await pdf.getPage(pageNum);
                        const viewport = page.getViewport({ scale: scaleFactor });

                        canvas.width = viewport.width;
                        canvas.height = viewport.height;

                        await page.render({ canvasContext: ctx, viewport: viewport }).promise;

                        let imgDataUrl;
                        if (compLevel === 'target') {
                             imgDataUrl = await compressToTargetSizeCanvas(canvas, targetBytesPerPage);
                        } else {
                             imgDataUrl = canvas.toDataURL('image/jpeg', imageQuality);
                        }

                        const jpgImage = await newPdf.embedJpg(imgDataUrl);
                        const newPage = newPdf.addPage([viewport.width, viewport.height]);
                        newPage.drawImage(jpgImage, { x: 0, y: 0, width: viewport.width, height: viewport.height });

                        await new Promise(resolve => setTimeout(resolve, 50));
                    }

                    canvas.width = 0;
                    canvas.height = 0;

                    if (progressStatus) progressStatus.textContent = "Finalizing PDF...";
                    if (progressBar) progressBar.style.width = "95%";
                    
                    const pdfBytes = await newPdf.save();
                    finalizeCompression(pdfBytes.buffer, arrayBuffer, true, compLevel === 'target');

                } else {
                    // ==========================================
                    // ENGINE 2: SMART WASM (Original Text Kept)
                    // ==========================================
                    if (progressStatus) progressStatus.textContent = "Waking up Smart Engine...";
                    const removeMeta = document.getElementById('metaToggle').checked;
                    
                    const worker = new Worker('../js/tools/compress-pdf/compress-worker.js');

                    worker.onmessage = function(e) {
                        const data = e.data;
                        if (data.status === 'progress') {
                            if (progressStatus) progressStatus.textContent = data.message;
                            if (progressBar) progressBar.style.width = data.percent + '%';
                            if (progressText) progressText.textContent = data.percent + '%';
                        } else if (data.status === 'done') {
                            worker.terminate();
                            finalizeCompression(data.compressedBuffer, arrayBuffer, false, false);
                        } else if (data.status === 'error') {
                            worker.terminate();
                            throw new Error(data.error);
                        }
                    };

                    worker.postMessage({ fileBuffer: arrayBuffer, level: compLevel });
                }

            } catch (error) {
                console.error("Compression Failed:", error);
                if (progressStatus) progressStatus.textContent = "Engine Error! Document might be protected.";
                if (progressStatus) progressStatus.style.color = "#ff5252";
                compressBtn.disabled = false;
                compressBtn.textContent = "Try Again";
            }
        });
    }

    // --- COMMON FINALIZE FUNCTION ---
    function finalizeCompression(compressedBuffer, originalBuffer, isForceMode, isTargetMode) {
        let compressedSize = compressedBuffer.byteLength;
        let savedPercentage = (((originalSizeBytes - compressedSize) / originalSizeBytes) * 100);
        
        if (savedPercentage < 1 && !isTargetMode) {
            savedPercentage = 0; 
            compressedSize = originalSizeBytes; 
            compressedBlob = currentFile; 
        } else {
            compressedBlob = new Blob([compressedBuffer], { type: 'application/pdf' });
        }
        
        savedPercentage = Number(savedPercentage).toFixed(2);
        
        const originalMb = (originalSizeBytes / (1024 * 1024)).toFixed(2);
        const finalMb = (compressedSize / (1024 * 1024)).toFixed(2);

        document.getElementById('progressBar').style.width = '100%';
        document.getElementById('progressText').textContent = '100%';

        setTimeout(() => {
            document.getElementById('progressContainer').style.display = "none";
            if (outputBox) outputBox.style.display = "block";
            if (finalActionArea) finalActionArea.style.display = "block";
            
            let successCardHTML = "";
            if (savedPercentage > 0 || isTargetMode) {
                successCardHTML = `
                    <div class="success-card">
                        <div class="success-header">🎉 Compression Successful!</div>
                        <p style="color: #b2ebf2; font-size: 0.95rem;">${isForceMode ? 'Rasterized and forced to reduce file size.' : 'Optimized keeping text selectable.'}</p>
                        <div class="stats-grid">
                            <div class="stat-box"><div class="stat-value" id="animOriginalSize">0</div><div class="stat-label">Original</div></div>
                            <div class="stat-box"><div class="stat-value highlight" id="animSavedPercent">0</div><div class="stat-label">${isTargetMode ? 'Optimized' : 'Reduced'}</div></div>
                            <div class="stat-box"><div class="stat-value" id="animNewSize">0</div><div class="stat-label">New Size</div></div>
                        </div>
                    </div>
                `;
            } else {
                successCardHTML = `
                    <div class="success-card" style="border-color: #ffb300;">
                        <div class="success-header" style="color: #ffb300;">⚡ Structurally Optimized!</div>
                        <p style="color: #b2ebf2; font-size: 0.95rem;">This file is already highly optimized. Our engine couldn't compress it further without losing quality.<br><br>
                        <span style="color:#00e676; font-weight:bold;">💡 Pro Tip:</span> Select <b>"Scanned Document"</b> mode to forcibly shrink the file.</p>
                    </div>
                `;
            }

            outputBox.innerHTML = successCardHTML;

            if (savedPercentage > 0 || isTargetMode) {
                animateValue("animOriginalSize", 0, originalMb, 1500, "MB");
                animateValue("animSavedPercent", 0, savedPercentage > 0 ? savedPercentage : 0, 1500, " %");
                animateValue("animNewSize", 0, finalMb, 1500, "MB");
            }
            
            compressBtn.disabled = false;
            compressBtn.textContent = "Compress Another PDF";

        }, 500);
    }

    // Download Logic
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (!compressedBlob) return;
            let name = fileNameInput.value.trim() || "SArixa-compressed";
            if (!name.toLowerCase().endsWith(".pdf")) name += ".pdf";
            
            const url = URL.createObjectURL(compressedBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = name;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 200);

            if (!hasShownDownloadMsg) {
                showToast("PDF Downloaded! 🎉 Next Tool: Merge PDF(Coming Soon)");
                hasShownDownloadMsg = true;
            }

            setTimeout(() => {
                if (window.triggerGlobalRatingPopup) window.triggerGlobalRatingPopup();
            }, 1000); 
        });
    }

    // Preview Logic
    if (previewBtn) {
        previewBtn.addEventListener('click', async () => {
            if (!compressedBlob) return;

            if (isPreviewOpen) {
                const existingViewer = document.getElementById('pdfViewerContainer');
                if (existingViewer) existingViewer.remove();
                isPreviewOpen = false;
                previewBtn.innerHTML = "Preview PDF";
                return;
            }

            isPreviewOpen = true;
            previewBtn.innerHTML = "Close Preview";
            
            let vContainer = document.getElementById('pdfViewerContainer');
            if (!vContainer) {
                vContainer = document.createElement('div');
                vContainer.id = 'pdfViewerContainer';
                vContainer.style.cssText = "display: flex; flex-direction: column; gap: 15px; max-height: 65vh; overflow-y: auto; align-items: center; padding: 15px; background: rgba(0, 230, 118, 0.05); border: 2px dashed rgba(0, 230, 118, 0.3); border-radius: 15px; margin-top: 25px; margin-bottom: 20px; width: 100%;";
                finalActionArea.parentNode.insertBefore(vContainer, finalActionArea);
            }
            
            vContainer.style.display = "flex";
            vContainer.innerHTML = "<p style='color:#00e676; font-weight:bold; margin-top:10px;'>Rendering preview...</p>";

            try {
                let arrayBuf;
                if (compressedBlob instanceof File) {
                    arrayBuf = await compressedBlob.arrayBuffer();
                } else {
                    arrayBuf = await compressedBlob.arrayBuffer();
                }
                const typedArray = new Uint8Array(arrayBuf);
                
                if (window.pdfjsLib && !window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                }

                const task = window.pdfjsLib.getDocument({ data: typedArray });
                const pdfDoc = await task.promise;

                vContainer.innerHTML = ""; 
                const outputScale = window.devicePixelRatio || 1;

                for (let i = 1; i <= pdfDoc.numPages; i++) {
                    if (!isPreviewOpen) break;
                    
                    const page = await pdfDoc.getPage(i);
                    const unscaledViewport = page.getViewport({ scale: 1 });
                    const containerWidth = vContainer.clientWidth > 0 ? vContainer.clientWidth - 30 : window.innerWidth - 60;
                    
                    const scale = Math.min(containerWidth / unscaledViewport.width, 1.5);
                    const viewport = page.getViewport({ scale: scale });

                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    canvas.width = Math.floor(viewport.width * outputScale);
                    canvas.height = Math.floor(viewport.height * outputScale);
                    canvas.style.width = Math.floor(viewport.width) + "px";
                    canvas.style.height = Math.floor(viewport.height) + "px";
                    canvas.style.maxWidth = "100%";
                    canvas.style.border = "1px solid #00e676";
                    canvas.style.borderRadius = "8px";
                    canvas.style.background = "#fff";

                    vContainer.appendChild(canvas);

                    await page.render({
                        canvasContext: ctx,
                        transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
                        viewport: viewport
                    }).promise;
                }
            } catch (err) {
                console.error("Preview failed: ", err);
                vContainer.innerHTML = "<p style='color:#ff5252;'>Preview failed to load.</p>";
            }
        });
    }
});