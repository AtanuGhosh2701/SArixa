document.addEventListener("DOMContentLoaded", () => {
    // PDF.js Setup
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

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
    
    // Settings DOM
    const formatSelect = document.getElementById('exportFormat');
    const qualitySelect = document.getElementById('exportQuality');
    const targetSizeWrap = document.getElementById('targetSizeWrap');
    const bgMode = document.getElementById('bgMode');
    const bwToggle = document.getElementById('bwToggle');
    
    // State
    let currentFile = null;
    let pageDataMap = new Map();
    let activeCroppers = new Map();
    let hasShownDownloadToast = false;

    // Create Toast Div dynamically if not present
    let toastEl = document.getElementById("toast-msg");
    if (!toastEl) {
        toastEl = document.createElement("div");
        toastEl.id = "toast-msg";
        toastEl.className = "toast";
        document.body.appendChild(toastEl);
    }

    // Quality Select Change Logic (Show/Hide Target Input)
    qualitySelect.addEventListener('change', (e) => {
        if (e.target.value === 'target') {
            targetSizeWrap.style.display = 'block';
        } else {
            targetSizeWrap.style.display = 'none';
        }
    });

    // Color Pickers Init (Iro.js)
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

    // File Handling & Drag Drop
    function processSelectedFile(file) {
        if (file && file.type === "application/pdf") {
            currentFile = file;
            document.getElementById('displayFileName').textContent = file.name;
            document.getElementById('displayFileSize').textContent = (file.size / (1024 * 1024)).toFixed(2) + " MB";
            document.getElementById('exportFilename').value = file.name.replace('.pdf', '');
            
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

    extractBtn.addEventListener('click', async () => {
        if (!currentFile) return;
        
        extractBtn.disabled = true;
        progressContainer.style.display = "block";
        workspaceSection.style.display = "none";
        
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
            }, 800);

        } catch (err) {
            console.error(err);
            alert("Error processing PDF. Ensure it is not password protected.");
            extractBtn.disabled = false;
        }
    });

    function updateProgress(current, total) {
        const percent = Math.round((current / total) * 100);
        progressBar.style.width = percent + "%";
        progressText.innerText = `${percent}%`;
        progressStatus.innerText = `Extracting Page ${current} of ${total}...`;
    }

    function buildImageCard(pageNum, dataURL, format) {
        const card = document.createElement('div');
        card.className = 'image-card';
        card.dataset.page = pageNum;

        // FIXED: SVG elements styled directly
        const zoomIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`;
        const cropIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"></path><path d="M18 22V8a2 2 0 0 0-2-2H2"></path></svg>`;
        const downloadIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
        const deleteIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

        card.innerHTML = `
            <div class="page-badge">Page ${pageNum}</div>
            <img class="img-thumb" id="img-page-${pageNum}" src="${dataURL}" alt="Extracted Page ${pageNum}">
            <div class="image-overlay">
                <button class="overlay-btn btn-zoom" style="display:flex; align-items:center; justify-content:center; color:#003c2f;" title="Zoom" aria-label="Zoom into Page ${pageNum}">${zoomIcon}</button>
                <button class="overlay-btn btn-crop" style="display:flex; align-items:center; justify-content:center; color:#003c2f;" title="Crop" aria-label="Crop Page ${pageNum}">${cropIcon}</button>
                <button class="overlay-btn btn-dl" style="display:flex; align-items:center; justify-content:center; color:#003c2f;" title="Download" aria-label="Download Page ${pageNum}">${downloadIcon}</button>
                <button class="overlay-btn btn-del" style="display:flex; align-items:center; justify-content:center; background:#ff5252; color:#fff;" title="Delete" aria-label="Delete Page ${pageNum}">${deleteIcon}</button>
            </div>
            <div class="file-name">Page_${pageNum}.${format === 'image/jpeg' ? 'jpg' : 'png'}</div>
        `;

        card.querySelector('.btn-zoom').onclick = () => openZoomModal(pageDataMap.get(pageNum));
        card.querySelector('.btn-crop').onclick = () => openCropModal(pageNum, card.querySelector('.img-thumb'));
        card.querySelector('.btn-dl').onclick = () => { downloadSingle(pageNum, format); triggerDownloadSuccess(); };
        
        // Setup Delete Modal Connection
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

    function openZoomModal(src) {
        const overlay = document.createElement("div");
        overlay.className = "zoom-overlay";
        overlay.innerHTML = `<button class="zoom-close" aria-label="Close Zoom View">✕</button><img src="${src}" alt="Zoomed Image">`;
        overlay.querySelector(".zoom-close").onclick = () => overlay.remove();
        document.body.appendChild(overlay);
    }

    function openCropModal(pageNum, imgElement) {
        const modal = document.createElement("div");
        modal.className = "crop-modal";
        modal.innerHTML = `
            <div class="crop-area" style="width: 100%; max-width: 800px; height: 65vh; margin-bottom: 20px; background: #000;"><img id="cropTarget" src="${pageDataMap.get(pageNum)}" alt="Crop target"></div>
            <div class="crop-actions" style="display:flex; gap:15px; width: 100%; max-width: 800px;">
                <button class="crop-btn cancel-btn" style="flex: 1; max-width: 200px; padding: 14px; font-size: 1rem; font-weight: bold; border: none; border-radius: 10px; cursor: pointer; background:#ff5252; color:#fff;" aria-label="Cancel Cropping">Cancel</button>
                <button class="crop-btn save-btn" style="flex: 1; max-width: 200px; padding: 14px; font-size: 1rem; font-weight: bold; border: none; border-radius: 10px; cursor: pointer; background:#00e676; color:#003c2f;" aria-label="Save Cropped Image">Apply Crop</button>
            </div>
        `;
        document.body.appendChild(modal);

        const cropper = new Cropper(modal.querySelector('#cropTarget'), { viewMode: 1, autoCropArea: 1, background: false });

        modal.querySelector('.cancel-btn').onclick = () => { cropper.destroy(); modal.remove(); };
        modal.querySelector('.save-btn').onclick = () => {
            const canvas = cropper.getCroppedCanvas();
            const newURL = canvas.toDataURL(formatSelect.value, 1.0);
            pageDataMap.set(pageNum, newURL);
            imgElement.src = newURL;
            cropper.destroy(); modal.remove();
        };
    }

    function downloadSingle(pageNum, format) {
        const ext = format === 'image/jpeg' ? 'jpg' : 'png';
        const link = document.createElement('a');
        link.href = pageDataMap.get(pageNum);
        link.download = `${document.getElementById('exportFilename').value}_Page_${pageNum}.${ext}`;
        link.click();
    }

    document.getElementById('downloadZipBtn').addEventListener('click', async () => {
        if (pageDataMap.size === 0) return;
        
        const btn = document.getElementById('downloadZipBtn');
        btn.innerText = 'Compressing...'; btn.disabled = true;

        const zip = new JSZip();
        const folderName = document.getElementById('exportFilename').value || 'SArixa_Export';
        const ext = formatSelect.value === 'image/jpeg' ? 'jpg' : 'png';

        for (let [pageNum, cropper] of activeCroppers.entries()) {
            const canvas = cropper.getCroppedCanvas();
            pageDataMap.set(pageNum, canvas.toDataURL(formatSelect.value, 1.0));
        }

        pageDataMap.forEach((dataURL, pageNum) => {
            zip.file(`${folderName}_Page_${pageNum}.${ext}`, dataURL.split(',')[1], { base64: true });
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `${folderName}.zip`;
        link.click();

        btn.innerText = 'Download All as ZIP'; btn.disabled = false;
        triggerDownloadSuccess();
    });

    // Rating trigger logic connected to Global UI
    function triggerDownloadSuccess() {
        if (!hasShownDownloadToast) {
            const t = document.getElementById("toast-msg");
            if (t) {
                t.innerText = "Images Downloaded! 🎉";
                t.classList.add("show");
                setTimeout(() => t.classList.remove("show"), 4000);
                hasShownDownloadToast = true;
            }
        }

        setTimeout(() => {
            if (window.triggerGlobalRatingPopup) window.triggerGlobalRatingPopup();
        }, 1500);
    }
});