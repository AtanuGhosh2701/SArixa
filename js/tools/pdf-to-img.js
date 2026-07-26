import { sharePdfFile } from './sharing-system.js';

document.addEventListener("DOMContentLoaded", () => {
    // Initialize PDF.js Library
    const pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
    if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    // DOM Elements
    const fileInput = document.getElementById('fileInput');
    const uploadZone = document.getElementById('uploadZone');
    const emptyState = document.getElementById('emptyState');
    const fileCard = document.getElementById('fileCard');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const extractBtn = document.getElementById('extractBtn');
    const workspaceSection = document.getElementById('workspaceSection');
    const outputGallery = document.getElementById('outputGallery');
    const pageSearch = document.getElementById('page-search');
    const searchEmptyState = document.getElementById('searchEmptyState');
    
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressStatus = document.getElementById('progressStatus');
    const outputBox = document.getElementById('outputBox'); 
    
    // Settings DOM Elements
    const formatSelect = document.getElementById('exportFormat');
    const qualitySelect = document.getElementById('exportQuality');
    const targetSizeWrap = document.getElementById('targetSizeWrap');
    const bgMode = document.getElementById('bgMode');
    const bwToggle = document.getElementById('bwToggle');
    
    // Password DOM Elements
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const pdfPasswordInput = document.getElementById('pdfPasswordInput');
    
    // State Variables
    let currentFile = null;
    let pageDataMap = new Map();
    let activeCroppers = new Map();
    let hasShownDownloadToast = false;

    const eyeOpenSvg = `<svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const eyeOffSvg = `<svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

    // Toast Notification Handler
    function triggerDownloadSuccess() {
        if (!hasShownDownloadToast) {
            const t = document.getElementById("toast-msg");
            if (t) {
                t.innerText = "Images Downloaded Successfully! 🎉";
                t.classList.add("show");
                setTimeout(() => t.classList.remove("show"), 4000);
                hasShownDownloadToast = true;
            }
        }
        setTimeout(() => {
            if (window.triggerGlobalRatingPopup) window.triggerGlobalRatingPopup();
        }, 1500);
    }

    // Toggle Password Input Visibility
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', () => {
            if (pdfPasswordInput.type === 'password') {
                pdfPasswordInput.type = 'text';
                togglePasswordBtn.innerHTML = eyeOffSvg;
            } else {
                pdfPasswordInput.type = 'password';
                togglePasswordBtn.innerHTML = eyeOpenSvg;
            }
        });
    }

    // Dynamic Toast Initializer
    let toastEl = document.getElementById("toast-msg");
    if (!toastEl) {
        toastEl = document.createElement("div");
        toastEl.id = "toast-msg";
        toastEl.className = "toast";
        document.body.appendChild(toastEl);
    }

    // Number Animation Counter
    function animateValue(objId, start, end, duration, suffix = "") {
        const obj = document.getElementById(objId);
        if (!obj) return;
        const startNum = parseFloat(start) || 0;
        const endNum = parseFloat(end) || 0;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const currentVal = Math.floor(progress * (endNum - startNum) + startNum);
            obj.innerHTML = currentVal + " <span style='font-size:0.5em'>" + suffix + "</span>";
            if (progress < 1) window.requestAnimationFrame(step);
            else obj.innerHTML = endNum + " <span style='font-size:0.5em'>" + suffix + "</span>";
        };
        window.requestAnimationFrame(step);
    }

    // Quality Selection Handler
    qualitySelect.addEventListener('change', (e) => {
        if (e.target.value === 'target') {
            targetSizeWrap.style.display = 'block';
        } else {
            targetSizeWrap.style.display = 'none';
        }
    });

    // Color Picker Setup (Iro.js)
    const bgPicker = new iro.ColorPicker("#bgIroContainer", { width: 200, color: "#ffffff", borderWidth: 1, borderColor: "#00e676" });
    setupPickerUI('bgMode', 'bgSwatchBtn', 'bgPickerOverlay', 'bgPickerPanel', bgPicker);

    function setupPickerUI(modeId, swatchId, overlayId, panelId, pickerObj) {
        const swatch = document.getElementById(swatchId);
        const overlay = document.getElementById(overlayId);
        const panel = document.getElementById(panelId);
        
        if(modeId) {
            document.getElementById(modeId).addEventListener('change', (e) => {
                document.getElementById('customColorSection').style.display = e.target.value === 'custom' ? 'block' : 'none';
            });
        }

        swatch.onclick = () => { panel.style.display = 'flex'; overlay.style.display = 'block'; };
        const closeFnc = () => { panel.style.display = 'none'; overlay.style.display = 'none'; };
        overlay.onclick = closeFnc;
        panel.querySelector('.close-picker-btn').onclick = closeFnc;
        panel.querySelector('.color-ok-btn').onclick = closeFnc;
        
        pickerObj.on('color:change', (color) => { swatch.style.backgroundColor = color.hexString; });
    }

    // Protected PDF Request Password UI Modal
    function requestPasswordUI(filename) {
        return new Promise((resolve) => {
            const popup = document.getElementById('password-prompt-popup');
            const filenameText = document.getElementById('password-file-name');
            const btnSubmit = document.getElementById('btn-submit-password');
            const btnCancel = document.getElementById('btn-cancel-password');
            const closeBtn = document.getElementById('close-password-popup');

            filenameText.innerText = `"${filename}" is protected. Please enter its password to extract images.`;
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

            const onSubmit = () => { cleanup(); resolve(pdfPasswordInput.value); };
            const onCancel = () => { cleanup(); resolve(null); };
            const onEnter = (e) => { if (e.key === 'Enter') onSubmit(); };

            btnSubmit.addEventListener('click', onSubmit);
            btnCancel.addEventListener('click', onCancel);
            closeBtn.addEventListener('click', onCancel);
            pdfPasswordInput.addEventListener('keypress', onEnter);
        });
    }

    // WASM Worker Decryption Bridge
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

            worker.postMessage({ action: 'decrypt', fileData: fileBuffer, password: password, fileName: fileName });
        });
    }

    // Process Initial Selected PDF File
    async function processSelectedFile(file) {
        if (file && file.type === "application/pdf") {
            const arrayBuffer = await file.arrayBuffer();
            let finalFile = file;

            try {
                // Read fresh buffer slice to prevent detachment
                await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
            } catch (error) {
                if (error.name === 'PasswordException') {
                    let isUnlocked = false;
                    while (!isUnlocked) {
                        const rawPwd = await requestPasswordUI(file.name);
                        if (rawPwd === null) return; 
                        
                        const pwd = rawPwd.trim();
                        
                        progressContainer.style.display = "block";
                        progressStatus.textContent = "Unlocking PDF File...";
                        progressText.textContent = "";
                        progressBar.style.width = "75%";

                        try {
                            const freshBuffer = await file.arrayBuffer(); 
                            const unlockedBuffer = await unlockPdfWithWasm(freshBuffer, pwd, file.name);
                            finalFile = new File([new Blob([unlockedBuffer], { type: 'application/pdf' })], file.name, { type: 'application/pdf' });
                            isUnlocked = true;
                            progressContainer.style.display = "none";
                        } catch (e) {
                            progressContainer.style.display = "none";
                            alert(`Incorrect password for ${file.name}. Try again.`);
                        }
                    }
                } else {
                    alert("Format Error: Invalid or corrupted PDF file.");
                    return;
                }
            }

            currentFile = finalFile;
            document.getElementById('displayFileName').textContent = finalFile.name;
            document.getElementById('displayFileSize').textContent = (finalFile.size / (1024 * 1024)).toFixed(2) + " MB";
            document.getElementById('exportFilename').value = finalFile.name.replace('.pdf', '');
            
            emptyState.style.display = "none";
            fileCard.style.display = "flex";
            extractBtn.disabled = false;
            
            resetWorkspace();
        } else {
            alert("Format Error: Please select a valid PDF file.");
        }
    }

    fileInput.addEventListener('change', (e) => processSelectedFile(e.target.files[0]));

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }, false);
    });
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => uploadZone.classList.add('drag-active'), false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => uploadZone.classList.remove('drag-active'), false);
    });
    uploadZone.addEventListener('drop', (e) => processSelectedFile(e.dataTransfer.files[0]), false);

    removeFileBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = "";
        fileCard.style.display = "none";
        emptyState.style.display = "block";
        extractBtn.disabled = true;
        resetWorkspace();
    });

    function resetWorkspace() {
        pageDataMap.clear();
        activeCroppers.forEach(cropper => cropper.destroy());
        activeCroppers.clear();
        
        const cards = outputGallery.querySelectorAll('.image-card');
        cards.forEach(card => card.remove());
        searchEmptyState.style.display = 'none';
        pageSearch.value = "";
        
        workspaceSection.style.display = 'none';
        progressContainer.style.display = 'none';
        if (outputBox) outputBox.style.display = 'none';
        extractBtn.textContent = "Convert to Images";
    }

    async function compressToTargetSize(canvas, targetKB, format) {
        let targetBytes = targetKB * 1024;
        let minQ = 0.1, maxQ = 0.9, quality = 0.8;
        let dataURL = canvas.toDataURL(format, quality);
        let size = Math.round((dataURL.length * 3) / 4);

        if (size <= targetBytes) return dataURL;

        if (format === 'image/jpeg') {
            for (let i = 0; i < 6; i++) { 
                quality = (minQ + maxQ) / 2;
                dataURL = canvas.toDataURL(format, quality);
                size = Math.round((dataURL.length * 3) / 4);
                if (size > targetBytes) maxQ = quality;
                else minQ = quality;
            }
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
            
            dataURL = scCanvas.toDataURL(format, quality);
        }
        return dataURL;
    }

    // Core Convert PDF to Image Extraction Logic
    extractBtn.addEventListener('click', async () => {
        if (!currentFile) return;
        
        extractBtn.disabled = true;
        progressContainer.style.display = "block";
        workspaceSection.style.display = "none";
        if (outputBox) outputBox.style.display = "none";
        
        const oldCards = outputGallery.querySelectorAll('.image-card');
        oldCards.forEach(c => c.remove());
        searchEmptyState.style.display = 'none';
        pageSearch.value = "";
        
        pageDataMap.clear();

        try {
            const arrayBuffer = await currentFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const totalPages = pdf.numPages;
            
            const format = formatSelect.value;
            const qualityMode = qualitySelect.value;
            let initialScale = 2.0;

            if (qualityMode === 'high') initialScale = 2.0;
            else if (qualityMode === 'medium') initialScale = 1.5;
            else if (qualityMode === 'low') initialScale = 1.0;
            else initialScale = 2.0; 

            for (let i = 1; i <= totalPages; i++) {
                updateProgress(i, totalPages);
                
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: initialScale }); 
                
                const pdfCanvas = document.createElement('canvas');
                pdfCanvas.width = viewport.width; pdfCanvas.height = viewport.height;
                await page.render({ canvasContext: pdfCanvas.getContext('2d'), viewport }).promise;

                const finalCanvas = document.createElement('canvas');
                finalCanvas.width = viewport.width; finalCanvas.height = viewport.height;
                const ctx = finalCanvas.getContext('2d');

                let bgColor = bgMode.value === 'black' ? '#000000' : (bgMode.value === 'custom' ? bgPicker.color.hexString : '#ffffff');
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

                if (bwToggle.checked) ctx.filter = 'grayscale(100%)';
                ctx.drawImage(pdfCanvas, 0, 0);
                ctx.filter = 'none';

                let finalDataURL = "";
                if (qualityMode === 'target') {
                    const targetKB = parseInt(document.getElementById('targetSizeKB').value) || 200; 
                    finalDataURL = await compressToTargetSize(finalCanvas, targetKB, format);
                } else {
                    let qualityParam = 1.0;
                    if (qualityMode === 'high') qualityParam = 0.9;
                    else if (qualityMode === 'medium') qualityParam = 0.7;
                    else if (qualityMode === 'low') qualityParam = 0.5;
                    finalDataURL = finalCanvas.toDataURL(format, qualityParam);
                }

                pageDataMap.set(i, finalDataURL);
                buildImageCard(i, finalDataURL, format);
            }

            progressStatus.textContent = "Extraction Complete!";
            setTimeout(() => {
                progressContainer.style.display = "none";
                workspaceSection.style.display = "block";
                extractBtn.disabled = false;
                extractBtn.innerText = "Re-Convert Images";
                
                if(outputBox) {
                    outputBox.style.display = "block";
                    outputBox.innerHTML = `
                        <div class="success-card">
                            <div class="success-header">🎉 Extraction Successful!</div>
                            <p style="color: #b2ebf2; font-size: 0.95rem;">Your PDF pages have been successfully converted to high-quality images.</p>
                            <div class="stats-grid">
                                <div class="stat-box">
                                    <div class="stat-value highlight" id="animTotalPages">0</div>
                                    <div class="stat-label">Total Pages</div>
                                </div>
                                <div class="stat-box">
                                    <div class="stat-value" id="animFormatText">${format === 'image/jpeg' ? 'JPG' : 'PNG'}</div>
                                    <div class="stat-label">Format</div>
                                </div>
                            </div>
                        </div>
                    `;
                    animateValue("animTotalPages", 0, totalPages, 1500, "");
                }

                if (window.confetti) {
                    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#00e676', '#b2ebf2', '#ffffff'] });
                }
            }, 800);

        } catch (err) {
            console.error(err);
            alert("Error processing PDF. Please check your document and try again.");
            extractBtn.disabled = false;
        }
    });

    function updateProgress(current, total) {
        const percent = Math.round((current / total) * 100);
        progressBar.style.width = percent + "%";
        progressText.innerText = `${percent}%`;
        progressStatus.innerText = `Extracting Page ${current} of ${total}...`;
    }

    // Build Individual Extracted Page Card UI
    function buildImageCard(pageNum, dataURL, format) {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.dataset.page = pageNum;

        const zoomIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`;
        const cropIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"></path><path d="M18 22V8a2 2 0 0 0-2-2H2"></path></svg>`;
        const shareIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`;
        const downloadIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
        const deleteIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

        card.innerHTML = `
            <div class="page-badge">Page ${pageNum}</div>
            <img class="img-thumb" id="img-page-${pageNum}" src="${dataURL}" alt="Extracted Page ${pageNum}">
            <div class="image-overlay">
                <button class="overlay-btn btn-zoom" style="display:flex; align-items:center; justify-content:center; color:#003c2f;" title="Zoom" aria-label="Zoom into Page ${pageNum}">${zoomIcon}</button>
                <button class="overlay-btn btn-crop" style="display:flex; align-items:center; justify-content:center; color:#003c2f;" title="Crop" aria-label="Crop Page ${pageNum}">${cropIcon}</button>
                <button class="overlay-btn btn-dl" style="display:flex; align-items:center; justify-content:center; color:#003c2f;" title="Download" aria-label="Download Page ${pageNum}">${downloadIcon}</button>
                <button class="overlay-btn btn-share" style="display:flex; align-items:center; justify-content:center; color:#003c2f; background:#00b0ff;" title="Share Image" aria-label="Share Page ${pageNum}">${shareIcon}</button>
                <button class="overlay-btn btn-del" style="display:flex; align-items:center; justify-content:center; background:#ff5252; color:#fff;" title="Delete" aria-label="Delete Page ${pageNum}">${deleteIcon}</button>
            </div>
            <div class="file-name">Page_${pageNum}.${format === 'image/jpeg' ? 'jpg' : 'png'}</div>
        `;

        card.querySelector('.btn-zoom').onclick = () => openZoomModal(pageDataMap.get(pageNum));
        card.querySelector('.btn-crop').onclick = () => openCropModal(pageNum, card.querySelector('.img-thumb'));
        
        // Single Image Share Event Handler
        card.querySelector('.btn-share').onclick = async (e) => {
            const shareBtn = e.currentTarget;
            const currentDataUrl = pageDataMap.get(pageNum);
            if (!currentDataUrl) return;

            const selectedMime = formatSelect.value;
            const ext = selectedMime === 'image/jpeg' ? 'jpg' : 'png';
            const folderName = document.getElementById('exportFilename').value || 'SArixa_Export';
            const imageFileName = `${folderName}_Page_${pageNum}.${ext}`;

            // Convert base64 DataURL to Binary Blob
            const arr = currentDataUrl.split(',');
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            const imageBlob = new Blob([u8arr], { type: selectedMime });

            const customMessage = `Here is Page ${pageNum} extracted securely using *SArixa*.`;

            // Call native share module
            await sharePdfFile(imageBlob, imageFileName, shareBtn, customMessage, selectedMime);
        };

        card.querySelector('.btn-dl').onclick = () => { downloadSingle(pageNum, format); triggerDownloadSuccess(); };
        
        card.querySelector('.btn-del').onclick = () => {
            const delPopup = document.getElementById("delete-confirm-popup");
            delPopup.style.display = "flex";
            
            document.getElementById("btn-confirm-delete").onclick = () => {
                pageDataMap.delete(pageNum);
                if (activeCroppers.has(pageNum)) activeCroppers.get(pageNum).destroy();
                card.remove();

                if(pageDataMap.size === 0) workspaceSection.style.display = 'none';
                delPopup.style.display = "none";
            };

            document.getElementById("btn-cancel-delete").onclick = () => {
                delPopup.style.display = "none";
            };
        };

        outputGallery.appendChild(card);
    }

    // Page Search Filtering Logic
    pageSearch.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        const cards = document.querySelectorAll('.image-card');
        let hasVisibleCard = false;

        cards.forEach(card => {
            if (!query || card.dataset.page === query) {
                card.style.display = ''; 
                hasVisibleCard = true;
            } else {
                card.style.display = 'none';
            }
        });

        if (cards.length > 0 || query !== "") {
            searchEmptyState.style.display = hasVisibleCard ? 'none' : 'block';
        } else {
            searchEmptyState.style.display = 'none';
        }
    });

    pageSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); pageSearch.blur(); }
    });

    // Zoom Image Modal
    function openZoomModal(src) {
        const overlay = document.createElement("div");
        overlay.className = "zoom-overlay";
        overlay.innerHTML = `<button class="zoom-close" aria-label="Close Zoom View">✕</button><img src="${src}" alt="Zoomed Image">`;
        overlay.querySelector(".zoom-close").onclick = () => overlay.remove();
        document.body.appendChild(overlay);
    }

    // Crop & Tilt Modal Setup
    function openCropModal(pageNum, imgElement) {
        const modal = document.createElement("div");
        modal.className = "crop-modal";
        modal.innerHTML = `
            <div class="crop-area"><img id="cropTarget" src="${pageDataMap.get(pageNum)}" alt="Crop target"></div>
            
            <div class="crop-tilt-wrapper">
                <div class="crop-tilt-header">
                    <label>Tilt: <span id="tiltVal">0</span>°</label>
                    <div class="step-input-group">
                        <label for="tiltStepInput">Step:</label>
                        <input type="number" id="tiltStepInput" value="1" min="0.1" max="90" step="0.1">
                        <span>°</span>
                    </div>
                </div>
                <div class="crop-tilt-controls">
                    <button type="button" id="btnTiltMinus" class="tilt-step-btn">-1°</button>
                    <input type="range" id="tiltSlider" min="-180" max="180" value="0" step="0.1" aria-label="Tilt Image slider">
                    <button type="button" id="btnTiltPlus" class="tilt-step-btn">+1°</button>
                    <button id="resetTiltBtn" type="button" class="reset-tilt-btn" aria-label="Reset Tilt">Reset</button>
                </div>
            </div>

            <div class="crop-actions">
                <button type="button" class="crop-btn cancel-btn" aria-label="Cancel Cropping">Cancel</button>
                <button type="button" class="crop-btn save-btn" aria-label="Save Cropped Image">Save Crop</button>
            </div>
        `;
        document.body.appendChild(modal);

        const targetImage = modal.querySelector('#cropTarget');
        const cropper = new Cropper(targetImage, { viewMode: 1, autoCropArea: 1, background: false, responsive: true, checkOrientation: false });

        const tiltSlider = modal.querySelector("#tiltSlider");
        const tiltVal = modal.querySelector("#tiltVal");
        const tiltStepInput = modal.querySelector("#tiltStepInput");
        const btnTiltMinus = modal.querySelector("#btnTiltMinus");
        const btnTiltPlus = modal.querySelector("#btnTiltPlus");
        const resetTiltBtn = modal.querySelector("#resetTiltBtn");

        let currentTilt = 0;

        function updateTiltUI() {
            if (currentTilt > 180) currentTilt = 180;
            if (currentTilt < -180) currentTilt = -180;
            tiltSlider.value = currentTilt;
            tiltVal.innerText = (Math.round(currentTilt * 10) / 10);
            cropper.rotateTo(currentTilt);
        }

        tiltStepInput.addEventListener("input", (e) => {
            let step = parseFloat(e.target.value) || 1;
            btnTiltMinus.innerText = "-" + step + "°";
            btnTiltPlus.innerText = "+" + step + "°";
        });

        btnTiltMinus.addEventListener("click", () => {
            let step = parseFloat(tiltStepInput.value) || 1;
            currentTilt -= step; updateTiltUI();
        });

        btnTiltPlus.addEventListener("click", () => {
            let step = parseFloat(tiltStepInput.value) || 1;
            currentTilt += step; updateTiltUI();
        });

        tiltSlider.addEventListener("input", (e) => {
            currentTilt = parseFloat(e.target.value); updateTiltUI();
        });

        resetTiltBtn.addEventListener("click", () => { currentTilt = 0; updateTiltUI(); });

        modal.querySelector('.cancel-btn').onclick = () => { cropper.destroy(); modal.remove(); };
        modal.querySelector('.save-btn').onclick = () => {
            const canvas = cropper.getCroppedCanvas();
            const newURL = canvas.toDataURL(formatSelect.value, 1.0);
            pageDataMap.set(pageNum, newURL);
            imgElement.src = newURL;
            cropper.destroy(); modal.remove();
        };
    }

    // Download Single Page Image
    function downloadSingle(pageNum, format) {
        const ext = format === 'image/jpeg' ? 'jpg' : 'png';
        const link = document.createElement('a');
        link.href = pageDataMap.get(pageNum);
        link.download = `${document.getElementById('exportFilename').value}_Page_${pageNum}.${ext}`;
        link.click();
    }

    // Generate ZIP Blob using JSZip
    async function generateZipBlob() {
        if (!window.JSZip) {
            throw new Error("JSZip is not loaded. Please ensure it is linked in the HTML.");
        }
        const zip = new window.JSZip();
        const folderName = document.getElementById('exportFilename').value || 'SArixa_Export';
        const ext = formatSelect.value === 'image/jpeg' ? 'jpg' : 'png';

        for (let [pageNum, cropper] of activeCroppers.entries()) {
            const canvas = cropper.getCroppedCanvas();
            pageDataMap.set(pageNum, canvas.toDataURL(formatSelect.value, 1.0));
        }

        pageDataMap.forEach((dataURL, pageNum) => {
            zip.file(`${folderName}_Page_${pageNum}.${ext}`, dataURL.split(',')[1], { base64: true });
        });

        return await zip.generateAsync({ type: 'blob' });
    }

    // Download All Images as ZIP File Event
    const downloadZipBtn = document.getElementById('downloadZipBtn');
    if (downloadZipBtn) {
        downloadZipBtn.addEventListener('click', async () => {
            if (pageDataMap.size === 0) return;
            
            const originalHTML = downloadZipBtn.innerHTML;
            downloadZipBtn.innerHTML = `<div class="spinner" style="display:inline-block; border-color: rgba(0, 34, 51, 0.3); border-top-color: #002233;"></div> Compressing...`; 
            downloadZipBtn.disabled = true;

            try {
                const zipBlob = await generateZipBlob();
                const folderName = document.getElementById('exportFilename').value || 'SArixa_Export';
                
                const link = document.createElement('a');
                link.href = URL.createObjectURL(zipBlob);
                link.download = `${folderName}.zip`;
                link.click();
                setTimeout(() => URL.revokeObjectURL(link.href), 500);
                
                triggerDownloadSuccess();
            } catch (err) {
                console.error("ZIP Creation Error:", err);
                alert("Error creating ZIP file. " + err.message);
            } finally {
                downloadZipBtn.innerHTML = originalHTML; 
                downloadZipBtn.disabled = false;
            }
        });
    }
});