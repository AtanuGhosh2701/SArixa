import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

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
    const engineSelect = document.getElementById('engineSelect'); // THE MASTER SWITCH

    // UI Elements for Preview & Download
    const finalActionArea = document.getElementById('finalActionArea');
    const previewBtn = document.getElementById('previewBtn');
    const fileNameInput = document.getElementById('fileNameInput');
    const downloadBtn = document.getElementById('downloadBtn');
    const outputBox = document.getElementById('outputBox');

    let currentFile = null;
    let originalSizeBytes = 0;
    let compressedBlob = null;
    let isPreviewOpen = false;

    // --- NUMBER COUNTER ANIMATION FUNCTION ---
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

    // --- FILE HANDLING LOGIC ---
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

    if (fileInput) {
        fileInput.addEventListener('change', (e) => processSelectedFile(e.target.files[0]));
    }

    // --- DRAG AND DROP LOGIC FOR PC ---
    if (previewBox) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            previewBox.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

        ['dragenter', 'dragover'].forEach(eventName => {
            previewBox.addEventListener(eventName, () => {
                if (window.matchMedia("(pointer: coarse)").matches) return; 
                previewBox.classList.add('drag-active');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            previewBox.addEventListener(eventName, () => {
                previewBox.classList.remove('drag-active');
            }, false);
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

    // --- 3. DUAL COMPRESSION ENGINE 🔥 ---
    if (compressBtn) {
        compressBtn.addEventListener('click', async () => {
            if (!currentFile) return;

            const progressContainer = document.getElementById('progressContainer');
            const progressBar = document.getElementById('progressBar');
            const progressText = document.getElementById('progressText');
            const progressStatus = document.getElementById('progressStatus');

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
                const compLevel = compressionLevel ? compressionLevel.value : 'recommended';
                const selectedEngine = engineSelect ? engineSelect.value : 'wasm';

                if (selectedEngine === 'canvas') {
                    // ==========================================
                    // 🔥 ENGINE 1: FORCE JPG (Memory Optimized)
                    // ==========================================
                    if (progressStatus) progressStatus.textContent = "Rasterizing with Force Engine...";
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

                    // Super Aggressive Downscaling
                    let scaleFactor = 1.5; 
                    let imageQuality = 0.8;
                    if (compLevel === 'extreme') { scaleFactor = 1.0; imageQuality = 0.5; } 
                    else if (compLevel === 'low') { scaleFactor = 2.0; imageQuality = 0.9; }

                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });

                    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
                        if (progressStatus) progressStatus.textContent = `Rasterizing Page ${pageNum} of ${totalPages}...`;
                        let currentProgress = 15 + ((pageNum / totalPages) * 70);
                        if (progressBar) progressBar.style.width = `${currentProgress}%`;
                        if (progressText) progressText.textContent = Math.round(currentProgress) + "%";

                        const page = await pdf.getPage(pageNum);
                        const viewport = page.getViewport({ scale: scaleFactor });

                        canvas.width = viewport.width;
                        canvas.height = viewport.height;

                        await page.render({ canvasContext: ctx, viewport: viewport }).promise;

                        const imgDataUrl = canvas.toDataURL('image/jpeg', imageQuality);
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
                    finalizeCompression(pdfBytes.buffer, arrayBuffer, true);

                } else {
                    // ==========================================
                    // 🔥 ENGINE 2: SMART WASM (Original Text Kept)
                    // ==========================================
                    if (progressStatus) progressStatus.textContent = "Waking up Smart Engine...";
                    
                    const worker = new Worker('../js/tools/compress-pdf/compress-worker.js');

                    worker.onmessage = function(e) {
                        const data = e.data;
                        if (data.status === 'progress') {
                            if (progressStatus) progressStatus.textContent = data.message;
                            if (progressBar) progressBar.style.width = data.percent + '%';
                            if (progressText) progressText.textContent = data.percent + '%';
                        } else if (data.status === 'done') {
                            worker.terminate();
                            finalizeCompression(data.compressedBuffer, arrayBuffer, false);
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
    function finalizeCompression(compressedBuffer, originalBuffer, isForceMode) {
        let compressedSize = compressedBuffer.byteLength;
        let finalBufferToUse = compressedBuffer;

        let savedPercentage = (((originalSizeBytes - compressedSize) / originalSizeBytes) * 100);
        
        // Prevent fake success or size increase
        if (savedPercentage < 1) {
            savedPercentage = 0; 
            compressedSize = originalSizeBytes; 
            finalBufferToUse = originalBuffer; 
        }
        
        savedPercentage = savedPercentage.toFixed(2);
        compressedBlob = new Blob([finalBufferToUse], { type: 'application/pdf' });
        
        const originalMb = (originalSizeBytes / (1024 * 1024)).toFixed(2);
        const finalMb = (compressedSize / (1024 * 1024)).toFixed(2);

        document.getElementById('progressBar').style.width = '100%';
        document.getElementById('progressText').textContent = '100%';

        setTimeout(() => {
            document.getElementById('progressContainer').style.display = "none";
            if (outputBox) outputBox.style.display = "block";
            if (finalActionArea) finalActionArea.style.display = "block";
            
            let successCardHTML = "";
            if (savedPercentage > 0) {
                successCardHTML = `
                    <div class="success-card">
                        <div class="success-header">🎉 Compression Successful!</div>
                        <p style="color: #b2ebf2; font-size: 0.95rem;">${isForceMode ? 'Rasterized and forced to reduce file size significantly.' : 'File optimized keeping text original and selectable.'}</p>
                        <div class="stats-grid">
                            <div class="stat-box"><div class="stat-value" id="animOriginalSize">0</div><div class="stat-label">Original</div></div>
                            <div class="stat-box"><div class="stat-value highlight" id="animSavedPercent">0</div><div class="stat-label">Reduced</div></div>
                            <div class="stat-box"><div class="stat-value" id="animNewSize">0</div><div class="stat-label">New Size</div></div>
                        </div>
                    </div>
                `;
            } else {
                successCardHTML = `
                    <div class="success-card" style="border-color: #ffb300;">
                        <div class="success-header" style="color: #ffb300;">⚡ Structurally Optimized!</div>
                        <p style="color: #b2ebf2; font-size: 0.95rem;">This file is already highly optimized. Our engine couldn't compress it further without losing quality.<br><br>
                        <span style="color:#00e676; font-weight:bold;">💡 Pro Tip:</span> Select <b>"Scanned Document"</b> mode to forcibly shrink the file by converting pages to images!</p>
                    </div>
                `;
            }

            outputBox.innerHTML = successCardHTML;

            if (savedPercentage > 0) {
                animateValue("animOriginalSize", 0, originalMb, 1500, "MB");
                animateValue("animSavedPercent", 0, savedPercentage, 1500, " %");
                animateValue("animNewSize", 0, finalMb, 1500, "MB");
            }
            
            compressBtn.disabled = false;
            compressBtn.textContent = "Compress Another PDF";

        }, 500);
    }

    // 4. Download Logic & Popup Trigger
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

            // MAGIC: TRIGGER RATING POPUP LOOP LOGIC
            setTimeout(() => {
                const hasSubmitted = localStorage.getItem('hasSubmittedSarixaRating');
                
                if (!hasSubmitted) {
                  let count = parseInt(localStorage.getItem('sarixaCompressCount') || '0');
                  count++; 
                  localStorage.setItem('sarixaCompressCount', count.toString());

                  // Show on 2nd time, OR every multiple of 5 (5, 10, 15, 20...)
                  if (count === 2 || (count >= 5 && count % 5 === 0)) {
                    const popup = document.getElementById('rating-popup');
                    const reminder = document.getElementById('rating-reminder-bar');
                    
                    if (popup) {
                        popup.style.display = 'flex';
                        if (reminder) reminder.style.display = 'none'; // Hide reminder when popup is open
                    }
                  }
                }
            }, 1000); 
        });
    }

    // 5. Preview PDF on the Same Page
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
                const arrayBuf = await compressedBlob.arrayBuffer();
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

    // ==========================================
    // FIREBASE RATING POPUP LOGIC
    // ==========================================
    const firebaseConfig = {
      apiKey: "AIzaSyDZxvUO_cI-amyllXIs3cJSikIvcdJcxj0",
      authDomain: "sarixa-c6d35.firebaseapp.com",
      databaseURL: "https://sarixa-c6d35-default-rtdb.firebaseio.com",
      projectId: "sarixa-c6d35",
      storageBucket: "sarixa-c6d35.firebasestorage.app",
      messagingSenderId: "404496275730",
      appId: "1:404496275730:web:46b6ba2791e76600d87bcb",
      measurementId: "G-TC8FR721KT"
    };

    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);

    let selectedRating = 0;
    const popup = document.getElementById('rating-popup');
    const closeTopBtn = document.getElementById('close-popup-top');
    const stars = document.querySelectorAll('#stars span');

    // UI States
    const step1 = document.getElementById('rating-step-1');
    const stepHappy = document.getElementById('rating-step-happy');
    const stepSad = document.getElementById('rating-step-sad');
    const successState = document.getElementById('rating-success-state');

    // Buttons
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const btnSubmitFeedback = document.getElementById('btn-submit-feedback');
    const feedbackText = document.getElementById('feedback-text');

    // Permanent Reminder Bar
    const reminderBar = document.getElementById('rating-reminder-bar');
    const openReminderBtn = document.getElementById('open-reminder-btn');

    // Show reminder bar on page load if rating NOT submitted yet
    if(!localStorage.getItem('hasSubmittedSarixaRating')) {
        if(reminderBar) reminderBar.style.display = 'flex';
    } else {
        if(reminderBar) reminderBar.style.display = 'none';
    }

    const resetPopupUI = () => {
        if(step1) step1.style.display = 'block';
        if(stepHappy) stepHappy.style.display = 'none';
        if(stepSad) stepSad.style.display = 'none';
        if(successState) successState.style.display = 'none';
        selectedRating = 0;
        if(feedbackText) feedbackText.value = "";
        if(copyLinkBtn) copyLinkBtn.innerText = "Copy Link";
        
        if(stars) {
            stars.forEach(s => { 
                s.innerHTML = '☆'; 
                s.style.color = '#555';
                s.classList.remove('selected');
            });
        }
    };

    // FULL CLOSE LOGIC
    const completeClose = () => {
        if(popup) popup.style.display = 'none';
        
        // IF RATING IS NOT SUBMITTED, SHOW REMINDER BAR AGAIN
        if (!localStorage.getItem('hasSubmittedSarixaRating')) {
            localStorage.setItem('sarixaRatingDismissed', 'true');
            if(reminderBar) reminderBar.style.display = 'flex'; 
        }
        
        setTimeout(resetPopupUI, 500);
    };

    if (closeTopBtn) closeTopBtn.addEventListener('click', completeClose);

    // STAR CLICK LOGIC
    if (stars) {
        stars.forEach(star => {
          star.addEventListener('click', function() {
            selectedRating = parseInt(this.getAttribute('data-value'));

            // Visual update
            stars.forEach(s => {
              const sVal = parseInt(s.getAttribute('data-value'));
              s.innerHTML = (sVal <= selectedRating) ? '⭐' : '☆';
              s.style.color = (sVal <= selectedRating) ? '#ffc107' : '#555';
              if(sVal <= selectedRating) s.classList.add('selected');
              else s.classList.remove('selected');
            });

            // Save initial star rating immediately to DB
            push(ref(database, 'sarixa_ratings'), {
                rating: selectedRating,
                timestamp: Date.now(),
                type: 'initial_click_compress' // Tracking source
            });

            // Submitting makes the popup and banner go away forever
            localStorage.setItem('hasSubmittedSarixaRating', 'true');
            if(reminderBar) reminderBar.style.display = 'none'; 

            // UX Transition (Step 2)
            setTimeout(() => {
                if(step1) step1.style.display = 'none';
                if(selectedRating >= 4) {
                    if(stepHappy) stepHappy.style.display = 'block';
                    const shareText = "I found the best PDF Compressor! It's 100% private (no server uploads) and completely free without watermarks. Try SArixa here: https://sarixa-tools.vercel.app/";
                    const whatsappBtn = document.getElementById('whatsapp-share-btn');
                    if(whatsappBtn) whatsappBtn.href = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                } else {
                    if(stepSad) stepSad.style.display = 'block';
                }
            }, 400); 
          });
        });
    }

    // HAPPY FLOW - COPY LINK
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', () => {
            navigator.clipboard.writeText("https://sarixa-tools.vercel.app/");
            copyLinkBtn.innerText = "Copied! ✔";
            setTimeout(() => {
                completeClose(); 
            }, 1500);
        });
    }

    // SAD FLOW - SUBMIT FEEDBACK
    if (btnSubmitFeedback) {
        btnSubmitFeedback.addEventListener('click', () => {
            const feedback = feedbackText ? feedbackText.value.trim() : "";
            btnSubmitFeedback.innerText = "Sending...";
            
            push(ref(database, 'sarixa_feedback'), {
                rating: selectedRating,
                feedback: feedback || "No text provided",
                source: "compress_pdf",
                timestamp: Date.now()
            }).then(() => {
                if(stepSad) stepSad.style.display = 'none';
                if(successState) successState.style.display = 'flex';
                setTimeout(completeClose, 2500);
            }).catch(err => {
                console.error(err);
                completeClose();
            });
        });
    }

    // REMINDER BAR LOGIC
    if (openReminderBtn) {
        openReminderBtn.addEventListener('click', () => {
            if(popup) popup.style.display = 'flex';
            if(reminderBar) reminderBar.style.display = 'none'; 
        });
    }
});