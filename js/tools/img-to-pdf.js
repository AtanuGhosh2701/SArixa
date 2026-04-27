import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// ==========================================
// DOM ELEMENTS
// ==========================================
const fileInput = document.getElementById("fileInput");
const cameraInput = document.getElementById("cameraInput");
const fileLabelText = document.getElementById("fileLabelText");
const previewBox = document.getElementById("previewBox");
const outputBox = document.getElementById("outputBox");
const previewBtn = document.getElementById("previewBtn");
const downloadBtn = document.getElementById("downloadBtn");
const qualitySelect = document.getElementById("qualitySelect");
const targetSizeContainer = document.getElementById("targetSizeContainer");
const targetSizeInput = document.getElementById("targetSizeInput");
const bgMode = document.getElementById("bgMode");

// AUTO-FILL ELEMENTS
const pageSizeSelect = document.getElementById("pageSize");
const autoFillContainer = document.getElementById("autoFillContainer");
const autoFillToggle = document.getElementById("autoFillToggle");

const batchToggle = document.getElementById("batchToggle");

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

// FONT AND FORMATTING ELEMENTS
const fontDropdown = document.getElementById("fontDropdown");
const selectedFontText = document.getElementById("selectedFontText");
const wmFontList = document.getElementById("wmFontList");
const formatBtns = document.querySelectorAll(".format-btn");

// UI ELEMENTS FOR COLOR PICKERS
const customColorSection = document.getElementById("customColorSection");
const colorSwatchBtn = document.getElementById("colorSwatchBtn");
const canvaColorPickerPanel = document.getElementById("canvaColorPickerPanel");
const colorPopoverOverlay = document.getElementById("colorPopoverOverlay");
const closePickerBtn = document.getElementById("closePickerBtn");
const hexColorPreview = document.getElementById("hexColorPreview");
const bgCustomHex = document.getElementById("bgCustomHex");
const colorOkBtn = document.getElementById("colorOkBtn");

const fontColorSwatchBtn = document.getElementById("fontColorSwatchBtn");
const fontColorPickerPanel = document.getElementById("fontColorPickerPanel");
const fontColorPopoverOverlay = document.getElementById("fontColorPopoverOverlay");
const fontClosePickerBtn = document.getElementById("fontClosePickerBtn");
const fontHexColorPreview = document.getElementById("fontHexColorPreview");
const fontCustomHex = document.getElementById("fontCustomHex");
const fontColorOkBtn = document.getElementById("fontColorOkBtn");

const wmColorSwatchBtn = document.getElementById("wmColorSwatchBtn");
const wmColorPickerPanel = document.getElementById("wmColorPickerPanel");
const wmColorPopoverOverlay = document.getElementById("wmColorPopoverOverlay");
const wmClosePickerBtn = document.getElementById("wmClosePickerBtn");
const wmHexColorPreview = document.getElementById("wmHexColorPreview");
const wmCustomHex = document.getElementById("wmCustomHex");
const wmColorOkBtn = document.getElementById("wmColorOkBtn");

const generateBtn = document.getElementById("generateBtn");
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

// Flags for one-time actions per session
let hasShownDownloadToast = false; 

let wmOriginalImageObj = null;
let selectedFont = "helvetica";
let wmFormats = { bold: false, italic: false };

// ==========================================
// BOOKMARK BUTTON LOGIC
// ==========================================
const bookmarkBtn = document.getElementById("bookmark-btn");
const toastMsg = document.getElementById("toast-msg");

if (bookmarkBtn) {
  bookmarkBtn.addEventListener('click', () => {
    toastMsg.innerText = "Feature Coming Soon! 🚀";
    toastMsg.classList.add("show");
    setTimeout(() => {
      toastMsg.classList.remove("show");
    }, 3000);
  });
}

// ==========================================
// EVENT LISTENERS
// ==========================================

// Handle Show/Hide for Auto-Fill Page
pageSizeSelect.addEventListener('change', (e) => {
  if (e.target.value === 'original') {
    autoFillContainer.style.display = 'none';
    autoFillToggle.checked = false;
  } else {
    autoFillContainer.style.display = 'block';
  }
});

pageNumToggle.addEventListener('change', (e) => {
  pageNumExtraFields.forEach(el => el.style.display = e.target.checked ? "block" : "none");
});

qualitySelect.addEventListener('change', (e) => {
  targetSizeContainer.style.display = e.target.value === 'target' ? 'block' : 'none';
});

wmToggle.addEventListener('change', (e) => {
  const show = e.target.checked;
  wmExtraFields.forEach(el => el.style.display = show ? "block" : "none");
  if (show) updateWmTypeFields();
});

wmType.addEventListener('change', updateWmTypeFields);

function updateWmTypeFields() {
  const isText = wmType.value === 'text';
  document.querySelectorAll('.wm-text-only').forEach(el => el.style.display = isText ? 'block' : 'none');
  document.querySelectorAll('.wm-image-only').forEach(el => el.style.display = !isText ? 'block' : 'none');
}

wmOpacity.addEventListener('input', (e) => { document.getElementById("wmOpacityVal").innerText = e.target.value; });
wmSize.addEventListener('input', (e) => { document.getElementById("wmSizeVal").innerText = e.target.value; });

fontDropdown.addEventListener("click", () => fontDropdown.classList.toggle("open"));
document.addEventListener("click", (e) => { if (!fontDropdown.contains(e.target)) fontDropdown.classList.remove("open"); });

wmFontList.addEventListener("click", (e) => {
  if(e.target.classList.contains("font-item")) {
    Array.from(wmFontList.children).forEach(i => i.classList.remove("active"));
    e.target.classList.add("active");
    selectedFont = e.target.getAttribute("data-font");
    selectedFontText.innerText = e.target.innerText;
    selectedFontText.style.fontFamily = e.target.style.fontFamily;
    fontDropdown.classList.remove("open");
  }
});

formatBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("active");
    const format = btn.getAttribute("data-format");
    wmFormats[format] = btn.classList.contains("active");
  });
});

wmImageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    wmFileNameText.innerText = file.name;
    const img = new Image();
    img.onload = () => { wmOriginalImageObj = img; };
    img.src = URL.createObjectURL(file);
  }
});

// Color Pickers Setup
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

const fontColorPicker = new iro.ColorPicker("#fontIroPickerContainer", { width: 220, color: "#000000", borderWidth: 1, borderColor: "#00e676", layout: [ { component: iro.ui.Box }, { component: iro.ui.Slider, options: { sliderType: 'hue' } } ] });
fontColorSwatchBtn.onclick = (e) => { e.stopPropagation(); fontColorPickerPanel.style.display = "flex"; fontColorPopoverOverlay.style.display = window.innerWidth <= 768 ? "block" : "none"; };
function closeFontColorPopup() { fontColorPickerPanel.style.display = "none"; fontColorPopoverOverlay.style.display = "none"; }
fontClosePickerBtn.onclick = closeFontColorPopup; fontColorPopoverOverlay.onclick = closeFontColorPopup; fontColorOkBtn.onclick = closeFontColorPopup; 
fontColorPicker.on('color:change', function(color) { const hex = color.hexString.toUpperCase(); fontCustomHex.value = hex; fontHexColorPreview.style.backgroundColor = hex; fontColorSwatchBtn.style.backgroundColor = hex; });
fontCustomHex.addEventListener('input', function(e) { let val = e.target.value; if (!val.startsWith("#")) val = "#" + val; if(val.match(/^#[0-9A-Fa-f]{6}$/i)) { fontColorPicker.color.hexString = val; fontHexColorPreview.style.backgroundColor = val; fontColorSwatchBtn.style.backgroundColor = val; } });
fontCustomHex.addEventListener('blur', function(e) { let val = e.target.value; if (!val.startsWith("#")) val = "#" + val; e.target.value = val.toUpperCase(); });

const wmColorPicker = new iro.ColorPicker("#wmIroPickerContainer", { width: 220, color: "#808080", borderWidth: 1, borderColor: "#00e676", layout: [ { component: iro.ui.Box }, { component: iro.ui.Slider, options: { sliderType: 'hue' } } ] });
wmColorSwatchBtn.onclick = (e) => { e.stopPropagation(); wmColorPickerPanel.style.display = "flex"; wmColorPopoverOverlay.style.display = window.innerWidth <= 768 ? "block" : "none"; };
function closeWmColorPopup() { wmColorPickerPanel.style.display = "none"; wmColorPopoverOverlay.style.display = "none"; }
wmClosePickerBtn.onclick = closeWmColorPopup; wmColorPopoverOverlay.onclick = closeWmColorPopup; wmColorOkBtn.onclick = closeWmColorPopup; 
wmColorPicker.on('color:change', function(color) { const hex = color.hexString.toUpperCase(); wmCustomHex.value = hex; wmHexColorPreview.style.backgroundColor = hex; wmColorSwatchBtn.style.backgroundColor = hex; });
wmCustomHex.addEventListener('input', function(e) { let val = e.target.value; if (!val.startsWith("#")) val = "#" + val; if(val.match(/^#[0-9A-Fa-f]{6}$/i)) { wmColorPicker.color.hexString = val; wmHexColorPreview.style.backgroundColor = val; wmColorSwatchBtn.style.backgroundColor = val; } });
wmCustomHex.addEventListener('blur', function(e) { let val = e.target.value; if (!val.startsWith("#")) val = "#" + val; e.target.value = val.toUpperCase(); });

document.addEventListener("click", (e) => {
  if (bgMode.value === "custom" && canvaColorPickerPanel.style.display === "flex") { if (!canvaColorPickerPanel.contains(e.target) && e.target !== colorSwatchBtn) closeColorPopup(); }
  if (fontColorPickerPanel.style.display === "flex") { if (!fontColorPickerPanel.contains(e.target) && e.target !== fontColorSwatchBtn) closeFontColorPopup(); }
  if (wmColorPickerPanel.style.display === "flex") { if (!wmColorPickerPanel.contains(e.target) && e.target !== wmColorSwatchBtn) closeWmColorPopup(); }
});

// ==========================================
// CORE FUNCTIONS
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

const handleFileInput = (e) => {
  if (!e.target.files.length) return;
  [...e.target.files].forEach(file => {
    images.push({ file, url: URL.createObjectURL(file), rotation: 0 });
  });
  renderPreview();
  fileLabelText.innerText = "Add More Files";
  e.target.value = ""; 
};

fileInput.onchange = handleFileInput;
if (cameraInput) cameraInput.onchange = handleFileInput;

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

  const fragment = document.createDocumentFragment();

  images.forEach((img, index) => {
    const card = document.createElement("div");
    card.className = "image-card";

    card.innerHTML = `
      <div class="page-badge">Page ${index + 1}</div>
      <img class="img-thumb" src="${img.url}" alt="Preview of ${img.file.name}" style="transform:rotate(${img.rotation}deg)">
      <div class="image-overlay">
        <button class="overlay-btn zoom" type="button" aria-label="Zoom Image" title="Zoom"><svg viewBox="0 0 24 24" fill="none" stroke="#003c2f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg></button>
        <button class="overlay-btn crop" type="button" aria-label="Crop Image" title="Crop"><svg viewBox="0 0 24 24" fill="none" stroke="#003c2f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"></path><path d="M18 22V8a2 2 0 0 0-2-2H2"></path></svg></button>
        <button class="overlay-btn rotate" type="button" aria-label="Rotate Image" title="Rotate"><svg viewBox="0 0 24 24" fill="none" stroke="#003c2f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg></button>
        <button class="overlay-btn delete" type="button" aria-label="Delete Image" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="#003c2f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
      </div>
      <div class="file-name">${img.file.name}</div>
      <div class="page-number">Page ${index + 1}</div>
    `;

    card.querySelector(".zoom").onclick = () => openZoom(img);
    card.querySelector(".crop").onclick = () => openCropper(img);
    card.querySelector(".rotate").onclick = () => { img.rotation += 90; renderPreview(); };
    card.querySelector(".delete").onclick = () => { URL.revokeObjectURL(images[index].url); images.splice(index, 1); renderPreview(); };
    
    fragment.appendChild(card);
  });
  
  previewBox.appendChild(fragment);
}

function openZoom(img) {
  const overlay = document.createElement("div");
  overlay.className = "zoom-overlay";
  overlay.innerHTML = `<button class="zoom-close" type="button" aria-label="Close Zoom">✕</button><img src="${img.url}" alt="Zoomed image preview" style="transform:rotate(${img.rotation}deg)">`;
  overlay.querySelector(".zoom-close").onclick = () => overlay.remove();
  document.body.appendChild(overlay);
}

function openCropper(img) {
  const modal = document.createElement("div");
  modal.className = "crop-modal";
  
  modal.innerHTML = `
    <div class="crop-area"><img id="cropImage" alt="Crop preview image"></div>
    <div class="crop-tilt-container">
      <label for="tiltSlider">Tilt: <span id="tiltVal">0</span>°</label>
      <input type="range" id="tiltSlider" min="-180" max="180" value="0" step="1" aria-label="Tilt Image slider">
      <button id="resetTiltBtn" type="button" class="reset-tilt-btn" aria-label="Reset Tilt">Reset</button>
    </div>
    <div class="crop-actions">
      <button type="button" class="crop-btn cancel-btn" aria-label="Cancel Crop">Cancel</button>
      <button type="button" class="crop-btn save-btn" aria-label="Save Crop">Save Crop</button>
    </div>
  `;
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

    const tiltSlider = modal.querySelector("#tiltSlider");
    const tiltVal = modal.querySelector("#tiltVal");
    const resetTiltBtn = modal.querySelector("#resetTiltBtn");

    tiltSlider.addEventListener("input", (e) => {
      const val = Number(e.target.value);
      tiltVal.innerText = val;
      cropper.rotateTo(val); 
    });

    resetTiltBtn.addEventListener("click", () => {
      tiltSlider.value = 0;
      tiltVal.innerText = "0";
      cropper.rotateTo(0);
    });

    modal.querySelector(".save-btn").onclick = () => {
      const croppedCanvas = cropper.getCroppedCanvas({ imageSmoothingEnabled: true, imageSmoothingQuality: 'medium' });
      croppedCanvas.toBlob((blob) => { 
        URL.revokeObjectURL(img.url); 
        img.url = URL.createObjectURL(blob); 
        img.rotation = 0; 
        cropper.destroy(); 
        modal.remove(); 
        renderPreview(); 
      }, "image/jpeg", 0.9);
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

async function compressToTarget(imgObj, targetBytes) {
  let minQ = 0.05;
  let maxQ = 1.0;
  let bestData = null;
  let bestDiff = Infinity;

  for(let i=0; i<6; i++) {
    let q = (minQ + maxQ) / 2;
    let res = await compressImage(imgObj, q);
    
    let bytes = Math.round((res.data.length - 22) * 0.75); 
    let diff = Math.abs(bytes - targetBytes);

    if(diff < bestDiff) {
      bestDiff = diff;
      bestData = res;
    }

    if(bytes > targetBytes) {
      maxQ = q; 
    } else {
      minQ = q; 
    }
  }
  return bestData;
}

// ==========================================
// PDF GENERATION (WEB WORKER IMPLEMENTATION)
// ==========================================
generateBtn.onclick = async () => {
  if (!images.length) return alert("Select images first");
  
  if (wmToggle.checked) {
    if (wmType.value === 'image' && !wmOriginalImageObj) {
        return alert("Please select a Logo Image for Watermark!");
    }
    if (wmType.value === 'text' && !wmTextInput.value.trim()) {
        return alert("Please enter text for the Watermark!");
    }
  }

  const isTargetMode = qualitySelect.value === 'target';
  let targetBytesPerImage = 0;
  
  if (isTargetMode) {
    const targetKb = parseFloat(targetSizeInput.value);
    if (!targetKb || targetKb <= 0) return alert("Please enter a valid target size in KB!");
    
    const totalTargetBytes = Math.max(1024, (targetKb * 1024) - 10240);
    targetBytesPerImage = totalTargetBytes / images.length;
  }
  
  const staticQuality = isTargetMode ? 0.7 : parseFloat(qualitySelect.value); 
  const isBatchMode = batchToggle.checked;
  const isAutoFill = autoFillToggle.checked; 
  
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

  const formatSize = pageSizeSelect.value;
  const orientationVal = orientation.value;
  const margin = +marginInput.value;
  const fit = fitMode.value;
  const isBW = bwToggle.checked;
  
  const addPageNumbers = pageNumToggle.checked;
  const pageNumberPosition = pageNumPos.value;
  const pageNumberSizeVal = 18; 
  const pageNumberColorHex = fontColorPicker.color.hexString;
  
  const addWatermark = wmToggle.checked;
  const wmTypeVal = wmType.value;
  const wmTextVal = wmTextInput.value.trim();
  const wmPosVal = wmPos.value;
  const wmSizeVal = wmSize.value / 100;    
  const wmOpacityVal = wmOpacity.value / 100; 
  const wmAngleVal = wmAngle.value;
  const wmColorHexVal = wmColorPicker.color.hexString;

  const pdfBgColorHex = (bgMode.value === "black") ? "#000000" : (bgMode.value === "custom" ? colorPicker.color.hexString : "#ffffff");

  let finalWmImageBase64 = null;
  let finalWmImageAspect = 1;
  
  if (addWatermark && wmTypeVal === 'image' && wmOriginalImageObj) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      let tw = wmOriginalImageObj.width;
      let th = wmOriginalImageObj.height;
      
      const MAX_WM_SIZE = 800;
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
              images, isFirst, formatSize, orientationVal, margin, fit, index, bgColorHex, 
              isBW, addPageNumbers, fontColorHex, fontPos, fontNumSize,
              addWatermark, wmType, wmText, wmImage, wmImageAspect, wmPos, wmSize, wmOpacity, wmAngle, wmColorHex,
              wmFont, wmBold, wmItalic
            } = payload;
            const { jsPDF } = self.jspdf;
            
            let pw, ph;
            
            // Layout initialization
            if (formatSize === "original") {
              let img = images[0]; 
              pw = img.imgWidth + (margin * 2);
              ph = img.imgHeight + (margin * 2);
              const imgOrientation = pw > ph ? "landscape" : "portrait";
              
              if (isFirst) pdf = new jsPDF({ format: [pw, ph], orientation: imgOrientation, unit: "pt" });
              else pdf.addPage([pw, ph], imgOrientation);
              
              pdf.setFillColor(bgColorHex);
              pdf.rect(0, 0, pw, ph, "F");
              pdf.addImage(img.data, "JPEG", margin, margin, img.imgWidth, img.imgHeight);
            } else {
              if (isFirst) pdf = new jsPDF({ format: formatSize, orientation: orientationVal, unit: "pt" });
              else pdf.addPage(formatSize, orientationVal);
              
              pw = pdf.internal.pageSize.getWidth();
              ph = pdf.internal.pageSize.getHeight();
              
              pdf.setFillColor(bgColorHex);
              pdf.rect(0, 0, pw, ph, "F");
              
              for(let i=0; i<images.length; i++) {
                 let img = images[i];
                 if(img.isOriginal) {
                    let w = pw - margin * 2;
                    let h = w * (img.imgHeight / img.imgWidth);
                    
                    if (fit === "height") {
                      h = ph - margin * 2;
                      w = h * (img.imgWidth / img.imgHeight);
                    } else if (fit === "auto") {
                      const imgAspect = img.imgWidth / img.imgHeight;
                      const pageAspect = (pw - margin * 2) / (ph - margin * 2);
                      if (imgAspect > pageAspect) {
                        w = pw - margin * 2;
                        h = w / imgAspect;
                      } else {
                        h = ph - margin * 2;
                        w = h * imgAspect;
                      }
                    }
                    let x = (pw - w) / 2;
                    let y = (ph - h) / 2;
                    pdf.addImage(img.data, "JPEG", x, y, w, h);
                 } else {
                    // Auto-Fill actual drawing
                    pdf.addImage(img.data, "JPEG", img.x, img.y, img.w, img.h);
                 }
              }
            }

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
                pdf.setTextColor(finalWmColor);
                
                let fontStyle = "normal";
                if(wmBold && wmItalic) fontStyle = "bolditalic";
                else if(wmBold) fontStyle = "bold";
                else if(wmItalic) fontStyle = "italic";
                pdf.setFont(wmFont, fontStyle);
                
                let safeW = pw - (wmPad * 2);
                let safeH = ph - (wmPad * 2);
                let targetW = safeW * wmSize;
                
                let wmFontSize = targetW / Math.max(1, wmText.length * 0.45); 
                wmFontSize = Math.min(wmFontSize, safeH * 0.8);
                pdf.setFontSize(wmFontSize);
                
                let posX, posY;
                let alignVal = "center";

                switch(wmPos) {
                  case "center": posX = pw/2; posY = ph/2 + (wmFontSize * 0.3); break;
                  case "bottom-center": posX = pw/2; posY = ph - wmPad; break;
                  case "bottom-right": posX = pw - wmPad; posY = ph - wmPad; alignVal = "right"; break;
                  case "bottom-left": posX = wmPad; posY = ph - wmPad; alignVal = "left"; break;
                  case "top-center": posX = pw/2; posY = wmPad + wmFontSize; break;
                  case "top-right": posX = pw - wmPad; posY = wmPad + wmFontSize; alignVal = "right"; break;
                  case "top-left": posX = wmPad; posY = wmPad + wmFontSize; alignVal = "left"; break;
                }
                pdf.text(wmText, posX, posY, { align: alignVal, angle: parseFloat(wmAngle) });

               } else if (wmType === 'image' && wmImage) {
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

            if (addPageNumbers) {
              pdf.setFont("helvetica", "normal");
              pdf.setFontSize(fontNumSize || 18); 
              pdf.setTextColor(fontColorHex); 

              let xPos, yPos, alignVal;
              let pad = Math.max(15, margin);

              switch(fontPos) {
                case "bottom-center": xPos = pw / 2; yPos = ph - pad; alignVal = "center"; break;
                case "bottom-right": xPos = pw - pad; yPos = ph - pad; alignVal = "right"; break;
                case "bottom-left": xPos = pad; yPos = ph - pad; alignVal = "left"; break;
                case "top-center": xPos = pw / 2; yPos = pad + 15; alignVal = "center"; break;
                case "top-right": xPos = pw - pad; yPos = pad + 15; alignVal = "right"; break;
                case "top-left": xPos = pad; yPos = pad + 15; alignVal = "left"; break;
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

    if (isBatchMode) {
      for (let i = 0; i < images.length; i++) {
        outputBox.innerHTML = `Batch Processing Image ${i + 1} of ${images.length}...`;
        
        let compressedRes;
        if (isTargetMode) {
          compressedRes = await compressToTarget(images[i], targetBytesPerImage);
        } else {
          compressedRes = await compressImage(images[i], staticQuality);
        }
        
        const { data, width, height } = compressedRes;
        
        let currentPageImages = [{ data, imgWidth: width, imgHeight: height, isOriginal: true }];
        
        await addPageToPDF({
            images: currentPageImages,
            isFirst: true, 
            formatSize: formatSize,
            orientationVal: orientationVal,
            margin: margin,
            fit: fit,
            index: 0, 
            bgColorHex: pdfBgColorHex,
            isBW: isBW,
            addPageNumbers: addPageNumbers,
            fontColorHex: pageNumberColorHex,
            fontPos: pageNumberPosition,
            fontNumSize: pageNumberSizeVal,
            addWatermark: addWatermark,
            wmType: wmTypeVal,
            wmText: wmTextVal,
            wmImage: finalWmImageBase64,
            wmImageAspect: finalWmImageAspect,
            wmPos: wmPosVal,
            wmSize: wmSizeVal,
            wmOpacity: wmOpacityVal,
            wmAngle: wmAngleVal,
            wmColorHex: wmColorHexVal,
            wmFont: selectedFont,
            wmBold: wmFormats.bold,
            wmItalic: wmFormats.italic
        });

        let singlePdfBlob = await finishPDF();
        
        let originalName = images[i].file.name;
        let baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        let downloadName = baseName + ".pdf";

        const url = URL.createObjectURL(singlePdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = downloadName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        const percentDone = Math.round(((i + 1) / images.length) * 100);
        progressBar.style.width = percentDone + "%";
        progressText.innerText = percentDone + "%";

        await new Promise(resolve => setTimeout(resolve, 800)); 
      }
      
      pdfWorker.terminate();
      URL.revokeObjectURL(workerUrl);
      
      progressBar.style.width = "100%";
      progressText.innerText = "100%";
      
      outputBox.innerHTML = "<span style='color:#00e676'>Batch Conversion Complete! ✔<br><small>All files have been downloaded.</small></span>";
      downloadBtn.disabled = true; 
      previewBtn.disabled = true;  

      // SHOW TOAST MESSAGE ONCE PER PAGE LOAD (For Batch Mode)
      if (!hasShownDownloadToast) {
        const toastEl = document.getElementById("toast-msg");
        if (toastEl) {
          toastEl.innerText = "PDF Downloaded! 🎉 Next Tool: Compress PDF (Coming Soon)";
          toastEl.classList.add("show");
          setTimeout(() => {
            toastEl.classList.remove("show");
          }, 4000);
          hasShownDownloadToast = true;
        }
      }

    } else {
      // COMBINED PDF MODE
      let currentPageImages = [];
      let currentX = margin;
      let currentY = margin;
      let rowHeight = 0;
      let pageIndex = 0;
      
      let pw = 0, ph = 0;
      if (formatSize !== 'original') {
          const sizes = { a4: {w:595.28, h:841.89}, a3: {w:841.89, h:1190.55}, letter: {w:612, h:792} };
          pw = sizes[formatSize].w;
          ph = sizes[formatSize].h;
          if (orientationVal === 'landscape') {
              pw = sizes[formatSize].h;
              ph = sizes[formatSize].w;
          }
      }

      for (let i = 0; i < images.length; i++) {
        outputBox.innerHTML = `Processing Image ${i + 1} of ${images.length}...`;
        
        let compressedRes;
        if (isTargetMode) {
          compressedRes = await compressToTarget(images[i], targetBytesPerImage);
        } else {
          compressedRes = await compressImage(images[i], staticQuality);
        }
        
        const { data, width, height } = compressedRes;
        
        if (isAutoFill && formatSize !== 'original') {
            // Auto-Fill Grouping logic with exact margin spacing
            let printW = width;
            let printH = height;
            let maxAllowedW = pw - margin * 2;
            let maxAllowedH = ph - margin * 2;
            
            if (printW > maxAllowedW) {
                let ratio = maxAllowedW / printW;
                printW = maxAllowedW;
                printH = printH * ratio;
            }
            if (printH > maxAllowedH) {
                let ratio = maxAllowedH / printH;
                printH = maxAllowedH;
                printW = printW * ratio;
            }
            
            // Check horizontal space using user defined margin
            if (currentPageImages.length > 0 && currentX + printW > pw - margin) {
                currentX = margin;
                currentY += rowHeight + margin; // vertical gap is exact margin
                rowHeight = 0;
            }
            
            // Check vertical space using user defined margin
            if (currentPageImages.length > 0 && currentY + printH > ph - margin) {
                await addPageToPDF({
                    images: currentPageImages,
                    isFirst: (pageIndex === 0),
                    formatSize: formatSize, orientationVal: orientationVal, margin: margin, fit: fit, index: pageIndex,
                    bgColorHex: pdfBgColorHex, isBW: isBW,
                    addPageNumbers: addPageNumbers, fontColorHex: pageNumberColorHex, fontPos: pageNumberPosition, fontNumSize: pageNumberSizeVal,
                    addWatermark: addWatermark, wmType: wmTypeVal, wmText: wmTextVal, wmImage: finalWmImageBase64, wmImageAspect: finalWmImageAspect, wmPos: wmPosVal, wmSize: wmSizeVal, wmOpacity: wmOpacityVal, wmAngle: wmAngleVal, wmColorHex: wmColorHexVal, wmFont: selectedFont, wmBold: wmFormats.bold, wmItalic: wmFormats.italic
                });
                pageIndex++;
                currentPageImages = [];
                currentX = margin;
                currentY = margin;
                rowHeight = 0;
            }
            
            currentPageImages.push({ data, x: currentX, y: currentY, w: printW, h: printH, isOriginal: false });
            currentX += printW + margin; // horizontal gap is exact margin
            rowHeight = Math.max(rowHeight, printH);
            
        } else {
            // Normal 1 image per page logic
            currentPageImages = [{ data, imgWidth: width, imgHeight: height, isOriginal: true }];
            await addPageToPDF({
                images: currentPageImages,
                isFirst: (pageIndex === 0),
                formatSize: formatSize, orientationVal: orientationVal, margin: margin, fit: fit, index: pageIndex,
                bgColorHex: pdfBgColorHex, isBW: isBW,
                addPageNumbers: addPageNumbers, fontColorHex: pageNumberColorHex, fontPos: pageNumberPosition, fontNumSize: pageNumberSizeVal,
                addWatermark: addWatermark, wmType: wmTypeVal, wmText: wmTextVal, wmImage: finalWmImageBase64, wmImageAspect: finalWmImageAspect, wmPos: wmPosVal, wmSize: wmSizeVal, wmOpacity: wmOpacityVal, wmAngle: wmAngleVal, wmColorHex: wmColorHexVal, wmFont: selectedFont, wmBold: wmFormats.bold, wmItalic: wmFormats.italic
            });
            pageIndex++;
            currentPageImages = [];
        }

        const percentDone = Math.round(((i + 1) / images.length) * 100);
        progressBar.style.width = percentDone + "%";
        progressText.innerText = percentDone + "%";

        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      if (currentPageImages.length > 0) {
          await addPageToPDF({
              images: currentPageImages,
              isFirst: (pageIndex === 0),
              formatSize: formatSize, orientationVal: orientationVal, margin: margin, fit: fit, index: pageIndex,
              bgColorHex: pdfBgColorHex, isBW: isBW,
              addPageNumbers: addPageNumbers, fontColorHex: pageNumberColorHex, fontPos: pageNumberPosition, fontNumSize: pageNumberSizeVal,
              addWatermark: addWatermark, wmType: wmTypeVal, wmText: wmTextVal, wmImage: finalWmImageBase64, wmImageAspect: finalWmImageAspect, wmPos: wmPosVal, wmSize: wmSizeVal, wmOpacity: wmOpacityVal, wmAngle: wmAngleVal, wmColorHex: wmColorHexVal, wmFont: selectedFont, wmBold: wmFormats.bold, wmItalic: wmFormats.italic
          });
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
    }
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
// UNIVERSAL PDF.JS PREVIEW LOGIC
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
  let name = fileNameInput.value.trim() || "SArixa-converted";
  if (!name.toLowerCase().endsWith(".pdf")) name += ".pdf";
  
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  
  setTimeout(() => URL.revokeObjectURL(url), 200);

  // SHOW TOAST MESSAGE ONCE PER PAGE LOAD
  if (!hasShownDownloadToast) {
    const toastEl = document.getElementById("toast-msg");
    if (toastEl) {
      toastEl.innerText = "PDF Downloaded! 🎉 Next Tool: Compress PDF (Coming Soon)";
      toastEl.classList.add("show");
      setTimeout(() => {
        toastEl.classList.remove("show");
      }, 4000);
      hasShownDownloadToast = true; // Set flag to true so it doesn't show again until page reload
    }
  }

  // NEVER-ENDING LOOP LOGIC FOR RATING POPUP
  setTimeout(() => {
    const hasSubmitted = localStorage.getItem('hasSubmittedSarixaRating');
    
    if (!hasSubmitted) {
      let count = parseInt(localStorage.getItem('sarixaDownloadCount') || '0');
      count++; 
      localStorage.setItem('sarixaDownloadCount', count.toString());

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
  }, 1500); // Wait 1.5s so toast message is read before popup shows
};

["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
  previewBox.addEventListener(eventName, e => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    e.preventDefault();
    e.stopPropagation();
  }, { passive: false }); 
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
    step1.style.display = 'block';
    stepHappy.style.display = 'none';
    stepSad.style.display = 'none';
    successState.style.display = 'none';
    selectedRating = 0;
    feedbackText.value = "";
    copyLinkBtn.innerText = "Copy Link";
    
    // Clear star selections
    stars.forEach(s => { 
        s.innerHTML = '☆'; 
        s.style.color = '#555';
        s.classList.remove('selected');
    });
};

// FULL CLOSE LOGIC
const completeClose = () => {
    popup.style.display = 'none';
    
    // IF RATING IS NOT SUBMITTED, SHOW REMINDER BAR AGAIN
    if (!localStorage.getItem('hasSubmittedSarixaRating')) {
        localStorage.setItem('sarixaRatingDismissed', 'true');
        if(reminderBar) reminderBar.style.display = 'flex'; 
    }
    
    setTimeout(resetPopupUI, 500);
};

closeTopBtn.addEventListener('click', completeClose);

// STAR CLICK LOGIC
stars.forEach(star => {
  star.addEventListener('click', function() {
    selectedRating = parseInt(this.getAttribute('data-value'));

    // Visual update (Clarity Polish)
    stars.forEach(s => {
      const sVal = parseInt(s.getAttribute('data-value'));
      s.innerHTML = (sVal <= selectedRating) ? '⭐' : '☆';
      s.style.color = (sVal <= selectedRating) ? '#ffc107' : '#555';
      if(sVal <= selectedRating) s.classList.add('selected');
      else s.classList.remove('selected');
    });

    // Save initial star rating immediately to DB so we don't lose it
    push(ref(database, 'sarixa_ratings'), {
        rating: selectedRating,
        timestamp: Date.now(),
        type: 'initial_click'
    });

    // Submitting makes the popup and banner go away forever
    localStorage.setItem('hasSubmittedSarixaRating', 'true');
    if(reminderBar) reminderBar.style.display = 'none'; 

    // UX Transition (Step 2)
    setTimeout(() => {
        step1.style.display = 'none';
        if(selectedRating >= 4) {
            stepHappy.style.display = 'block';
            const shareText = "I found the best Image to PDF tool! It's 100% private (no server uploads) and completely free without watermarks. Try SArixa here: https://sarixa-tools.vercel.app/";
            document.getElementById('whatsapp-share-btn').href = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        } else {
            stepSad.style.display = 'block';
        }
    }, 400); // Slightly slower for them to see the glowing stars
  });
});

// HAPPY FLOW - COPY LINK
copyLinkBtn.addEventListener('click', () => {
    navigator.clipboard.writeText("https://sarixa-tools.vercel.app/");
    copyLinkBtn.innerText = "Copied! ✔";
    setTimeout(() => {
        completeClose(); // Close entirely
    }, 1500);
});

// SAD FLOW - SUBMIT FEEDBACK
btnSubmitFeedback.addEventListener('click', () => {
    const feedback = feedbackText.value.trim();
    btnSubmitFeedback.innerText = "Sending...";
    
    push(ref(database, 'sarixa_feedback'), {
        rating: selectedRating,
        feedback: feedback || "No text provided",
        timestamp: Date.now()
    }).then(() => {
        stepSad.style.display = 'none';
        successState.style.display = 'flex';
        setTimeout(completeClose, 2500);
    }).catch(err => {
        console.error(err);
        completeClose();
    });
});

// REMINDER BAR LOGIC
if(openReminderBtn) {
    openReminderBtn.addEventListener('click', () => {
        popup.style.display = 'flex';
        if(reminderBar) reminderBar.style.display = 'none'; // Hide reminder when popup is open
    });
}