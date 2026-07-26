// Import the native sharing helper system (using correct relative path)
import { sharePdfFile } from '../sharing-system.js';

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById('fileInput');
    const previewBox = document.getElementById('previewBox');
    const uploadArea = document.getElementById('uploadArea');
    const fileInfoBox = document.getElementById('fileInfoBox'); 
    
    const selectedFileName = document.getElementById('selectedFileName');
    const selectedFileSize = document.getElementById('selectedFileSize');
    const removeFileBtn = document.getElementById('removeFileBtn');
    
    const userPassword = document.getElementById('userPassword');
    const ownerPassword = document.getElementById('ownerPassword');
    const permPrint = document.getElementById('permPrint');
    const permCopy = document.getElementById('permCopy');
    const permModify = document.getElementById('permModify');

    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    const strengthBars = [
        document.getElementById('str-1'), document.getElementById('str-2'),
        document.getElementById('str-3'), document.getElementById('str-4')
    ];
    const strengthText = document.getElementById('strengthText');
    const protectBtn = document.getElementById('protectBtn');
    
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressStatus = document.getElementById('progressStatus');
    
    const outputBox = document.getElementById('outputBox');
    const finalActionArea = document.getElementById('finalActionArea');
    const fileNameInput = document.getElementById('fileNameInput');
    const downloadBtn = document.getElementById('downloadBtn');
    const shareBtn = document.getElementById('shareBtn'); // <-- Added Share Button
    const toast = document.getElementById('toast');

    let currentFile = null;
    let encryptedPdfBlob = null;
    let isUserPasswordValid = false;

    function showToast(message, type = 'success') {
        if(!toast) return;
        toast.textContent = message;
        toast.className = `toast show ${type === 'error' ? 'error' : ''}`;
        setTimeout(() => { toast.classList.remove('show'); }, 3000);
    }

    function formatBytes(bytes) {
        if (!+bytes) return '0 MB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    // Toggle Password Visibility
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if(!input) return;

            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);

            if(type === 'text') {
                this.innerHTML = `
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                `;
            } else {
                this.innerHTML = `
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            }
        });
    });

    function validatePasswords() {
        const val1 = userPassword.value;
        let score = 0;
        
        if (val1.length > 0) {
            if (val1.length >= 6) score++;
            if (val1.match(/[A-Z]/)) score++;
            if (val1.match(/[0-9]/)) score++;
            if (val1.match(/[^A-Za-z0-9]/)) score++;
        }

        strengthBars.forEach(bar => { if(bar) bar.style.background = 'rgba(255, 255, 255, 0.1)'; });
        
        if (val1.length === 0) {
            if(strengthText) { strengthText.textContent = "Enter password"; strengthText.style.color = "#9be7d8"; }
            isUserPasswordValid = false;
        } else if (score <= 1) {
            if(strengthBars[0]) strengthBars[0].style.background = '#ff5252';
            if(strengthText) { strengthText.textContent = "Weak"; strengthText.style.color = "#ff5252"; }
            isUserPasswordValid = true; 
        } else if (score === 2) {
            if(strengthBars[0]) strengthBars[0].style.background = '#ffc107';
            if(strengthBars[1]) strengthBars[1].style.background = '#ffc107';
            if(strengthText) { strengthText.textContent = "Fair"; strengthText.style.color = "#ffc107"; }
            isUserPasswordValid = true;
        } else if (score === 3) {
            if(strengthBars[0]) strengthBars[0].style.background = '#00e676';
            if(strengthBars[1]) strengthBars[1].style.background = '#00e676';
            if(strengthBars[2]) strengthBars[2].style.background = '#00e676';
            if(strengthText) { strengthText.textContent = "Good"; strengthText.style.color = "#00e676"; }
            isUserPasswordValid = true;
        } else {
            strengthBars.forEach(bar => { if(bar) bar.style.background = '#00ff84'; });
            if(strengthText) { strengthText.textContent = "Strong 💪"; strengthText.style.color = "#00ff84"; }
            isUserPasswordValid = true;
        }

        if (protectBtn) {
            protectBtn.disabled = !(isUserPasswordValid && currentFile !== null);
        }

        const hasOwnerPass = ownerPassword.value.length > 0;
        if(permPrint) permPrint.disabled = !hasOwnerPass;
        if(permCopy) permCopy.disabled = !hasOwnerPass;
        if(permModify) permModify.disabled = !hasOwnerPass;
    }

    if (userPassword) userPassword.addEventListener('input', validatePasswords);
    if (ownerPassword) ownerPassword.addEventListener('input', validatePasswords);
    validatePasswords(); 

    // Drag and Drop
    if (previewBox) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            previewBox.addEventListener(eventName, e => { e.preventDefault(); e.stopPropagation(); }, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            previewBox.addEventListener(eventName, () => previewBox.classList.add('drag-active'), false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            previewBox.addEventListener(eventName, () => previewBox.classList.remove('drag-active'), false);
        });
        previewBox.addEventListener('drop', e => {
            const files = e.dataTransfer.files;
            if (files && files.length > 0) handleFileSelect(files[0]);
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', e => { 
            const files = e.target.files;
            if (files && files.length > 0) handleFileSelect(files[0]); 
            fileInput.value = ''; 
        });
    }

    function handleFileSelect(file) {
        if (!file || (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf'))) {
            showToast('Please select a valid PDF file.', 'error');
            return;
        }
        
        currentFile = file;
        if(selectedFileName) selectedFileName.textContent = file.name;
        if(selectedFileSize) selectedFileSize.textContent = formatBytes(file.size);
        
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        if(fileNameInput) fileNameInput.value = `${baseName}_secured.pdf`;

        if(uploadArea) uploadArea.style.display = 'none';
        if(fileInfoBox) fileInfoBox.style.display = 'flex';
        
        if(outputBox) outputBox.style.display = 'none';
        if(finalActionArea) finalActionArea.style.display = 'none';
        
        encryptedPdfBlob = null;
        if (shareBtn) shareBtn.disabled = true; // Disable Share Button
        validatePasswords();
    }

    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            currentFile = null;
            
            if(uploadArea) uploadArea.style.display = 'block';
            if(fileInfoBox) fileInfoBox.style.display = 'none';
            
            if(outputBox) outputBox.style.display = 'none';
            if(finalActionArea) finalActionArea.style.display = 'none';

            if (shareBtn) shareBtn.disabled = true; // Disable Share Button
            validatePasswords();
        });
    }

    // WASM Worker Execution
    if (protectBtn) {
        protectBtn.addEventListener('click', async () => {
            if (!currentFile || !isUserPasswordValid) return;

            protectBtn.disabled = true;
            userPassword.disabled = true;
            ownerPassword.disabled = true;
            if (shareBtn) shareBtn.disabled = true; // Disable share during generation
            
            progressContainer.style.display = 'block';
            progressStatus.textContent = 'Initializing Security Engine...';
            progressBar.style.width = '10%';
            progressText.textContent = '10%';

            try {
                const arrayBuffer = await currentFile.arrayBuffer();
                
                // Initialize worker
                const worker = new Worker('../js/tools/protect-pdf/protect-worker.js');

                const workerTimeout = setTimeout(() => {
                    handleError("Engine initialization timed out. WASM files not found!");
                    worker.terminate();
                }, 15000);

                worker.onmessage = function(e) {
                    const data = e.data;
                    
                    if (data.type === 'READY') {
                        progressStatus.textContent = "Applying AES-256 Encryption...";
                        progressBar.style.width = "60%";
                        progressText.textContent = "60%";
                        
                        worker.postMessage({
                            type: 'ENCRYPT',
                            arrayBuffer: arrayBuffer,
                            userPassword: userPassword.value,
                            ownerPassword: ownerPassword.value.trim() !== "" ? ownerPassword.value : null,
                            permPrint: permPrint.checked,
                            permCopy: permCopy.checked,
                            permModify: permModify.checked
                        }, [arrayBuffer]);
                    } 
                    else if (data.type === 'SUCCESS') {
                        clearTimeout(workerTimeout);
                        progressBar.style.width = '100%';
                        progressText.textContent = '100%';
                        progressStatus.textContent = 'Encryption complete!';

                        encryptedPdfBlob = new Blob([data.encryptedBuffer], { type: 'application/pdf' });
                        worker.terminate();

                        setTimeout(() => {
                            progressContainer.style.display = 'none';
                            outputBox.style.display = 'block';
                            
                            outputBox.innerHTML = `
                                <div class="success-card">
                                    <div class="success-header">
                                        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                        PDF Secured Successfully!
                                    </div>
                                    <p style="color: #b2ebf2; font-size: 0.95rem; margin-top:10px;">Your document is now strictly locked with AES-256 and custom permissions.</p>
                                </div>
                            `;
                            
                            finalActionArea.style.display = 'block';
                            protectBtn.disabled = false;
                            userPassword.disabled = false;
                            ownerPassword.disabled = false;
                            protectBtn.innerHTML = "Update Security Settings";

                            if (shareBtn) shareBtn.disabled = false; // ENABLE SHARE BUTTON!
                            
                            if (window.confetti) {
                                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#00e676', '#ffffff'] });
                            }
                        }, 500);

                    } else if (data.type === 'ERROR') {
                        clearTimeout(workerTimeout);
                        handleError(data.message);
                        worker.terminate();
                    }
                };

                worker.onerror = function(err) {
                    clearTimeout(workerTimeout);
                    handleError("Failed to load backend engine. Worker Error.");
                    worker.terminate();
                };

            } catch (error) {
                handleError(error.message);
            }
        });
    }

    function handleError(msg) {
        progressContainer.style.display = 'none';
        protectBtn.disabled = false;
        userPassword.disabled = false;
        ownerPassword.disabled = false;
        showToast(msg || "An unexpected error occurred.", "error");
    }

    // Download File
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (!encryptedPdfBlob) return;

            let name = fileNameInput.value.trim() || "SArixa-Protected.pdf";
            if (!name.toLowerCase().endsWith(".pdf")) name += ".pdf";

            const url = URL.createObjectURL(encryptedPdfBlob);
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
    }

    // Share Button Logic (NATIVE FILE SHARING)
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            if (!encryptedPdfBlob) return alert("Please protect a PDF first!");
            
            let name = fileNameInput.value.trim() || "SArixa-Protected.pdf";
            if (!name.toLowerCase().endsWith(".pdf")) name += ".pdf";
            
            // Custom message specific to this tool
            const customMessage = "Here is the PDF document I locked with an AES-256 password using *SArixa*.";

            await sharePdfFile(encryptedPdfBlob, name, shareBtn, customMessage);
        });
    }
});