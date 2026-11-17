// IMPORT NATIVE SHARE SYSTEM
import { sharePdfFile } from './sharing-system.js';

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
const shareBtn = document.getElementById("shareBtn"); 
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
const wmMosaicToggle = document.getElementById("wmMosaicToggle");
const wmDensity = document.getElementById("wmDensity");
const wmDensityVal = document.getElementById("wmDensityVal");
const wmTextInput = document.getElementById("wmTextInput");
const wmImageInput = document.getElementById("wmImageInput");
const wmFileNameText = document.getElementById("wmFileNameText");
const wmPos = document.getElementById("wmPos");
const wmSize = document.getElementById("wmSize");
const wmOpacity = document.getElementById("wmOpacity");
const wmAngle = document.getElementById("wmAngle");
const wmExtraFields = document.querySelectorAll(".wm-extra");
const wmMosaicExtraFields = document.querySelectorAll(".wm-mosaic-extra");

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

// CAMERA WARNING POPUP ELEMENTS
const cameraBtnTrigger = document.getElementById("cameraBtnTrigger");
const cameraWarningPopup = document.getElementById("camera-warning-popup");
const closeCameraPopup = document.getElementById("close-camera-popup");
const btnOpenGallery = document.getElementById("btn-open-gallery");
const btnUseCameraAnyway = document.getElementById("btn-use-camera-anyway");

// DELETE CONFIRMATION POPUP ELEMENTS
const deleteConfirmPopup = document.getElementById("delete-confirm-popup");
const btnCancelDelete = document.getElementById("btn-cancel-delete");
const btnConfirmDelete = document.getElementById("btn-confirm-delete");

// ==========================================
// PROTECTION UI DOM ELEMENTS
// ==========================================
const enableProtectionToggle = document.getElementById("enableProtectionToggle");
const securityPanel = document.getElementById("securityPanel");
const userPassword = document.getElementById("userPassword");
const ownerPassword = document.getElementById("ownerPassword");
const permPrint = document.getElementById("permPrint");
const permCopy = document.getElementById("permCopy");
const permModify = document.getElementById("permModify");
const strengthBars = [document.getElementById('str-1'), document.getElementById('str-2'), document.getElementById('str-3'), document.getElementById('str-4')];
const strengthText = document.getElementById('strengthText');
const togglePasswordBtns = document.querySelectorAll('.toggle-password');

// ==========================================
// STATE VARIABLES
// ==========================================
let images = [];
let pdfBlob = null; 
let downloadPdfBlob = null; 
let isPreviewOpen = false;
let hasShownCameraWarning = false;
let imageIndexToDelete = null; 
let wmOriginalImageObj = null;
let selectedFont = "helvetica";
let wmFormats = { bold: false, italic: false };

// ==========================================
// NUMBER ANIMATOR HELPER
// ==========================================
function animateValue(objId, start, end, duration, suffix = "", isFloat = false) {
    const obj = document.getElementById(objId);
    if (!obj) return;
    const startNum = parseFloat(start) || 0;
    const endNum = parseFloat(end) || 0;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        let currentVal = progress * (endNum - startNum) + startNum;
        if (!isFloat) currentVal = Math.floor(currentVal);
        else currentVal = currentVal.toFixed(2);
        obj.innerHTML = currentVal + " <span style='font-size:0.5em'>" + suffix + "</span>";
        if (progress < 1) window.requestAnimationFrame(step);
        else {
            let finalVal = isFloat ? endNum.toFixed(2) : endNum;
            obj.innerHTML = finalVal + " <span style='font-size:0.5em'>" + suffix + "</span>";
        }
    };
    window.requestAnimationFrame(step);
}

// ==========================================
// PROTECTION UI LOGIC 
// ==========================================
if(enableProtectionToggle) {
    enableProtectionToggle.addEventListener('change', (e) => {
        if(securityPanel) securityPanel.style.display = e.target.checked ? 'grid' : 'none';
        validatePasswords();
    });
}

togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if(!input) return;
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        if(type === 'text') {
            this.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
        } else {
            this.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        }
    });
});

function validatePasswords() {
    if(!enableProtectionToggle || !enableProtectionToggle.checked) return;
    
    if(userPassword) {
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
        } else if (score <= 1) {
            if(strengthBars[0]) strengthBars[0].style.background = '#ff5252';
            if(strengthText) { strengthText.textContent = "Weak"; strengthText.style.color = "#ff5252"; }
        } else if (score === 2) {
            if(strengthBars[0]) strengthBars[0].style.background = '#ffc107';
            if(strengthBars[1]) strengthBars[1].style.background = '#ffc107';
            if(strengthText) { strengthText.textContent = "Fair"; strengthText.style.color = "#ffc107"; }
        } else if (score === 3) {
            if(strengthBars[0]) strengthBars[0].style.background = '#00e676';
            if(strengthBars[1]) strengthBars[1].style.background = '#00e676';
            if(strengthBars[2]) strengthBars[2].style.background = '#00e676';
            if(strengthText) { strengthText.textContent = "Good"; strengthText.style.color = "#00e676"; }
        } else {
            strengthBars.forEach(bar => { if(bar) bar.style.background = '#00ff84'; });
            if(strengthText) { strengthText.textContent = "Strong 💪"; strengthText.style.color = "#00ff84"; }
        }
    }

    if(ownerPassword) {
        const hasOwnerPass = ownerPassword.value.length > 0;
        if(permPrint) permPrint.disabled = !hasOwnerPass;
        if(permCopy) permCopy.disabled = !hasOwnerPass;
        if(permModify) permModify.disabled = !hasOwnerPass;
    }
}

if (userPassword) userPassword.addEventListener('input', validatePasswords);
if (ownerPassword) ownerPassword.addEventListener('input', validatePasswords);

// ==========================================
// EVENT LISTENERS & UI LOGIC
// ==========================================

if (cameraBtnTrigger && cameraWarningPopup) {
  cameraBtnTrigger.addEventListener("click", () => {
    if (!hasShownCameraWarning) { cameraWarningPopup.style.display = "flex"; hasShownCameraWarning = true; } else { cameraInput.click(); }
  });
  closeCameraPopup.addEventListener("click", () => { cameraWarningPopup.style.display = "none"; });
  btnOpenGallery.addEventListener("click", () => { cameraWarningPopup.style.display = "none"; fileInput.click(); });
  btnUseCameraAnyway.addEventListener("click", () => { cameraWarningPopup.style.display = "none"; cameraInput.click(); });
  cameraWarningPopup.addEventListener("click", (e) => { if (e.target === cameraWarningPopup) { cameraWarningPopup.style.display = "none"; } });
}

if (deleteConfirmPopup) {
  btnCancelDelete.addEventListener("click", () => { deleteConfirmPopup.style.display = "none"; imageIndexToDelete = null; });
  btnConfirmDelete.addEventListener("click", () => {
    if (imageIndexToDelete !== null) { URL.revokeObjectURL(images[imageIndexToDelete].url); images.splice(imageIndexToDelete, 1); renderPreview(); }
    deleteConfirmPopup.style.display = "none"; imageIndexToDelete = null; 
  });
  deleteConfirmPopup.addEventListener("click", (e) => { if (e.target === deleteConfirmPopup) { deleteConfirmPopup.style.display = "none"; imageIndexToDelete = null; } });
}

pageSizeSelect.addEventListener('change', (e) => {
  if (e.target.value === 'original') { autoFillContainer.style.display = 'none'; autoFillToggle.checked = false; } else { autoFillContainer.style.display = 'block'; }
});

pageNumToggle.addEventListener('change', (e) => { pageNumExtraFields.forEach(el => el.style.display = e.target.checked ? "block" : "none"); });
qualitySelect.addEventListener('change', (e) => { targetSizeContainer.style.display = e.target.value === 'target' ? 'block' : 'none'; });

wmToggle.addEventListener('change', (e) => {
  const show = e.target.checked;
  wmExtraFields.forEach(el => el.style.display = show ? "block" : "none");
  if (show) { updateWmTypeFields(); wmMosaicToggle.dispatchEvent(new Event('change')); }
});

wmType.addEventListener('change', updateWmTypeFields);
function updateWmTypeFields() {
  const isText = wmType.value === 'text';
  document.querySelectorAll('.wm-text-only').forEach(el => el.style.display = isText ? 'block' : 'none');
  document.querySelectorAll('.wm-image-only').forEach(el => el.style.display = !isText ? 'block' : 'none');
}

wmMosaicToggle.addEventListener('change', (e) => {
    const isMosaic = e.target.checked;
    wmMosaicExtraFields.forEach(el => el.style.display = isMosaic ? "block" : "none");
    const posWrapper = document.getElementById("wmPosContainer");
    if (posWrapper) { posWrapper.style.display = isMosaic ? "none" : "block"; }

    if (isMosaic) {
        if (wmSize) {
            wmSize.value = 10;
            const wmSizeVal = document.getElementById("wmSizeVal");
            if (wmSizeVal) wmSizeVal.innerText = "10";
        }
    }
});

wmDensity.addEventListener('input', (e) => { wmDensityVal.innerText = e.target.value; });
wmOpacity.addEventListener('input', (e) => { document.getElementById("wmOpacityVal").innerText = e.target.value; });
wmSize.addEventListener('input', (e) => { document.getElementById("wmSizeVal").innerText = e.target.value; });

// 🔥 ULTIMATE MOBILE DROPDOWN FIX 🔥
if (fontDropdown) {
    // Parent div er z-index barate hobe jate eta nicher kono settings er pichone lukhiye na jay
    if (fontDropdown.parentElement) {
        fontDropdown.parentElement.style.position = "relative";
        fontDropdown.parentElement.style.zIndex = "99999";
    }

    // Direct event listener on the dropdown for instant response
    fontDropdown.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation(); // Stops event bubbling completely
        
        const clickedFontItem = e.target.closest(".font-item");
        
        if (clickedFontItem) {
            // Option was clicked inside the dropdown
            Array.from(wmFontList.children).forEach(i => i.classList.remove("active"));
            clickedFontItem.classList.add("active");
            selectedFont = clickedFontItem.getAttribute("data-font");
            selectedFontText.innerText = clickedFontItem.innerText;
            selectedFontText.style.fontFamily = clickedFontItem.style.fontFamily;
            fontDropdown.classList.remove("open");
        } else {
            // Dropdown main body was clicked to open/close
            fontDropdown.classList.toggle("open");
        }
    });

    // Close when tapping anywhere else outside (Desktop)
    document.addEventListener("click", (e) => {
        if (fontDropdown.classList.contains("open") && !fontDropdown.contains(e.target)) {
            fontDropdown.classList.remove("open");
        }
    });
    
    // Close when tapping anywhere else outside (Mobile strict fallback)
    document.addEventListener("touchstart", (e) => {
        if (fontDropdown.classList.contains("open") && !fontDropdown.contains(e.target)) {
            fontDropdown.classList.remove("open");
        }
    }, { passive: true });
}

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

const colorPicker = new iro.ColorPicker("#iroPickerContainer", { width: 220, color: "#ffffff", borderWidth: 1, borderColor: "#00e676", layout: [ { component: iro.ui.Box }, { component: iro.ui.Slider, options: { sliderType: 'hue' } } ] });
bgMode.onchange = () => { if (bgMode.value === "custom") customColorSection.style.display = "block"; else { customColorSection.style.display = "none"; closeColorPopup(); } };
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
// CORE PREVIEW FUNCTIONS & SORTABLE FIX
// ==========================================

// 🔥 UPDATED SORTABLE.JS FOR LOW-END DEVICES 🔥
const sortable = new Sortable(previewBox, {
  animation: 250, // Smoother animation time
  easing: "cubic-bezier(0.25, 1, 0.5, 1)", 
  scroll: true, 
  forceFallback: true, // Forces custom rendering to avoid native mobile drag bugs
  fallbackClass: "sortable-fallback", // Added optimized CSS class
  ghostClass: "sortable-ghost", // Added optimized CSS class
  dragClass: "sortable-drag",
  scrollSensitivity: 80, 
  scrollSpeed: 20, 
  fallbackOnBody: true, 
  fallbackTolerance: 5, // Prevents accidental drag on scroll
  delay: 150, // Lower delay for quick tap-and-drag response
  delayOnTouchOnly: true, 
  touchStartThreshold: 5, 
  emptyInsertThreshold: 8,
  draggable: ".image-card", 
  
  onEnd: function(evt) { 
    if (evt.oldIndex === evt.newIndex) return;

    // 1. Array Update - Backend state sync
    const moved = images.splice(evt.oldIndex, 1)[0]; 
    images.splice(evt.newIndex, 0, moved); 
    
    // 2. DOM Manipulation FIX - Skip Full re-render (renderPreview) completely!
    // Instead, dynamically update the visible labels based on their new HTML order.
    const cards = previewBox.querySelectorAll(".image-card");
    cards.forEach((card, i) => {
        // Update visual text numbers
        const badge = card.querySelector(".page-badge");
        const pageNum = card.querySelector(".page-number");
        if (badge) badge.innerText = `Page ${i + 1}`;
        if (pageNum) pageNum.innerText = `Page ${i + 1}`;

        // Re-assign the correct index to the delete button closure
        const deleteBtn = card.querySelector(".delete");
        if (deleteBtn) {
            deleteBtn.onclick = (e) => { 
                e.stopPropagation(); 
                imageIndexToDelete = i; 
                deleteConfirmPopup.style.display = "flex"; 
            };
        }
    });
  }
});

const handleFileInput = (e) => {
  if (!e.target.files.length) return;
  [...e.target.files].forEach(file => { images.push({ file, url: URL.createObjectURL(file), rotation: 0 }); });
  renderPreview(); fileLabelText.innerText = "Add More Files"; e.target.value = ""; 
};
fileInput.onchange = handleFileInput;
if (cameraInput) cameraInput.onchange = handleFileInput;

function renderPreview() {
  previewBox.innerHTML = "";
  if (!images.length) {
    previewBox.innerHTML = `<div class="preview-empty">No file selected</div><div class="preview-advice">Select file or Drag and Drop file here</div>`;
    fileLabelText.innerText = "Select File";
    return;
  }
  const fragment = document.createDocumentFragment();
  images.forEach((img, index) => {
    const card = document.createElement("div");
    card.className = "image-card";
    card.innerHTML = `
      <div class="page-badge">Page ${index + 1}</div>
      <img class="img-thumb" src="${img.url}" alt="Preview" style="transform:rotate(${img.rotation}deg)">
      <div class="image-overlay">
        <button class="overlay-btn zoom" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg></button>
        <button class="overlay-btn crop" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2v14a2 2 0 0 0 2 2h14"></path><path d="M18 22V8a2 2 0 0 0-2-2H2"></path></svg></button>
        <button class="overlay-btn rotate" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg></button>
        <button class="overlay-btn delete" type="button" style="background:#ff5252; color:#fff; border:none;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
      </div>
      <div class="file-name">${img.file.name}</div>
      <div class="page-number">Page ${index + 1}</div>
    `;
    card.querySelector(".zoom").onclick = (e) => { e.stopPropagation(); openZoom(img); };
    card.querySelector(".crop").onclick = (e) => { e.stopPropagation(); openCropper(img); };
    card.querySelector(".rotate").onclick = (e) => { e.stopPropagation(); img.rotation += 90; renderPreview(); };
    card.querySelector(".delete").onclick = (e) => { e.stopPropagation(); imageIndexToDelete = index; deleteConfirmPopup.style.display = "flex"; };
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
    <div class="crop-tilt-wrapper">
        <div class="crop-tilt-header"><label>Tilt: <span id="tiltVal">0</span>°</label><div class="step-input-group"><label for="tiltStepInput">Step:</label><input type="number" id="tiltStepInput" value="1" min="0.1" max="90" step="0.1"><span>°</span></div></div>
        <div class="crop-tilt-controls"><button type="button" id="btnTiltMinus" class="tilt-step-btn">-1°</button><input type="range" id="tiltSlider" min="-180" max="180" value="0" step="0.1"><button type="button" id="btnTiltPlus" class="tilt-step-btn">+1°</button><button id="resetTiltBtn" type="button" class="reset-tilt-btn">Reset</button></div>
    </div>
    <div class="crop-actions"><button type="button" class="crop-btn cancel-btn">Cancel</button><button type="button" class="crop-btn save-btn">Save Crop</button></div>
  `;
  document.body.appendChild(modal);
  
  const imageElement = modal.querySelector("#cropImage");
  const tempImg = new Image();
  tempImg.src = img.url;
  tempImg.onload = () => {
    const tempCanvas = document.createElement('canvas'); const tempCtx = tempCanvas.getContext('2d');
    const isSideways = (img.rotation / 90) % 2 !== 0;  const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(tempImg.width, tempImg.height));
    tempCanvas.width = (isSideways ? tempImg.height : tempImg.width) * scale; tempCanvas.height = (isSideways ? tempImg.width : tempImg.height) * scale;
    tempCtx.scale(scale, scale); tempCtx.translate(tempCanvas.width / (2 * scale), tempCanvas.height / (2 * scale));
    tempCtx.rotate((img.rotation * Math.PI) / 180); tempCtx.drawImage(tempImg, -tempImg.width / 2, -tempImg.height / 2);
    imageElement.src = tempCanvas.toDataURL("image/jpeg", 0.85);

    const cropper = new Cropper(imageElement, { viewMode: 1, autoCropArea: 1, background: false, responsive: true, checkOrientation: false });
    const tiltSlider = modal.querySelector("#tiltSlider"), tiltVal = modal.querySelector("#tiltVal"), tiltStepInput = modal.querySelector("#tiltStepInput"), btnTiltMinus = modal.querySelector("#btnTiltMinus"), btnTiltPlus = modal.querySelector("#btnTiltPlus"), resetTiltBtn = modal.querySelector("#resetTiltBtn");
    let currentTilt = 0;
    function updateTiltUI() { if (currentTilt > 180) currentTilt = 180; if (currentTilt < -180) currentTilt = -180; tiltSlider.value = currentTilt; tiltVal.innerText = (Math.round(currentTilt * 10) / 10); cropper.rotateTo(currentTilt); }
    tiltStepInput.addEventListener("input", (e) => { let step = parseFloat(e.target.value) || 1; btnTiltMinus.innerText = "-" + step + "°"; btnTiltPlus.innerText = "+" + step + "°"; });
    btnTiltMinus.addEventListener("click", () => { let step = parseFloat(tiltStepInput.value) || 1; currentTilt -= step; updateTiltUI(); });
    btnTiltPlus.addEventListener("click", () => { let step = parseFloat(tiltStepInput.value) || 1; currentTilt += step; updateTiltUI(); });
    tiltSlider.addEventListener("input", (e) => { currentTilt = parseFloat(e.target.value); updateTiltUI(); });
    resetTiltBtn.addEventListener("click", () => { currentTilt = 0; updateTiltUI(); });
    modal.querySelector(".save-btn").onclick = () => {
      const croppedCanvas = cropper.getCroppedCanvas({ imageSmoothingEnabled: true, imageSmoothingQuality: 'medium' });
      croppedCanvas.toBlob((blob) => { URL.revokeObjectURL(img.url); img.url = URL.createObjectURL(blob); img.rotation = 0; cropper.destroy(); modal.remove(); renderPreview(); }, "image/jpeg", 0.9);
    };
  };
  modal.querySelector(".cancel-btn").onclick = () => modal.remove();
}

function compressImage(imgObj, quality, maxRes = null) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas"); const ctx = canvas.getContext("2d");
      let MAX_RESOLUTION = maxRes !== null ? maxRes : (quality >= 0.9 ? 3000 : (quality >= 0.6 ? 1600 : 900));
      let targetWidth = img.width, targetHeight = img.height;
      if (targetWidth > MAX_RESOLUTION || targetHeight > MAX_RESOLUTION) { const scaleFactor = MAX_RESOLUTION / Math.max(targetWidth, targetHeight); targetWidth = Math.round(targetWidth * scaleFactor); targetHeight = Math.round(targetHeight * scaleFactor); }
      const isSideways = (imgObj.rotation / 90) % 2 !== 0; canvas.width = isSideways ? targetHeight : targetWidth; canvas.height = isSideways ? targetWidth : targetHeight;
      let bgColor = (bgMode.value === "black") ? "#000000" : (bgMode.value === "custom" ? colorPicker.color.hexString : "#ffffff");
      ctx.fillStyle = bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.translate(canvas.width / 2, canvas.height / 2); ctx.rotate((imgObj.rotation * Math.PI) / 180);
      if (bwToggle.checked) ctx.filter = 'grayscale(100%)';
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = quality >= 0.9 ? 'high' : 'medium';
      ctx.drawImage(img, -targetWidth / 2, -targetHeight / 2, targetWidth, targetHeight); ctx.filter = 'none';
      let finalQuality = quality >= 0.9 ? 0.95 : quality;
      resolve({ data: canvas.toDataURL("image/jpeg", finalQuality), width: canvas.width, height: canvas.height });
    };
    img.src = imgObj.url;
  });
}

async function compressToTarget(imgObj, targetBytes) {
  let minQ = 0.05, maxQ = 1.0, bestData = null, bestDiff = Infinity, TARGET_MAX_RES = 1600; 
  for(let i=0; i<6; i++) {
    let q = (minQ + maxQ) / 2; let res = await compressImage(imgObj, q, TARGET_MAX_RES);
    let bytes = Math.round((res.data.length - 22) * 0.75); let diff = Math.abs(bytes - targetBytes);
    if(diff < bestDiff) { bestDiff = diff; bestData = res; }
    if(bytes > targetBytes) maxQ = q; else minQ = q; 
  }
  return bestData;
}

// ==========================================
// AES-256 ENCRYPTION HELPER
// ==========================================
function encryptPdfBlob(blob, userPass, ownerPass, allowPrint, allowCopy, allowModify) {
    return new Promise(async (resolve, reject) => {
        try {
            const arrayBuffer = await blob.arrayBuffer();
            const worker = new Worker('../js/tools/protect-pdf/protect-worker.js');

            const timeout = setTimeout(() => {
                worker.terminate();
                reject(new Error("Encryption Engine timed out."));
            }, 20000);

            worker.onmessage = function(e) {
                const data = e.data;
                if (data.type === 'READY') {
                    worker.postMessage({
                        type: 'ENCRYPT',
                        arrayBuffer: arrayBuffer,
                        userPassword: userPass,
                        ownerPassword: ownerPass,
                        permPrint: allowPrint,
                        permCopy: allowCopy,
                        permModify: allowModify
                    }, [arrayBuffer]);
                } else if (data.type === 'SUCCESS') {
                    clearTimeout(timeout);
                    const encryptedBlob = new Blob([data.encryptedBuffer], { type: 'application/pdf' });
                    worker.terminate();
                    resolve(encryptedBlob);
                } else if (data.type === 'ERROR') {
                    clearTimeout(timeout);
                    worker.terminate();
                    reject(new Error(data.message));
                }
            };

            worker.onerror = function(err) {
                clearTimeout(timeout);
                worker.terminate();
                reject(new Error("Worker failed to load. Check paths."));
            };
        } catch (err) {
            reject(err);
        }
    });
}

// ==========================================
// PDF GENERATION LOGIC
// ==========================================
generateBtn.onclick = async () => {
  if (!images.length) return alert("Select images first");

  // Pre-check for Password if protection is enabled
  if (enableProtectionToggle && enableProtectionToggle.checked) {
      if (!userPassword.value || userPassword.value.trim() === "") {
          return alert("Please enter a Document Open Password to protect your PDF!");
      }
  }

  if (wmToggle.checked) {
    if (wmType.value === 'image' && !wmOriginalImageObj) return alert("Please select a Logo Image for Watermark!");
    if (wmType.value === 'text' && !wmTextInput.value.trim()) return alert("Please enter text for the Watermark!");
  }

  const isTargetMode = qualitySelect.value === 'target';
  let targetBytesPerImage = 0;
  if (isTargetMode) {
    const targetKb = parseFloat(targetSizeInput.value);
    if (!targetKb || targetKb <= 0) return alert("Please enter a valid target size in KB!");
    targetBytesPerImage = Math.max(1024, (targetKb * 1024) - 10240) / images.length;
  }
  
  const staticQuality = isTargetMode ? 0.7 : parseFloat(qualitySelect.value); 
  const isBatchMode = batchToggle.checked;
  const isAutoFill = autoFillToggle.checked; 
  
  generateBtn.disabled = true; loader.style.display = "inline-block"; outputBox.innerHTML = "Initializing Engine...";
  downloadBtn.disabled = true; previewBtn.disabled = true;
  if (shareBtn) shareBtn.style.display = "none"; // Hide Share button until successful generation
  progressContainer.style.display = "block"; progressBar.style.width = "0%"; progressText.innerText = "0%";

  if (isPreviewOpen) { outputBox.innerHTML = "Initializing Engine..."; isPreviewOpen = false; previewBtn.innerText = "Preview PDF"; }

  const formatSize = pageSizeSelect.value, orientationVal = orientation.value, margin = +marginInput.value, fit = fitMode.value, isBW = bwToggle.checked;
  const addPageNumbers = pageNumToggle.checked, pageNumberPosition = pageNumPos.value, pageNumberSizeVal = 18, pageNumberColorHex = fontColorPicker.color.hexString;
  const addWatermark = wmToggle.checked, wmMosaicVal = wmMosaicToggle.checked, wmDensityValNum = parseInt(wmDensity.value), wmTypeVal = wmType.value, wmTextVal = wmTextInput.value.trim(), wmPosVal = wmPos.value, wmSizeVal = wmSize.value / 100, wmOpacityVal = wmOpacity.value / 100, wmAngleVal = wmAngle.value, wmColorHexVal = wmColorPicker.color.hexString;
  const pdfBgColorHex = (bgMode.value === "black") ? "#000000" : (bgMode.value === "custom" ? colorPicker.color.hexString : "#ffffff");
  let finalWmImageBase64 = null, finalWmImageAspect = 1;
  
  if (addWatermark && wmTypeVal === 'image' && wmOriginalImageObj) {
      const canvas = document.createElement("canvas"); const ctx = canvas.getContext("2d");
      let tw = wmOriginalImageObj.width, th = wmOriginalImageObj.height;
      const MAX_WM_SIZE = 800;
      if (tw > MAX_WM_SIZE || th > MAX_WM_SIZE) { const scale = MAX_WM_SIZE / Math.max(tw, th); tw *= scale; th *= scale; }
      canvas.width = tw; canvas.height = th;
      if (isBW) ctx.filter = 'grayscale(100%)';
      ctx.drawImage(wmOriginalImageObj, 0, 0, tw, th); ctx.filter = 'none';
      finalWmImageBase64 = canvas.toDataURL("image/png"); finalWmImageAspect = tw / th;
  }

  try {
    const workerCode = `
      importScripts("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      let pdf = null;
      self.onmessage = function(e) {
        const { action, payload } = e.data;
        try {
          if (action === "addPage") {
            const { images, isFirst, formatSize, orientationVal, margin, fit, index, bgColorHex, isBW, addPageNumbers, fontColorHex, fontPos, fontNumSize, addWatermark, wmMosaic, wmDensity, wmType, wmText, wmImage, wmImageAspect, wmPos, wmSize, wmOpacity, wmAngle, wmColorHex, wmFont, wmBold, wmItalic } = payload;
            const { jsPDF } = self.jspdf;
            let pw, ph;
            
            if (formatSize === "original") {
              let img = images[0]; pw = img.imgWidth + (margin * 2); ph = img.imgHeight + (margin * 2);
              const imgOrientation = pw > ph ? "landscape" : "portrait";
              const imgType = img.data.startsWith("data:image/png") ? "PNG" : "JPEG";
              if (isFirst) pdf = new jsPDF({ format: [pw, ph], orientation: imgOrientation, unit: "pt" }); else pdf.addPage([pw, ph], imgOrientation);
              pdf.setFillColor(bgColorHex); pdf.rect(0, 0, pw, ph, "F");
              pdf.addImage(img.data, imgType, margin, margin, img.imgWidth, img.imgHeight);
            } else {
              if (isFirst) pdf = new jsPDF({ format: formatSize, orientation: orientationVal, unit: "pt" }); else pdf.addPage(formatSize, orientationVal);
              pw = pdf.internal.pageSize.getWidth(); ph = pdf.internal.pageSize.getHeight();
              pdf.setFillColor(bgColorHex); pdf.rect(0, 0, pw, ph, "F");
              for(let i=0; i<images.length; i++) {
                 let img = images[i]; const imgType = img.data.startsWith("data:image/png") ? "PNG" : "JPEG";
                 if(img.isOriginal) {
                    let w = pw - margin * 2; let h = w * (img.imgHeight / img.imgWidth);
                    if (fit === "height") { h = ph - margin * 2; w = h * (img.imgWidth / img.imgHeight); }
                    else if (fit === "auto") { const imgAspect = img.imgWidth / img.imgHeight; const pageAspect = (pw - margin * 2) / (ph - margin * 2); if (imgAspect > pageAspect) { w = pw - margin * 2; h = w / imgAspect; } else { h = ph - margin * 2; w = h * imgAspect; } }
                    let x = (pw - w) / 2; let y = (ph - h) / 2;
                    pdf.addImage(img.data, imgType, x, y, w, h);
                 } else { pdf.addImage(img.data, imgType, img.x, img.y, img.w, img.h); }
              }
            }

            if (addWatermark) {
              pdf.saveGraphicsState();
              try { pdf.setGState(new self.jspdf.GState({opacity: parseFloat(wmOpacity)})); } catch (e) { console.log("GState not supported"); }
              let wmPad = Math.max(20, margin);
              if (wmType === 'text' && wmText) {
                pdf.setTextColor(wmColorHex);
                let fontStyle = "normal"; if(wmBold && wmItalic) fontStyle = "bolditalic"; else if(wmBold) fontStyle = "bold"; else if(wmItalic) fontStyle = "italic";
                pdf.setFont(wmFont, fontStyle);
                let targetW = pw * wmSize * 1.5; let wmFontSize = targetW / Math.max(1, wmText.length * 0.4); wmFontSize = Math.min(wmFontSize, ph * 0.7); 
                pdf.setFontSize(wmFontSize);
                if (wmMosaic) {
                    let steps = Math.max(2, parseInt(wmDensity)); let stepX = pw / steps; let stepY = ph / steps;
                    for (let r = -1; r <= steps + 1; r++) { for (let c = -1; c <= steps + 1; c++) { let posX = c * stepX; let posY = r * stepY; if (r % 2 !== 0) posX += stepX / 2; pdf.text(wmText, posX, posY, { align: 'center', baseline: 'middle', angle: parseFloat(wmAngle) }); } }
                } else {
                    let posX, posY; let alignVal = "center"; let baseLineVal = "middle";
                    switch(wmPos) { case "center": posX = pw/2; posY = ph/2; break; case "bottom-center": posX = pw/2; posY = ph - wmPad; baseLineVal = "bottom"; break; case "bottom-right": posX = pw - wmPad; posY = ph - wmPad; alignVal = "right"; baseLineVal = "bottom"; break; case "bottom-left": posX = wmPad; posY = ph - wmPad; alignVal = "left"; baseLineVal = "bottom"; break; case "top-center": posX = pw/2; posY = wmPad; baseLineVal = "top"; break; case "top-right": posX = pw - wmPad; posY = wmPad; alignVal = "right"; baseLineVal = "top"; break; case "top-left": posX = wmPad; posY = wmPad; alignVal = "left"; baseLineVal = "top"; break; }
                    pdf.text(wmText, posX, posY, { align: alignVal, baseline: baseLineVal, angle: parseFloat(wmAngle) });
                }
              } else if (wmType === 'image' && wmImage) {
                let maxW = (pw - wmPad * 2) * wmSize; let maxH = (ph - wmPad * 2) * wmSize;
                let imgW = maxW; let imgH = imgW / wmImageAspect;
                if (imgH > maxH) { imgH = maxH; imgW = imgH * wmImageAspect; }
                if (wmMosaic) {
                    let steps = Math.max(2, parseInt(wmDensity)); let stepX = pw / steps; let stepY = ph / steps;
                    for (let r = -1; r <= steps + 1; r++) { for (let c = -1; c <= steps + 1; c++) { let posX = c * stepX; let posY = r * stepY; if (r % 2 !== 0) posX += stepX / 2; let drawX = posX - (imgW / 2); let drawY = posY - (imgH / 2); pdf.addImage(wmImage, 'PNG', drawX, drawY, imgW, imgH); } }
                } else {
                    let posX, posY;
                    switch(wmPos) { case "center": posX = (pw - imgW)/2; posY = (ph - imgH)/2; break; case "bottom-center": posX = (pw - imgW)/2; posY = ph - wmPad - imgH; break; case "bottom-right": posX = pw - wmPad - imgW; posY = ph - wmPad - imgH; break; case "bottom-left": posX = wmPad; posY = ph - wmPad - imgH; break; case "top-center": posX = (pw - imgW)/2; posY = wmPad; break; case "top-right": posX = pw - wmPad - imgW; posY = wmPad; break; case "top-left": posX = wmPad; posY = wmPad; break; }
                    pdf.addImage(wmImage, 'PNG', posX, posY, imgW, imgH);
                }
              }
              pdf.restoreGraphicsState();
            }

            if (addPageNumbers) {
              pdf.setFont("helvetica", "normal"); pdf.setFontSize(fontNumSize || 18); pdf.setTextColor(fontColorHex); 
              let xPos, yPos, alignVal; let pad = Math.max(15, margin);
              switch(fontPos) { case "bottom-center": xPos = pw / 2; yPos = ph - pad; alignVal = "center"; break; case "bottom-right": xPos = pw - pad; yPos = ph - pad; alignVal = "right"; break; case "bottom-left": xPos = pad; yPos = ph - pad; alignVal = "left"; break; case "top-center": xPos = pw / 2; yPos = pad + 15; alignVal = "center"; break; case "top-right": xPos = pw - pad; yPos = pad + 15; alignVal = "right"; break; case "top-left": xPos = pad; yPos = pad + 15; alignVal = "left"; break; }
              pdf.text("Page - " + (index + 1), xPos, yPos, { align: alignVal });
            }
            self.postMessage({ type: "pageAdded", index: index });
          } else if (action === "finish") {
            const blob = pdf.output("blob"); self.postMessage({ type: "done", blob: blob }); pdf = null;
          }
        } catch (error) { self.postMessage({ type: "error", error: error.message }); }
      };
    `;

    const workerBlob = new Blob([workerCode], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(workerBlob);
    const pdfWorker = new Worker(workerUrl);

    const addPageToPDF = (payload) => {
        return new Promise((resolve, reject) => {
            const handler = (e) => {
                if (e.data.type === "pageAdded") { pdfWorker.removeEventListener("message", handler); resolve(); } 
                else if (e.data.type === "error") { pdfWorker.removeEventListener("message", handler); reject(new Error(e.data.error)); }
            };
            pdfWorker.addEventListener("message", handler); pdfWorker.postMessage({ action: "addPage", payload });
        });
    };

    const finishPDF = () => {
        return new Promise((resolve, reject) => {
            const handler = (e) => {
                if (e.data.type === "done") { pdfWorker.removeEventListener("message", handler); resolve(e.data.blob); } 
                else if (e.data.type === "error") { pdfWorker.removeEventListener("message", handler); reject(new Error(e.data.error)); }
            };
            pdfWorker.addEventListener("message", handler); pdfWorker.postMessage({ action: "finish" });
        });
    };

    if (isBatchMode) {
      for (let i = 0; i < images.length; i++) {
        outputBox.innerHTML = `Batch Processing Image ${i + 1} of ${images.length}...`;
        let compressedRes;
        if (isTargetMode) compressedRes = await compressToTarget(images[i], targetBytesPerImage);
        else {
          let resLimit = 1600; if (staticQuality >= 0.9) resLimit = 3000; else if (staticQuality >= 0.6) resLimit = 1600; else resLimit = 900;
          compressedRes = await compressImage(images[i], staticQuality, resLimit);
        }
        const { data, width, height } = compressedRes;
        let currentPageImages = [{ data, imgWidth: width, imgHeight: height, isOriginal: true }];
        
        await addPageToPDF({
            images: currentPageImages, isFirst: true, formatSize: formatSize, orientationVal: orientationVal, margin: margin, fit: fit, index: 0, 
            bgColorHex: pdfBgColorHex, isBW: isBW, addPageNumbers: addPageNumbers, fontColorHex: pageNumberColorHex, fontPos: pageNumberPosition, fontNumSize: pageNumberSizeVal,
            addWatermark: addWatermark, wmType: wmTypeVal, wmText: wmTextVal, wmImage: finalWmImageBase64, wmImageAspect: finalWmImageAspect, wmPos: wmPosVal, wmSize: wmSizeVal, wmOpacity: wmOpacityVal, wmAngle: wmAngleVal, wmColorHex: wmColorHexVal, wmFont: selectedFont, wmBold: wmFormats.bold, wmItalic: wmFormats.italic, wmMosaic: wmMosaicVal, wmDensity: wmDensityValNum
        });

        let singlePdfBlob = await finishPDF();

        if (enableProtectionToggle && enableProtectionToggle.checked && userPassword && userPassword.value) {
            outputBox.innerHTML = `Encrypting Image ${i + 1} with AES-256...`;
            try {
                singlePdfBlob = await encryptPdfBlob(
                    singlePdfBlob, 
                    userPassword.value, 
                    ownerPassword ? ownerPassword.value : null, 
                    permPrint ? permPrint.checked : true, 
                    permCopy ? permCopy.checked : true, 
                    permModify ? permModify.checked : true
                );
            } catch (e) {
                console.error(e);
                outputBox.innerHTML = `<span style='color:#ff5252'>Encryption Error on Image ${i + 1}: ${e.message}</span>`;
                continue;
            }
        }

        let originalName = images[i].file.name;
        let baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        let downloadName = baseName + (enableProtectionToggle && enableProtectionToggle.checked ? "_protected.pdf" : ".pdf");

        const url = URL.createObjectURL(singlePdfBlob);
        const a = document.createElement("a"); a.href = url; a.download = downloadName; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        const percentDone = Math.round(((i + 1) / images.length) * 100);
        progressBar.style.width = percentDone + "%"; progressText.innerText = percentDone + "%";
        await new Promise(resolve => setTimeout(resolve, 800)); 
      }
      
      pdfWorker.terminate(); URL.revokeObjectURL(workerUrl);
      progressBar.style.width = "100%"; progressText.innerText = "100%";
      outputBox.innerHTML = `
        <div class="success-card">
            <div class="success-header">🎉 Batch Conversion Complete!</div>
            <p style="color: #b2ebf2; font-size: 0.95rem;">All individual PDF files have been generated ${enableProtectionToggle.checked ? 'and encrypted' : ''} successfully.</p>
            <div class="stats-grid"><div class="stat-box"><div class="stat-value highlight" id="animTotalFiles">0</div><div class="stat-label">PDFs Created</div></div></div>
        </div>
      `;
      animateValue("animTotalFiles", 0, images.length, 1500, "");
      if (window.confetti) confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#00e676', '#b2ebf2', '#ffffff'] });

      downloadBtn.disabled = true; previewBtn.disabled = true;  
    } else {
      let currentPageImages = []; let currentX = margin; let currentY = margin; let rowHeight = 0; let pageIndex = 0;
      let pw = 0, ph = 0;
      if (formatSize !== 'original') {
          const sizes = { a4: {w:595.28, h:841.89}, a3: {w:841.89, h:1190.55}, letter: {w:612, h:792} };
          pw = sizes[formatSize].w; ph = sizes[formatSize].h;
          if (orientationVal === 'landscape') { pw = sizes[formatSize].h; ph = sizes[formatSize].w; }
      }

      for (let i = 0; i < images.length; i++) {
        outputBox.innerHTML = `Processing Image ${i + 1} of ${images.length}...`;
        let compressedRes;
        if (isTargetMode) compressedRes = await compressToTarget(images[i], targetBytesPerImage);
        else {
          let resLimit = 1600; if (staticQuality >= 0.9) resLimit = 3000; else if (staticQuality >= 0.6) resLimit = 1600; else resLimit = 900;
          compressedRes = await compressImage(images[i], staticQuality, resLimit);
        }
        const { data, width, height } = compressedRes;
        if (isAutoFill && formatSize !== 'original') {
            let printW = width; let printH = height; let maxAllowedW = pw - margin * 2; let maxAllowedH = ph - margin * 2;
            if (printW > maxAllowedW) { let ratio = maxAllowedW / printW; printW = maxAllowedW; printH = printH * ratio; }
            if (printH > maxAllowedH) { let ratio = maxAllowedH / printH; printH = maxAllowedH; printW = printW * ratio; }
            if (currentPageImages.length > 0 && currentX + printW > pw - margin) { currentX = margin; currentY += rowHeight + margin; rowHeight = 0; }
            if (currentPageImages.length > 0 && currentY + printH > ph - margin) {
                await addPageToPDF({ images: currentPageImages, isFirst: (pageIndex === 0), formatSize: formatSize, orientationVal: orientationVal, margin: margin, fit: fit, index: pageIndex, bgColorHex: pdfBgColorHex, isBW: isBW, addPageNumbers: addPageNumbers, fontColorHex: pageNumberColorHex, fontPos: pageNumberPosition, fontNumSize: pageNumberSizeVal, addWatermark: addWatermark, wmType: wmTypeVal, wmText: wmTextVal, wmImage: finalWmImageBase64, wmImageAspect: finalWmImageAspect, wmPos: wmPosVal, wmSize: wmSizeVal, wmOpacity: wmOpacityVal, wmAngle: wmAngleVal, wmColorHex: wmColorHexVal, wmFont: selectedFont, wmBold: wmFormats.bold, wmItalic: wmFormats.italic, wmMosaic: wmMosaicVal, wmDensity: wmDensityValNum });
                pageIndex++; currentPageImages = []; currentX = margin; currentY = margin; rowHeight = 0;
            }
            currentPageImages.push({ data, x: currentX, y: currentY, w: printW, h: printH, isOriginal: false }); currentX += printW + margin; rowHeight = Math.max(rowHeight, printH);
        } else {
            currentPageImages = [{ data, imgWidth: width, imgHeight: height, isOriginal: true }];
            await addPageToPDF({ images: currentPageImages, isFirst: (pageIndex === 0), formatSize: formatSize, orientationVal: orientationVal, margin: margin, fit: fit, index: pageIndex, bgColorHex: pdfBgColorHex, isBW: isBW, addPageNumbers: addPageNumbers, fontColorHex: pageNumberColorHex, fontPos: pageNumberPosition, fontNumSize: pageNumberSizeVal, addWatermark: addWatermark, wmType: wmTypeVal, wmText: wmTextVal, wmImage: finalWmImageBase64, wmImageAspect: finalWmImageAspect, wmPos: wmPosVal, wmSize: wmSizeVal, wmOpacity: wmOpacityVal, wmAngle: wmAngleVal, wmColorHex: wmColorHexVal, wmFont: selectedFont, wmBold: wmFormats.bold, wmItalic: wmFormats.italic, wmMosaic: wmMosaicVal, wmDensity: wmDensityValNum });
            pageIndex++; currentPageImages = [];
        }
        const percentDone = Math.round(((i + 1) / images.length) * 100);
        progressBar.style.width = percentDone + "%"; progressText.innerText = percentDone + "%";
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      if (currentPageImages.length > 0) {
          await addPageToPDF({ images: currentPageImages, isFirst: (pageIndex === 0), formatSize: formatSize, orientationVal: orientationVal, margin: margin, fit: fit, index: pageIndex, bgColorHex: pdfBgColorHex, isBW: isBW, addPageNumbers: addPageNumbers, fontColorHex: pageNumberColorHex, fontPos: pageNumberPosition, fontNumSize: pageNumberSizeVal, addWatermark: addWatermark, wmType: wmTypeVal, wmText: wmTextVal, wmImage: finalWmImageBase64, wmImageAspect: finalWmImageAspect, wmPos: wmPosVal, wmSize: wmSizeVal, wmOpacity: wmOpacityVal, wmAngle: wmAngleVal, wmColorHex: wmColorHexVal, wmFont: selectedFont, wmBold: wmFormats.bold, wmItalic: wmFormats.italic, wmMosaic: wmMosaicVal, wmDensity: wmDensityValNum });
      }
      
      outputBox.innerHTML = "Finalizing PDF...";
      pdfBlob = await finishPDF(); 
      downloadPdfBlob = pdfBlob; 
      
      pdfWorker.terminate(); URL.revokeObjectURL(workerUrl);

      if (enableProtectionToggle && enableProtectionToggle.checked && userPassword && userPassword.value) {
          outputBox.innerHTML = "Encrypting PDF with AES-256...";
          try {
              downloadPdfBlob = await encryptPdfBlob(
                  pdfBlob, 
                  userPassword.value, 
                  ownerPassword ? ownerPassword.value : null, 
                  permPrint ? permPrint.checked : true, 
                  permCopy ? permCopy.checked : true, 
                  permModify ? permModify.checked : true
              );
          } catch (e) {
              console.error(e);
              generateBtn.disabled = false; loader.style.display = "none";
              return outputBox.innerHTML = `<span style='color:#ff5252'>Encryption Error: ${e.message}</span>`;
          }
      }

      progressBar.style.width = "100%"; progressText.innerText = "100%";
      const finalMb = downloadPdfBlob.size / (1024 * 1024);
      
      outputBox.innerHTML = `
        <div class="success-card">
            <div class="success-header">🎉 PDF Generated ${enableProtectionToggle.checked ? '& Secured' : ''} Successfully!</div>
            <p style="color: #b2ebf2; font-size: 0.95rem;">Your images have been compiled into a single PDF document.</p>
            <div class="stats-grid">
                <div class="stat-box"><div class="stat-value highlight" id="animTotalPages">0</div><div class="stat-label">Total Images</div></div>
                <div class="stat-box"><div class="stat-value" id="animPdfSize">0</div><div class="stat-label">File Size</div></div>
            </div>
        </div>
      `;
      animateValue("animTotalPages", 0, images.length, 1500, ""); animateValue("animPdfSize", 0, finalMb, 1500, "MB", true);
      if (window.confetti) confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#00e676', '#b2ebf2', '#ffffff'] });

      // Reveal buttons
      downloadBtn.disabled = false; 
      previewBtn.disabled = false;
      if (shareBtn) {
          shareBtn.style.display = "inline-flex";
          shareBtn.disabled = false;
      }
    }
  } catch (err) {
    console.error(err); outputBox.innerHTML = `<span style='color:#ff5252'>Error: ${err.message || "Memory Error! Try lower quality."}</span>`; progressContainer.style.display = "none";
  } finally {
    generateBtn.disabled = false; loader.style.display = "none";
  }
};

previewBtn.onclick = async () => {
  if (!pdfBlob) return alert("Generate PDF first");

  if (isPreviewOpen) {
    const finalMb = downloadPdfBlob.size / (1024 * 1024);
    outputBox.innerHTML = `
      <div class="success-card">
          <div class="success-header">🎉 PDF Generated ${enableProtectionToggle && enableProtectionToggle.checked ? '& Secured' : ''} Successfully!</div>
          <p style="color: #b2ebf2; font-size: 0.95rem;">Your images have been compiled into a single PDF document.</p>
          <div class="stats-grid"><div class="stat-box"><div class="stat-value highlight">${images.length}</div><div class="stat-label">Total Images</div></div><div class="stat-box"><div class="stat-value">${finalMb.toFixed(2)} <span style='font-size:0.5em'>MB</span></div><div class="stat-label">File Size</div></div></div>
      </div>
    `;
    isPreviewOpen = false; previewBtn.innerText = "Preview PDF";
    return;
  }
  
  outputBox.innerHTML = "";
  const loaderDiv = document.createElement("div"); loaderDiv.style.width = "100%"; loaderDiv.style.maxWidth = "500px"; loaderDiv.style.margin = "0 auto";
  loaderDiv.innerHTML = `<div class="progress-info" style="margin-top: 10px;"><span>Rendering Preview...</span><span id="previewProgressText">0%</span></div><div class="progress-track"><div id="previewProgressBar" class="progress-bar"></div></div>`;
  outputBox.appendChild(loaderDiv);

  isPreviewOpen = true; previewBtn.innerText = "Close Preview";
  
  try {
    await new Promise(r => setTimeout(r, 50));
    
    const arrayBuffer = await pdfBlob.arrayBuffer(); 
    const typedArray = new Uint8Array(arrayBuffer);
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const loadingTask = pdfjsLib.getDocument({ data: typedArray });
    const pdf = await loadingTask.promise;

    if (!isPreviewOpen) return;
    const container = document.createElement("div"); container.id = "pdfViewerContainer"; container.style.display = "flex"; container.style.flexDirection = "column"; container.style.gap = "15px"; container.style.maxHeight = "65vh"; container.style.overflowY = "auto"; container.style.alignItems = "center"; container.style.padding = "10px"; container.style.background = "rgba(0, 0, 0, 0.2)"; container.style.borderRadius = "12px";
    const outputScale = window.devicePixelRatio || 1;

    for (let i = 1; i <= pdf.numPages; i++) {
      if (!isPreviewOpen) break; 
      const page = await pdf.getPage(i);
      const unscaledViewport = page.getViewport({ scale: 1 }); const containerWidth = outputBox.clientWidth > 0 ? outputBox.clientWidth - 30 : window.innerWidth - 60; const scale = containerWidth / unscaledViewport.width; const viewport = page.getViewport({ scale: Math.min(scale, 1.5) }); 
      const canvas = document.createElement("canvas"); const ctx = canvas.getContext("2d");
      canvas.width = Math.floor(viewport.width * outputScale); canvas.height = Math.floor(viewport.height * outputScale); canvas.style.width = Math.floor(viewport.width) + "px"; canvas.style.height = Math.floor(viewport.height) + "px"; canvas.style.maxWidth = "100%"; canvas.style.border = "1px solid #00e676"; canvas.style.borderRadius = "8px"; canvas.style.background = "#fff";
      container.appendChild(canvas);
      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
      await page.render({ canvasContext: ctx, transform: transform, viewport: viewport }).promise;
      const percentDone = Math.round((i / pdf.numPages) * 100); const pBar = document.getElementById("previewProgressBar"); const pText = document.getElementById("previewProgressText");
      if (pBar && pText) { pBar.style.width = percentDone + "%"; pText.innerText = percentDone + "%"; }
      await new Promise(requestAnimationFrame);
    }
    if (isPreviewOpen) { await new Promise(r => setTimeout(r, 200)); outputBox.innerHTML = ""; outputBox.appendChild(container); }
  } catch (err) {
    console.error(err);
    if (isPreviewOpen) { outputBox.innerHTML = `<span style='color:#ff5252'>Preview failed. Please use Download button instead.</span>`; isPreviewOpen = false; previewBtn.innerText = "Preview PDF"; }
  }
};

downloadBtn.onclick = () => {
  let name = fileNameInput.value.trim() || "SArixa-converted";
  if (!name.toLowerCase().endsWith(".pdf")) name += ".pdf";
  
  const url = URL.createObjectURL(downloadPdfBlob); 
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 200);
  
  // Dynamic Confetti Loading (Boosts Initial Performance)
  if (!window.confetti) {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js";
      script.onload = () => {
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#00e676', '#b2ebf2', '#ffffff'] });
      };
      document.body.appendChild(script);
  } else {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#00e676', '#b2ebf2', '#ffffff'] });
  }

  setTimeout(() => { if (window.triggerGlobalRatingPopup) window.triggerGlobalRatingPopup(); }, 1500); 
};

// Share Button Logic
if (shareBtn) {
  shareBtn.onclick = async () => {
    if (!downloadPdfBlob) return alert("Generate PDF first!");
    
    let name = fileNameInput.value.trim() || "SArixa-converted";
    if (!name.toLowerCase().endsWith(".pdf")) name += ".pdf";
    if (enableProtectionToggle && enableProtectionToggle.checked) {
        if (!name.includes("_protected")) name = name.replace(".pdf", "_protected.pdf");
    }
    
    const customMessage = "Here is the PDF document I converted securely using *SArixa* (100% Private, Zero Uploads).";
    
    await sharePdfFile(downloadPdfBlob, name, shareBtn, customMessage);
  };
}