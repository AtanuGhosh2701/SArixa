// js/tools/merge-pdf/merge-pdf.js

document.addEventListener("DOMContentLoaded", () => {
    const previewBox = document.getElementById('previewBox');
    const fileInput = document.getElementById('fileInput');
    const emptyState = document.getElementById('emptyState');
    const fileList = document.getElementById('fileList');
    const mergeBtn = document.getElementById('mergeBtn');
    
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressStatus = document.getElementById('progressStatus');
    
    const outputBox = document.getElementById('outputBox');
    const finalActionArea = document.getElementById('finalActionArea');
    const fileNameInput = document.getElementById('fileNameInput');
    const previewBtn = document.getElementById('previewBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const toast = document.getElementById('toast');

    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const pdfPasswordInput = document.getElementById('pdfPasswordInput');

    let filesState = [];
    let mergedPdfBlob = null;
    let isPreviewOpen = false;

    const eyeOpenSvg = `<svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const eyeOffSvg = `<svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

    // Toast Notification Engine
    function showToast(message, type = 'success') {
        toast.textContent = message;
        toast.className = `toast show ${type === 'error' ? 'error' : ''}`;
        setTimeout(() => { toast.classList.remove('show'); }, 3500);
    }

    // File Size Formatter
    function formatBytes(bytes) {
        if (!+bytes) return '0 MB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    // Initialize Sortable JS
    new Sortable(fileList, {
        animation: 200,
        ghostClass: 'sortable-ghost'
    });

    // Eye Password Visibility Toggle
    togglePasswordBtn.addEventListener('click', () => {
        if (pdfPasswordInput.type === 'password') {
            pdfPasswordInput.type = 'text';
            togglePasswordBtn.innerHTML = eyeOffSvg;
        } else {
            pdfPasswordInput.type = 'password';
            togglePasswordBtn.innerHTML = eyeOpenSvg;
        }
    });

    // Dropzone Listeners
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        previewBox.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }, false);
    });
    ['dragenter', 'dragover'].forEach(eventName => {
        previewBox.addEventListener(eventName, () => previewBox.classList.add('drag-active'), false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        previewBox.addEventListener(eventName, () => previewBox.classList.remove('drag-active'), false);
    });
    previewBox.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
    fileInput.addEventListener('change', e => { handleFiles(e.target.files); fileInput.value = ''; });

    // Request Protected PDF Password UI Modal
    function requestPasswordUI(filename) {
        return new Promise((resolve) => {
            const popup = document.getElementById('password-prompt-popup');
            const filenameText = document.getElementById('password-file-name');
            const btnSubmit = document.getElementById('btn-submit-password');
            const btnCancel = document.getElementById('btn-cancel-password');
            const closeBtn = document.getElementById('close-password-popup');

            filenameText.innerText = `"${filename}" is protected. Please enter its password to add it.`;
            pdfPasswordInput.value = '';
            pdfPasswordInput.type = 'password';
            togglePasswordBtn.innerHTML = eyeOpenSvg;
            
            popup.style.display = 'flex';
            pdfPasswordInput.focus();

            const cleanup = () => {
                popup.style.display = 'none';
                btnSubmit.removeEventListener('click', onSubmit);
                btnCancel.removeEventListener('click', onCancel);
                closeBtn.removeEventListener('click', onCancel);
                pdfPasswordInput.removeEventListener('keypress', onEnter);
            };

            const onSubmit = () => {
                const pwd = pdfPasswordInput.value;
                cleanup();
                resolve(pwd);
            };

            const onCancel = () => {
                cleanup();
                resolve(null);
            };
            
            const onEnter = (e) => {
                if (e.key === 'Enter') onSubmit();
            };

            btnSubmit.addEventListener('click', onSubmit);
            btnCancel.addEventListener('click', onCancel);
            closeBtn.addEventListener('click', onCancel);
            pdfPasswordInput.addEventListener('keypress', onEnter);
        });
    }

    // WASM Worker Communication Controller Layer
    function unlockPdfWithWasm(fileBuffer, password, fileName) {
        return new Promise((resolve, reject) => {
            const worker = new Worker('../js/tools/merge-pdf/merge-worker.js');
            
            worker.onmessage = (e) => {
                if (e.data.status === 'success') {
                    resolve(e.data.data);
                } else {
                    reject(new Error(e.data.message));
                }
                worker.terminate();
            };

            worker.onerror = (err) => {
                reject(new Error("Decryption stream connection error."));
                worker.terminate();
            };

            worker.postMessage({ 
                action: 'decrypt', 
                fileData: fileBuffer, 
                password: password, 
                fileName: fileName 
            });
        });
    }

    // Processing Incoming Selection Streams
    async function handleFiles(files) {
        const newFiles = Array.from(files).filter(file => file.type === 'application/pdf');
        
        if (newFiles.length === 0) { 
            showToast('Please select valid PDF files.', 'error'); 
            return; 
        }

        for (let file of newFiles) {
            const id = 'pdf-' + Math.random().toString(36).substr(2, 9);
            const arrayBuffer = await file.arrayBuffer();
            let fileBytes = new Uint8Array(arrayBuffer);

            try {
                // Verify structure baseline validation
                await PDFLib.PDFDocument.load(fileBytes);
                filesState.push({ id, file, rawBuffer: fileBytes });
                renderFileCard(file, id);
            } catch (error) {
                if (error.message && (error.message.toLowerCase().includes('encrypted') || error.message.toLowerCase().includes('password'))) {
                    let isUnlocked = false;
                    
                    while (!isUnlocked) {
                        const rawPwd = await requestPasswordUI(file.name);
                        if (rawPwd === null) {
                            showToast(`Skipped adding ${file.name}`, 'error');
                            break; 
                        }

                        const pwd = rawPwd.trim();
                        progressStatus.textContent = "Unlocking High-Security PDF...";
                        progressContainer.style.display = 'block';

                        try {
                            const unlockedBuffer = await unlockPdfWithWasm(arrayBuffer, pwd, file.name);
                            const cleanBytes = new Uint8Array(unlockedBuffer);
                            
                            filesState.push({ id, file, rawBuffer: cleanBytes });
                            progressContainer.style.display = 'none';
                            renderFileCard(file, id);
                            showToast(`AES-256 Unlocked successfully!`);
                            isUnlocked = true;
                        } catch (e) {
                            progressContainer.style.display = 'none';
                            showToast(`Incorrect password for ${file.name}. Try again.`, 'error');
                        }
                    }
                } else {
                    showToast(`Failed to load ${file.name}. File corrupted.`, 'error');
                }
            }
        }
        updateUI();
    }

    function renderFileCard(file, id) {
        const li = document.createElement('li');
        li.className = 'file-card';
        li.dataset.id = id;

        li.innerHTML = `
            <div class="file-info-wrap">
                <div class="drag-handle" title="Drag to reorder">⋮⋮</div>
                <div class="file-icon">PDF</div>
                <div class="file-details">
                    <span class="file-name" title="${file.name}">${file.name}</span>
                    <span class="file-size">${formatBytes(file.size)}</span>
                </div>
            </div>
            <button class="remove-btn" title="Remove File">&times;</button>
        `;

        li.querySelector('.remove-btn').addEventListener('click', () => {
            filesState = filesState.filter(item => item.id !== id);
            li.remove();
            updateUI();
        });

        fileList.appendChild(li);
    }

    function updateUI() {
        if (filesState.length > 0) {
            emptyState.style.display = 'none';
            fileList.style.display = 'flex';
        } else {
            emptyState.style.display = 'block';
            fileList.style.display = 'none';
        }

        if (filesState.length >= 2) {
            mergeBtn.disabled = false;
            mergeBtn.textContent = 'Merge PDFs Now';
        } else {
            mergeBtn.disabled = true;
            mergeBtn.textContent = filesState.length === 1 ? 'Add 1 more PDF' : 'Merge PDFs Now';
        }

        outputBox.style.display = 'none';
        finalActionArea.style.display = 'none';
        progressContainer.style.display = 'none';
    }

    // Merge Core Pipeline Execution
    mergeBtn.addEventListener('click', async () => {
        if (filesState.length < 2) return;

        mergeBtn.disabled = true;
        progressContainer.style.display = 'block';
        outputBox.style.display = 'none';
        finalActionArea.style.display = 'none';
        progressBar.style.width = '5%';
        progressStatus.textContent = 'Initializing engine...';

        const existingViewer = document.getElementById('pdfViewerContainer');
        if (existingViewer) existingViewer.remove();
        isPreviewOpen = false;
        previewBtn.innerHTML = "Preview PDF";

        try {
            const { PDFDocument } = PDFLib;
            const mergedPdf = await PDFDocument.create();
            mergedPdf.setTitle('SArixa Merged Document');
            
            const orderedDomIds = Array.from(fileList.children).map(li => li.dataset.id);
            const orderedFilesState = orderedDomIds.map(id => filesState.find(item => item.id === id));

            for (let i = 0; i < orderedFilesState.length; i++) {
                progressStatus.textContent = `Merging file ${i + 1} of ${orderedFilesState.length}...`;
                const fileState = orderedFilesState[i];
                
                // Load clean unlocked structural stream directly
                const pdfDoc = await PDFDocument.load(fileState.rawBuffer);
                
                const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));

                let progress = ((i + 1) / orderedFilesState.length) * 90;
                progressBar.style.width = `${progress}%`;
                progressText.textContent = Math.round(progress) + '%';
            }

            progressStatus.textContent = 'Finalizing PDF...';
            progressBar.style.width = '95%';
            
            const pdfBytes = await mergedPdf.save();
            mergedPdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

            progressBar.style.width = '100%';
            progressText.textContent = '100%';

            setTimeout(() => {
                progressContainer.style.display = 'none';
                outputBox.style.display = 'block';
                
                outputBox.innerHTML = `
                    <div class="success-card">
                        <div class="success-header">🎉 Merge Successful!</div>
                        <div class="final-size-text">Final Size: ${formatBytes(mergedPdfBlob.size)}</div>
                        <p style="color: #b2ebf2; font-size: 0.95rem;">Your files have been seamlessly combined into a single document.</p>
                    </div>
                `;
                
                finalActionArea.style.display = 'block';
                mergeBtn.disabled = false;
                mergeBtn.textContent = 'Merge Again';
                
                if (window.confetti) {
                    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#00e676', '#b2ebf2', '#ffffff'] });
                }
                showToast('PDFs merged successfully!');
            }, 500);

        } catch (error) {
            console.error("Merge error:", error);
            progressStatus.textContent = 'Engine Error! Could not process files.';
            progressStatus.style.color = '#ff5252';
            mergeBtn.disabled = false;
            mergeBtn.textContent = 'Try Again';
            showToast('Failed to merge PDFs. An error occurred.', 'error');
        }
    });

    // Native Infinite Render Page Scroll Preview
    previewBtn.addEventListener('click', async () => {
        if (!mergedPdfBlob) return;

        if (isPreviewOpen) {
            const existingViewer = document.getElementById('pdfViewerContainer');
            if (existingViewer) existingViewer.remove();
            isPreviewOpen = false;
            previewBtn.innerHTML = "Preview PDF";
            return;
        }

        isPreviewOpen = true;
        previewBtn.innerHTML = "Close Preview";
        
        let vContainer = document.createElement('div');
        vContainer.id = 'pdfViewerContainer';
        vContainer.style.cssText = "display: flex; flex-direction: column; gap: 15px; max-height: 60vh; overflow-y: auto; align-items: center; padding: 20px; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(0, 230, 118, 0.3); border-radius: 12px; margin-top: 25px; width: 100%;";
        
        finalActionArea.appendChild(vContainer);
        vContainer.innerHTML = "<p style='color:#00e676; font-weight:bold;'>Rendering preview... Please wait.</p>";

        try {
            const arrayBuf = await mergedPdfBlob.arrayBuffer();
            const typedArray = new Uint8Array(arrayBuf);
            const task = window.pdfjsLib.getDocument({ data: typedArray });
            const pdfDoc = await task.promise;

            vContainer.innerHTML = ""; 
            const outputScale = window.devicePixelRatio || 1;
            const totalPages = pdfDoc.numPages; 

            for (let i = 1; i <= totalPages; i++) {
                if (!isPreviewOpen) break;
                const page = await pdfDoc.getPage(i);
                const unscaledViewport = page.getViewport({ scale: 1 });
                const containerWidth = vContainer.clientWidth > 0 ? vContainer.clientWidth - 40 : window.innerWidth - 60;
                const scale = Math.min(containerWidth / unscaledViewport.width, 1.2);
                const viewport = page.getViewport({ scale: scale });

                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.width = Math.floor(viewport.width * outputScale);
                canvas.height = Math.floor(viewport.height * outputScale);
                canvas.style.width = Math.floor(viewport.width) + "px";
                canvas.style.height = Math.floor(viewport.height) + "px";
                canvas.style.maxWidth = "100%";
                canvas.style.border = "1px solid #00e676";
                canvas.style.borderRadius = "5px";
                canvas.style.marginBottom = "10px";

                vContainer.appendChild(canvas);
                await page.render({ canvasContext: ctx, transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null, viewport: viewport }).promise;
            }
        } catch (err) {
            vContainer.innerHTML = "<p style='color:#ff5252;'>Preview failed to load.</p>";
        }
    });

    // Download Handler
    downloadBtn.addEventListener('click', () => {
        if (!mergedPdfBlob) return;
        
        let name = fileNameInput.value.trim() || "sarixa-merged";
        if (!name.toLowerCase().endsWith(".pdf")) name += ".pdf";
        
        const url = URL.createObjectURL(mergedPdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 300);
        
        setTimeout(() => {
            if (window.triggerGlobalRatingPopup) window.triggerGlobalRatingPopup();
        }, 1500);
    });
});