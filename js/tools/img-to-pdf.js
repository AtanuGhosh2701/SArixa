    // ==========================================
    // DOM ELEMENTS
    // ==========================================
    const fileInput = document.getElementById("fileInput");
    const fileLabelText = document.getElementById("fileLabelText");
    const previewBox = document.getElementById("previewBox");
    const outputBox = document.getElementById("outputBox");
    const previewBtn = document.getElementById("previewBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const qualitySelect = document.getElementById("qualitySelect");
    const bgMode = document.getElementById("bgMode");
    
    // TOGGLES & OPTIONS
    const bwToggle = document.getElementById("bwToggle");
    const pageNumToggle = document.getElementById("pageNumToggle");
    const pageNumPos = document.getElementById("pageNumPos");
    const pageNumExtraFields = document.querySelectorAll(".page-num-extra");
    
    // WATERMARK ELEMENTS
    const wmToggle = document.getElementById("wmToggle");
    const wmType = document.getElementById("wmType");
    const wmTextInput = document.getElementById("wmTextInput");
    const wmImageInput = document.getElementById("wmImageInput");
    const wmFileNameText = document.getElementById("wmFileNameText");
    const wmPos = document.getElementById("wmPos");
    const wmSize = document.getElementById("wmSize");
    const wmOpacity = document.getElementById("wmOpacity");
    const wmAngle = document.getElementById("wmAngle");
    const wmExtraFields = document.querySelectorAll(".wm-extra");

    // UI ELEMENTS FOR BACKGROUND COLOR PICKER
    const customColorSection = document.getElementById("customColorSection");
    const colorSwatchBtn = document.getElementById("colorSwatchBtn");
    const canvaColorPickerPanel = document.getElementById("canvaColorPickerPanel");
    const colorPopoverOverlay = document.getElementById("colorPopoverOverlay");
    const closePickerBtn = document.getElementById("closePickerBtn");
    const hexColorPreview = document.getElementById("hexColorPreview");
    const bgCustomHex = document.getElementById("bgCustomHex");
    const colorOkBtn = document.getElementById("colorOkBtn");

    // UI ELEMENTS FOR FONT COLOR PICKER
    const fontColorSwatchBtn = document.getElementById("fontColorSwatchBtn");
    const fontColorPickerPanel = document.getElementById("fontColorPickerPanel");
    const fontColorPopoverOverlay = document.getElementById("fontColorPopoverOverlay");
    const fontClosePickerBtn = document.getElementById("fontClosePickerBtn");
    const fontHexColorPreview = document.getElementById("fontHexColorPreview");
    const fontCustomHex = document.getElementById("fontCustomHex");
    const fontColorOkBtn = document.getElementById("fontColorOkBtn");

    // UI ELEMENTS FOR WATERMARK COLOR PICKER
    const wmColorSwatchBtn = document.getElementById("wmColorSwatchBtn");
    const wmColorPickerPanel = document.getElementById("wmColorPickerPanel");
    const wmColorPopoverOverlay = document.getElementById("wmColorPopoverOverlay");
    const wmClosePickerBtn = document.getElementById("wmClosePickerBtn");
    const wmHexColorPreview = document.getElementById("wmHexColorPreview");
    const wmCustomHex = document.getElementById("wmCustomHex");
    const wmColorOkBtn = document.getElementById("wmColorOkBtn");

    const generateBtn = document.getElementById("generateBtn");
    const pageSize = document.getElementById("pageSize");
    const orientation = document.getElementById("orientation");
    const marginInput = document.getElementById("marginInput");
    const fitMode = document.getElementById("fitMode");
    const fileNameInput = document.getElementById("fileNameInput");
    const loader = document.getElementById("loader");

    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");

    // ==========================================
    // STATE VARIABLES
    // ==========================================
    let images = [];
    let pdfBlob = null;
    let isPreviewOpen = false;
    
    // Watermark Image Setup
    let wmOriginalImageObj = null;

    // Show/Hide Page Number Extra Options
    pageNumToggle.addEventListener('change', (e) => {
      pageNumExtraFields.forEach(el => {
        el.style.display = e.target.checked ? "block" : "none";
      });
    });

    // Show/Hide Watermark Extra Options
    wmToggle.addEventListener('change', (e) => {
      const show = e.target.checked;
      wmExtraFields.forEach(el => el.style.display = show ? "block" : "none");
      if (show) updateWmTypeFields();
    });

    // Switch between Text/Image Watermark options
    wmType.addEventListener('change', updateWmTypeFields);

    function updateWmTypeFields() {
      const isText = wmType.value === 'text';
      document.querySelectorAll('.wm-text-only').forEach(el => el.style.display = isText ? 'block' : 'none');
      document.querySelectorAll('.wm-image-only').forEach(el => el.style.display = !isText ? 'block' : 'none');
    }

    // Sliders value updates
    wmOpacity.addEventListener('input', (e) => { document.getElementById("wmOpacityVal").innerText = e.target.value; });
    wmSize.addEventListener('input', (e) => { document.getElementById("wmSizeVal").innerText = e.target.value; });

    // Load original watermark image without modifying yet (allows dynamic B&W toggling later)
    wmImageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        wmFileNameText.innerText = file.name;
        const img = new Image();
        img.onload = () => {
          wmOriginalImageObj = img;
        };
        img.src = URL.createObjectURL(file);
      }
    });

    // ==========================================
    // 🎨 COLOR PICKERS SETUP
    // ==========================================
    
    // 1. Background Color
    const colorPicker = new iro.ColorPicker("#iroPickerContainer", { width: 220, color: "#ffffff", borderWidth: 1, borderColor: "#00e676", layout: [ { component: iro.ui.Box }, { component: iro.ui.Slider, options: { sliderType: 'hue' } } ] });
    bgMode.onchange = () => {
      if (bgMode.value === "custom") customColorSection.style.display = "block";
      else { customColorSection.style.display = "none"; closeColorPopup(); }
    };
    colorSwatchBtn.onclick = (e) => { e.stopPropagation(); canvaColorPickerPanel.style.display = "flex"; colorPopoverOverlay.style.display = window.innerWidth <= 768 ? "block" : "none"; };
    function closeColorPopup() { canvaColorPickerPanel.style.display = "none"; colorPopoverOverlay.style.display = "none"; }
    closePickerBtn.onclick = closeColorPopup; colorPopoverOverlay.onclick = closeColorPopup; colorOkBtn.onclick = closeColorPopup; 
    colorPicker.on('color:change', function(color) { const hex = color.hexString.toUpperCase(); bgCustomHex.value = hex; hexColorPreview.style.backgroundColor = hex; colorSwatchBtn.style.backgroundColor = hex; });
    bgCustomHex.addEventListener('input', function(e) { let val = e.target.value; if (!val.startsWith("#")) val = "#" + val; if(val.match(/^#[0-9A-Fa-f]{6}$/i)) { colorPicker.color.hexString = val; hexColorPreview.style.backgroundColor = val; colorSwatchBtn.style.backgroundColor = val; } });
    bgCustomHex.addEventListener('blur', function(e) { let val = e.target.value; if (!val.startsWith("#")) val = "#" + val; e.target.value = val.toUpperCase(); });

    // 2. Font Color
    const fontColorPicker = new iro.ColorPicker("#fontIroPickerContainer", { width: 220, color: "#000000", borderWidth: 1, borderColor: "#00e676", layout: [ { component: iro.ui.Box }, { component: iro.ui.Slider, options: { sliderType: 'hue' } } ] });
    fontColorSwatchBtn.onclick = (e) => { e.stopPropagation(); fontColorPickerPanel.style.display = "flex"; fontColorPopoverOverlay.style.display = window.innerWidth <= 768 ? "block" : "none"; };
    function closeFontColorPopup() { fontColorPickerPanel.style.display = "none"; fontColorPopoverOverlay.style.display = "none"; }
    fontClosePickerBtn.onclick = closeFontColorPopup; fontColorPopoverOverlay.onclick = closeFontColorPopup; fontColorOkBtn.onclick = closeFontColorPopup; 
    fontColorPicker.on('color:change', function(color) { const hex = color.hexString.toUpperCase(); fontCustomHex.value = hex; fontHexColorPreview.style.backgroundColor = hex; fontColorSwatchBtn.style.backgroundColor = hex; });
    fontCustomHex.addEventListener('input', function(e) { let val = e.target.value; if (!val.startsWith("#")) val = "#" + val; if(val.match(/^#[0-9A-Fa-f]{6}$/i)) { fontColorPicker.color.hexString = val; fontHexColorPreview.style.backgroundColor = val; fontColorSwatchBtn.style.backgroundColor = val; } });
    fontCustomHex.addEventListener('blur', function(e) { let val = e.target.value; if (!val.startsWith("#")) val = "#" + val; e.target.value = val.toUpperCase(); });

    // 3. Watermark Color
    const wmColorPicker = new iro.ColorPicker("#wmIroPickerContainer", { width: 220, color: "#808080", borderWidth: 1, borderColor: "#00e676", layout: [ { component: iro.ui.Box }, { component: iro.ui.Slider, options: { sliderType: 'hue' } } ] });
    wmColorSwatchBtn.onclick = (e) => { e.stopPropagation(); wmColorPickerPanel.style.display = "flex"; wmColorPopoverOverlay.style.display = window.innerWidth <= 768 ? "block" : "none"; };
    function closeWmColorPopup() { wmColorPickerPanel.style.display = "none"; wmColorPopoverOverlay.style.display = "none"; }
    wmClosePickerBtn.onclick = closeWmColorPopup; wmColorPopoverOverlay.onclick = closeWmColorPopup; wmColorOkBtn.onclick = closeWmColorPopup; 
    wmColorPicker.on('color:change', function(color) { const hex = color.hexString.toUpperCase(); wmCustomHex.value = hex; wmHexColorPreview.style.backgroundColor = hex; wmColorSwatchBtn.style.backgroundColor = hex; });
    wmCustomHex.addEventListener('input', function(e) { let val = e.target.value; if (!val.startsWith("#")) val = "#" + val; if(val.match(/^#[0-9A-Fa-f]{6}$/i)) { wmColorPicker.color.hexString = val; wmHexColorPreview.style.backgroundColor = val; wmColorSwatchBtn.style.backgroundColor = val; } });
    wmCustomHex.addEventListener('blur', function(e) { let val = e.target.value; if (!val.startsWith("#")) val = "#" + val; e.target.value = val.toUpperCase(); });

    // Close popups on outside click
    document.addEventListener("click", (e) => {
      if (bgMode.value === "custom" && canvaColorPickerPanel.style.display === "flex") { if (!canvaColorPickerPanel.contains(e.target) && e.target !== colorSwatchBtn) closeColorPopup(); }
      if (fontColorPickerPanel.style.display === "flex") { if (!fontColorPickerPanel.contains(e.target) && e.target !== fontColorSwatchBtn) closeFontColorPopup(); }
      if (wmColorPickerPanel.style.display === "flex") { if (!wmColorPickerPanel.contains(e.target) && e.target !== wmColorSwatchBtn) closeWmColorPopup(); }
    });

    // ==========================================
    // EVENT LISTENERS & INITIALIZATION
    // ==========================================
    const sortable = new Sortable(previewBox, {
      animation: 200,
      scroll: true,
      forceFallback: true,
      scrollSensitivity: 60,
      scrollSpeed: 15,
      fallbackOnBody: true,
      delay: 200,              
      delayOnTouchOnly: true,  
      touchStartThreshold: 5,  
      onEnd: function(evt) {
        const moved = images.splice(evt.oldIndex, 1)[0];
        images.splice(evt.newIndex, 0, moved);
        renderPreview();
      }
    });

    fileInput.onchange = (e) => {
      [...e.target.files].forEach(file => {
        images.push({ file, url: URL.createObjectURL(file), rotation: 0 });
      });
      renderPreview();
      fileLabelText.innerText = "Add More Files";
      fileInput.value = "";
    };

    // ==========================================
    // CORE FUNCTIONS
    // ==========================================
    function renderPreview() {
      previewBox.innerHTML = "";
      
      if (!images.length) {
        previewBox.innerHTML = `
          <div class="preview-empty">No file selected</div>
          <div class="preview-advice">Select file or Drag and Drop file here</div>
        `;
        fileLabelText.innerText = "Select File";
        return;
      }

      images.forEach((img, index) => {
        const card = document.createElement("div");
        card.className = "image-card";

        card.innerHTML = `
          <div class="page-badge">Page ${index + 1}</div>
          <img class="img-thumb" src="${img.url}" style="transform:rotate(${img.rotation}deg)">
          <div class="image-overlay">
            <button class="overlay-btn zoom" title="Zoom"><svg viewBox="0 0 24 24" fill="none" stroke="#003c2f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg></button>
            <button class="overlay-btn crop" title="Crop"><svg viewBox="0 0 24 24" fill="none" stroke="#003c2f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"></path><path d="M18 22V8a2 2 0 0 0-2-2H2"></path></svg></button>
            <button class="overlay-btn rotate" title="Rotate"><svg viewBox="0 0 24 24" fill="none" stroke="#003c2f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg></button>
            <button class="overlay-btn delete" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="#003c2f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
          </div>
          <div class="file-name">${img.file.name}</div>
          <div class="page-number">Page ${index + 1}</div>
        `;

        card.querySelector(".zoom").onclick = () => openZoom(img);
        card.querySelector(".crop").onclick = () => openCropper(img);
        card.querySelector(".rotate").onclick = () => { img.rotation += 90; renderPreview(); };
        card.querySelector(".delete").onclick = () => { URL.revokeObjectURL(images[index].url); images.splice(index, 1); renderPreview(); };
        
        previewBox.appendChild(card);
      });
    }

    function openZoom(img) {
      const overlay = document.createElement("div");
      overlay.className = "zoom-overlay";
      overlay.innerHTML = `<button class="zoom-close">✕</button><img src="${img.url}" style="transform:rotate(${img.rotation}deg)">`;
      overlay.querySelector(".zoom-close").onclick = () => overlay.remove();
      document.body.appendChild(overlay);
    }

    function openCropper(img) {
      const modal = document.createElement("div");
      modal.className = "crop-modal";
      modal.innerHTML = `<div class="crop-area"><img id="cropImage"></div><div class="crop-actions"><button class="crop-btn cancel-btn">Cancel</button><button class="crop-btn save-btn">Save Crop</button></div>`;
      document.body.appendChild(modal);
      
      const imageElement = modal.querySelector("#cropImage");
      const tempImg = new Image();
      tempImg.src = img.url;
      
      tempImg.onload = () => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const isSideways = (img.rotation / 90) % 2 !== 0;  
        const maxDimension = 1600;
        const scale = Math.min(1, maxDimension / Math.max(tempImg.width, tempImg.height));

        tempCanvas.width = (isSideways ? tempImg.height : tempImg.width) * scale;
        tempCanvas.height = (isSideways ? tempImg.width : tempImg.height) * scale;

        tempCtx.scale(scale, scale);
        tempCtx.translate(tempCanvas.width / (2 * scale), tempCanvas.height / (2 * scale));
        tempCtx.rotate((img.rotation * Math.PI) / 180);
        tempCtx.drawImage(tempImg, -tempImg.width / 2, -tempImg.height / 2);

        imageElement.src = tempCanvas.toDataURL("image/jpeg", 0.85);

        const cropper = new Cropper(imageElement, { viewMode: 1, autoCropArea: 1, background: false, responsive: true, checkOrientation: false });

        modal.querySelector(".save-btn").onclick = () => {
          const croppedCanvas = cropper.getCroppedCanvas({ imageSmoothingEnabled: true, imageSmoothingQuality: 'medium' });
          croppedCanvas.toBlob((blob) => { URL.revokeObjectURL(img.url); img.url = URL.createObjectURL(blob); img.rotation = 0; cropper.destroy(); modal.remove(); renderPreview(); }, "image/jpeg", 0.9);
        };
      };
      
      modal.querySelector(".cancel-btn").onclick = () => modal.remove();
    }

    // ==========================================
    // COMPRESS IMAGE LOGIC & BLACK AND WHITE
    // ==========================================
    function compressImage(imgObj, quality) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          
          const MAX_RESOLUTION = 1200;
          let targetWidth = img.width;
          let targetHeight = img.height;

          if (targetWidth > MAX_RESOLUTION || targetHeight > MAX_RESOLUTION) {
            const scaleFactor = MAX_RESOLUTION / Math.max(targetWidth, targetHeight);
            targetWidth = Math.round(targetWidth * scaleFactor);
            targetHeight = Math.round(targetHeight * scaleFactor);
          }

          const isSideways = (imgObj.rotation / 90) % 2 !== 0;
          canvas.width = isSideways ? targetHeight : targetWidth;
          canvas.height = isSideways ? targetWidth : targetHeight;
          
          let bgColor = (bgMode.value === "black") ? "#000000" : (bgMode.value === "custom" ? colorPicker.color.hexString : "#ffffff");
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((imgObj.rotation * Math.PI) / 180);
          
          if (bwToggle.checked) {
            ctx.filter = 'grayscale(100%)';
          }

          ctx.drawImage(img, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight);
          ctx.filter = 'none';

          resolve({
            data: canvas.toDataURL("image/jpeg", quality),
            width: canvas.width,
            height: canvas.height
          });
        };
        img.src = imgObj.url;
      });
    }

    // ==========================================
    // PDF GENERATION (WEB WORKER IMPLEMENTATION)
    // ==========================================
    generateBtn.onclick = async () => {
      if (!images.length) return alert("Select images first");
      
      // Added Validation for missing inputs when watermark is ON
      if (wmToggle.checked) {
        if (wmType.value === 'image' && !wmOriginalImageObj) {
            return alert("Please select a Logo Image for Watermark!");
        }
        if (wmType.value === 'text' && !wmTextInput.value.trim()) {
            return alert("Please enter text for the Watermark!");
        }
      }
      
      generateBtn.disabled = true;
      loader.style.display = "inline-block";
      outputBox.innerHTML = "Initializing Engine...";
      downloadBtn.disabled = true;
      previewBtn.disabled = true;

      progressContainer.style.display = "block";
      progressBar.style.width = "0%";
      progressText.innerText = "0%";

      if (isPreviewOpen) {
        outputBox.innerHTML = "Initializing Engine..."; 
        isPreviewOpen = false;
        previewBtn.innerText = "Preview PDF";
      }

      const formatSize = pageSize.value;
      const quality = parseFloat(qualitySelect.value);
      const orientationVal = orientation.value;
      const margin = +marginInput.value;
      const fit = fitMode.value;
      const isBW = bwToggle.checked;
      
      // Page Number Data
      const addPageNumbers = pageNumToggle.checked;
      const pageNumberPosition = pageNumPos.value;
      const pageNumberColorHex = fontColorPicker.color.hexString;
      
      // Watermark Data
      const addWatermark = wmToggle.checked;
      const wmTypeVal = wmType.value;
      const wmTextVal = wmTextInput.value.trim();
      const wmPosVal = wmPos.value;
      const wmSizeVal = wmSize.value / 100;    // Convert slider 5-100 to 0.05 - 1.0
      const wmOpacityVal = wmOpacity.value / 100; // Convert slider 1-100 to 0.01 - 1.0
      const wmAngleVal = wmAngle.value;
      const wmColorHexVal = wmColorPicker.color.hexString;

      const pdfBgColorHex = (bgMode.value === "black") ? "#000000" : (bgMode.value === "custom" ? colorPicker.color.hexString : "#ffffff");

      // Prepare Image Watermark Base64 (with B&W filter if needed) before passing to Worker
      let finalWmImageBase64 = null;
      let finalWmImageAspect = 1;
      
      if (addWatermark && wmTypeVal === 'image' && wmOriginalImageObj) {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          let tw = wmOriginalImageObj.width;
          let th = wmOriginalImageObj.height;
          
          const MAX_WM_SIZE = 800; // Downscale large logos to prevent low-end device memory crash
          if (tw > MAX_WM_SIZE || th > MAX_WM_SIZE) {
            const scale = MAX_WM_SIZE / Math.max(tw, th);
            tw *= scale;
            th *= scale;
          }
          canvas.width = tw;
          canvas.height = th;
          
          if (isBW) {
            ctx.filter = 'grayscale(100%)';
          }
          
          ctx.drawImage(wmOriginalImageObj, 0, 0, tw, th);
          ctx.filter = 'none';
          
          finalWmImageBase64 = canvas.toDataURL("image/png");
          finalWmImageAspect = tw / th;
      }

      try {
        const workerCode = `
          importScripts("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
          
          let pdf = null;
          
          self.onmessage = function(e) {
            const { action, payload } = e.data;
            
            try {
              if (action === "addPage") {
                const { 
                  data, imgWidth, imgHeight, isFirst, formatSize, orientationVal, margin, fit, index, bgColorHex, 
                  isBW, addPageNumbers, fontColorHex, fontPos, 
                  addWatermark, wmType, wmText, wmImage, wmImageAspect, wmPos, wmSize, wmOpacity, wmAngle, wmColorHex 
                } = payload;
                const { jsPDF } = self.jspdf;
                
                let pw, ph;
                let x = 0, y = 0, w = imgWidth, h = imgHeight;

                if (formatSize === "original") {
                  pw = imgWidth + (margin * 2);
                  ph = imgHeight + (margin * 2);
                  const imgOrientation = pw > ph ? "landscape" : "portrait";
                  if (isFirst) pdf = new jsPDF({ format: [pw, ph], orientation: imgOrientation, unit: "pt" });
                  else pdf.addPage([pw, ph], imgOrientation);
                  
                  x = margin;
                  y = margin;
                  w = imgWidth;
                  h = imgHeight;
                } else {
                  if (isFirst) pdf = new jsPDF({ format: formatSize, orientation: orientationVal, unit: "pt" });
                  else pdf.addPage(formatSize, orientationVal);
                  
                  pw = pdf.internal.pageSize.getWidth();
                  ph = pdf.internal.pageSize.getHeight();
                  
                  w = pw - margin * 2;
                  h = w * (imgHeight / imgWidth);
                  
                  if (fit === "height") {
                    h = ph - margin * 2;
                    w = h * (imgWidth / imgHeight);
                  } else if (fit === "auto") {
                    const imgAspect = imgWidth / imgHeight;
                    const pageAspect = (pw - margin * 2) / (ph - margin * 2);
                    if (imgAspect > pageAspect) {
                      w = pw - margin * 2;
                      h = w / imgAspect;
                    } else {
                      h = ph - margin * 2;
                      w = h * imgAspect;
                    }
                  }
                  x = (pw - w) / 2;
                  y = (ph - h) / 2;
                }

                pdf.setFillColor(bgColorHex);
                pdf.rect(0, 0, pw, ph, "F");
                pdf.addImage(data, "JPEG", x, y, w, h);

                // ================= Add Watermark Logic =================
                if (addWatermark) {
                  pdf.saveGraphicsState();
                  try {
                    pdf.setGState(new self.jspdf.GState({opacity: parseFloat(wmOpacity)}));
                  } catch (e) {
                    console.log("GState not supported in this context");
                  }

                  let wmPad = Math.max(20, margin);

                  if (wmType === 'text' && wmText) {
                    
                    let finalWmColor = wmColorHex;
                    if (isBW) {
                        // Force grayscale conversion of hex color if B&W is ON
                        let r = parseInt(finalWmColor.substr(1,2), 16);
                        let g = parseInt(finalWmColor.substr(3,2), 16);
                        let b = parseInt(finalWmColor.substr(5,2), 16);
                        let lum = Math.round(0.299*r + 0.587*g + 0.114*b);
                        let hexLum = lum.toString(16).padStart(2, '0');
                        finalWmColor = "#" + hexLum + hexLum + hexLum;
                    }
                    pdf.setTextColor(finalWmColor);
                    
                    // Anti-Clipping Size Calculation for Text
                    let safeW = pw - (wmPad * 2);
                    let safeH = ph - (wmPad * 2);
                    let targetW = safeW * wmSize;
                    
                    // Prevent giant font sizes pushing out of bounds
                    let wmFontSize = targetW / Math.max(1, wmText.length * 0.45); 
                    wmFontSize = Math.min(wmFontSize, safeH * 0.8);
                    pdf.setFontSize(wmFontSize);
                    
                    let posX, posY;
                    let alignVal = "center";

                    switch(wmPos) {
                      case "center": posX = pw/2; posY = ph/2; break;
                      case "bottom-center": posX = pw/2; posY = ph - wmPad - (wmFontSize/3); break;
                      case "bottom-right": posX = pw - wmPad; posY = ph - wmPad - (wmFontSize/3); alignVal = "right"; break;
                      case "bottom-left": posX = wmPad; posY = ph - wmPad - (wmFontSize/3); alignVal = "left"; break;
                      case "top-center": posX = pw/2; posY = wmPad + (wmFontSize/1.5); break;
                      case "top-right": posX = pw - wmPad; posY = wmPad + (wmFontSize/1.5); alignVal = "right"; break;
                      case "top-left": posX = wmPad; posY = wmPad + (wmFontSize/1.5); alignVal = "left"; break;
                    }

                    pdf.text(wmText, posX, posY, { align: alignVal, baseline: "middle", angle: parseFloat(wmAngle) });

                  } else if (wmType === 'image' && wmImage) {
                    
                    // Proportional Size Calculation for Image
                    let maxW = (pw - wmPad * 2) * wmSize;
                    let maxH = (ph - wmPad * 2) * wmSize;
                    
                    let imgW = maxW;
                    let imgH = imgW / wmImageAspect;
                    if (imgH > maxH) {
                       imgH = maxH;
                       imgW = imgH * wmImageAspect;
                    }

                    let posX, posY;
                    switch(wmPos) {
                      case "center": posX = (pw - imgW)/2; posY = (ph - imgH)/2; break;
                      case "bottom-center": posX = (pw - imgW)/2; posY = ph - wmPad - imgH; break;
                      case "bottom-right": posX = pw - wmPad - imgW; posY = ph - wmPad - imgH; break;
                      case "bottom-left": posX = wmPad; posY = ph - wmPad - imgH; break;
                      case "top-center": posX = (pw - imgW)/2; posY = wmPad; break;
                      case "top-right": posX = pw - wmPad - imgW; posY = wmPad; break;
                      case "top-left": posX = wmPad; posY = wmPad; break;
                    }
                    
                    pdf.addImage(wmImage, 'PNG', posX, posY, imgW, imgH);
                  }
                  
                  pdf.restoreGraphicsState();
                }

                // ================= Add Page Number Logic =================
                if (addPageNumbers) {
                  pdf.setFontSize(12);
                  pdf.setTextColor(fontColorHex); 

                  let xPos, yPos, alignVal;
                  let pad = Math.max(15, margin);

                  switch(fontPos) {
                    case "bottom-center": xPos = pw / 2; yPos = ph - pad; alignVal = "center"; break;
                    case "bottom-right": xPos = pw - pad; yPos = ph - pad; alignVal = "right"; break;
                    case "bottom-left": xPos = pad; yPos = ph - pad; alignVal = "left"; break;
                    case "top-center": xPos = pw / 2; yPos = pad + 10; alignVal = "center"; break;
                    case "top-right": xPos = pw - pad; yPos = pad + 10; alignVal = "right"; break;
                    case "top-left": xPos = pad; yPos = pad + 10; alignVal = "left"; break;
                  }
                  
                  pdf.text("Page - " + (index + 1), xPos, yPos, { align: alignVal });
                }

                self.postMessage({ type: "pageAdded", index: index });

              } else if (action === "finish") {
                const blob = pdf.output("blob");
                self.postMessage({ type: "done", blob: blob });
                pdf = null;
              }
            } catch (error) {
              self.postMessage({ type: "error", error: error.message });
            }
          };
        `;

        const workerBlob = new Blob([workerCode], { type: "application/javascript" });
        const workerUrl = URL.createObjectURL(workerBlob);
        const pdfWorker = new Worker(workerUrl);

        const addPageToPDF = (payload) => {
            return new Promise((resolve, reject) => {
                const handler = (e) => {
                    if (e.data.type === "pageAdded") {
                        pdfWorker.removeEventListener("message", handler);
                        resolve();
                    } else if (e.data.type === "error") {
                        pdfWorker.removeEventListener("message", handler);
                        reject(new Error(e.data.error));
                    }
                };
                pdfWorker.addEventListener("message", handler);
                pdfWorker.postMessage({ action: "addPage", payload });
            });
        };

        const finishPDF = () => {
            return new Promise((resolve, reject) => {
                const handler = (e) => {
                    if (e.data.type === "done") {
                        pdfWorker.removeEventListener("message", handler);
                        resolve(e.data.blob);
                    } else if (e.data.type === "error") {
                        pdfWorker.removeEventListener("message", handler);
                        reject(new Error(e.data.error));
                    }
                };
                pdfWorker.addEventListener("message", handler);
                pdfWorker.postMessage({ action: "finish" });
            });
        };

        for (let i = 0; i < images.length; i++) {
          outputBox.innerHTML = `Processing Image ${i + 1} of ${images.length}...`;
          const { data, width, height } = await compressImage(images[i], quality);
          
          await addPageToPDF({
              data: data,
              imgWidth: width,
              imgHeight: height,
              isFirst: (i === 0),
              formatSize: formatSize,
              orientationVal: orientationVal,
              margin: margin,
              fit: fit,
              index: i,
              bgColorHex: pdfBgColorHex,
              isBW: isBW,
              addPageNumbers: addPageNumbers,
              fontColorHex: pageNumberColorHex,
              fontPos: pageNumberPosition,
              addWatermark: addWatermark,
              wmType: wmTypeVal,
              wmText: wmTextVal,
              wmImage: finalWmImageBase64,
              wmImageAspect: finalWmImageAspect,
              wmPos: wmPosVal,
              wmSize: wmSizeVal,
              wmOpacity: wmOpacityVal,
              wmAngle: wmAngleVal,
              wmColorHex: wmColorHexVal
          });

          const percentDone = Math.round(((i + 1) / images.length) * 100);
          progressBar.style.width = percentDone + "%";
          progressText.innerText = percentDone + "%";

          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        outputBox.innerHTML = "Finalizing PDF...";
        pdfBlob = await finishPDF();
        
        pdfWorker.terminate();
        URL.revokeObjectURL(workerUrl);
        
        progressBar.style.width = "100%";
        progressText.innerText = "100%";
        
        outputBox.innerHTML = "<span style='color:#00e676'>PDF Ready ✔</span>";
        downloadBtn.disabled = false;
        previewBtn.disabled = false;
        
      } catch (err) {
        console.error(err);
        outputBox.innerHTML = `<span style='color:#ff5252'>Error: ${err.message || "Memory Error! Try lower quality."}</span>`;
        progressContainer.style.display = "none";
      } finally {
        generateBtn.disabled = false;
        loader.style.display = "none";
      }
    };

    // ==========================================
    // 🚀 UNIVERSAL PDF.JS PREVIEW LOGIC
    // ==========================================
    previewBtn.onclick = async () => {
      if (!pdfBlob) return alert("Generate PDF first");
      
      if (isPreviewOpen) {
        outputBox.innerHTML = "<span style='color:#00e676'>PDF Ready ✔</span>"; 
        isPreviewOpen = false;
        previewBtn.innerText = "Preview PDF";
        return;
      }
      
      outputBox.innerHTML = "";
      
      const loaderDiv = document.createElement("div");
      loaderDiv.style.width = "100%";
      loaderDiv.style.maxWidth = "500px";
      loaderDiv.style.margin = "0 auto";
      loaderDiv.innerHTML = `
        <div class="progress-info" style="margin-top: 10px;">
          <span>Rendering Preview...</span>
          <span id="previewProgressText">0%</span>
        </div>
        <div class="progress-track">
          <div id="previewProgressBar" class="progress-bar"></div>
        </div>
      `;
      outputBox.appendChild(loaderDiv);

      isPreviewOpen = true;
      previewBtn.innerText = "Close Preview";
      
      try {
        await new Promise(r => setTimeout(r, 50));

        const arrayBuffer = await pdfBlob.arrayBuffer();
        const typedArray = new Uint8Array(arrayBuffer);

        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const loadingTask = pdfjsLib.getDocument({ data: typedArray });
        const pdf = await loadingTask.promise;

        if (!isPreviewOpen) return;

        const container = document.createElement("div");
        container.id = "pdfViewerContainer";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "15px";
        container.style.maxHeight = "65vh";
        container.style.overflowY = "auto";
        container.style.alignItems = "center";
        container.style.padding = "10px";
        container.style.background = "rgba(0, 0, 0, 0.2)";
        container.style.borderRadius = "12px";

        const outputScale = window.devicePixelRatio || 1;

        for (let i = 1; i <= pdf.numPages; i++) {
          if (!isPreviewOpen) break; 

          const page = await pdf.getPage(i);
          
          const unscaledViewport = page.getViewport({ scale: 1 });
          const containerWidth = outputBox.clientWidth > 0 ? outputBox.clientWidth - 30 : window.innerWidth - 60;
          const scale = containerWidth / unscaledViewport.width;
          const viewport = page.getViewport({ scale: Math.min(scale, 1.5) }); 

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
          
          container.appendChild(canvas);

          const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

          const renderContext = {
            canvasContext: ctx,
            transform: transform,
            viewport: viewport
          };

          await page.render(renderContext).promise;
          
          const percentDone = Math.round((i / pdf.numPages) * 100);
          const pBar = document.getElementById("previewProgressBar");
          const pText = document.getElementById("previewProgressText");
          if (pBar && pText) {
            pBar.style.width = percentDone + "%";
            pText.innerText = percentDone + "%";
          }

          await new Promise(requestAnimationFrame);
        }

        if (isPreviewOpen) {
          await new Promise(r => setTimeout(r, 200));
          outputBox.innerHTML = "";
          outputBox.appendChild(container);
        }

      } catch (err) {
        console.error(err);
        if (isPreviewOpen) {
          outputBox.innerHTML = "<span style='color:#ff5252'>Preview failed. Please use Download button instead.</span>";
          isPreviewOpen = false;
          previewBtn.innerText = "Preview PDF";
        }
      }
    };

    downloadBtn.onclick = () => {
      let name = fileNameInput.value.trim() || "converted";
      if (!name.toLowerCase().endsWith(".pdf")) name += ".pdf";
      
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      
      setTimeout(() => URL.revokeObjectURL(url), 200);
    };

    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
      previewBox.addEventListener(eventName, e => {
        if (window.matchMedia("(pointer: coarse)").matches) return;
        e.preventDefault();
        e.stopPropagation();
      });
    });

    previewBox.addEventListener("drop", (e) => {
      if (window.matchMedia("(pointer: coarse)").matches) return;
      
      const droppedFiles = [...e.dataTransfer.files].filter(file => file.type.startsWith("image/"));
      if (!droppedFiles.length) return;
      
      droppedFiles.forEach(file => {
        images.push({ file, url: URL.createObjectURL(file), rotation: 0 });
      });
      
      renderPreview();
      fileLabelText.innerText = "Add More Files";
    });
    
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
        if (scrollTop > lastScrollTop && scrollTop > 80) {
            navbar.classList.add('hidden-nav');
        } else {
            navbar.classList.remove('hidden-nav');
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });