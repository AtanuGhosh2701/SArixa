import { sharePdfFile } from '../sharing-system.js';

const initOrganisePdfTool = () => {
    let pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];

    // ==========================================
    // 1. DYNAMIC SCRIPT & STYLE LOADERS
    // ==========================================
    const loadedScriptPromises = {};
    function loadScriptOnce(src) {
        if (loadedScriptPromises[src]) return loadedScriptPromises[src];
        loadedScriptPromises[src] = new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
        return loadedScriptPromises[src];
    }

    function loadStyleOnce(href) {
        if (document.querySelector(`link[href="${href}"]`)) return;
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = href;
        document.head.appendChild(l);
    }

    async function ensureCorePdfLibsLoaded() {
        await Promise.all([
            window.pdfjsLib ? Promise.resolve() : loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'),
            window.PDFLib ? Promise.resolve() : loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js'),
            window.Sortable ? Promise.resolve() : loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.0/Sortable.min.js')
        ]);
        pdfjsLib = window.pdfjsLib || window['pdfjs-dist/build/pdf'];
        if (pdfjsLib) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }

    async function ensureIroLoaded() {
        if (typeof window.iro === 'undefined') {
            await loadScriptOnce('https://cdn.jsdelivr.net/npm/@jaames/iro@5');
        }
    }

    async function ensureCropperLoaded() {
        loadStyleOnce('https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css');
        if (typeof window.Cropper === 'undefined') {
            await loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js');
        }
    }

    async function ensureConfettiLoaded() {
        if (typeof window.confetti === 'undefined') {
            try { await loadScriptOnce('https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js'); } catch (e) {}
        }
    }

    const runWhenIdle = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));
    runWhenIdle(() => {
        document.querySelectorAll('input, select, button').forEach((el, idx) => {
            if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.textContent.trim()) {
                const fallbackLabel = el.getAttribute('title') || el.getAttribute('placeholder') || el.id || `control-${idx}`;
                el.setAttribute('aria-label', fallbackLabel.replace(/[-_]/g, ' '));
            }
        });
    });

    const fileBtnLabelEl = document.querySelector('label[for="fileInput"]');
    if (fileBtnLabelEl) {
        ['pointerenter', 'pointerdown', 'touchstart'].forEach(ev => {
            fileBtnLabelEl.addEventListener(ev, () => { ensureCorePdfLibsLoaded(); }, { once: true, passive: true });
        });
    }

    const fabColorBtn = document.getElementById('fab-color');
    if (fabColorBtn) fabColorBtn.remove();
    const fabResizeOldBtn = document.getElementById('fab-resize');
    if (fabResizeOldBtn) fabResizeOldBtn.remove();
    const submenuResizeOld = document.getElementById('submenu-resize');
    if (submenuResizeOld) submenuResizeOld.remove();

    const ratingPlaceEl = document.getElementById('rating-placeholder');
    if (ratingPlaceEl) {
        const rObs = new MutationObserver(() => {
            const rPopup = document.getElementById('rating-popup');
            if (rPopup && !rPopup.dataset.initialized) {
                rPopup.dataset.initialized = 'true';
                rPopup.style.display = 'none';
                rObs.disconnect();
            }
        });
        rObs.observe(ratingPlaceEl, { childList: true, subtree: true });
    }

    // ==========================================
    // 2. DOM ELEMENTS & SELECTORS
    // ==========================================
    const fileInput = document.getElementById('fileInput');
    const fileInputLabel = document.getElementById('fileInputLabel');
    const uploadZone = document.getElementById('uploadZone');
    const emptyState = document.getElementById('emptyState');
    const fileCardsContainer = document.getElementById('fileCardsContainer');

    const workspaceSection = document.getElementById('workspaceSection');
    const pdfGrid = document.getElementById('pdf-grid');
    const exportBtn = document.getElementById('export-btn');
    const globalResetBtn = document.getElementById('global-reset-btn');
    const globalWmToggle = document.getElementById('global-wm-toggle');
    const selectAllToggle = document.getElementById('select-all-pages-toggle');
    const selectedCountBadge = document.getElementById('selected-pages-count-badge');
    const pageNumToggle = document.getElementById('pageNumToggle');
    const pageNumSettingsPanel = document.getElementById('page-num-settings-panel');
    const pageNumPos = document.getElementById('pageNumPos');
    const applyPageNumBtn = document.getElementById('apply-page-num-btn');
    const clearPageNumBtn = document.getElementById('clear-page-num-btn');

    const wmSettingsPanel = document.getElementById('wm-settings-panel');
    const wmType = document.getElementById('wmType');
    const wmTextInput = document.getElementById('wmTextInput');
    const fontDropdown = document.getElementById('fontDropdown');
    const selectedFontText = document.getElementById('selectedFontText');
    const wmFontList = document.getElementById('wmFontList');
    const wmFormatBtns = document.querySelectorAll('.wm-format-btn');
    const wmImageInput = document.getElementById('wmImageInput');
    const wmFileNameText = document.getElementById('wmFileNameText');
    const wmMosaicToggle = document.getElementById('wmMosaicToggle');
    const wmPosContainer = document.getElementById('wmPosContainer');
    const wmPos = document.getElementById('wmPos');
    const wmDensity = document.getElementById('wmDensity');
    const wmDensityVal = document.getElementById('wmDensityVal');
    const wmSize = document.getElementById('wmSize');
    const wmSizeVal = document.getElementById('wmSizeVal');
    const wmOpacity = document.getElementById('wmOpacity');
    const wmOpacityVal = document.getElementById('wmOpacityVal');
    const wmAngle = document.getElementById('wmAngle');
    const applyWmSelectedBtn = document.getElementById('apply-wm-selected-btn');
    const clearWmSelectedBtn = document.getElementById('clear-wm-selected-btn');

    const fontColorSwatchBtn = document.getElementById('fontColorSwatchBtn');
    const fontColorPickerPanel = document.getElementById('fontColorPickerPanel');
    const fontColorPopoverOverlay = document.getElementById('fontColorPopoverOverlay');
    const fontClosePickerBtn = document.getElementById('fontClosePickerBtn');
    const fontHexColorPreview = document.getElementById('fontHexColorPreview');
    const fontCustomHex = document.getElementById('fontCustomHex');
    const fontColorOkBtn = document.getElementById('fontColorOkBtn');

    const wmColorSwatchBtn = document.getElementById('wmColorSwatchBtn');
    const wmColorPickerPanel = document.getElementById('wmColorPickerPanel');
    const wmColorPopoverOverlay = document.getElementById('wmColorPopoverOverlay');
    const wmClosePickerBtn = document.getElementById('wmClosePickerBtn');
    const wmHexColorPreview = document.getElementById('wmHexColorPreview');
    const wmCustomHex = document.getElementById('wmCustomHex');
    const wmColorOkBtn = document.getElementById('wmColorOkBtn');

    const pageSearchInput = document.getElementById('page-search-input');
    const pageSearchBtn = document.getElementById('page-search-btn');

    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressStatus = document.getElementById('progressStatus');

    const outputBox = document.getElementById('outputBox');
    const finalActionArea = document.getElementById('finalActionArea');
    const fileNameInput = document.getElementById('fileNameInput');
    const previewBtn = document.getElementById('previewBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const shareBtn = document.getElementById('shareBtn');
    const toast = document.getElementById('toast');

    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const pdfPasswordInput = document.getElementById('pdfPasswordInput');

    let exportedPdfBlob = null;
    let isExportPreviewOpen = false;
    let activePreviewPdfDoc = null;

    const eyeOpenSvg = `<svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    const eyeOffSvg = `<svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

    function showToast(message, type = 'success') {
        if (!toast) return;
        toast.textContent = message;
        toast.className = `toast show ${type === 'error' ? 'error' : ''}`;
        setTimeout(() => { toast.classList.remove('show'); }, 3500);
    }

    function formatBytes(bytes) {
        if (!+bytes) return '0 MB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    function cleanupPreviewResources() {
        if (activePreviewPdfDoc) {
            try { activePreviewPdfDoc.destroy(); } catch (e) {}
            activePreviewPdfDoc = null;
        }
        const existingViewer = document.getElementById('pdfViewerContainer');
        if (existingViewer) {
            existingViewer.querySelectorAll('canvas').forEach(c => { c.width = 1; c.height = 1; });
            existingViewer.remove();
        }
    }

    function hideExportResultArea() {
        if (outputBox) outputBox.style.display = 'none';
        if (finalActionArea) finalActionArea.style.display = 'none';
        cleanupPreviewResources();
        isExportPreviewOpen = false;
        if (previewBtn) previewBtn.innerHTML = "Preview PDF";
        if (shareBtn) shareBtn.disabled = true;
    }

    if (togglePasswordBtn && pdfPasswordInput) {
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

    const floatingToolbar = document.getElementById('floating-toolbar');
    const fabUndo = document.getElementById('fab-undo');
    const fabRedo = document.getElementById('fab-redo');
    const fabAddText = document.getElementById('fab-add-text');
    const fabDuplicate = document.getElementById('fab-duplicate');
    const fabReplace = document.getElementById('fab-replace');
    const fabRotateLeft = document.getElementById('fab-rotate-left');
    const fabRotateRight = document.getElementById('fab-rotate-right');
    const fabExtract = document.getElementById('fab-extract');
    const fabWatermark = document.getElementById('fab-watermark');
    const fabMargins = document.getElementById('fab-margins');
    const fabRemove = document.getElementById('fab-remove');
    const fabReset = document.getElementById('fab-reset');
    const fabCrop = document.getElementById('fab-crop');
    const fabDraw = document.getElementById('fab-draw');
    const fabViewChanges = document.getElementById('fab-view-changes');

    const replaceImageInput = document.getElementById('replaceImageInput');

    const confirmPopup = document.getElementById('confirm-popup');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmDesc = document.getElementById('confirm-desc');
    let confirmCallback = null;

    const duplicatePopup = document.getElementById('duplicate-popup');
    const btnDupChanges = document.getElementById('btn-dup-changes');
    const btnDupOriginal = document.getElementById('btn-dup-original');
    const btnDupCancel = document.getElementById('btn-dup-cancel');

    const replacePopup = document.getElementById('replace-popup');
    const btnReplaceBlank = document.getElementById('btn-replace-blank');
    const btnReplaceImage = document.getElementById('btn-replace-image');
    const btnReplaceCancel = document.getElementById('btn-replace-cancel');

    const pageResetPopup = document.getElementById('page-reset-popup');
    const btnCancelPageReset = document.getElementById('btn-cancel-page-reset');
    const btnConfirmPageReset = document.getElementById('btn-confirm-page-reset');

    const pageRemovePopup = document.getElementById('page-remove-popup');
    const btnCancelPageRemove = document.getElementById('btn-cancel-page-remove');
    const btnConfirmPageRemove = document.getElementById('btn-confirm-page-remove');

    const insertPopup = document.getElementById('insert-popup');
    const btnInsertBlank = document.getElementById('btn-insert-blank');
    const btnInsertImage = document.getElementById('btn-insert-image');
    const btnInsertCancel = document.getElementById('btn-insert-cancel');
    const insertImageInput = document.getElementById('insertImageInput');

    const editorModal = document.getElementById('editor-modal');
    const editorCanvas = document.getElementById('editor-canvas');
    const editorOverlay = document.getElementById('editor-overlay');
    const btnEditorCancel = document.getElementById('editor-cancel');
    const btnEditorSave = document.getElementById('editor-save');
    const btnDetailClose = document.getElementById('detail-close-btn');
    const fabAddMoreTextWrapper = document.getElementById('add-text-btn-wrapper');
    const fabAddMoreTextBtn = document.getElementById('fab-add-more-text');

    const extractHeaderGroup = document.getElementById('extract-header-group');

    const drawHeaderGroup = document.getElementById('draw-header-group');
    const drawFormatToolbar = document.getElementById('draw-format-toolbar');
    const btnDrawCancel = document.getElementById('draw-cancel');
    const btnDrawSave = document.getElementById('draw-save');
    const drawUndoBtn = document.getElementById('draw-undo-btn');
    const drawRedoBtn = document.getElementById('draw-redo-btn');

    const drawColorTriggerBtn = document.getElementById('draw-color-trigger-btn');
    const drawJoystick = document.getElementById('draw-cursor-joystick');
    const djMain = document.getElementById('dj-main');
    const djLine = document.getElementById('dj-line');
    const djHandle = document.getElementById('dj-handle');
    const drawOffsetToggle = document.getElementById('draw-offset-toggle');
    const toolPen = document.getElementById('tool-pen');
    const toolMarker = document.getElementById('tool-marker');
    const toolEraser = document.getElementById('tool-eraser');
    const toolFill = document.getElementById('tool-fill');

    const formatFont = document.getElementById('format-font');
    const formatBold = document.getElementById('format-bold');
    const formatItalic = document.getElementById('format-italic');
    const formatUnderline = document.getElementById('format-underline');
    const formatStrike = document.getElementById('format-strike');
    const alignBtns = document.querySelectorAll('#text-format-toolbar .align-btn');

    const pointerToggle = document.getElementById('pointer-toggle');
    const pointerStyleSelect = document.getElementById('pointer-style-select');

    const formatBgToggle = document.getElementById('format-bg-toggle');
    const bgColorTriggerBtn = document.getElementById('bg-color-trigger-btn');

    const formatBorderToggle = document.getElementById('format-border-toggle');
    const borderColorTriggerBtn = document.getElementById('border-color-trigger-btn');

    const colorTriggerBtn = document.getElementById('color-trigger-btn');
    const customColorModal = document.getElementById('custom-color-modal');
    const colorPopoverOverlay = document.getElementById('colorPopoverOverlay');
    const ccpCloseBtn = document.getElementById('ccp-close-btn');
    const ccpPreviewCircle = document.getElementById('ccp-preview-circle');
    const ccpHexInput = document.getElementById('ccp-hex-input');
    const ccpOkBtn = document.getElementById('ccp-ok-btn');

    // ==========================================
    // 3. STATE MANAGEMENT, DEVICE PROFILE & MEMORY MANAGERS
    // ==========================================
    const DEVICE_PROFILE = (() => {
        const mem = navigator.deviceMemory || 4;
        const cores = navigator.hardwareConcurrency || 4;
        const isMobile = window.innerWidth <= 900 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
        const isLowEnd = mem <= 3 || cores <= 4;
        return {
            isMobile,
            isLowEnd,
            // Ultra-Crisp Thumbnail & Editor Resolution with tight LRU cache
            thumbScale: isLowEnd ? 0.58 : (isMobile ? 0.78 : 0.85),
            maxThumbDim: isLowEnd ? 620 : (isMobile ? 880 : 960),
            thumbQuality: isLowEnd ? 0.88 : 0.92,
            lruMaxEntries: isLowEnd ? 14 : (isMobile ? 22 : (mem >= 8 ? 75 : 50)),
            renderConcurrency: isMobile ? 1 : 2,
            editorDpr: Math.min(window.devicePixelRatio || 1, isLowEnd ? 1.75 : 2.25),
            previewDpr: Math.min(window.devicePixelRatio || 1, isLowEnd ? 1.6 : 2.25),
            exportScale: isLowEnd ? 1.5 : (isMobile ? 1.75 : 2.0),
            maxOverlayDim: isLowEnd ? 1300 : (isMobile ? 1600 : 2200),
            maxEditorDim: isLowEnd ? 1500 : (isMobile ? 2050 : 2500),
            maxUndoHistory: isLowEnd ? 12 : (isMobile ? 18 : 30)
        };
    })();

    const yieldToMain = () => new Promise(resolve => {
        if (typeof window.requestAnimationFrame === 'function' && document.visibilityState === 'visible') {
            requestAnimationFrame(() => setTimeout(resolve, 0));
        } else {
            setTimeout(resolve, 0);
        }
    });

    function releaseCanvasMemory(canvas) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 1;
        canvas.height = 1;
    }

    function canvasToBlob(canvas, mimeType = 'image/jpeg', quality = 0.8) {
        return new Promise((resolve) => {
            if (canvas.toBlob) {
                canvas.toBlob((blob) => {
                    if (blob) return resolve(blob);
                    fetch(canvas.toDataURL(mimeType, quality)).then(r => r.blob()).then(resolve);
                }, mimeType, quality);
            } else {
                fetch(canvas.toDataURL(mimeType, quality)).then(r => r.blob()).then(resolve);
            }
        });
    }

    async function canvasToBlobUrl(canvas, mimeType = 'image/jpeg', quality = 0.8) {
        const blob = await canvasToBlob(canvas, mimeType, quality);
        return ThumbnailCacheManager.registerBlobUrl(URL.createObjectURL(blob));
    }

    async function canvasToArrayBuffer(canvas, mimeType = 'image/png', quality = 0.92) {
        const blob = await canvasToBlob(canvas, mimeType, quality);
        return await blob.arrayBuffer();
    }

    let colorPickerInstance = null;
    let fontColorPicker = null;
    let wmColorPicker = null;
    let activeColorTarget = 'text';

    let activeTextContent = null;
    let editorScale = 1.0;
    let currentImgOffsetX = 0;
    let currentImgOffsetY = 0;
    let currentImgDrawW = 0;
    let currentImgDrawH = 0;

    let isDetailViewOpen = false;
    let isTextEditingOpen = false;
    let isDrawMode = false;
    let isMarginsMode = false;
    let currentPdfRenderTask = null;

    let pdfSources = [];
    let pdfJsDocs = [];
    let originalFileName = "organized.pdf";
    let pagesState = [];
    let historyUndoStack = [];
    let historyRedoStack = [];
    let sortableInstance = null;
    let addedItemCounter = 0;
    let activeInsertPoint = null;

    let selectedPageIds = [];
    let selectedPageId = null;

    let wmOriginalImageDataUrl = null;
    let wmOriginalImageAspect = 1;
    let selectedWmFont = "Arial";
    let wmFormats = { bold: false, italic: false };
    let currentWmColorHex = "#808080";
    let currentPageNumColorHex = "#000000";

    let activeDragTextWrapper = null;
    let textInteractionMode = null;
    let textDragStartX = 0;
    let textDragStartY = 0;
    let textInitialLeft = 0;
    let textInitialTop = 0;
    let textInitialFontSize = 24;
    let textHasDragged = false;
    let textDragRafId = null;

    let drawCanvas = null;
    let drawCtx = null;
    let strokeBufferCanvas = null;
    let strokeBufferCtx = null;
    let activeDrawTool = 'pen';
    let isDraggingMainPoint = false;
    let hasMovedDuringDrag = false;
    let mainPointX = 0;
    let mainPointY = 0;
    let dragStartClientX = 0;
    let dragStartClientY = 0;
    let startMainX = 0;
    let startMainY = 0;
    let currentStrokePoints = [];
    let workingDrawings = [];
    let drawHistory = [];
    let redoDrawHistory = [];

    let marginsHeaderGroup = null;
    let marginsFormatToolbar = null;
    let marginGuidesContainer = null;
    let workingMargins = null;
    let marginRawBaseCanvas = null;
    let marginBaseRawW = 0;
    let marginBaseRawH = 0;
    let marginsInitialized = false;

    const PAGE_SIZE_PRESETS = {
        A4: [595.28, 841.89],
        A3: [841.89, 1190.55],
        Letter: [612, 792],
        Legal: [612, 1008]
    };

    // LRU Thumbnail Cache & ObjectURL Lifecycle Manager
    const ThumbnailCacheManager = (() => {
        const lruMap = new Map();
        const allCreatedBlobUrls = new Set();
        const visiblePageIds = new Set();

        function registerBlobUrl(url) {
            if (url && url.startsWith('blob:')) allCreatedBlobUrls.add(url);
            return url;
        }

        function revokeBlobUrl(url) {
            if (url && url.startsWith('blob:') && allCreatedBlobUrls.has(url)) {
                try { URL.revokeObjectURL(url); } catch (e) {}
                allCreatedBlobUrls.delete(url);
            }
        }

        function touch(pageId, url) {
            if (!pageId || !url) return;
            if (lruMap.has(pageId)) lruMap.delete(pageId);
            lruMap.set(pageId, url);
            evictIfNeeded();
        }

        function get(pageId) {
            if (!lruMap.has(pageId)) return null;
            const url = lruMap.get(pageId);
            lruMap.delete(pageId);
            lruMap.set(pageId, url);
            return url;
        }

        function isUrlReferencedInHistory(url) {
            if (!url) return false;
            const checkArr = (arr) => arr.some(p => p.cacheUrl === url || p.dataUrl === url || p.cleanDataUrl === url || p.rawCacheUrl === url);
            if (checkArr(pagesState)) return true;
            for (let i = 0; i < historyUndoStack.length; i++) {
                if (checkArr(historyUndoStack[i])) return true;
            }
            for (let i = 0; i < historyRedoStack.length; i++) {
                if (checkArr(historyRedoStack[i])) return true;
            }
            return false;
        }

        function evictIfNeeded(customMaxLimit = DEVICE_PROFILE.lruMaxEntries) {
            if (lruMap.size <= customMaxLimit) return;
            for (const [pageId, url] of lruMap.entries()) {
                if (lruMap.size <= customMaxLimit) break;
                if (visiblePageIds.has(pageId) && customMaxLimit > 0) continue;
                const st = pagesState.find(p => p.id === pageId);
                if (st && st.type === 'original') {
                    lruMap.delete(pageId);
                    st.cacheUrl = null;
                    st.rawCacheUrl = null;
                    if (!isUrlReferencedInHistory(url)) {
                        revokeBlobUrl(url);
                    }
                    const wrapper = pdfGrid ? pdfGrid.querySelector(`.card-wrapper[data-id="${pageId}"]`) : null;
                    if (wrapper && !visiblePageIds.has(pageId)) {
                        const c = wrapper.querySelector('canvas');
                        if (c && c.width > 1) {
                            releaseCanvasMemory(c);
                            wrapper.dataset.thumbRendered = 'false';
                        }
                    }
                }
            }
        }

        function markVisible(pageId, isVis) {
            if (isVis) visiblePageIds.add(pageId);
            else visiblePageIds.delete(pageId);
        }

        function clearAll() {
            lruMap.clear();
            visiblePageIds.clear();
            allCreatedBlobUrls.forEach(url => {
                try { URL.revokeObjectURL(url); } catch (e) {}
            });
            allCreatedBlobUrls.clear();
        }

        return {
            registerBlobUrl,
            revokeBlobUrl,
            touch,
            get,
            markVisible,
            isVisible: (id) => visiblePageIds.has(id),
            evictIfNeeded,
            clearAll
        };
    })();

    // Centralized PDF Document & Source Lifecycle Manager
    const ResourceManager = (() => {
        function isSourceReferenced(sourceIdx) {
            const inCurrent = pagesState.some(p => p.type === 'original' && p.sourceIndex === sourceIdx);
            if (inCurrent) return true;
            for (let i = 0; i < historyUndoStack.length; i++) {
                if (historyUndoStack[i].some(p => p.type === 'original' && p.sourceIndex === sourceIdx)) return true;
            }
            for (let i = 0; i < historyRedoStack.length; i++) {
                if (historyRedoStack[i].some(p => p.type === 'original' && p.sourceIndex === sourceIdx)) return true;
            }
            return false;
        }

        function cleanupUnreferencedSources() {
            for (let s = 0; s < pdfSources.length; s++) {
                if (pdfSources[s] && !isSourceReferenced(s)) {
                    if (pdfJsDocs[s]) {
                        try { pdfJsDocs[s].destroy(); } catch (e) {}
                        pdfJsDocs[s] = null;
                    }
                    pdfSources[s] = null;
                }
            }
        }

        // Frees 200-400MB of PDF.js Worker memory before heavy PDF-Lib export runs.
        // If user edits again after export, getCachedPdfDoc() transparently reloads on demand.
        async function suspendPdfJsDocsForExport() {
            ThumbnailRenderQueue.clearPendingOnly();
            for (let s = 0; s < pdfJsDocs.length; s++) {
                if (pdfJsDocs[s]) {
                    try { await pdfJsDocs[s].cleanup(); } catch (e) {}
                    try { await pdfJsDocs[s].destroy(); } catch (e) {}
                    pdfJsDocs[s] = null;
                }
            }
            if (DEVICE_PROFILE.isMobile) {
                ThumbnailCacheManager.evictIfNeeded(12);
            }
        }

        function destroyAllPdfDocs() {
            for (let s = 0; s < pdfJsDocs.length; s++) {
                if (pdfJsDocs[s]) {
                    try { pdfJsDocs[s].destroy(); } catch (e) {}
                    pdfJsDocs[s] = null;
                }
            }
            pdfJsDocs = [];
            pdfSources = [];
        }

        return {
            cleanupUnreferencedSources,
            suspendPdfJsDocsForExport,
            destroyAllPdfDocs
        };
    })();

    // Bounded Lazy Thumbnail Render Queue & IntersectionObserver
    const ThumbnailRenderQueue = (() => {
        const queue = [];
        const queuedIds = new Set();
        let activeCount = 0;
        let observer = null;

        function ensureObserver() {
            if (observer || typeof IntersectionObserver === 'undefined') return observer;
            observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const wrapper = entry.target;
                    const pageId = wrapper.dataset.id;
                    if (!pageId) return;
                    if (entry.isIntersecting) {
                        ThumbnailCacheManager.markVisible(pageId, true);
                        if (wrapper.dataset.thumbRendered !== 'true') {
                            enqueue(pageId, true);
                        }
                    } else {
                        ThumbnailCacheManager.markVisible(pageId, false);
                    }
                });
                ThumbnailCacheManager.evictIfNeeded();
            }, {
                root: null,
                rootMargin: '320px 0px',
                threshold: 0.01
            });
            return observer;
        }

        function observeWrapper(wrapper) {
            const obs = ensureObserver();
            if (obs && wrapper) obs.observe(wrapper);
            else if (wrapper && wrapper.dataset.id) enqueue(wrapper.dataset.id, false);
        }

        function unobserveWrapper(wrapper) {
            if (observer && wrapper) observer.unobserve(wrapper);
        }

        function enqueue(pageId, highPriority = false) {
            if (!pageId) return;
            if (queuedIds.has(pageId)) {
                if (highPriority) {
                    const idx = queue.indexOf(pageId);
                    if (idx > 0) {
                        queue.splice(idx, 1);
                        queue.unshift(pageId);
                    }
                }
                return;
            }
            queuedIds.add(pageId);
            if (highPriority) queue.unshift(pageId);
            else queue.push(pageId);
            processQueue();
        }

        async function renderCardThumbnail(pageId) {
            const stateObj = pagesState.find(p => p.id === pageId);
            if (!stateObj) return;
            const wrapper = pdfGrid ? pdfGrid.querySelector(`.card-wrapper[data-id="${pageId}"]`) : null;
            if (!wrapper) return;
            const canvas = wrapper.querySelector('canvas');
            if (!canvas) return;

            let imgUrl = stateObj.cacheUrl || stateObj.dataUrl || ThumbnailCacheManager.get(pageId);

            if (imgUrl) {
                await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        canvas.width = img.width || 240;
                        canvas.height = img.height || 340;
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 0, 0);
                        wrapper.dataset.thumbRendered = 'true';
                        ThumbnailCacheManager.touch(pageId, imgUrl);
                        resolve();
                    };
                    img.onerror = () => {
                        stateObj.cacheUrl = null;
                        resolve();
                    };
                    img.src = imgUrl;
                });
                if (wrapper.dataset.thumbRendered === 'true') return;
            }

            if (stateObj.type === 'original' && stateObj.sourceIndex !== null && pdfSources[stateObj.sourceIndex]) {
                let page = null;
                try {
                    const pdf = await getCachedPdfDoc(stateObj.sourceIndex);
                    page = await pdf.getPage(stateObj.originalIndex);
                    const unscaled = page.getViewport({ scale: 1 });
                    stateObj.pageWidth = unscaled.width;
                    stateObj.pageHeight = unscaled.height;

                    const maxSide = Math.max(unscaled.width, unscaled.height, 1);
                    const targetScale = Math.min(DEVICE_PROFILE.thumbScale, DEVICE_PROFILE.maxThumbDim / maxSide);
                    const viewport = page.getViewport({ scale: Math.max(0.14, targetScale) });

                    canvas.width = Math.max(1, Math.round(viewport.width));
                    canvas.height = Math.max(1, Math.round(viewport.height));
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    await page.render({ canvasContext: ctx, viewport }).promise;

                    const blobUrl = await canvasToBlobUrl(canvas, 'image/jpeg', DEVICE_PROFILE.thumbQuality);
                    stateObj.cacheUrl = blobUrl;
                    stateObj.rawCacheUrl = blobUrl;
                    wrapper.dataset.thumbRendered = 'true';
                    ThumbnailCacheManager.touch(pageId, blobUrl);
                } catch (e) {
                    console.warn('Thumbnail render skipped for', pageId, e);
                } finally {
                    // Release internal PDF.js page caches immediately so 68MB PDFs do not accumulate in RAM
                    if (page && page.cleanup) {
                        try { page.cleanup(); } catch (err) {}
                    }
                }
            } else if (stateObj.type === 'blank') {
                const w = Math.round((stateObj.pageWidth || 400) * 0.4);
                const h = Math.round((stateObj.pageHeight || 565) * 0.4);
                canvas.width = Math.max(80, w);
                canvas.height = Math.max(110, h);
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                wrapper.dataset.thumbRendered = 'true';
            }
        }

        function processQueue() {
            while (activeCount < DEVICE_PROFILE.renderConcurrency && queue.length > 0) {
                const nextId = queue.shift();
                queuedIds.delete(nextId);
                activeCount++;
                renderCardThumbnail(nextId).finally(() => {
                    activeCount--;
                    if (queue.length > 0) {
                        setTimeout(processQueue, 0);
                    }
                });
            }
        }

        function clearPendingOnly() {
            queue.length = 0;
            queuedIds.clear();
        }

        function reset() {
            clearPendingOnly();
            if (observer) {
                observer.disconnect();
            }
        }

        return {
            observeWrapper,
            unobserveWrapper,
            enqueue,
            renderCardThumbnail,
            clearPendingOnly,
            reset
        };
    })();

    let activeDropupMenu = null;
    function closeCustomDropupMenu() {
        if (activeDropupMenu) { activeDropupMenu.remove(); activeDropupMenu = null; }
    }

    document.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.custom-dropup-menu')) return;
        const selectEl = e.target.closest('.editor-toolbar select.toolbar-select');
        if (selectEl && window.innerWidth <= 768) {
            const toolbarEl = selectEl.closest('.editor-toolbar');
            const tbRect = toolbarEl ? toolbarEl.getBoundingClientRect() : null;
            if (tbRect && tbRect.top > window.innerHeight * 0.5) {
                e.preventDefault(); e.stopPropagation();
                closeCustomDropupMenu();
                document.querySelectorAll('.slider-popup').forEach(p => p.classList.add('hidden'));

                const menu = document.createElement('div');
                menu.className = 'custom-dropup-menu';
                Array.from(selectEl.options).forEach(opt => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'custom-dropup-item' + (selectEl.value === opt.value ? ' active' : '');
                    btn.textContent = opt.textContent;
                    if (opt.style && opt.style.fontFamily) btn.style.fontFamily = opt.style.fontFamily;
                    btn.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        selectEl.value = opt.value;
                        selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                        closeCustomDropupMenu();
                    });
                    menu.appendChild(btn);
                });
                document.body.appendChild(menu);
                activeDropupMenu = menu;
                return;
            }
        }
        closeCustomDropupMenu();
    }, { capture: true });

    // ==========================================
    // 4. MULTI-SELECT MANAGEMENT & TOOLBAR SYNC
    // ==========================================
    function getTargetPagesForBatchAction() {
        if (isDetailViewOpen && selectedPageId) {
            const p = pagesState.find(item => item.id === selectedPageId);
            return p ? [p] : [];
        }
        if (selectedPageIds.length > 0) {
            const selectedSet = new Set(selectedPageIds);
            return pagesState.filter(p => selectedSet.has(p.id));
        }
        return pagesState.slice();
    }

    function updateSelectionUI() {
        const validIds = new Set(pagesState.map(p => p.id));
        selectedPageIds = selectedPageIds.filter(id => validIds.has(id));
        const selectedSet = new Set(selectedPageIds);

        if (!isDetailViewOpen) {
            selectedPageId = selectedPageIds.length > 0 ? selectedPageIds[selectedPageIds.length - 1] : null;
        }

        if (pdfGrid) {
            pdfGrid.classList.toggle('multi-select-active', selectedPageIds.length >= 2);
        }

        document.querySelectorAll('.card-wrapper').forEach(wrapper => {
            const id = wrapper.dataset.id;
            const card = wrapper.querySelector('.image-card');
            if (card) {
                card.classList.toggle('selected', selectedSet.has(id));
            }
        });

        if (selectedCountBadge) {
            selectedCountBadge.innerText = selectedPageIds.length;
        }
        if (selectAllToggle) {
            selectAllToggle.checked = pagesState.length > 0 && selectedPageIds.length === pagesState.length;
        }

        const pageNumHint = document.getElementById('page-num-target-hint');
        if (pageNumHint) {
            pageNumHint.innerText = selectedPageIds.length > 0
                ? `Will number ${selectedPageIds.length} selected page(s) sequentially (Page - 1 to ${selectedPageIds.length}).`
                : `No specific selection — will number all ${pagesState.length} pages sequentially.`;
        }

        const wmHint = document.getElementById('wm-target-hint');
        if (wmHint) {
            wmHint.innerText = (isDetailViewOpen && selectedPageId)
                ? `Applies watermark ONLY to this current page in Expand View.`
                : (selectedPageIds.length > 0
                    ? `Applies watermark to ${selectedPageIds.length} selected page(s).`
                    : `Applies watermark to all ${pagesState.length} page(s).`);
        }

        if (selectedPageIds.length === 0 && !isDetailViewOpen) {
            floatingToolbar.classList.add('hidden');
            closeAllSubmenus();
        } else {
            floatingToolbar.classList.remove('hidden');
            const allowSinglePageTools = isDetailViewOpen || selectedPageIds.length === 1;
            if (fabViewChanges) fabViewChanges.style.display = isDetailViewOpen ? 'none' : 'flex';
            if (fabAddText) fabAddText.disabled = !allowSinglePageTools;
            if (fabCrop) fabCrop.disabled = !allowSinglePageTools;
            if (fabDraw) fabDraw.disabled = !allowSinglePageTools;
            if (fabMargins) fabMargins.disabled = !allowSinglePageTools;
            if (fabReplace) fabReplace.disabled = !allowSinglePageTools;
        }
    }

    function togglePageSelection(pageId, forceState = null) {
        const idx = selectedPageIds.indexOf(pageId);
        const shouldSelect = forceState !== null ? forceState : (idx === -1);
        if (shouldSelect && idx === -1) {
            selectedPageIds.push(pageId);
        } else if (!shouldSelect && idx !== -1) {
            selectedPageIds.splice(idx, 1);
        }
        updateSelectionUI();

        if (pageNumToggle && pageNumToggle.checked) {
            if (selectedPageIds.length > 0) {
                applyPageNumbersToTargetPages(false);
            } else {
                pagesState.forEach(p => { p.pageNumber = null; updateSingleCardBadge(p.id); });
                pageNumToggle.checked = false;
                syncAllGearIconsVisibility();
            }
        }
    }

    if (selectAllToggle) {
        selectAllToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedPageIds = pagesState.map(p => p.id);
            } else {
                selectedPageIds = [];
            }
            updateSelectionUI();

            if (pageNumToggle && pageNumToggle.checked) {
                if (selectedPageIds.length > 0) {
                    applyPageNumbersToTargetPages(false);
                } else {
                    pagesState.forEach(p => { p.pageNumber = null; updateSingleCardBadge(p.id); });
                    pageNumToggle.checked = false;
                    syncAllGearIconsVisibility();
                }
            }
        });
    }

    function getActiveTextElement() {
        if (activeTextContent && document.body.contains(activeTextContent)) return activeTextContent;
        const sel = editorOverlay.querySelector('.text-wrapper.selected .text-content') || editorOverlay.querySelector('.text-content');
        if (sel) { activeTextContent = sel; sel.parentElement.classList.add('selected'); }
        return activeTextContent;
    }

    function linkInputAndSlider(inputId, sliderId, cssProp, scaleMult = 1, unit = 'px') {
        const input = document.getElementById(inputId);
        const slider = document.getElementById(sliderId);
        if (!input || !slider) return;

        const popup = slider.parentElement;
        popup.addEventListener('click', (e) => e.stopPropagation());
        popup.addEventListener('pointerdown', (e) => e.stopPropagation());

        input.parentElement.addEventListener('click', (e) => {
            if (e.target.closest('.slider-popup')) return;
            e.stopPropagation();
            closeCustomDropupMenu();
            document.querySelectorAll('.slider-popup').forEach(p => p.classList.add('hidden'));
            popup.classList.remove('hidden');
            input.focus();
            if (e.target !== input) input.select();
        });

        const defaultVal = slider.value;
        input.addEventListener('blur', (e) => {
            if (e.target.value === '' || isNaN(e.target.value)) {
                e.target.value = defaultVal; slider.value = defaultVal;
                if (isTextEditingOpen && cssProp) updateCSS(defaultVal);
            }
        });

        const updateCSS = (val) => {
            const targetContent = getActiveTextElement();
            if (targetContent && isTextEditingOpen && cssProp) {
                if (cssProp === 'bgRadius' || cssProp === 'bgOpacity' || cssProp === 'borderWeight') {
                    targetContent.parentElement.dataset[cssProp] = val;
                    if (cssProp === 'borderWeight') updateBorderStyles(targetContent);
                    else updateBgStyles(targetContent);
                } else {
                    const mult = (cssProp === 'fontSize') ? editorScale : scaleMult;
                    targetContent.style[cssProp] = (val * mult) + unit;
                }
            }
        };

        input.addEventListener('input', (e) => {
            let v = e.target.value;
            if (v !== '') { slider.value = v; if (isTextEditingOpen && cssProp) updateCSS(v); }
        });
        slider.addEventListener('input', (e) => {
            let v = e.target.value;
            input.value = v;
            if (isTextEditingOpen && cssProp) updateCSS(v);
        });
    }

    // ==========================================
    // 5. STRUCTURAL-SHARING UNDO / REDO HISTORY STACK
    // ==========================================
    function cloneSinglePageAnnotations(p) {
        p.texts = p.texts ? p.texts.map(t => ({ ...t })) : [];
        p.drawings = p.drawings ? p.drawings.map(d => ({
            ...d,
            points: d.points ? d.points.map(pt => ({ x: pt.x, y: pt.y })) : undefined
        })) : [];
        p.margins = p.margins ? { ...p.margins } : null;
        p.watermark = p.watermark ? { ...p.watermark } : null;
        p.pageNumber = p.pageNumber ? { ...p.pageNumber } : null;
        return p;
    }

    function clonePagesState(arr, deepCopyAnnotations = false) {
        return arr.map(p => {
            if (deepCopyAnnotations) {
                return cloneSinglePageAnnotations({ ...p });
            }
            return {
                ...p,
                texts: p.texts ? p.texts.slice() : [],
                drawings: p.drawings ? p.drawings.slice() : [],
                margins: p.margins ? { ...p.margins } : null,
                watermark: p.watermark ? { ...p.watermark } : null,
                pageNumber: p.pageNumber ? { ...p.pageNumber } : null
            };
        });
    }

    function saveState() {
        historyUndoStack.push(clonePagesState(pagesState, false));
        if (historyUndoStack.length > DEVICE_PROFILE.maxUndoHistory) {
            historyUndoStack.shift();
            ResourceManager.cleanupUnreferencedSources();
        }
        historyRedoStack = [];
        updateHistoryButtons();
    }

    function updateHistoryButtons() {
        if (fabUndo) fabUndo.disabled = historyUndoStack.length === 0;
        if (fabRedo) fabRedo.disabled = historyRedoStack.length === 0;
    }

    if (fabUndo) {
        fabUndo.addEventListener('click', () => {
            if (historyUndoStack.length === 0) return;
            historyRedoStack.push(clonePagesState(pagesState, false));
            pagesState = historyUndoStack.pop();
            syncDOMWithState();
            updateHistoryButtons();
        });
    }

    if (fabRedo) {
        fabRedo.addEventListener('click', () => {
            if (historyRedoStack.length === 0) return;
            historyUndoStack.push(clonePagesState(pagesState, false));
            pagesState = historyRedoStack.pop();
            syncDOMWithState();
            updateHistoryButtons();
        });
    }

    document.getElementById('btn-submit-confirm').onclick = () => { confirmPopup.classList.add('hidden'); if (confirmCallback) confirmCallback(); };
    document.getElementById('btn-cancel-confirm').onclick = () => { confirmPopup.classList.add('hidden'); };
    function requestConfirm(title, desc, callback) {
        confirmTitle.innerText = title; confirmDesc.innerText = desc;
        confirmCallback = callback; confirmPopup.classList.remove('hidden');
    }

    // ==========================================
    // 6. PDF LOADING, DECRYPTION & LAZY THUMBNAILS
    // ==========================================
    async function getCachedPdfDoc(sourceIndex) {
        if (!pdfJsDocs[sourceIndex]) {
            const srcBuf = pdfSources[sourceIndex];
            if (!srcBuf) throw new Error(`PDF source ${sourceIndex} is no longer available.`);
            const loadingTask = pdfjsLib.getDocument({
                data: srcBuf.slice(0),
                verbosity: 0,
                disableAutoFetch: true,
                disableStream: false
            });
            pdfJsDocs[sourceIndex] = await loadingTask.promise;
        }
        return pdfJsDocs[sourceIndex];
    }

    // Fast <1ms byte scan to detect if a PDF contains an /Encrypt dictionary without loading PDFLib
    function hasPdfEncryptDictionary(arrayBuffer) {
        try {
            const bytes = new Uint8Array(arrayBuffer);
            const len = bytes.length;
            const decoder = new TextDecoder('latin1');
            const tailSize = Math.min(len, 65536);
            const tailText = decoder.decode(bytes.subarray(len - tailSize, len));
            if (tailText.includes('/Encrypt')) return true;
            const headSize = Math.min(len, 16384);
            const headText = decoder.decode(bytes.subarray(0, headSize));
            return headText.includes('/Encrypt');
        } catch (e) {
            return false;
        }
    }

    function requestPasswordUI(filename) {
        return new Promise((resolve) => {
            const popup = document.getElementById('password-prompt-popup');
            const filenameText = document.getElementById('password-file-name');
            const btnSubmit = document.getElementById('btn-submit-password');
            const btnCancel = document.getElementById('btn-cancel-password');
            const closeBtn = document.getElementById('close-password-popup');

            if (!popup || !pdfPasswordInput) {
                const fallbackPwd = prompt(`"${filename}" is password protected. Enter password:`);
                resolve(fallbackPwd);
                return;
            }

            if (filenameText) filenameText.innerText = `"${filename}" is protected. Please enter its password to open it.`;
            pdfPasswordInput.value = '';
            pdfPasswordInput.type = 'password';
            if (togglePasswordBtn) togglePasswordBtn.innerHTML = eyeOpenSvg;

            popup.classList.remove('hidden');
            popup.style.display = 'flex';
            pdfPasswordInput.focus();

            const cleanup = () => {
                popup.classList.add('hidden');
                popup.style.display = 'none';
                btnSubmit.removeEventListener('click', onSubmit);
                btnCancel.removeEventListener('click', onCancel);
                if (closeBtn) closeBtn.removeEventListener('click', onCancel);
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
                if (e.key === 'Enter') {
                    e.preventDefault();
                    onSubmit();
                }
            };

            btnSubmit.addEventListener('click', onSubmit);
            btnCancel.addEventListener('click', onCancel);
            if (closeBtn) closeBtn.removeEventListener('click', onCancel);
            pdfPasswordInput.addEventListener('keypress', onEnter);
        });
    }

    function unlockPdfWithWasm(fileBuffer, password, fileName) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(new URL('./organise-worker.js', import.meta.url));

            worker.onmessage = (e) => {
                if (e.data.status === 'success') {
                    resolve(e.data.data);
                } else {
                    reject(new Error(e.data.message));
                }
                worker.terminate();
            };

            worker.onerror = () => {
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

    async function processSelectedFile(file) {
        if (!file || file.type !== "application/pdf") {
            showToast("Format Error: Please select a valid PDF file.", "error");
            return;
        }

        await ensureCorePdfLibsLoaded();
        setTimeout(() => { ensureIroLoaded(); ensureCropperLoaded(); ensureConfettiLoaded(); }, 1500);

        const rawArrayBuffer = await file.arrayBuffer();
        let finalArrayBuffer = rawArrayBuffer;
        let initialPdfJsDoc = null;

        // Avoid parsing 68MB with PDFLib on upload; use PDF.js worker + fast /Encrypt byte check
        const looksEncrypted = hasPdfEncryptDictionary(rawArrayBuffer);

        try {
            if (looksEncrypted) {
                // Verify if PDFLib requires decryption (owner or user password)
                await window.PDFLib.PDFDocument.load(new Uint8Array(rawArrayBuffer));
            }
            const loadingTask = pdfjsLib.getDocument({
                data: finalArrayBuffer.slice(0),
                verbosity: 0,
                disableAutoFetch: true,
                disableStream: false
            });
            initialPdfJsDoc = await loadingTask.promise;
        } catch (error) {
            const errMsg = (error && error.message ? error.message : '').toLowerCase();
            const isPasswordErr = (error && error.name === 'PasswordException') || errMsg.includes('encrypted') || errMsg.includes('password');

            if (isPasswordErr) {
                let isUnlocked = false;

                while (!isUnlocked) {
                    const rawPwd = await requestPasswordUI(file.name);
                    if (rawPwd === null) {
                        showToast(`Skipped adding ${file.name}`, 'error');
                        fileInput.value = "";
                        return;
                    }

                    const pwd = rawPwd.trim();
                    workspaceSection.style.display = "block";
                    progressContainer.style.display = "block";
                    updateProgress(25, "Unlocking High-Security PDF...");

                    try {
                        const unlockedBuffer = await unlockPdfWithWasm(rawArrayBuffer.slice(0), pwd, file.name);
                        const loadingTask = pdfjsLib.getDocument({
                            data: unlockedBuffer.slice(0),
                            verbosity: 0,
                            disableAutoFetch: true,
                            disableStream: false
                        });
                        initialPdfJsDoc = await loadingTask.promise;
                        finalArrayBuffer = unlockedBuffer;
                        progressContainer.style.display = "none";
                        isUnlocked = true;
                        showToast(`Unlocked ${file.name}!`);
                    } catch (e) {
                        progressContainer.style.display = "none";
                        if (pagesState.length === 0) workspaceSection.style.display = "none";
                        showToast(`Incorrect password for ${file.name}. Try again.`, 'error');
                    }
                }
            } else {
                showToast(`Failed to load ${file.name}. File corrupted.`, 'error');
                fileInput.value = "";
                return;
            }
        }

        hideExportResultArea();
        const sourceIndex = pdfSources.length;
        if (sourceIndex === 0) originalFileName = file.name.replace(/\.pdf$/i, '-organized.pdf');

        const sizeStr = (file.size / (1024 * 1024)).toFixed(2) + " MB";
        const card = document.createElement('div');
        card.className = 'file-card';
        card.innerHTML = `<div class="file-info"><div class="file-icon">PDF</div><div class="file-details"><h4>${file.name}</h4><p>${sizeStr}</p></div></div><button class="remove-btn" title="Remove File">&times;</button>`;
        card.querySelector('.remove-btn').addEventListener('click', () => {
            saveState();
            pagesState = pagesState.filter(p => p.sourceIndex !== sourceIndex);
            hideExportResultArea();
            syncDOMWithState();
            card.remove();
            if (fileCardsContainer.children.length === 0) triggerClearWorkspace();
        });
        fileCardsContainer.appendChild(card);

        emptyState.style.display = "none";
        workspaceSection.style.display = "block";
        if (fileInputLabel) fileInputLabel.textContent = "Add another PDF";
        progressContainer.style.display = "block";
        updateProgress(10, "Loading document...");

        pdfSources.push(finalArrayBuffer);
        if (initialPdfJsDoc) {
            pdfJsDocs[sourceIndex] = initialPdfJsDoc;
        }
        await renderPdfThumbnails(sourceIndex);
        fileInput.value = "";
    }

    fileInput.addEventListener('change', (e) => processSelectedFile(e.target.files[0]));

    if (uploadZone) {
        uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-active'); });
        uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-active'));
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault(); uploadZone.classList.remove('drag-active');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) processSelectedFile(e.dataTransfer.files[0]);
        });
    }

    function triggerClearWorkspace() {
        ThumbnailRenderQueue.reset();
        if (pdfGrid) {
            pdfGrid.querySelectorAll('canvas').forEach(releaseCanvasMemory);
            pdfGrid.innerHTML = '';
        }
        ThumbnailCacheManager.clearAll();
        ResourceManager.destroyAllPdfDocs();

        fileInput.value = "";
        fileCardsContainer.innerHTML = '';
        emptyState.style.display = "block";
        workspaceSection.style.display = "none";
        if (fileInputLabel) fileInputLabel.textContent = "Select PDF File";

        pagesState = [];
        historyUndoStack = [];
        historyRedoStack = [];
        updateHistoryButtons();
        exportedPdfBlob = null;
        hideExportResultArea();
        clearSelection();
    }

    if (pageSearchBtn && pageSearchInput) {
        const handleSearch = () => {
            const pageNum = parseInt(pageSearchInput.value, 10);
            if (pageNum > 0 && pageNum <= pdfGrid.children.length) {
                const targetWrapper = pdfGrid.children[pageNum - 1];
                if (targetWrapper) {
                    const pid = targetWrapper.dataset.id;
                    if (pid && targetWrapper.dataset.thumbRendered !== 'true') {
                        ThumbnailRenderQueue.enqueue(pid, true);
                    }
                    targetWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const card = targetWrapper.querySelector('.image-card');
                    card.classList.add('highlight-flash');
                    setTimeout(() => card.classList.remove('highlight-flash'), 1500);
                    togglePageSelection(pid, true);
                }
            } else alert("Page not found!");
        };
        pageSearchBtn.addEventListener('click', handleSearch);
        pageSearchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } });
    }

    async function renderPdfThumbnails(sourceIndex) {
        const wasAllSelected = pagesState.length > 0 && selectedPageIds.length === pagesState.length;
        const hadBatchResize = Boolean(batchResizeToggle && batchResizeToggle.checked);
        const hadPageNum = Boolean(pageNumToggle && pageNumToggle.checked);
        const hadGlobalWm = Boolean(globalWmToggle && globalWmToggle.checked);
        const existingWm = pagesState.find(p => p.watermark)?.watermark || null;

        saveState();
        try {
            const pdf = await getCachedPdfDoc(sourceIndex);
            const newlyAddedIds = [];
            const fragment = document.createDocumentFragment();
            const eagerRenderCount = DEVICE_PROFILE.isMobile ? 6 : 12;

            // Sample Page 1 dimensions first; remaining pages update their exact dimensions when rendered
            let defaultPageW = 595.28;
            let defaultPageH = 841.89;
            try {
                const firstPage = await pdf.getPage(1);
                const vp1 = firstPage.getViewport({ scale: 1 });
                defaultPageW = vp1.width;
                defaultPageH = vp1.height;
                if (firstPage.cleanup) firstPage.cleanup();
            } catch (e) {}

            for (let i = 1; i <= pdf.numPages; i++) {
                if (i % 15 === 0 || i === pdf.numPages) {
                    updateProgress(10 + ((i / pdf.numPages) * 80), `Preparing Page ${i} of ${pdf.numPages}...`);
                    await yieldToMain();
                }

                let pW = defaultPageW;
                let pH = defaultPageH;
                if (pdf.numPages <= 60) {
                    try {
                        const page = await pdf.getPage(i);
                        const unscaledViewport = page.getViewport({ scale: 1 });
                        pW = unscaledViewport.width;
                        pH = unscaledViewport.height;
                        if (page.cleanup) page.cleanup();
                    } catch (e) {}
                }

                const uniqueId = `page-src${sourceIndex}-${i}-${Date.now()}-${i}`;
                const canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = 1;

                const stateObj = {
                    id: uniqueId,
                    type: 'original',
                    sourceIndex: sourceIndex,
                    originalIndex: i,
                    visualRotation: 0,
                    resize: null,
                    rawCacheUrl: null,
                    cacheUrl: null,
                    texts: [],
                    drawings: [],
                    margins: null,
                    watermark: null,
                    pageNumber: null,
                    isEdited: false,
                    pageWidth: pW,
                    pageHeight: pH
                };

                const wrapper = createCardWrapper(uniqueId, `Page`, canvas);
                wrapper.dataset.thumbRendered = 'false';
                attachCardEvents(wrapper, stateObj);
                pagesState.push(stateObj);
                fragment.appendChild(wrapper);
                newlyAddedIds.push({ id: uniqueId, wrapper, eager: i <= eagerRenderCount });
            }

            pdfGrid.appendChild(fragment);

            newlyAddedIds.forEach(({ id, wrapper, eager }) => {
                ThumbnailRenderQueue.observeWrapper(wrapper);
                if (eager) ThumbnailRenderQueue.enqueue(id, true);
            });

            if (wasAllSelected) {
                newlyAddedIds.forEach(({ id }) => {
                    if (!selectedPageIds.includes(id)) selectedPageIds.push(id);
                });
            }

            if (hadBatchResize) {
                const preset = batchResizePresetSelect ? batchResizePresetSelect.value : 'A4';
                const hasBg = batchResizeBgToggle ? batchResizeBgToggle.checked : true;
                const bgColor = batchResizeColorInput ? batchResizeColorInput.value.toUpperCase() : '#FFFFFF';
                if (preset && preset !== 'original') {
                    newlyAddedIds.forEach(({ id }) => {
                        const st = pagesState.find(p => p.id === id);
                        if (st) {
                            applyResizePresetToSinglePage(st, preset, hasBg, bgColor);
                            updateSingleCardBadge(id);
                        }
                    });
                }
            }
            if (hadPageNum) {
                newlyAddedIds.forEach(({ id }) => {
                    if (!selectedPageIds.includes(id)) selectedPageIds.push(id);
                });
                applyPageNumbersToTargetPages(false);
            }
            if (hadGlobalWm && existingWm) {
                newlyAddedIds.forEach(({ id }) => {
                    const st = pagesState.find(p => p.id === id);
                    if (st) {
                        st.watermark = JSON.parse(JSON.stringify(existingWm));
                        updateSingleCardBadge(id);
                    }
                });
            }

            updateGridAspectRatio();
            updateDynamicLabels();
            initSortable();
            updateSelectionUI();
            updateProgress(100, "Ready!");
            setTimeout(() => progressContainer.style.display = "none", 600);
        } catch (error) {
            console.error(error);
            alert("Error reading PDF.");
            progressContainer.style.display = "none";
        }
    }

    function createCardWrapper(id, labelText, canvasElement) {
        const wrapper = document.createElement('div');
        wrapper.className = 'card-wrapper';
        wrapper.dataset.id = id;
        wrapper.innerHTML = `
            <div class="card-gap left" title="Insert Here"></div>
            <div class="image-card">
                <div class="card-select-check" title="Select / Deselect Page">✔</div>
                <button type="button" class="card-eye-expand-btn" title="View / Expand This Page" aria-label="Expand Page">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
                <div class="canvas-container"><div class="edited-badge" style="display:none;">✨ MODIFIED</div></div>
                <div class="page-label">${labelText}</div>
            </div>
            <div class="card-gap right" title="Insert Here"></div>`;
        wrapper.querySelector('.canvas-container').appendChild(canvasElement);
        return wrapper;
    }

    function attachCardEvents(wrapper, stateObj) {
        const pageId = stateObj.id;
        const imageCard = wrapper.querySelector('.image-card');
        const checkBtn = wrapper.querySelector('.card-select-check');
        const eyeBtn = wrapper.querySelector('.card-eye-expand-btn');

        let holdTimer = null;
        let holdTriggered = false;
        let startTouchX = 0;
        let startTouchY = 0;

        let lastClickTime = 0;
        let snapshotBeforeFirstClick = [];

        if (checkBtn) {
            checkBtn.onclick = (e) => {
                e.stopPropagation();
                togglePageSelection(pageId);
            };
        }

        if (eyeBtn) {
            eyeBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                openDetailView(pageId);
            };
        }

        if (!wrapper.dataset.eventsAttached) {
            wrapper.dataset.eventsAttached = 'true';

            imageCard.addEventListener('touchstart', (e) => {
                if (e.target.closest('.card-select-check') || e.target.closest('.card-eye-expand-btn')) return;
                if (e.touches.length !== 1) return;
                holdTriggered = false;
                startTouchX = e.touches[0].clientX;
                startTouchY = e.touches[0].clientY;

                clearTimeout(holdTimer);
                holdTimer = setTimeout(() => {
                    holdTriggered = true;
                    if (navigator.vibrate) { try { navigator.vibrate(35); } catch (err) {} }
                    togglePageSelection(pageId);
                }, 420);
            }, { passive: true });

            imageCard.addEventListener('touchmove', (e) => {
                if (!holdTimer || e.touches.length !== 1) return;
                const dx = Math.abs(e.touches[0].clientX - startTouchX);
                const dy = Math.abs(e.touches[0].clientY - startTouchY);
                if (dx > 10 || dy > 10) {
                    clearTimeout(holdTimer);
                    holdTimer = null;
                }
            }, { passive: true });

            imageCard.addEventListener('touchend', () => {
                clearTimeout(holdTimer);
                holdTimer = null;
            });

            imageCard.addEventListener('touchcancel', () => {
                clearTimeout(holdTimer);
                holdTimer = null;
            });

            imageCard.addEventListener('click', (e) => {
                if (e.target.closest('.card-select-check') || e.target.closest('.card-eye-expand-btn')) return;
                e.stopPropagation();

                if (holdTriggered) {
                    holdTriggered = false;
                    return;
                }

                const now = Date.now();
                const isDoubleClick = (now - lastClickTime) < 360;

                if (isDoubleClick) {
                    lastClickTime = 0;
                    selectedPageIds = [...snapshotBeforeFirstClick];
                    togglePageSelection(pageId);
                    return;
                }

                lastClickTime = now;
                snapshotBeforeFirstClick = [...selectedPageIds];

                if (selectedPageIds.length >= 2) {
                    togglePageSelection(pageId);
                } else {
                    selectedPageIds = [pageId];
                    selectedPageId = pageId;
                    updateSelectionUI();
                }
            });
        }

        const gapLeft = wrapper.querySelector('.card-gap.left');
        const gapRight = wrapper.querySelector('.card-gap.right');

        gapLeft.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.card-gap').forEach(el => el.classList.remove('active'));
            gapLeft.classList.add('active');
            activeInsertPoint = { targetId: pageId, position: 'before' };
            if (insertPopup) insertPopup.classList.remove('hidden');
        };
        gapRight.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.card-gap').forEach(el => el.classList.remove('active'));
            gapRight.classList.add('active');
            activeInsertPoint = { targetId: pageId, position: 'after' };
            if (insertPopup) insertPopup.classList.remove('hidden');
        };
    }

    function clearSelection() {
        if (isDetailViewOpen) return;
        selectedPageIds = [];
        selectedPageId = null;
        updateSelectionUI();
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.toolbar-input-group') && !e.target.closest('.slider-popup')) {
            document.querySelectorAll('.slider-popup').forEach(p => p.classList.add('hidden'));
        }
        if (isDetailViewOpen) return;
        if (!e.target.closest('.card-wrapper') && !e.target.closest('.file-input-group') && !e.target.closest('#uploadZone') && !e.target.closest('.floating-toolbar') && !e.target.closest('.workspace-controls') && !e.target.closest('.fab-submenu') && !e.target.closest('.popup-overlay') && !e.target.closest('.editor-modal') && !e.target.closest('.canva-picker-panel') && !e.target.closest('.picker-overlay') && !e.target.closest('.crop-modal')) {
            clearSelection();
            document.querySelectorAll('.card-gap').forEach(el => el.classList.remove('active'));
            if (insertPopup && !insertPopup.classList.contains('hidden') && !e.target.closest('#insert-popup .popup-content')) {
                insertPopup.classList.add('hidden');
            }
            activeInsertPoint = null;
        }
    });

    function initSortable() {
        if (sortableInstance) return;
        if (!window.Sortable || !pdfGrid) return;
        sortableInstance = new Sortable(pdfGrid, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            delay: 50,
            delayOnTouchOnly: true,
            draggable: ".card-wrapper",
            filter: ".card-select-check, .card-eye-expand-btn",
            preventOnFilter: false,
            scroll: true,
            scrollSensitivity: 100,
            scrollSpeed: 40,
            bubbleScroll: true,
            forceFallback: true,
            fallbackOnBody: true,
            fallbackTolerance: 5,
            onEnd: () => {
                saveState();
                const stateMap = new Map(pagesState.map(p => [p.id, p]));
                const newArray = [];
                Array.from(pdfGrid.children).forEach(wrapper => {
                    const st = stateMap.get(wrapper.dataset.id);
                    if (st) newArray.push(st);
                });
                pagesState = newArray;
                if (pageNumToggle && pageNumToggle.checked) {
                    applyPageNumbersToTargetPages(false);
                }
                updateDynamicLabels();
            }
        });
    }

    function updateDynamicLabels() {
        const stateMap = new Map(pagesState.map(p => [p.id, p]));
        Array.from(pdfGrid.children).forEach((wrapper, index) => {
            const label = wrapper.querySelector('.page-label');
            if (label) {
                const stateObj = stateMap.get(wrapper.dataset.id);
                if (!stateObj) return;
                let text = `Page ${index + 1}`;
                if (stateObj.type === 'blank') text = `[Blank] ${text}`;
                if (label.innerText !== text) label.innerText = text;
            }
        });
    }

    function updateGridAspectRatio() {
        if (pagesState.length === 0) return;
        let ratioCounts = {}, maxCount = 0, dominantRatio = 1 / 1.414;
        pagesState.forEach(p => {
            let w = p.pageWidth || 400, h = p.pageHeight || 565, rot = p.visualRotation || 0;
            if (Math.abs(rot % 180) === 90) { let temp = w; w = h; h = temp; }
            let r = (w / h).toFixed(3);
            ratioCounts[r] = (ratioCounts[r] || 0) + 1;
            if (ratioCounts[r] > maxCount) { maxCount = ratioCounts[r]; dominantRatio = parseFloat(r); }
        });

        const clampedRatio = Math.max(0.707, Math.min(1.414, dominantRatio));
        document.documentElement.style.setProperty('--dynamic-card-ratio', clampedRatio);
    }

    function checkIsPageEdited(stateObj) {
        return Boolean(
            (stateObj.texts && stateObj.texts.length > 0) ||
            (stateObj.drawings && stateObj.drawings.length > 0) ||
            hasActiveMargins(stateObj.margins) ||
            stateObj.watermark ||
            stateObj.pageNumber ||
            (stateObj.visualRotation !== 0) ||
            (stateObj.resize !== null) ||
            (stateObj.type !== 'original')
        );
    }

    function updateSingleCardBadge(pageId) {
        const stateObj = pagesState.find(p => p.id === pageId);
        if (!stateObj) return;
        const isActuallyEdited = checkIsPageEdited(stateObj);
        stateObj.isEdited = isActuallyEdited;
        const wrapper = pdfGrid.querySelector(`.card-wrapper[data-id="${pageId}"]`);
        if (wrapper) {
            const badge = wrapper.querySelector('.edited-badge');
            if (badge) badge.style.display = isActuallyEdited ? "block" : "none";
        }
        updateDynamicLabels();
    }

    function syncDOMWithState() {
        updateGridAspectRatio();

        const existingWrappers = new Map();
        Array.from(pdfGrid.children).forEach(w => {
            if (w.dataset && w.dataset.id) {
                existingWrappers.set(w.dataset.id, w);
            }
        });

        const selectedSet = new Set(selectedPageIds);
        const nextIdsSet = new Set(pagesState.map(p => p.id));

        existingWrappers.forEach((wrapper, id) => {
            if (!nextIdsSet.has(id)) {
                ThumbnailRenderQueue.unobserveWrapper(wrapper);
                ThumbnailCacheManager.markVisible(id, false);
                const c = wrapper.querySelector('canvas');
                if (c) releaseCanvasMemory(c);
                wrapper.remove();
                existingWrappers.delete(id);
            }
        });

        const fragment = document.createDocumentFragment();

        pagesState.forEach(stateObj => {
            let wrapper = existingWrappers.get(stateObj.id);
            let canvas = wrapper ? wrapper.querySelector('canvas') : null;
            const currentThumbKey = `${stateObj.type}:${stateObj.cacheUrl || stateObj.dataUrl || ''}`;

            if (!wrapper) {
                canvas = document.createElement('canvas');
                canvas.width = 1;
                canvas.height = 1;
                wrapper = createCardWrapper(stateObj.id, `Page`, canvas);
                wrapper.dataset.thumbRendered = 'false';
                wrapper.dataset.thumbKey = currentThumbKey;
                ThumbnailRenderQueue.observeWrapper(wrapper);
            } else if (wrapper.dataset.thumbKey !== currentThumbKey) {
                wrapper.dataset.thumbKey = currentThumbKey;
                wrapper.dataset.thumbRendered = 'false';
            }

            const isLandscape = Math.abs((stateObj.visualRotation || 0) % 180) === 90;
            if (canvas) {
                canvas.style.transform = `rotate(${stateObj.visualRotation || 0}deg) scale(${isLandscape ? 0.707 : 1})`;
            }

            const imageCard = wrapper.querySelector('.image-card');
            if (imageCard) {
                imageCard.classList.toggle('blank-card', stateObj.type === 'blank');
                imageCard.classList.toggle('selected', selectedSet.has(stateObj.id));
            }

            const badge = wrapper.querySelector('.edited-badge');
            const isActuallyEdited = checkIsPageEdited(stateObj);
            if (badge) badge.style.display = isActuallyEdited ? "block" : "none";
            stateObj.isEdited = isActuallyEdited;

            attachCardEvents(wrapper, stateObj);
            fragment.appendChild(wrapper);

            if (wrapper.dataset.thumbRendered !== 'true') {
                const isVis = ThumbnailCacheManager.isVisible(stateObj.id);
                ThumbnailRenderQueue.enqueue(stateObj.id, isVis);
            }
        });

        pdfGrid.appendChild(fragment);
        updateDynamicLabels();
        initSortable();
        updateSelectionUI();
    }

    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
            if (w < 2 * r) r = w / 2; if (h < 2 * r) r = h / 2;
            this.beginPath(); this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath(); return this;
        };
    }

    function closeAllSubmenus() { document.querySelectorAll('.fab-submenu').forEach(m => m.classList.add('hidden')); }

    // ==========================================
    // 7. WATERMARK, PAGE NUMBERS & BATCH RESIZE
    // ==========================================
    function setupWorkspaceColorPickers() {
        if (typeof iro === 'undefined') return;

        if (document.getElementById('fontIroPickerContainer') && !fontColorPicker) {
            fontColorPicker = new iro.ColorPicker("#fontIroPickerContainer", {
                width: 210, color: "#000000", borderWidth: 1, borderColor: "#00e676",
                layout: [{ component: iro.ui.Box }, { component: iro.ui.Slider, options: { sliderType: 'hue' } }]
            });
            fontColorPicker.on('color:change', (color) => {
                const hex = color.hexString.toUpperCase();
                currentPageNumColorHex = hex;
                if (fontCustomHex) fontCustomHex.value = hex;
                if (fontHexColorPreview) fontHexColorPreview.style.backgroundColor = hex;
                if (fontColorSwatchBtn) fontColorSwatchBtn.style.backgroundColor = hex;
            });
        }

        if (document.getElementById('wmIroPickerContainer') && !wmColorPicker) {
            wmColorPicker = new iro.ColorPicker("#wmIroPickerContainer", {
                width: 210, color: "#808080", borderWidth: 1, borderColor: "#00e676",
                layout: [{ component: iro.ui.Box }, { component: iro.ui.Slider, options: { sliderType: 'hue' } }]
            });
            wmColorPicker.on('color:change', (color) => {
                const hex = color.hexString.toUpperCase();
                currentWmColorHex = hex;
                if (wmCustomHex) wmCustomHex.value = hex;
                if (wmHexColorPreview) wmHexColorPreview.style.backgroundColor = hex;
                if (wmColorSwatchBtn) wmColorSwatchBtn.style.backgroundColor = hex;
            });
        }
    }

    if (fontColorSwatchBtn && fontColorPickerPanel) {
        fontColorSwatchBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await ensureIroLoaded();
            setupWorkspaceColorPickers();
            fontColorPickerPanel.style.display = "flex";
            if (fontColorPopoverOverlay) fontColorPopoverOverlay.style.display = window.innerWidth <= 768 ? "block" : "none";
        });
        const closeFontPicker = () => {
            fontColorPickerPanel.style.display = "none";
            if (fontColorPopoverOverlay) fontColorPopoverOverlay.style.display = "none";
        };
        if (fontClosePickerBtn) fontClosePickerBtn.onclick = closeFontPicker;
        if (fontColorPopoverOverlay) fontColorPopoverOverlay.onclick = closeFontPicker;
        if (fontColorOkBtn) fontColorOkBtn.onclick = closeFontPicker;
        if (fontCustomHex) {
            fontCustomHex.addEventListener('input', (e) => {
                let val = e.target.value;
                if (!val.startsWith("#")) val = "#" + val;
                if (/^#[0-9A-Fa-f]{6}$/i.test(val)) {
                    currentPageNumColorHex = val.toUpperCase();
                    if (fontColorPicker) fontColorPicker.color.hexString = val;
                    if (fontHexColorPreview) fontHexColorPreview.style.backgroundColor = val;
                    fontColorSwatchBtn.style.backgroundColor = val;
                }
            });
        }
    }

    if (wmColorSwatchBtn && wmColorPickerPanel) {
        wmColorSwatchBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await ensureIroLoaded();
            setupWorkspaceColorPickers();
            wmColorPickerPanel.style.display = "flex";
            if (wmColorPopoverOverlay) wmColorPopoverOverlay.style.display = window.innerWidth <= 768 ? "block" : "none";
        });
        const closeWmPicker = () => {
            wmColorPickerPanel.style.display = "none";
            if (wmColorPopoverOverlay) wmColorPopoverOverlay.style.display = "none";
        };
        if (wmClosePickerBtn) wmClosePickerBtn.onclick = closeWmPicker;
        if (wmColorPopoverOverlay) wmColorPopoverOverlay.onclick = closeWmPicker;
        if (wmColorOkBtn) wmColorOkBtn.onclick = closeWmPicker;
        if (wmCustomHex) {
            wmCustomHex.addEventListener('input', (e) => {
                let val = e.target.value;
                if (!val.startsWith("#")) val = "#" + val;
                if (/^#[0-9A-Fa-f]{6}$/i.test(val)) {
                    currentWmColorHex = val.toUpperCase();
                    if (wmColorPicker) wmColorPicker.color.hexString = val;
                    if (wmHexColorPreview) wmHexColorPreview.style.backgroundColor = val;
                    wmColorSwatchBtn.style.backgroundColor = val;
                }
            });
        }
    }

    function applyPageNumbersToTargetPages(saveUndo = true) {
        if (pagesState.length === 0) return;
        if (saveUndo) saveState();

        if (selectedPageIds.length === 0) {
            selectedPageIds = pagesState.map(p => p.id);
            updateSelectionUI();
        }

        const pos = pageNumPos ? pageNumPos.value : 'bottom-right';
        const color = currentPageNumColorHex || '#000000';
        const selectedSet = new Set(selectedPageIds);
        const targets = pagesState.filter(p => selectedSet.has(p.id));

        pagesState.forEach(p => {
            if (!selectedSet.has(p.id)) p.pageNumber = null;
        });

        targets.forEach((p, idx) => {
            p.pageNumber = {
                num: idx + 1,
                pos: pos,
                color: color,
                size: 18
            };
        });

        pagesState.forEach(p => updateSingleCardBadge(p.id));
        if (isDetailViewOpen && selectedPageId) renderBigCanvas(selectedPageId, true, false);
    }

    const pageNumModal = document.getElementById('page-num-modal');
    const openPageNumSettingsBtn = document.getElementById('open-page-num-settings-btn');
    const closePageNumModalX = document.getElementById('close-page-num-modal-x');

    const wmModal = document.getElementById('wm-modal');
    const openWmSettingsBtn = document.getElementById('open-wm-settings-btn');
    const closeWmModalX = document.getElementById('close-wm-modal-x');

    const batchResizeToggle = document.getElementById('batchResizeToggle');
    const openBatchResizeBtn = document.getElementById('open-batch-resize-btn');
    const batchResizeModal = document.getElementById('batch-resize-modal');
    const closeBatchResizeModalX = document.getElementById('close-batch-resize-modal-x');
    const cancelBatchResizeBtn = document.getElementById('cancel-batch-resize-btn');
    const applyBatchResizeBtn = document.getElementById('apply-batch-resize-btn');
    const batchResizePresetSelect = document.getElementById('batch-resize-preset-select');
    const batchResizeBgToggle = document.getElementById('batch-resize-bg-toggle');
    const batchResizeColorInput = document.getElementById('batch-resize-color-input');
    const batchResizeBgLabel = document.getElementById('batch-resize-bg-label');
    const batchResizeTargetHint = document.getElementById('batch-resize-target-hint');

    function syncAllGearIconsVisibility() {
        if (openPageNumSettingsBtn && pageNumToggle) {
            openPageNumSettingsBtn.style.display = pageNumToggle.checked ? 'inline-flex' : 'none';
        }
        if (openWmSettingsBtn && globalWmToggle) {
            openWmSettingsBtn.style.display = globalWmToggle.checked ? 'inline-flex' : 'none';
        }
        if (openBatchResizeBtn && batchResizeToggle) {
            openBatchResizeBtn.style.display = batchResizeToggle.checked ? 'inline-flex' : 'none';
        }
    }

    function openPageNumModal() {
        if (!pageNumModal) return;
        updateSelectionUI();
        pageNumModal.style.zIndex = '100015';
        pageNumModal.classList.remove('hidden');
    }

    function closePageNumModal() {
        if (pageNumModal) pageNumModal.classList.add('hidden');
        const anyHasPn = pagesState.some(p => p.pageNumber && p.pageNumber.num);
        if (pageNumToggle) pageNumToggle.checked = anyHasPn;
        syncAllGearIconsVisibility();
    }

    if (openPageNumSettingsBtn) {
        openPageNumSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openPageNumModal();
        });
    }
    if (closePageNumModalX) closePageNumModalX.addEventListener('click', closePageNumModal);
    if (pageNumModal) {
        pageNumModal.addEventListener('click', (e) => {
            if (e.target === pageNumModal) closePageNumModal();
        });
    }

    if (pageNumToggle) {
        pageNumToggle.addEventListener('change', (e) => {
            syncAllGearIconsVisibility();
            if (e.target.checked) {
                openPageNumModal();
            } else {
                saveState();
                pagesState.forEach(p => { p.pageNumber = null; updateSingleCardBadge(p.id); });
                closePageNumModal();
                if (isDetailViewOpen && selectedPageId) renderBigCanvas(selectedPageId, true, false);
            }
        });
    }

    if (applyPageNumBtn) {
        applyPageNumBtn.addEventListener('click', () => {
            if (pageNumToggle) pageNumToggle.checked = true;
            applyPageNumbersToTargetPages(true);
            closePageNumModal();
        });
    }

    if (clearPageNumBtn) {
        clearPageNumBtn.addEventListener('click', () => {
            saveState();
            const targets = getTargetPagesForBatchAction();
            targets.forEach(p => { p.pageNumber = null; updateSingleCardBadge(p.id); });
            closePageNumModal();
            if (isDetailViewOpen && selectedPageId) renderBigCanvas(selectedPageId, true, false);
        });
    }

    function updateWmTypeFields() {
        if (!wmType) return;
        const isText = wmType.value === 'text';
        document.querySelectorAll('#wm-settings-panel .wm-text-only').forEach(el => el.style.display = isText ? 'block' : 'none');
        document.querySelectorAll('#wm-settings-panel .wm-image-only').forEach(el => el.style.display = !isText ? 'block' : 'none');
    }

    function openWatermarkModal() {
        if (!wmModal) return;
        updateSelectionUI();
        updateWmTypeFields();
        if (wmMosaicToggle) wmMosaicToggle.dispatchEvent(new Event('change'));
        wmModal.style.zIndex = '100015';
        wmModal.classList.remove('hidden');
    }

    function closeWatermarkModal() {
        if (wmModal) wmModal.classList.add('hidden');
        const anyHasWm = pagesState.some(p => p.watermark);
        if (globalWmToggle) globalWmToggle.checked = anyHasWm;
        syncAllGearIconsVisibility();
    }

    if (openWmSettingsBtn) {
        openWmSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openWatermarkModal();
        });
    }
    if (closeWmModalX) closeWmModalX.addEventListener('click', closeWatermarkModal);
    if (wmModal) {
        wmModal.addEventListener('click', (e) => {
            if (e.target === wmModal) closeWatermarkModal();
        });
    }

    if (globalWmToggle) {
        globalWmToggle.addEventListener('change', (e) => {
            syncAllGearIconsVisibility();
            if (e.target.checked) {
                openWatermarkModal();
            } else {
                saveState();
                pagesState.forEach(p => { p.watermark = null; updateSingleCardBadge(p.id); });
                closeWatermarkModal();
                if (isDetailViewOpen && selectedPageId) renderBigCanvas(selectedPageId, true, false);
            }
        });
    }

    if (fabWatermark) {
        fabWatermark.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            closeAllSubmenus();
            if (globalWmToggle) globalWmToggle.checked = true;
            syncAllGearIconsVisibility();
            openWatermarkModal();
        };
    }

    if (wmType) wmType.addEventListener('change', updateWmTypeFields);

    if (wmMosaicToggle) {
        wmMosaicToggle.addEventListener('change', (e) => {
            const isMosaic = e.target.checked;
            document.querySelectorAll('.wm-mosaic-extra').forEach(el => el.style.display = isMosaic ? 'block' : 'none');
            if (wmPosContainer) wmPosContainer.style.display = isMosaic ? 'none' : 'block';
            if (isMosaic && wmSize && parseInt(wmSize.value, 10) > 25) {
                wmSize.value = 12;
                if (wmSizeVal) wmSizeVal.innerText = "12";
            }
        });
    }

    if (wmDensity) wmDensity.addEventListener('input', (e) => { if (wmDensityVal) wmDensityVal.innerText = e.target.value; });
    if (wmSize) wmSize.addEventListener('input', (e) => { if (wmSizeVal) wmSizeVal.innerText = e.target.value; });
    if (wmOpacity) wmOpacity.addEventListener('input', (e) => { if (wmOpacityVal) wmOpacityVal.innerText = e.target.value; });

    if (fontDropdown) {
        const dropdownMenuEl = document.getElementById('fontDropdownMenu');
        if (wmFontList && wmFontList.children.length <= 3) {
            const fonts = [
                { name: 'Arial', css: 'Arial, sans-serif' },
                { name: 'Helvetica', css: 'Helvetica, Arial, sans-serif' },
                { name: 'Times New Roman', css: "'Times New Roman', Times, serif" },
                { name: 'Courier New', css: "'Courier New', Courier, monospace" },
                { name: 'Verdana', css: 'Verdana, sans-serif' },
                { name: 'Georgia', css: 'Georgia, serif' },
                { name: 'Palatino', css: "Palatino, 'Palatino Linotype', serif" },
                { name: 'Comic Sans MS', css: "'Comic Sans MS', cursive, sans-serif" },
                { name: 'Trebuchet MS', css: "'Trebuchet MS', sans-serif" },
                { name: 'Impact', css: 'Impact, sans-serif' }
            ];
            wmFontList.innerHTML = fonts.map((f, idx) =>
                `<div class="font-item${idx === 0 ? ' active' : ''}" data-font="${f.name}" style="font-family: ${f.css};">${f.name}</div>`
            ).join('');
            if (selectedFontText) {
                selectedFontText.innerText = 'Arial';
                selectedFontText.style.fontFamily = 'Arial, sans-serif';
            }
        }

        if (fontDropdown.parentElement) {
            fontDropdown.parentElement.style.position = "relative";
            fontDropdown.parentElement.style.zIndex = "100020";
        }

        fontDropdown.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const clickedFontItem = e.target.closest(".font-item");
            if (clickedFontItem && wmFontList) {
                Array.from(wmFontList.children).forEach(i => i.classList.remove("active"));
                clickedFontItem.classList.add("active");
                selectedWmFont = clickedFontItem.getAttribute("data-font") || "Arial";
                if (selectedFontText) {
                    selectedFontText.innerText = clickedFontItem.innerText;
                    selectedFontText.style.fontFamily = clickedFontItem.style.fontFamily;
                }
                fontDropdown.classList.remove("open");
                if (dropdownMenuEl) dropdownMenuEl.style.display = "none";
            } else {
                const isOpen = fontDropdown.classList.toggle("open");
                if (dropdownMenuEl) dropdownMenuEl.style.display = isOpen ? "block" : "none";
            }
        });

        document.addEventListener("click", (e) => {
            if (fontDropdown.classList.contains("open") && !fontDropdown.contains(e.target)) {
                fontDropdown.classList.remove("open");
                if (dropdownMenuEl) dropdownMenuEl.style.display = "none";
            }
        });
    }

    wmFormatBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            btn.classList.toggle("active");
            const fmt = btn.getAttribute("data-format");
            if (fmt) wmFormats[fmt] = btn.classList.contains("active");
        });
    });

    if (wmImageInput) {
        wmImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (wmFileNameText) wmFileNameText.innerText = file.name;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = new Image();
                    img.onload = async () => {
                        const canvas = document.createElement('canvas');
                        let tw = img.width, th = img.height;
                        const MAX_WM = 800;
                        if (tw > MAX_WM || th > MAX_WM) {
                            const sc = MAX_WM / Math.max(tw, th);
                            tw = Math.round(tw * sc); th = Math.round(th * sc);
                        }
                        canvas.width = tw; canvas.height = th;
                        canvas.getContext('2d').drawImage(img, 0, 0, tw, th);
                        wmOriginalImageDataUrl = await canvasToBlobUrl(canvas, 'image/png');
                        wmOriginalImageAspect = tw / (th || 1);
                        releaseCanvasMemory(canvas);
                    };
                    img.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    function buildCurrentWatermarkConfig() {
        const typeVal = wmType ? wmType.value : 'text';
        const textVal = (wmTextInput && wmTextInput.value.trim()) ? wmTextInput.value.trim() : 'SArixa';
        if (typeVal === 'image' && !wmOriginalImageDataUrl) {
            alert("Please select a Logo Image for the Watermark!");
            return null;
        }
        return {
            type: typeVal,
            text: textVal,
            font: selectedWmFont || 'Arial',
            bold: Boolean(wmFormats.bold),
            italic: Boolean(wmFormats.italic),
            imageDataUrl: typeVal === 'image' ? wmOriginalImageDataUrl : null,
            imageAspect: wmOriginalImageAspect || 1,
            mosaic: wmMosaicToggle ? wmMosaicToggle.checked : false,
            density: wmDensity ? parseInt(wmDensity.value, 10) || 4 : 4,
            pos: wmPos ? wmPos.value : 'center',
            size: (wmSize ? parseFloat(wmSize.value) || 30 : 30) / 100,
            opacity: (wmOpacity ? parseFloat(wmOpacity.value) || 50 : 50) / 100,
            angle: wmAngle ? parseFloat(wmAngle.value) || 0 : 45,
            color: currentWmColorHex || '#808080'
        };
    }

    if (applyWmSelectedBtn) {
        applyWmSelectedBtn.addEventListener('click', () => {
            if (pagesState.length === 0) return;
            const wmCfg = buildCurrentWatermarkConfig();
            if (!wmCfg) return;
            saveState();
            const targets = getTargetPagesForBatchAction();
            targets.forEach(p => {
                p.watermark = { ...wmCfg };
                updateSingleCardBadge(p.id);
            });
            if (globalWmToggle) globalWmToggle.checked = true;
            closeWatermarkModal();
            if (isDetailViewOpen && selectedPageId) renderBigCanvas(selectedPageId, true, false);
        });
    }

    if (clearWmSelectedBtn) {
        clearWmSelectedBtn.addEventListener('click', () => {
            if (pagesState.length === 0) { closeWatermarkModal(); return; }
            saveState();
            const targets = getTargetPagesForBatchAction();
            targets.forEach(p => {
                p.watermark = null;
                updateSingleCardBadge(p.id);
            });
            closeWatermarkModal();
            if (isDetailViewOpen && selectedPageId) renderBigCanvas(selectedPageId, true, false);
        });
    }

    function updateBatchResizeBgUI() {
        if (!batchResizeBgToggle || !batchResizeColorInput || !batchResizeBgLabel) return;
        const hasBg = batchResizeBgToggle.checked;
        batchResizeColorInput.style.display = hasBg ? 'inline-block' : 'none';
        batchResizeBgLabel.innerText = hasBg
            ? `Solid Color (${batchResizeColorInput.value.toUpperCase()})`
            : 'Transparent Margin';
    }

    if (batchResizeBgToggle) batchResizeBgToggle.addEventListener('change', updateBatchResizeBgUI);
    if (batchResizeColorInput) batchResizeColorInput.addEventListener('input', updateBatchResizeBgUI);

    function openBatchResizeModal() {
        if (!batchResizeModal) return;
        if (batchResizeTargetHint) {
            batchResizeTargetHint.innerText = selectedPageIds.length > 0
                ? `Centers ${selectedPageIds.length} selected page(s) inside the chosen size by adding equal margins.`
                : `Centers all ${pagesState.length} page(s) inside the chosen size by adding equal margins.`;
        }
        if (batchResizePresetSelect && batchResizePresetSelect.value === 'original') {
            batchResizePresetSelect.value = 'A4';
        }
        updateBatchResizeBgUI();
        batchResizeModal.style.zIndex = '100015';
        batchResizeModal.classList.remove('hidden');
    }

    function closeBatchResizeModal() {
        if (batchResizeModal) batchResizeModal.classList.add('hidden');
        const anyResized = pagesState.some(p => p.resize !== null);
        if (batchResizeToggle) batchResizeToggle.checked = anyResized;
        syncAllGearIconsVisibility();
    }

    if (openBatchResizeBtn) {
        openBatchResizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openBatchResizeModal();
        });
    }
    if (closeBatchResizeModalX) closeBatchResizeModalX.addEventListener('click', closeBatchResizeModal);
    if (cancelBatchResizeBtn) cancelBatchResizeBtn.addEventListener('click', closeBatchResizeModal);
    if (batchResizeModal) {
        batchResizeModal.addEventListener('click', (e) => {
            if (e.target === batchResizeModal) closeBatchResizeModal();
        });
    }

    if (batchResizeToggle) {
        batchResizeToggle.addEventListener('change', (e) => {
            syncAllGearIconsVisibility();
            if (e.target.checked) {
                openBatchResizeModal();
            } else {
                saveState();
                pagesState.forEach(p => {
                    if (p.resize) {
                        p.margins = null;
                        p.resize = null;
                        updateSingleCardBadge(p.id);
                    }
                });
                closeBatchResizeModal();
                if (isDetailViewOpen && selectedPageId) renderBigCanvas(selectedPageId, true, false);
            }
        });
    }

    function applyResizePresetToSinglePage(p, preset, hasBg, bgColor) {
        if (!p) return;
        const isSideways = Math.abs((p.visualRotation || 0) % 180) === 90;
        const W = isSideways ? (p.pageHeight || 595.28) : (p.pageWidth || 595.28);
        const H = isSideways ? (p.pageWidth || 841.89) : (p.pageHeight || 841.89);

        if (!preset || preset === 'original') {
            p.margins = null;
            p.resize = null;
            return;
        }

        let targetW = W, targetH = H;
        if (preset === 'Square') {
            const maxSide = Math.max(W, H);
            targetW = maxSide;
            targetH = maxSide;
        } else if (PAGE_SIZE_PRESETS[preset]) {
            const [pW, pH] = PAGE_SIZE_PRESETS[preset];
            const scale = Math.max(W / pW, H / pH);
            targetW = pW * scale;
            targetH = pH * scale;
        }

        const padX = Math.max(0, (targetW - W) / 2);
        const padY = Math.max(0, (targetH - H) / 2);

        p.margins = {
            top: padY,
            bottom: padY,
            left: padX,
            right: padX,
            hasBg: hasBg,
            color: bgColor,
            pageSize: preset
        };
        p.resize = preset;
    }

    function applyBatchResizeToTargetPages(saveUndo = true) {
        if (pagesState.length === 0) return;
        const preset = batchResizePresetSelect ? batchResizePresetSelect.value : 'A4';
        const hasBg = batchResizeBgToggle ? batchResizeBgToggle.checked : true;
        const bgColor = batchResizeColorInput ? batchResizeColorInput.value.toUpperCase() : '#FFFFFF';

        if (saveUndo) saveState();

        const targets = getTargetPagesForBatchAction();
        targets.forEach(p => {
            applyResizePresetToSinglePage(p, preset, hasBg, bgColor);
            updateSingleCardBadge(p.id);
        });
    }

    if (applyBatchResizeBtn) {
        applyBatchResizeBtn.addEventListener('click', () => {
            if (pagesState.length === 0) return;
            const preset = batchResizePresetSelect ? batchResizePresetSelect.value : 'A4';
            if (batchResizeToggle) batchResizeToggle.checked = (preset !== 'original');
            applyBatchResizeToTargetPages(true);
            closeBatchResizeModal();
            if (isDetailViewOpen && selectedPageId) renderBigCanvas(selectedPageId, true, false);
        });
    }

    const wmImageCache = {};
    async function ensureWmImageLoaded(dataUrl) {
        if (!dataUrl) return null;
        if (wmImageCache[dataUrl]) return wmImageCache[dataUrl];
        const img = new Image();
        img.src = dataUrl;
        await new Promise(r => { img.onload = r; img.onerror = r; });
        wmImageCache[dataUrl] = img;
        return img;
    }

    async function drawWatermarkAndPageNumOnContext(ctx, stateObj, cw, ch, scaleFactor = 1.0) {
        const wm = stateObj.watermark;
        if (wm) {
            ctx.save();
            ctx.globalAlpha = wm.opacity ?? 0.5;
            const wmPad = Math.max(20 * scaleFactor, 15);

            if (wm.type === 'text' && wm.text) {
                const fontMap = {
                    helvetica: 'Helvetica, Arial, sans-serif',
                    times: '"Times New Roman", Times, serif',
                    courier: '"Courier New", Courier, monospace',
                    'Arial': 'Arial, sans-serif',
                    'Helvetica': 'Helvetica, Arial, sans-serif',
                    'Times New Roman': '"Times New Roman", Times, serif',
                    'Courier New': '"Courier New", Courier, monospace',
                    'Verdana': 'Verdana, sans-serif',
                    'Georgia': 'Georgia, serif',
                    'Palatino': 'Palatino, "Palatino Linotype", serif',
                    'Comic Sans MS': '"Comic Sans MS", cursive, sans-serif',
                    'Trebuchet MS': '"Trebuchet MS", sans-serif',
                    'Impact': 'Impact, sans-serif'
                };
                const fontFam = fontMap[wm.font] || `"${wm.font}", Arial, sans-serif`;
                const targetW = cw * (wm.size || 0.3) * 1.5;
                let wmFontSize = targetW / Math.max(1, wm.text.length * 0.4);
                wmFontSize = Math.min(wmFontSize, ch * 0.7);

                ctx.font = `${wm.italic ? 'italic ' : ''}${wm.bold ? 'bold ' : ''}${wmFontSize}px ${fontFam}`;
                ctx.fillStyle = wm.color || '#808080';
                const rad = (-(wm.angle || 0) * Math.PI) / 180;

                if (wm.mosaic) {
                    const steps = Math.max(2, parseInt(wm.density, 10) || 4);
                    const stepX = cw / steps;
                    const stepY = ch / steps;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    for (let r = -1; r <= steps + 1; r++) {
                        for (let c = -1; c <= steps + 1; c++) {
                            let posX = c * stepX;
                            let posY = r * stepY;
                            if (r % 2 !== 0) posX += stepX / 2;
                            ctx.save();
                            ctx.translate(posX, posY);
                            ctx.rotate(rad);
                            ctx.fillText(wm.text, 0, 0);
                            ctx.restore();
                        }
                    }
                } else {
                    let posX = cw / 2, posY = ch / 2;
                    let alignVal = 'center', baseLineVal = 'middle';
                    switch (wm.pos) {
                        case 'center': posX = cw / 2; posY = ch / 2; break;
                        case 'bottom-center': posX = cw / 2; posY = ch - wmPad; baseLineVal = 'bottom'; break;
                        case 'bottom-right': posX = cw - wmPad; posY = ch - wmPad; alignVal = 'right'; baseLineVal = 'bottom'; break;
                        case 'bottom-left': posX = wmPad; posY = ch - wmPad; alignVal = 'left'; baseLineVal = 'bottom'; break;
                        case 'top-center': posX = cw / 2; posY = wmPad; baseLineVal = 'top'; break;
                        case 'top-right': posX = cw - wmPad; posY = wmPad; alignVal = 'right'; baseLineVal = 'top'; break;
                        case 'top-left': posX = wmPad; posY = wmPad; alignVal = 'left'; baseLineVal = 'top'; break;
                    }
                    ctx.save();
                    ctx.translate(posX, posY);
                    ctx.rotate(rad);
                    ctx.textAlign = alignVal;
                    ctx.textBaseline = baseLineVal;
                    ctx.fillText(wm.text, 0, 0);
                    ctx.restore();
                }
            } else if (wm.type === 'image' && wm.imageDataUrl) {
                const wmImg = await ensureWmImageLoaded(wm.imageDataUrl);
                if (wmImg) {
                    const maxW = (cw - wmPad * 2) * (wm.size || 0.3);
                    const maxH = (ch - wmPad * 2) * (wm.size || 0.3);
                    const aspect = wm.imageAspect || (wmImg.width / (wmImg.height || 1));
                    let imgW = maxW;
                    let imgH = imgW / aspect;
                    if (imgH > maxH) { imgH = maxH; imgW = imgH * aspect; }

                    if (wm.mosaic) {
                        const steps = Math.max(2, parseInt(wm.density, 10) || 4);
                        const stepX = cw / steps;
                        const stepY = ch / steps;
                        for (let r = -1; r <= steps + 1; r++) {
                            for (let c = -1; c <= steps + 1; c++) {
                                let posX = c * stepX;
                                let posY = r * stepY;
                                if (r % 2 !== 0) posX += stepX / 2;
                                ctx.drawImage(wmImg, posX - imgW / 2, posY - imgH / 2, imgW, imgH);
                            }
                        }
                    } else {
                        let posX = (cw - imgW) / 2, posY = (ch - imgH) / 2;
                        switch (wm.pos) {
                            case 'center': posX = (cw - imgW) / 2; posY = (ch - imgH) / 2; break;
                            case 'bottom-center': posX = (cw - imgW) / 2; posY = ch - wmPad - imgH; break;
                            case 'bottom-right': posX = cw - wmPad - imgW; posY = ch - wmPad - imgH; break;
                            case 'bottom-left': posX = wmPad; posY = ch - wmPad - imgH; break;
                            case 'top-center': posX = (cw - imgW) / 2; posY = wmPad; break;
                            case 'top-right': posX = cw - wmPad - imgW; posY = wmPad; break;
                            case 'top-left': posX = wmPad; posY = wmPad; break;
                        }
                        ctx.drawImage(wmImg, posX, posY, imgW, imgH);
                    }
                }
            }
            ctx.restore();
        }

        const pn = stateObj.pageNumber;
        if (pn && pn.num) {
            ctx.save();
            const fontSize = (pn.size || 18) * scaleFactor;
            ctx.font = `normal ${fontSize}px Helvetica, Arial, sans-serif`;
            ctx.fillStyle = pn.color || '#000000';
            const pad = Math.max(18 * scaleFactor, 12);
            let xPos = cw - pad, yPos = ch - pad, alignVal = 'right';

            switch (pn.pos) {
                case 'bottom-center': xPos = cw / 2; yPos = ch - pad; alignVal = 'center'; ctx.textBaseline = 'bottom'; break;
                case 'bottom-right': xPos = cw - pad; yPos = ch - pad; alignVal = 'right'; ctx.textBaseline = 'bottom'; break;
                case 'bottom-left': xPos = pad; yPos = ch - pad; alignVal = 'left'; ctx.textBaseline = 'bottom'; break;
                case 'top-center': xPos = cw / 2; yPos = pad; alignVal = 'center'; ctx.textBaseline = 'top'; break;
                case 'top-right': xPos = cw - pad; yPos = pad; alignVal = 'right'; ctx.textBaseline = 'top'; break;
                case 'top-left': xPos = pad; yPos = pad; alignVal = 'left'; ctx.textBaseline = 'top'; break;
            }
            ctx.textAlign = alignVal;
            ctx.fillText(`Page - ${pn.num}`, xPos, yPos);
            ctx.restore();
        }
    }

    // ==========================================
    // 8. PAGE INSERT, DUPLICATE, ROTATE, REMOVE & RESET
    // ==========================================
    function insertNewState(newState) {
        if (!activeInsertPoint) return;
        const targetIdx = pagesState.findIndex(p => p.id === activeInsertPoint.targetId);
        if (targetIdx === -1) return;
        if (activeInsertPoint.position === 'before') pagesState.splice(targetIdx, 0, newState);
        else pagesState.splice(targetIdx + 1, 0, newState);
        if (insertPopup) insertPopup.classList.add('hidden');
        activeInsertPoint = null;
        document.querySelectorAll('.card-gap').forEach(el => el.classList.remove('active'));
        syncDOMWithState();
    }

    if (btnInsertCancel) {
        btnInsertCancel.addEventListener('click', () => {
            if (insertPopup) insertPopup.classList.add('hidden');
            activeInsertPoint = null;
            document.querySelectorAll('.card-gap').forEach(el => el.classList.remove('active'));
        });
    }

    if (btnInsertBlank) {
        btnInsertBlank.addEventListener('click', async () => {
            saveState();
            addedItemCounter++;
            const w = 400, h = 565;
            const blankUrl = await createBlankBlobUrl(w, h);
            insertNewState({
                id: `inserted-${addedItemCounter}`, type: 'blank', pageWidth: w, pageHeight: h, visualRotation: 0,
                resize: null, dataUrl: blankUrl, cacheUrl: blankUrl, texts: [], drawings: [], margins: null,
                watermark: null, pageNumber: null, isEdited: false, originalIndex: null, sourceIndex: null
            });
        });
    }

    if (btnInsertImage) btnInsertImage.addEventListener('click', () => insertImageInput.click());

    if (insertImageInput) {
        insertImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file || !activeInsertPoint) return;
            saveState();
            const blobUrl = ThumbnailCacheManager.registerBlobUrl(URL.createObjectURL(file));
            const tempImg = new Image();
            tempImg.onload = async () => {
                addedItemCounter++;
                const thumbCanvas = document.createElement('canvas');
                const sc = Math.min(1, DEVICE_PROFILE.maxThumbDim / Math.max(tempImg.width, tempImg.height, 1));
                thumbCanvas.width = Math.max(1, Math.round(tempImg.width * sc));
                thumbCanvas.height = Math.max(1, Math.round(tempImg.height * sc));
                thumbCanvas.getContext('2d').drawImage(tempImg, 0, 0, thumbCanvas.width, thumbCanvas.height);
                const thumbUrl = await canvasToBlobUrl(thumbCanvas, file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.8);
                releaseCanvasMemory(thumbCanvas);

                insertNewState({
                    id: `inserted-${addedItemCounter}`, type: 'image', mime: file.type,
                    pageWidth: tempImg.width, pageHeight: tempImg.height, dataUrl: blobUrl, cacheUrl: thumbUrl,
                    visualRotation: 0, resize: null, texts: [], drawings: [], margins: null,
                    watermark: null, pageNumber: null, isEdited: false, originalIndex: null, sourceIndex: null
                });
            };
            tempImg.src = blobUrl;
            insertImageInput.value = "";
        });
    }

    if (fabDuplicate) {
        fabDuplicate.addEventListener('click', () => {
            if (selectedPageIds.length === 0) return;
            const anyEdited = selectedPageIds.some(id => {
                const st = pagesState.find(p => p.id === id);
                return st && st.isEdited;
            });
            if (anyEdited && duplicatePopup) duplicatePopup.classList.remove('hidden');
            else performBatchDuplicate(true);
        });
    }
    if (btnDupChanges) btnDupChanges.addEventListener('click', () => { if (duplicatePopup) duplicatePopup.classList.add('hidden'); performBatchDuplicate(true); });
    if (btnDupOriginal) btnDupOriginal.addEventListener('click', () => { if (duplicatePopup) duplicatePopup.classList.add('hidden'); performBatchDuplicate(false); });
    if (btnDupCancel) btnDupCancel.addEventListener('click', () => { if (duplicatePopup) duplicatePopup.classList.add('hidden'); });

    function performBatchDuplicate(withChanges) {
        if (selectedPageIds.length === 0) return;
        saveState();
        const idsToDup = selectedPageIds.slice();
        idsToDup.forEach(id => {
            const idx = pagesState.findIndex(p => p.id === id);
            if (idx === -1) return;
            const sourceState = pagesState[idx];
            addedItemCounter++;
            const newState = clonePagesState([sourceState], true)[0];
            newState.id = `dup-${addedItemCounter}`;
            if (!withChanges) {
                newState.visualRotation = 0; newState.resize = null; newState.texts = [];
                newState.drawings = []; newState.margins = null; newState.watermark = null;
                newState.pageNumber = null; newState.isEdited = false;
            }
            pagesState.splice(idx + 1, 0, newState);
        });
        syncDOMWithState();
    }

    function rotatePageAnnotations90(stateObj, amount, oldVisW, oldVisH, newVisW, newVisH) {
        const steps = (((amount / 90) % 4) + 4) % 4;
        if (steps === 0) return;

        cloneSinglePageAnnotations(stateObj);

        if (stateObj.drawings && stateObj.drawings.length > 0) {
            stateObj.drawings.forEach(action => {
                const transformPt = (px, py) => {
                    if (steps === 1) return { x: 1 - py, y: px };
                    if (steps === 2) return { x: 1 - px, y: 1 - py };
                    if (steps === 3) return { x: py, y: 1 - px };
                    return { x: px, y: py };
                };
                if (action.type === 'fill' || action.tool === 'fill') {
                    const np = transformPt(action.x, action.y);
                    action.x = Math.round(np.x * 10000) / 10000;
                    action.y = Math.round(np.y * 10000) / 10000;
                } else if (action.points && action.points.length > 0) {
                    action.points = action.points.map(pt => {
                        const np = transformPt(pt.x, pt.y);
                        return {
                            x: Math.round(np.x * 10000) / 10000,
                            y: Math.round(np.y * 10000) / 10000
                        };
                    });
                    if (action.sizeRatio && oldVisW > 0 && newVisW > 0) {
                        action.sizeRatio = action.sizeRatio * (oldVisW / newVisW);
                    }
                }
            });
        }

        if (stateObj.texts && stateObj.texts.length > 0) {
            stateObj.texts.forEach(txt => {
                const oldW = oldVisW || 595.28;
                const oldH = oldVisH || 841.89;
                const newW = newVisW || oldH;
                const newH = newVisH || oldW;

                const bwRatioOld = txt.boxWidthRatio || ((txt.boxWidth || 50) / oldW);
                const bhRatioOld = txt.boxHeightRatio || ((txt.boxHeight || 24) / oldH);

                const cx = txt.x + bwRatioOld / 2;
                const cy = txt.y + bhRatioOld / 2;

                let newCx = cx, newCy = cy;
                if (steps === 1) { newCx = 1 - cy; newCy = cx; }
                else if (steps === 2) { newCx = 1 - cx; newCy = 1 - cy; }
                else if (steps === 3) { newCx = cy; newCy = 1 - cx; }

                const newBwRatio = bwRatioOld * (oldW / newW);
                const newBhRatio = bhRatioOld * (oldH / newH);

                if (txt.fontSizeRatio) {
                    txt.fontSizeRatio = txt.fontSizeRatio * (oldW / newW);
                }
                txt.boxWidthRatio = newBwRatio;
                txt.boxHeightRatio = newBhRatio;
                txt.x = newCx - newBwRatio / 2;
                txt.y = newCy - newBhRatio / 2;
                txt.rotation = ((txt.rotation || 0) + amount) % 360;
            });
        }

        if (stateObj.margins && hasActiveMargins(stateObj.margins)) {
            const m = stateObj.margins;
            const t = m.top || 0, r = m.right || 0, b = m.bottom || 0, l = m.left || 0;
            if (steps === 1) { m.top = l; m.right = t; m.bottom = r; m.left = b; }
            else if (steps === 2) { m.top = b; m.right = l; m.bottom = t; m.left = r; }
            else if (steps === 3) { m.top = r; m.right = b; m.bottom = l; m.left = t; }
        }
    }

    function applyRotation(amount) {
        const targets = (isDetailViewOpen && selectedPageId)
            ? [selectedPageId]
            : (selectedPageIds.length > 0 ? selectedPageIds : pagesState.map(p => p.id));
        if (targets.length === 0) return;
        saveState();
        targets.forEach(id => {
            const stateObj = pagesState.find(p => p.id === id);
            if (!stateObj) return;

            const oldRot = stateObj.visualRotation || 0;
            const oldSideways = Math.abs(oldRot % 180) === 90;
            const oldVisW = oldSideways ? (stateObj.pageHeight || 595.28) : (stateObj.pageWidth || 595.28);
            const oldVisH = oldSideways ? (stateObj.pageWidth || 841.89) : (stateObj.pageHeight || 841.89);

            let newRot = (oldRot + amount) % 360;
            if (newRot === -0) newRot = 0;
            stateObj.visualRotation = newRot;

            const newSideways = Math.abs(newRot % 180) === 90;
            const newVisW = newSideways ? (stateObj.pageHeight || 595.28) : (stateObj.pageWidth || 595.28);
            const newVisH = newSideways ? (stateObj.pageWidth || 841.89) : (stateObj.pageHeight || 841.89);

            rotatePageAnnotations90(stateObj, amount, oldVisW, oldVisH, newVisW, newVisH);

            const wrapper = document.querySelector(`.card-wrapper[data-id="${id}"]`);
            if (wrapper) {
                const canvas = wrapper.querySelector('canvas');
                if (canvas) {
                    const isLandscape = Math.abs(stateObj.visualRotation % 180) === 90;
                    canvas.style.transform = `rotate(${stateObj.visualRotation}deg) scale(${isLandscape ? 0.707 : 1})`;
                }
            }
            updateSingleCardBadge(id);
        });
        if (isDetailViewOpen && !isDrawMode && !isTextEditingOpen && !isMarginsMode && selectedPageId) {
            renderBigCanvas(selectedPageId, true, false);
        }
    }

    if (fabRotateLeft) fabRotateLeft.addEventListener('click', () => applyRotation(-90));
    if (fabRotateRight) fabRotateRight.addEventListener('click', () => applyRotation(90));

    if (fabRemove) {
        fabRemove.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            if (isDetailViewOpen) {
                if (pagesState.length <= 1) return alert("Cannot delete the last page.");
            } else {
                if (selectedPageIds.length === 0) return;
                if (selectedPageIds.length >= pagesState.length) return alert("Cannot delete all pages. At least 1 page must remain.");
            }
            if (pageRemovePopup) {
                pageRemovePopup.style.zIndex = '100055';
                pageRemovePopup.classList.remove('hidden');
            }
        });
    }
    if (btnCancelPageRemove) btnCancelPageRemove.addEventListener('click', () => { if (pageRemovePopup) pageRemovePopup.classList.add('hidden'); });
    if (btnConfirmPageRemove) {
        btnConfirmPageRemove.addEventListener('click', async () => {
            if (pageRemovePopup) pageRemovePopup.classList.add('hidden');

            if (isDetailViewOpen && selectedPageId) {
                if (pagesState.length <= 1) return;
                saveState();

                const navListBefore = getExpandNavigationList();
                const curNavIdx = navListBefore.indexOf(selectedPageId);
                const curGlobalIdx = pagesState.findIndex(p => p.id === selectedPageId);

                const wrapper = document.querySelector(`.card-wrapper[data-id="${selectedPageId}"]`);
                if (wrapper) {
                    ThumbnailRenderQueue.unobserveWrapper(wrapper);
                    const c = wrapper.querySelector('canvas');
                    if (c) releaseCanvasMemory(c);
                    wrapper.remove();
                }

                pagesState = pagesState.filter(p => p.id !== selectedPageId);
                selectedPageIds = selectedPageIds.filter(id => id !== selectedPageId);

                let nextPageId = null;
                if (selectedPageIds.length > 0) {
                    const navListAfter = pagesState.filter(p => selectedPageIds.includes(p.id)).map(p => p.id);
                    const nextIdx = Math.min(Math.max(0, curNavIdx), navListAfter.length - 1);
                    nextPageId = navListAfter[nextIdx];
                } else {
                    const nextGlobalIdx = Math.min(Math.max(0, curGlobalIdx), pagesState.length - 1);
                    nextPageId = pagesState[nextGlobalIdx].id;
                    selectedPageIds = [nextPageId];
                }

                selectedPageId = nextPageId;
                updateDynamicLabels();
                updateSelectionUI();
                updateExpandNavigationUI();
                await renderBigCanvas(selectedPageId, true, false);
                return;
            }

            if (selectedPageIds.length === 0) return;
            saveState();
            const removeSet = new Set(selectedPageIds);
            selectedPageIds.forEach(id => {
                const wrapper = document.querySelector(`.card-wrapper[data-id="${id}"]`);
                if (wrapper) {
                    ThumbnailRenderQueue.unobserveWrapper(wrapper);
                    const c = wrapper.querySelector('canvas');
                    if (c) releaseCanvasMemory(c);
                    wrapper.remove();
                }
            });
            pagesState = pagesState.filter(p => !removeSet.has(p.id));
            clearSelection();
            updateDynamicLabels();
        });
    }

    if (fabReset) {
        fabReset.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            if (!isDetailViewOpen && selectedPageIds.length === 0) return;
            if (pageResetPopup) {
                pageResetPopup.style.zIndex = '100055';
                pageResetPopup.classList.remove('hidden');
            }
        });
    }
    if (btnCancelPageReset) btnCancelPageReset.addEventListener('click', () => { if (pageResetPopup) pageResetPopup.classList.add('hidden'); });
    if (btnConfirmPageReset) {
        btnConfirmPageReset.addEventListener('click', async () => {
            if (pageResetPopup) pageResetPopup.classList.add('hidden');
            const idsToReset = (isDetailViewOpen && selectedPageId) ? [selectedPageId] : selectedPageIds;
            if (idsToReset.length === 0) return;
            saveState();
            idsToReset.forEach(id => {
                const stateObj = pagesState.find(p => p.id === id);
                if (!stateObj) return;
                stateObj.visualRotation = 0; stateObj.resize = null; stateObj.texts = [];
                stateObj.drawings = []; stateObj.margins = null; stateObj.watermark = null;
                stateObj.pageNumber = null; stateObj.isEdited = false;
            });
            syncDOMWithState();
            if (isDetailViewOpen && selectedPageId) {
                updateExpandNavigationUI();
                await renderBigCanvas(selectedPageId, true, false);
            }
        });
    }

    if (globalResetBtn) {
        globalResetBtn.addEventListener('click', () => {
            if (pdfSources.length === 0) return;
            requestConfirm("Reset Entire Workspace", "Are you sure you want to revert all pages to their original state? This undoes everything.", () => {
                saveState();
                progressContainer.style.display = "block"; updateProgress(10, "Resetting document...");
                if (isDetailViewOpen) closeDetailView();

                ThumbnailRenderQueue.reset();
                pdfGrid.querySelectorAll('canvas').forEach(releaseCanvasMemory);
                pdfGrid.innerHTML = '';
                pagesState = [];
                clearSelection();

                if (pageNumToggle) { pageNumToggle.checked = false; if (pageNumSettingsPanel) pageNumSettingsPanel.style.display = 'none'; }
                if (globalWmToggle) { globalWmToggle.checked = false; if (wmSettingsPanel) wmSettingsPanel.style.display = 'none'; }
                if (batchResizeToggle) { batchResizeToggle.checked = false; }
                syncAllGearIconsVisibility();

                (async () => {
                    const fragment = document.createDocumentFragment();
                    const eagerIds = [];
                    const eagerLimit = DEVICE_PROFILE.isMobile ? 6 : 12;

                    for (let s = 0; s < pdfSources.length; s++) {
                        if (!pdfSources[s]) continue;
                        const pdf = await getCachedPdfDoc(s);
                        let defW = 595.28, defH = 841.89;
                        try {
                            const fp = await pdf.getPage(1);
                            const vp1 = fp.getViewport({ scale: 1 });
                            defW = vp1.width; defH = vp1.height;
                            if (fp.cleanup) fp.cleanup();
                        } catch (e) {}

                        for (let i = 1; i <= pdf.numPages; i++) {
                            const canvas = document.createElement('canvas');
                            canvas.width = 1;
                            canvas.height = 1;

                            const uniqueId = `page-src${s}-${i}`;
                            const wrapper = createCardWrapper(uniqueId, `Page`, canvas);
                            wrapper.dataset.thumbRendered = 'false';

                            const stateObj = {
                                id: uniqueId, type: 'original', sourceIndex: s, originalIndex: i,
                                visualRotation: 0, resize: null, rawCacheUrl: null, cacheUrl: null,
                                texts: [], drawings: [], margins: null, watermark: null, pageNumber: null, isEdited: false,
                                pageWidth: defW, pageHeight: defH
                            };
                            attachCardEvents(wrapper, stateObj);
                            pagesState.push(stateObj);
                            fragment.appendChild(wrapper);
                            eagerIds.push({ id: uniqueId, wrapper });
                        }
                    }

                    pdfGrid.appendChild(fragment);
                    eagerIds.forEach(({ id, wrapper }, idx) => {
                        ThumbnailRenderQueue.observeWrapper(wrapper);
                        if (idx < eagerLimit) ThumbnailRenderQueue.enqueue(id, true);
                    });

                    updateGridAspectRatio();
                    updateDynamicLabels();
                    initSortable();
                    updateSelectionUI();
                    updateProgress(100, "Ready!");
                    setTimeout(() => progressContainer.style.display = "none", 600);
                })();
            });
        });
    }

    if (fabReplace) {
        fabReplace.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            if (!selectedPageId) return;
            closeAllSubmenus();
            if (replacePopup) replacePopup.classList.remove('hidden');
        });
    }
    if (btnReplaceCancel) btnReplaceCancel.addEventListener('click', () => { if (replacePopup) replacePopup.classList.add('hidden'); });
    if (btnReplaceBlank) {
        btnReplaceBlank.addEventListener('click', async () => {
            if (replacePopup) replacePopup.classList.add('hidden');
            if (!selectedPageId) return;
            saveState();
            const stateObj = pagesState.find(p => p.id === selectedPageId);
            const w = stateObj.pageWidth || 400, h = stateObj.pageHeight || 565;
            stateObj.type = 'blank'; stateObj.originalIndex = null; stateObj.sourceIndex = null;
            const blankUrl = await createBlankBlobUrl(w, h);
            stateObj.dataUrl = blankUrl;
            stateObj.cacheUrl = blankUrl;
            syncDOMWithState();
        });
    }
    if (btnReplaceImage) {
        btnReplaceImage.addEventListener('click', () => {
            if (replacePopup) replacePopup.classList.add('hidden');
            replaceImageInput.click();
        });
    }

    replaceImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file || !selectedPageId) return;
        saveState();
        const blobUrl = ThumbnailCacheManager.registerBlobUrl(URL.createObjectURL(file));
        const stateObj = pagesState.find(p => p.id === selectedPageId);
        const tempImg = new Image();
        tempImg.onload = async () => {
            const thumbCanvas = document.createElement('canvas');
            const sc = Math.min(1, DEVICE_PROFILE.maxThumbDim / Math.max(tempImg.width, tempImg.height, 1));
            thumbCanvas.width = Math.max(1, Math.round(tempImg.width * sc));
            thumbCanvas.height = Math.max(1, Math.round(tempImg.height * sc));
            thumbCanvas.getContext('2d').drawImage(tempImg, 0, 0, thumbCanvas.width, thumbCanvas.height);
            const thumbUrl = await canvasToBlobUrl(thumbCanvas, file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.8);
            releaseCanvasMemory(thumbCanvas);

            stateObj.type = 'image'; stateObj.mime = file.type;
            stateObj.dataUrl = blobUrl; stateObj.cacheUrl = thumbUrl;
            stateObj.pageWidth = tempImg.width; stateObj.pageHeight = tempImg.height;
            stateObj.originalIndex = null; stateObj.sourceIndex = null;
            syncDOMWithState();
        };
        tempImg.src = blobUrl;
        replaceImageInput.value = "";
    });

    async function createBlankBlobUrl(w = 400, h = 565) {
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const cx = c.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h);
        const url = await canvasToBlobUrl(c, 'image/jpeg', 0.8);
        releaseCanvasMemory(c);
        return url;
    }

    // ==========================================
    // 9. CROPPER & COMPOSITE PAGE RENDERER
    // ==========================================
    async function renderCompositePageCanvas(stateObj, targetScale = 2.0) {
        const isSideways = Math.abs((stateObj.visualRotation || 0) % 180) === 90;
        let rawWidth = 0, rawHeight = 0, pageObj = null, imgObj = null, cleanImgObj = null;

        if (stateObj.type === 'original') {
            const pdf = await getCachedPdfDoc(stateObj.sourceIndex);
            pageObj = await pdf.getPage(stateObj.originalIndex);
            const totalRot = (pageObj.rotate || 0) + (stateObj.visualRotation || 0);
            const vp1 = pageObj.getViewport({ scale: 1, rotation: totalRot });
            rawWidth = vp1.width; rawHeight = vp1.height;
        } else {
            imgObj = new Image();
            imgObj.src = stateObj.dataUrl || stateObj.cacheUrl;
            await new Promise(res => { imgObj.onload = res; imgObj.onerror = res; });
            rawWidth = isSideways ? imgObj.height : imgObj.width;
            rawHeight = isSideways ? imgObj.width : imgObj.height;

            cleanImgObj = new Image();
            cleanImgObj.src = stateObj.cleanDataUrl || stateObj.cacheUrl || stateObj.dataUrl;
            await new Promise(res => { cleanImgObj.onload = res; cleanImgObj.onerror = res; });
        }

        const hasMargins = hasActiveMargins(stateObj.margins);
        const m = hasMargins
            ? stateObj.margins
            : { top: 0, bottom: 0, left: 0, right: 0, hasBg: false, color: '#FFFFFF' };

        const isTransparentMargin = hasMargins && !m.hasBg;

        const totalUnscaledW = rawWidth + (m.left || 0) + (m.right || 0);
        const totalUnscaledH = rawHeight + (m.top || 0) + (m.bottom || 0);

        const maxDimension = DEVICE_PROFILE.maxOverlayDim;
        const safeScale = Math.min(targetScale, maxDimension / Math.max(totalUnscaledW, totalUnscaledH, 1));

        const imgW = Math.round(rawWidth * safeScale);
        const imgH = Math.round(rawHeight * safeScale);
        const mTopPx = Math.round((m.top || 0) * safeScale);
        const mBottomPx = Math.round((m.bottom || 0) * safeScale);
        const mLeftPx = Math.round((m.left || 0) * safeScale);
        const mRightPx = Math.round((m.right || 0) * safeScale);

        const cw = imgW + mLeftPx + mRightPx;
        const ch = imgH + mTopPx + mBottomPx;

        const cleanCanvas = document.createElement('canvas');
        cleanCanvas.width = cw; cleanCanvas.height = ch;
        const cleanCtx = cleanCanvas.getContext('2d');
        if (m.hasBg) {
            cleanCtx.fillStyle = m.color || '#ffffff';
            cleanCtx.fillRect(0, 0, cw, ch);
        } else {
            cleanCtx.clearRect(0, 0, cw, ch);
        }

        const outCanvas = document.createElement('canvas');
        outCanvas.width = cw; outCanvas.height = ch;
        const outCtx = outCanvas.getContext('2d');
        if (m.hasBg) {
            outCtx.fillStyle = m.color || '#ffffff';
            outCtx.fillRect(0, 0, cw, ch);
        } else {
            outCtx.clearRect(0, 0, cw, ch);
        }

        const basePageCanvas = document.createElement('canvas');
        basePageCanvas.width = imgW; basePageCanvas.height = imgH;
        const bCtx = basePageCanvas.getContext('2d');
        if (stateObj.type === 'original' || stateObj.type === 'blank') {
            bCtx.fillStyle = '#ffffff';
            bCtx.fillRect(0, 0, imgW, imgH);
        } else {
            bCtx.clearRect(0, 0, imgW, imgH);
        }

        if (stateObj.type === 'original') {
            const totalRot = (pageObj.rotate || 0) + (stateObj.visualRotation || 0);
            const vp = pageObj.getViewport({ scale: safeScale, rotation: totalRot });
            await pageObj.render({ canvasContext: bCtx, viewport: vp }).promise;
            if (pageObj.cleanup) { try { pageObj.cleanup(); } catch (e) {} }
            cleanCtx.drawImage(basePageCanvas, mLeftPx, mTopPx, imgW, imgH);
            outCtx.drawImage(basePageCanvas, mLeftPx, mTopPx, imgW, imgH);
        } else {
            const drawW = isSideways ? rawHeight : rawWidth;
            const drawH = isSideways ? rawWidth : rawHeight;

            if (cleanImgObj) {
                cleanCtx.save();
                cleanCtx.translate(mLeftPx + imgW / 2, mTopPx + imgH / 2);
                cleanCtx.rotate(((stateObj.visualRotation || 0) * Math.PI) / 180);
                cleanCtx.scale(safeScale, safeScale);
                cleanCtx.drawImage(cleanImgObj, -drawW / 2, -drawH / 2, drawW, drawH);
                cleanCtx.restore();
            }
            if (imgObj) {
                outCtx.save();
                outCtx.translate(mLeftPx + imgW / 2, mTopPx + imgH / 2);
                outCtx.rotate(((stateObj.visualRotation || 0) * Math.PI) / 180);
                outCtx.scale(safeScale, safeScale);
                outCtx.drawImage(imgObj, -drawW / 2, -drawH / 2, drawW, drawH);
                outCtx.restore();
            }
        }
        releaseCanvasMemory(basePageCanvas);

        if (stateObj.drawings && stateObj.drawings.length > 0) {
            const tempDrawCanvas = document.createElement('canvas');
            tempDrawCanvas.width = cw; tempDrawCanvas.height = ch;
            const tempDrawCtx = tempDrawCanvas.getContext('2d', { willReadFrequently: true });
            replayDrawingsOnCanvas(tempDrawCanvas, tempDrawCtx, stateObj.drawings, safeScale, mLeftPx, mTopPx, imgW, imgH);
            outCtx.drawImage(tempDrawCanvas, 0, 0);
            releaseCanvasMemory(tempDrawCanvas);
        }

        if (stateObj.texts && stateObj.texts.length > 0) {
            drawSavedTextsOnContext(outCtx, stateObj.texts, mLeftPx, mTopPx, imgW, imgH, safeScale);
        }

        await drawWatermarkAndPageNumOnContext(outCtx, stateObj, cw, ch, safeScale);

        return { compositeCanvas: outCanvas, cleanCanvas: cleanCanvas, isTransparentMargin };
    }

    if (fabCrop) {
        fabCrop.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            if (!selectedPageId) return;
            closeAllSubmenus();
            const stateObj = pagesState.find(p => p.id === selectedPageId);
            if (stateObj.type === 'blank' && (!stateObj.texts || stateObj.texts.length === 0) && (!stateObj.drawings || stateObj.drawings.length === 0) && !hasActiveMargins(stateObj.margins)) {
                return alert("Cannot crop an empty blank page.");
            }
            openCropper(stateObj);
        });
    }

    async function openCropper(stateObj) {
        progressContainer.style.display = "block";
        updateProgress(50, "Preparing Image...");
        await ensureCropperLoaded();
        let compositeBlobUrl = null;
        let cleanSourceCanvas = null;
        let useTransparentPng = false;

        try {
            const rendered = await renderCompositePageCanvas(stateObj, DEVICE_PROFILE.exportScale);
            useTransparentPng = Boolean(rendered.isTransparentMargin || stateObj.mime === 'image/png');
            compositeBlobUrl = useTransparentPng
                ? await canvasToBlobUrl(rendered.compositeCanvas, "image/png")
                : await canvasToBlobUrl(rendered.compositeCanvas, "image/jpeg", 0.94);
            cleanSourceCanvas = rendered.cleanCanvas;
            releaseCanvasMemory(rendered.compositeCanvas);
        } catch (e) {
            console.error("Failed to render composite page for crop", e);
            compositeBlobUrl = stateObj.dataUrl || stateObj.cacheUrl;
        }
        progressContainer.style.display = "none";

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
        imageElement.onload = () => {
            const cropper = new Cropper(imageElement, { viewMode: 1, autoCropArea: 1, background: true, responsive: true, checkOrientation: false });
            const tiltSlider = modal.querySelector("#tiltSlider"), tiltVal = modal.querySelector("#tiltVal"), tiltStepInput = modal.querySelector("#tiltStepInput"), btnTiltMinus = modal.querySelector("#btnTiltMinus"), btnTiltPlus = modal.querySelector("#btnTiltPlus"), resetTiltBtn = modal.querySelector("#resetTiltBtn");
            let currentTilt = 0;

            function updateTiltUI() {
                if (currentTilt > 180) currentTilt = 180;
                if (currentTilt < -180) currentTilt = -180;
                tiltSlider.value = currentTilt;
                tiltVal.innerText = (Math.round(currentTilt * 10) / 10);
                cropper.rotateTo(currentTilt);
            }

            tiltStepInput.addEventListener("input", (e) => { let step = parseFloat(e.target.value) || 1; btnTiltMinus.innerText = "-" + step + "°"; btnTiltPlus.innerText = "+" + step + "°"; });
            btnTiltMinus.addEventListener("click", () => { let step = parseFloat(tiltStepInput.value) || 1; currentTilt -= step; updateTiltUI(); });
            btnTiltPlus.addEventListener("click", () => { let step = parseFloat(tiltStepInput.value) || 1; currentTilt += step; updateTiltUI(); });
            tiltSlider.addEventListener("input", (e) => { currentTilt = parseFloat(e.target.value); updateTiltUI(); });
            resetTiltBtn.addEventListener("click", () => { currentTilt = 0; updateTiltUI(); });

            modal.querySelector(".save-btn").onclick = async () => {
                const cropOptions = useTransparentPng
                    ? { imageSmoothingEnabled: true, imageSmoothingQuality: 'high' }
                    : { fillColor: '#ffffff', imageSmoothingEnabled: true, imageSmoothingQuality: 'high' };
                const croppedCanvas = cropper.getCroppedCanvas(cropOptions);
                const cropData = cropper.getData();
                saveState();

                stateObj.type = 'image';
                stateObj.mime = useTransparentPng ? 'image/png' : 'image/jpeg';
                stateObj.dataUrl = useTransparentPng
                    ? await canvasToBlobUrl(croppedCanvas, "image/png")
                    : await canvasToBlobUrl(croppedCanvas, "image/jpeg", 0.92);

                let cleanCroppedCanvas = croppedCanvas;
                if (cleanSourceCanvas && cleanSourceCanvas.width > 1) {
                    const W = cleanSourceCanvas.width, H = cleanSourceCanvas.height;
                    const rad = ((cropData.rotate || 0) * Math.PI) / 180;
                    const cos = Math.abs(Math.cos(rad)), sin = Math.abs(Math.sin(rad));
                    const rotW = W * cos + H * sin, rotH = W * sin + H * cos;

                    const rotCleanCanvas = document.createElement('canvas');
                    rotCleanCanvas.width = Math.max(1, Math.round(rotW));
                    rotCleanCanvas.height = Math.max(1, Math.round(rotH));
                    const rCtx = rotCleanCanvas.getContext('2d');
                    if (!useTransparentPng) {
                        rCtx.fillStyle = '#ffffff';
                        rCtx.fillRect(0, 0, rotCleanCanvas.width, rotCleanCanvas.height);
                    }
                    rCtx.save();
                    rCtx.translate(rotW / 2, rotH / 2);
                    rCtx.rotate(rad);
                    rCtx.scale(cropData.scaleX || 1, cropData.scaleY || 1);
                    rCtx.drawImage(cleanSourceCanvas, -W / 2, -H / 2, W, H);
                    rCtx.restore();

                    cleanCroppedCanvas = document.createElement('canvas');
                    cleanCroppedCanvas.width = croppedCanvas.width;
                    cleanCroppedCanvas.height = croppedCanvas.height;
                    const ccCtx = cleanCroppedCanvas.getContext('2d');
                    if (!useTransparentPng) {
                        ccCtx.fillStyle = '#ffffff';
                        ccCtx.fillRect(0, 0, cleanCroppedCanvas.width, cleanCroppedCanvas.height);
                    }
                    ccCtx.drawImage(
                        rotCleanCanvas,
                        cropData.x, cropData.y, cropData.width, cropData.height,
                        0, 0, cleanCroppedCanvas.width, cleanCroppedCanvas.height
                    );

                    stateObj.cleanDataUrl = useTransparentPng
                        ? await canvasToBlobUrl(cleanCroppedCanvas, "image/png")
                        : await canvasToBlobUrl(cleanCroppedCanvas, "image/jpeg", 0.90);
                    releaseCanvasMemory(rotCleanCanvas);
                    releaseCanvasMemory(cleanSourceCanvas);
                }

                const thumbCanvas = document.createElement('canvas');
                const thumbScale = Math.min(1, DEVICE_PROFILE.maxThumbDim / Math.max(cleanCroppedCanvas.width, cleanCroppedCanvas.height, 1));
                thumbCanvas.width = Math.max(1, Math.round(cleanCroppedCanvas.width * thumbScale));
                thumbCanvas.height = Math.max(1, Math.round(cleanCroppedCanvas.height * thumbScale));
                thumbCanvas.getContext('2d').drawImage(cleanCroppedCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
                stateObj.cacheUrl = useTransparentPng
                    ? await canvasToBlobUrl(thumbCanvas, "image/png")
                    : await canvasToBlobUrl(thumbCanvas, "image/jpeg", DEVICE_PROFILE.thumbQuality);
                releaseCanvasMemory(thumbCanvas);

                const finalW = croppedCanvas.width * 0.5;
                const finalH = croppedCanvas.height * 0.5;
                if (cleanCroppedCanvas !== croppedCanvas) releaseCanvasMemory(cleanCroppedCanvas);
                releaseCanvasMemory(croppedCanvas);

                stateObj.visualRotation = 0;
                stateObj.texts = [];
                stateObj.drawings = [];
                stateObj.margins = null;
                stateObj.resize = null;
                stateObj.watermark = null;
                stateObj.pageNumber = null;
                stateObj.pageWidth = finalW;
                stateObj.pageHeight = finalH;
                stateObj.originalIndex = null;
                stateObj.sourceIndex = null;

                cropper.destroy();
                if (compositeBlobUrl && compositeBlobUrl !== stateObj.dataUrl) {
                    ThumbnailCacheManager.revokeBlobUrl(compositeBlobUrl);
                }
                modal.remove();
                syncDOMWithState();
                if (isDetailViewOpen) renderBigCanvas(selectedPageId, true, false);
            };
        };
        imageElement.src = compositeBlobUrl;
        modal.querySelector(".cancel-btn").onclick = () => {
            if (cleanSourceCanvas) releaseCanvasMemory(cleanSourceCanvas);
            if (compositeBlobUrl && compositeBlobUrl !== stateObj.dataUrl && compositeBlobUrl !== stateObj.cacheUrl) {
                ThumbnailCacheManager.revokeBlobUrl(compositeBlobUrl);
            }
            modal.remove();
        };
    }

    // ==========================================
    // 10. COLOR PICKER & GPU-SAFE COLOR UTILITIES
    // ==========================================
    let openColorModalGlobal = null;

    function setupColorPicker() {
        const openColorModal = async (triggerEl, targetType) => {
            await ensureIroLoaded();
            activeColorTarget = targetType;
            customColorModal.style.display = "flex";
            colorPopoverOverlay.style.display = "block";

            const headerTitle = customColorModal.querySelector('.panel-header span');
            if (headerTitle) {
                if (targetType === 'text') headerTitle.innerText = "Text Color";
                else if (targetType === 'bg') headerTitle.innerText = "Background Color";
                else if (targetType === 'border') headerTitle.innerText = "Stroke Color";
                else if (targetType === 'draw') headerTitle.innerText = "Draw Color";
                else if (targetType === 'margin-bg') headerTitle.innerText = "Margin Color";
            }

            const rect = triggerEl.getBoundingClientRect();
            let modalTop = rect.bottom + 8;
            let modalLeft = rect.left + (rect.width / 2) - 130;
            if (modalLeft < 10) modalLeft = 10;
            if (modalLeft + 260 > window.innerWidth) modalLeft = window.innerWidth - 270;
            if (modalTop + 330 > window.innerHeight) modalTop = rect.top - 330;

            customColorModal.style.position = 'fixed';
            customColorModal.style.top = modalTop + 'px';
            customColorModal.style.left = modalLeft + 'px';
            customColorModal.style.transform = 'none';
            customColorModal.style.width = '260px';
            customColorModal.style.margin = '0';

            if (!colorPickerInstance && typeof iro !== 'undefined') {
                colorPickerInstance = new iro.ColorPicker("#iroPickerContainer", {
                    width: 200, color: "#000000", borderWidth: 1, borderColor: "#00e676",
                    layout: [{ component: iro.ui.Box }, { component: iro.ui.Slider, options: { sliderType: 'hue' } }]
                });
                colorPickerInstance.on('color:change', function (color) {
                    const hex = color.hexString.toUpperCase();
                    ccpHexInput.value = hex;
                    ccpPreviewCircle.style.backgroundColor = hex;
                    applyPickedColor(hex);
                });
            }

            const currentHex = triggerEl.style.backgroundColor ? rgbToHex(triggerEl.style.backgroundColor) : '#000000';
            ccpHexInput.value = currentHex.toUpperCase();
            ccpPreviewCircle.style.backgroundColor = currentHex;
            if (colorPickerInstance) colorPickerInstance.color.hexString = currentHex;
        };

        openColorModalGlobal = openColorModal;

        function applyPickedColor(hex) {
            const targetContent = getActiveTextElement();
            if (activeColorTarget === 'text') {
                colorTriggerBtn.style.backgroundColor = hex;
                if (targetContent) targetContent.style.color = hex;
            } else if (activeColorTarget === 'bg') {
                bgColorTriggerBtn.style.backgroundColor = hex;
                if (targetContent) { targetContent.parentElement.dataset.bgColor = hex; updateBgStyles(targetContent); }
            } else if (activeColorTarget === 'border') {
                if (borderColorTriggerBtn) borderColorTriggerBtn.style.backgroundColor = hex;
                if (targetContent) { targetContent.parentElement.dataset.borderColor = hex; updateBorderStyles(targetContent); }
            } else if (activeColorTarget === 'draw') {
                if (drawColorTriggerBtn) drawColorTriggerBtn.style.backgroundColor = hex;
                updateMainPointStyle();
            } else if (activeColorTarget === 'margin-bg') {
                const mColorBtn = document.getElementById('margin-color-trigger-btn');
                if (mColorBtn) mColorBtn.style.backgroundColor = hex;
                if (workingMargins) { workingMargins.color = hex; renderMarginPreviewSync(); }
            }
        }

        colorTriggerBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openColorModal(colorTriggerBtn, 'text'); });
        bgColorTriggerBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openColorModal(bgColorTriggerBtn, 'bg'); });
        if (borderColorTriggerBtn) borderColorTriggerBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openColorModal(borderColorTriggerBtn, 'border'); });
        if (drawColorTriggerBtn) drawColorTriggerBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openColorModal(drawColorTriggerBtn, 'draw'); });

        function closeColorPopup(e) {
            if (e) e.stopPropagation();
            customColorModal.style.display = "none";
            colorPopoverOverlay.style.display = "none";
        }
        ccpCloseBtn.addEventListener('click', closeColorPopup);
        ccpOkBtn.addEventListener('click', closeColorPopup);
        colorPopoverOverlay.addEventListener('click', closeColorPopup);

        ccpHexInput.addEventListener('input', (e) => {
            let hex = e.target.value;
            if (!hex.startsWith("#")) hex = "#" + hex;
            if (/^#[0-9A-F]{6}$/i.test(hex)) {
                ccpPreviewCircle.style.backgroundColor = hex;
                if (colorPickerInstance) colorPickerInstance.color.hexString = hex;
                applyPickedColor(hex.toUpperCase());
            }
        });
        ccpHexInput.addEventListener('blur', (e) => {
            let hex = e.target.value;
            if (!hex.startsWith("#")) hex = "#" + hex;
            e.target.value = hex.toUpperCase();
        });
    }
    setupColorPicker();

    function rgbToHex(rgbStr) {
        if (!rgbStr) return '#000000';
        rgbStr = rgbStr.trim();
        if (rgbStr.startsWith('#')) {
            if (rgbStr.length === 4) return '#' + rgbStr[1] + rgbStr[1] + rgbStr[2] + rgbStr[2] + rgbStr[3] + rgbStr[3];
            return rgbStr.toUpperCase();
        }
        const match = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (!match) return '#000000';
        return "#" + ((1 << 24) + (parseInt(match[1], 10) << 16) + (parseInt(match[2], 10) << 8) + parseInt(match[3], 10)).toString(16).slice(1).toUpperCase();
    }

    function hexToRgba(hex, opacity) {
        const cleanHex = rgbToHex(hex);
        let r = 0, g = 0, b = 0;
        if (cleanHex.length === 7) {
            r = parseInt(cleanHex.substring(1, 3), 16);
            g = parseInt(cleanHex.substring(3, 5), 16);
            b = parseInt(cleanHex.substring(5, 7), 16);
        }
        return `rgba(${r},${g},${b},${opacity})`;
    }

    function parseHexToRgbObj(hexStr) {
        const cleanHex = rgbToHex(hexStr || '#ff5252');
        return {
            r: parseInt(cleanHex.substring(1, 3), 16) || 0,
            g: parseInt(cleanHex.substring(3, 5), 16) || 0,
            b: parseInt(cleanHex.substring(5, 7), 16) || 0,
            hex: cleanHex
        };
    }

    function getDrawColorRgb() {
        const raw = drawColorTriggerBtn ? drawColorTriggerBtn.style.backgroundColor : '#ff5252';
        return parseHexToRgbObj(raw || '#ff5252');
    }

    function getContrastColor(hexColor) {
        const hex = rgbToHex(hexColor).replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16), g = parseInt(hex.substr(2, 2), 16), b = parseInt(hex.substr(4, 2), 16);
        return (((r * 299) + (g * 587) + (b * 114)) / 1000 >= 128) ? '#000000' : '#FFFFFF';
    }

    // Dedicated tiny 16x16 readback canvas so getImageData is NEVER called on #editor-canvas.
    // This prevents Chrome from demoting #editor-canvas from GPU to CPU software rendering on the 2nd page!
    let avgColorSampleCanvas = null;
    let avgColorSampleCtx = null;

    function getAverageRGB(ctx, x, y, width, height) {
        try {
            const srcCanvas = ctx && ctx.canvas ? ctx.canvas : editorCanvas;
            if (!srcCanvas || srcCanvas.width <= 1 || srcCanvas.height <= 1) return "#FFFFFF";
            if (!avgColorSampleCanvas) {
                avgColorSampleCanvas = document.createElement('canvas');
                avgColorSampleCanvas.width = 16;
                avgColorSampleCanvas.height = 16;
                avgColorSampleCtx = avgColorSampleCanvas.getContext('2d', { willReadFrequently: true });
            }
            const cssW = parseFloat(srcCanvas.style.width) || srcCanvas.width;
            const cssH = parseFloat(srcCanvas.style.height) || srcCanvas.height;
            const ratioX = srcCanvas.width / Math.max(1, cssW);
            const ratioY = srcCanvas.height / Math.max(1, cssH);

            const sx = Math.max(0, Math.min(srcCanvas.width - 1, Math.round(x * ratioX)));
            const sy = Math.max(0, Math.min(srcCanvas.height - 1, Math.round(y * ratioY)));
            const sw = Math.max(1, Math.min(srcCanvas.width - sx, Math.round(width * ratioX)));
            const sh = Math.max(1, Math.min(srcCanvas.height - sy, Math.round(height * ratioY)));

            avgColorSampleCtx.fillStyle = '#FFFFFF';
            avgColorSampleCtx.fillRect(0, 0, 16, 16);
            avgColorSampleCtx.drawImage(srcCanvas, sx, sy, sw, sh, 0, 0, 16, 16);

            const data = avgColorSampleCtx.getImageData(0, 0, 16, 16).data;
            let r = 0, g = 0, b = 0, count = 0;
            for (let i = 0; i < data.length; i += 16) {
                r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
            }
            return "#" + ((1 << 24) + (Math.floor(r / count) << 16) + (Math.floor(g / count) << 8) + Math.floor(b / count)).toString(16).slice(1);
        } catch (e) {
            return "#FFFFFF";
        }
    }
    // ==========================================
    // 11. EXPAND VIEW NAVIGATION & SUBTOOL ROUTING
    // ==========================================
    const expandPrevBtn = document.getElementById('expand-prev-page-btn');
    const expandNextBtn = document.getElementById('expand-next-page-btn');
    const detailPageTitle = document.getElementById('detail-page-title');

    function hideAllEditorHeadersAndToolbars() {
        closeCustomDropupMenu();
        document.getElementById('detail-header-group').style.display = 'none';
        document.getElementById('text-header-group').style.display = 'none';
        document.getElementById('text-format-toolbar').style.display = 'none';
        if (extractHeaderGroup) extractHeaderGroup.style.display = 'none';
        drawHeaderGroup.style.display = 'none';
        drawFormatToolbar.style.display = 'none';
        if (marginsHeaderGroup) marginsHeaderGroup.style.display = 'none';
        if (marginsFormatToolbar) marginsFormatToolbar.style.display = 'none';
        if (drawJoystick) drawJoystick.classList.add('hidden');
        if (drawCanvas) drawCanvas.style.display = 'none';
        if (marginGuidesContainer) marginGuidesContainer.classList.add('hidden');
        if (expandPrevBtn) expandPrevBtn.classList.add('hidden');
        if (expandNextBtn) expandNextBtn.classList.add('hidden');
    }

    function getExpandNavigationList() {
        if (selectedPageIds.length > 1) {
            const selectedSet = new Set(selectedPageIds);
            return pagesState.filter(p => selectedSet.has(p.id)).map(p => p.id);
        }
        return pagesState.map(p => p.id);
    }

    function updateExpandNavigationUI() {
        const isPureExpandView = isDetailViewOpen && !isTextEditingOpen && !isDrawMode && !isMarginsMode;
        if (!isPureExpandView) {
            if (expandPrevBtn) expandPrevBtn.classList.add('hidden');
            if (expandNextBtn) expandNextBtn.classList.add('hidden');
            return;
        }

        const navList = getExpandNavigationList();
        const currentIdx = navList.indexOf(selectedPageId);
        const globalIdx = pagesState.findIndex(p => p.id === selectedPageId);

        if (detailPageTitle) {
            if (selectedPageIds.length > 1) {
                detailPageTitle.innerText = `Page ${globalIdx + 1} (${currentIdx + 1} of ${navList.length} Selected)`;
            } else {
                detailPageTitle.innerText = `Page ${globalIdx + 1} of ${pagesState.length}`;
            }
        }

        if (expandPrevBtn) {
            expandPrevBtn.classList.toggle('hidden', navList.length <= 1);
            expandPrevBtn.disabled = currentIdx <= 0;
        }
        if (expandNextBtn) {
            expandNextBtn.classList.toggle('hidden', navList.length <= 1);
            expandNextBtn.disabled = currentIdx === -1 || currentIdx >= navList.length - 1;
        }
    }

    async function navigateExpandPage(direction) {
        if (!isDetailViewOpen || isTextEditingOpen || isDrawMode || isMarginsMode) return;
        const navList = getExpandNavigationList();
        const currentIdx = navList.indexOf(selectedPageId);
        if (currentIdx === -1) return;

        const nextIdx = currentIdx + direction;
        if (nextIdx >= 0 && nextIdx < navList.length) {
            selectedPageId = navList[nextIdx];
            if (selectedPageIds.length <= 1) {
                selectedPageIds = [selectedPageId];
                updateSelectionUI();
            }
            updateExpandNavigationUI();
            await renderBigCanvas(selectedPageId, true, false);
        }
    }

    if (expandPrevBtn) expandPrevBtn.addEventListener('click', (e) => { e.stopPropagation(); navigateExpandPage(-1); });
    if (expandNextBtn) expandNextBtn.addEventListener('click', (e) => { e.stopPropagation(); navigateExpandPage(1); });

    window.addEventListener('keydown', (e) => {
        if (!isDetailViewOpen || isTextEditingOpen || isDrawMode || isMarginsMode) return;
        if (e.key === 'ArrowLeft') navigateExpandPage(-1);
        else if (e.key === 'ArrowRight') navigateExpandPage(1);
    });

    let touchSwipeStartX = 0;
    let touchSwipeStartY = 0;
    const workspaceAreaEl = document.getElementById('editor-workspace-area');
    if (workspaceAreaEl) {
        workspaceAreaEl.addEventListener('touchstart', (e) => {
            if (!isDetailViewOpen || isTextEditingOpen || isDrawMode || isMarginsMode) return;
            if (e.touches.length === 1) {
                touchSwipeStartX = e.touches[0].clientX;
                touchSwipeStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        workspaceAreaEl.addEventListener('touchend', (e) => {
            if (!isDetailViewOpen || isTextEditingOpen || isDrawMode || isMarginsMode) return;
            if (e.changedTouches.length === 1) {
                const dx = e.changedTouches[0].clientX - touchSwipeStartX;
                const dy = e.changedTouches[0].clientY - touchSwipeStartY;
                if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) {
                    if (dx < 0) navigateExpandPage(1);
                    else navigateExpandPage(-1);
                }
            }
        }, { passive: true });
    }

    let openedSubToolFromExpand = false;

    function openDetailView(keepPageId = null) {
        if (selectedPageIds.length === 0 && !selectedPageId && !keepPageId) return;
        if (keepPageId && pagesState.some(p => p.id === keepPageId)) {
            selectedPageId = keepPageId;
        } else if (selectedPageIds.length > 0) {
            const selectedSet = new Set(selectedPageIds);
            const orderedSelected = pagesState.filter(p => selectedSet.has(p.id));
            if (orderedSelected.length > 0) selectedPageId = orderedSelected[0].id;
        }

        openedSubToolFromExpand = false;
        isDetailViewOpen = true; isTextEditingOpen = false; isDrawMode = false; isMarginsMode = false;
        editorModal.classList.remove('hidden');
        editorModal.classList.remove('subtool-open');
        hideAllEditorHeadersAndToolbars();
        document.getElementById('detail-header-group').style.display = 'flex';
        floatingToolbar.classList.remove('hidden');
        floatingToolbar.style.zIndex = '100001';
        if (fabAddMoreTextWrapper) fabAddMoreTextWrapper.style.display = 'none';
        editorOverlay.querySelectorAll('.text-wrapper').forEach(w => w.remove());
        editorOverlay.style.pointerEvents = 'none';
        editorOverlay.style.overflow = 'hidden';

        if (fabDuplicate) fabDuplicate.style.display = 'none';
        if (fabReplace) fabReplace.style.display = 'none';

        updateSelectionUI();
        updateExpandNavigationUI();
        renderBigCanvas(selectedPageId, true, false);
    }

    function returnFromSubTool() {
        if (textDragRafId) {
            cancelAnimationFrame(textDragRafId);
            textDragRafId = null;
        }
        activeDragTextWrapper = null;
        textInteractionMode = null;

        if (drawCanvas) {
            releaseCanvasMemory(drawCanvas);
            drawCanvas.remove(); drawCanvas = null; drawCtx = null;
        }
        if (strokeBufferCanvas) {
            releaseCanvasMemory(strokeBufferCanvas);
            strokeBufferCanvas = null; strokeBufferCtx = null;
        }
        if (marginRawBaseCanvas) {
            releaseCanvasMemory(marginRawBaseCanvas);
            marginRawBaseCanvas = null;
        }
        if (drawJoystick) drawJoystick.classList.add('hidden');
        if (marginGuidesContainer) marginGuidesContainer.classList.add('hidden');
        editorOverlay.querySelectorAll('.text-wrapper').forEach(w => w.remove());
        activeTextContent = null;
        document.querySelectorAll('.slider-popup').forEach(p => p.classList.add('hidden'));

        if (openedSubToolFromExpand && selectedPageId) {
            openDetailView(selectedPageId);
        } else {
            closeDetailView();
            if (selectedPageIds.length > 0) floatingToolbar.classList.remove('hidden');
        }
    }

    // ==========================================
    // 12. MARGINS & PAGE RESIZE TOOL
    // ==========================================
    function getDefaultMargins() {
        return { top: 0, bottom: 0, left: 0, right: 0, hasBg: false, color: '#FFFFFF', pageSize: 'original' };
    }

    function hasActiveMargins(m) {
        if (!m) return false;
        return (m.top > 0 || m.bottom > 0 || m.left > 0 || m.right > 0 || (m.pageSize && m.pageSize !== 'original' && m.pageSize !== 'custom'));
    }

    function detectInitialMarginMode(m) {
        if (!m) return 'all';
        if (m.top === m.bottom && m.top === m.left && m.top === m.right) return 'all';
        if (m.top > 0 && m.bottom === 0 && m.left === 0 && m.right === 0) return 'top';
        if (m.bottom > 0 && m.top === 0 && m.left === 0 && m.right === 0) return 'bottom';
        if (m.left > 0 && m.top === 0 && m.bottom === 0 && m.right === 0) return 'left';
        if (m.right > 0 && m.top === 0 && m.bottom === 0 && m.left === 0) return 'right';
        return 'custom';
    }

    let marginPreviewRafId = null;
    function scheduleMarginPreviewRender() {
        if (marginPreviewRafId) return;
        marginPreviewRafId = requestAnimationFrame(() => {
            marginPreviewRafId = null;
            renderMarginPreviewSync();
        });
    }

    function applyPageSizePresetToMargins(preset) {
        if (!workingMargins) return;
        const sideSelect = document.getElementById('margin-side-select');
        const W = marginBaseRawW || 595.28;
        const H = marginBaseRawH || 841.89;

        if (preset === 'original') {
            workingMargins.top = 0; workingMargins.bottom = 0; workingMargins.left = 0; workingMargins.right = 0;
            workingMargins.pageSize = 'original';
            if (sideSelect) sideSelect.value = 'all';
            syncMarginInputsWithState();
            renderMarginPreviewSync();
            return;
        }

        if (preset === 'custom') {
            workingMargins.pageSize = 'custom';
            if (sideSelect) sideSelect.value = 'custom';
            syncMarginInputsWithState();
            renderMarginPreviewSync();
            return;
        }

        let targetW = W, targetH = H;
        if (preset === 'Square') {
            const maxSide = Math.max(W, H);
            targetW = maxSide; targetH = maxSide;
        } else if (PAGE_SIZE_PRESETS[preset]) {
            const [pW, pH] = PAGE_SIZE_PRESETS[preset];
            const scale = Math.max(W / pW, H / pH);
            targetW = pW * scale; targetH = pH * scale;
        }

        const padX = Math.max(0, Math.round((targetW - W) / 2));
        const padY = Math.max(0, Math.round((targetH - H) / 2));

        workingMargins.left = padX; workingMargins.right = padX;
        workingMargins.top = padY; workingMargins.bottom = padY;
        workingMargins.pageSize = preset;

        if (sideSelect) sideSelect.value = (padX === padY) ? 'all' : 'custom';
        syncMarginInputsWithState();
        renderMarginPreviewSync();
    }

    function ensureMarginsUICreated() {
        if (marginsInitialized) return;
        marginsInitialized = true;

        const editorHeader = document.querySelector('.editor-header');
        marginsHeaderGroup = document.getElementById('margins-header-group');
        if (!marginsHeaderGroup) {
            marginsHeaderGroup = document.createElement('div');
            marginsHeaderGroup.id = 'margins-header-group';
            marginsHeaderGroup.style.cssText = 'display: none; justify-content: space-between; width: 100%; align-items: center;';
            editorHeader.appendChild(marginsHeaderGroup);
        }
        marginsHeaderGroup.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <h3 style="margin: 0; color: var(--text-bright); font-size: 1.1rem; font-weight: 600;">Margins & Page Size</h3>
            </div>
            <div class="editor-header-actions" style="display: flex; gap: 15px;">
                <button id="margins-cancel" class="btn-secondary">Cancel</button>
                <button id="margins-save" class="action-btn" style="min-height: 36px; padding: 8px 16px;">Save Margins</button>
            </div>
        `;

        marginsFormatToolbar = document.getElementById('margins-format-toolbar');
        if (!marginsFormatToolbar) {
            marginsFormatToolbar = document.createElement('div');
            marginsFormatToolbar.id = 'margins-format-toolbar';
            marginsFormatToolbar.className = 'editor-toolbar';
            marginsFormatToolbar.style.display = 'none';
            const workspaceArea = document.getElementById('editor-workspace-area');
            editorModal.insertBefore(marginsFormatToolbar, workspaceArea);
        }

        marginsFormatToolbar.innerHTML = `
            <div class="format-tools-center">
                <div class="toolbar-control-wrapper">
                    <span class="control-label">Page Size</span>
                    <select id="margin-resize-select" class="toolbar-select" style="width: 150px;">
                        <option value="original">Original Size</option>
                        <option value="A4">A4 (210 × 297 mm)</option>
                        <option value="A3">A3 (297 × 420 mm)</option>
                        <option value="Letter">Letter (8.5 × 11 in)</option>
                        <option value="Legal">Legal (8.5 × 14 in)</option>
                        <option value="Square">Square (1 : 1)</option>
                        <option value="custom">Custom Size</option>
                    </select>
                </div>

                <div class="toolbar-control-wrapper">
                    <span class="control-label">Side</span>
                    <select id="margin-side-select" class="toolbar-select" style="width: 130px;">
                        <option value="all">All Sides</option>
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>

                <div class="toolbar-control-wrapper" id="margin-single-wrapper">
                    <span class="control-label" id="margin-single-label">All Sides</span>
                    <div class="toolbar-input-group">
                        <input type="number" id="margin-single-input" class="toolbar-num-input" value="0" min="0" max="2000" style="width: 50px; margin: 0;">
                        <div class="slider-popup hidden">
                            <input type="range" id="margin-single-slider" min="0" max="600" value="0">
                        </div>
                    </div>
                </div>

                <div class="toolbar-control-wrapper custom-margin-item hidden">
                    <span class="control-label">Top</span>
                    <div class="toolbar-input-group">
                        <input type="number" id="margin-top-input" class="toolbar-num-input" value="0" min="0" max="2000" style="width: 50px; margin: 0;">
                        <div class="slider-popup hidden">
                            <input type="range" id="margin-top-slider" min="0" max="600" value="0">
                        </div>
                    </div>
                </div>
                
                <div class="toolbar-control-wrapper custom-margin-item hidden">
                    <span class="control-label">Bottom</span>
                    <div class="toolbar-input-group">
                        <input type="number" id="margin-bottom-input" class="toolbar-num-input" value="0" min="0" max="2000" style="width: 50px; margin: 0;">
                        <div class="slider-popup hidden">
                            <input type="range" id="margin-bottom-slider" min="0" max="600" value="0">
                        </div>
                    </div>
                </div>

                <div class="toolbar-control-wrapper custom-margin-item hidden">
                    <span class="control-label">Left</span>
                    <div class="toolbar-input-group">
                        <input type="number" id="margin-left-input" class="toolbar-num-input" value="0" min="0" max="2000" style="width: 50px; margin: 0;">
                        <div class="slider-popup hidden">
                            <input type="range" id="margin-left-slider" min="0" max="600" value="0">
                        </div>
                    </div>
                </div>

                <div class="toolbar-control-wrapper custom-margin-item hidden">
                    <span class="control-label">Right</span>
                    <div class="toolbar-input-group">
                        <input type="number" id="margin-right-input" class="toolbar-num-input" value="0" min="0" max="2000" style="width: 50px; margin: 0;">
                        <div class="slider-popup hidden">
                            <input type="range" id="margin-right-slider" min="0" max="600" value="0">
                        </div>
                    </div>
                </div>

                <div class="toolbar-control-wrapper">
                    <span class="control-label">Margin Color</span>
                    <div style="display:flex; align-items:center; gap:8px; height: 34px;">
                        <label class="switch" title="OFF = Transparent, ON = Solid Color">
                            <input type="checkbox" id="margin-bg-toggle">
                            <span class="slider"></span>
                        </label>
                        <button id="margin-color-trigger-btn" type="button" class="toolbar-color-trigger hidden" style="background-color: #FFFFFF; margin-top:0;"></button>
                    </div>
                </div>
            </div>
        `;

        marginGuidesContainer = document.getElementById('margin-guides-container');
        if (!marginGuidesContainer) {
            marginGuidesContainer = document.createElement('div');
            marginGuidesContainer.id = 'margin-guides-container';
            marginGuidesContainer.className = 'hidden';
            editorOverlay.appendChild(marginGuidesContainer);
        }
        marginGuidesContainer.innerHTML = `
            <div class="margin-guide horizontal top" data-side="top"><div class="margin-handle"></div></div>
            <div class="margin-guide horizontal bottom" data-side="bottom"><div class="margin-handle"></div></div>
            <div class="margin-guide vertical left" data-side="left"><div class="margin-handle"></div></div>
            <div class="margin-guide vertical right" data-side="right"><div class="margin-handle"></div></div>
        `;

        const resizeSelect = document.getElementById('margin-resize-select');
        const sideSelect = document.getElementById('margin-side-select');
        const singleInput = document.getElementById('margin-single-input');
        const singleSlider = document.getElementById('margin-single-slider');
        const bgToggle = document.getElementById('margin-bg-toggle');
        const colorBtn = document.getElementById('margin-color-trigger-btn');
        const cancelBtn = document.getElementById('margins-cancel');
        const saveBtn = document.getElementById('margins-save');

        if (resizeSelect) resizeSelect.addEventListener('change', (e) => applyPageSizePresetToMargins(e.target.value));
        sideSelect.addEventListener('change', () => { if (workingMargins) syncMarginInputsWithState(); });

        linkInputAndSlider('margin-single-input', 'margin-single-slider', null);
        const onSingleValueChange = (rawVal) => {
            if (!workingMargins) return;
            const v = Math.max(0, Math.min(2000, parseInt(rawVal, 10) || 0));
            const mode = sideSelect.value;
            if (mode === 'all') {
                workingMargins.top = v; workingMargins.bottom = v; workingMargins.left = v; workingMargins.right = v;
            } else if (['top', 'bottom', 'left', 'right'].includes(mode)) {
                workingMargins[mode] = v;
            }
            workingMargins.pageSize = (workingMargins.top === 0 && workingMargins.bottom === 0 && workingMargins.left === 0 && workingMargins.right === 0) ? 'original' : 'custom';
            syncMarginInputsWithState();
            scheduleMarginPreviewRender();
        };
        singleInput.addEventListener('input', e => onSingleValueChange(e.target.value));
        singleSlider.addEventListener('input', e => onSingleValueChange(e.target.value));

        ['top', 'bottom', 'left', 'right'].forEach(side => {
            linkInputAndSlider(`margin-${side}-input`, `margin-${side}-slider`, null);
            const inp = document.getElementById(`margin-${side}-input`);
            const sld = document.getElementById(`margin-${side}-slider`);
            const onCustomSideChange = (rawVal) => {
                if (!workingMargins) return;
                const v = Math.max(0, Math.min(2000, parseInt(rawVal, 10) || 0));
                workingMargins[side] = v;
                workingMargins.pageSize = (workingMargins.top === 0 && workingMargins.bottom === 0 && workingMargins.left === 0 && workingMargins.right === 0) ? 'original' : 'custom';
                syncMarginInputsWithState();
                scheduleMarginPreviewRender();
            };
            inp.addEventListener('input', e => onCustomSideChange(e.target.value));
            sld.addEventListener('input', e => onCustomSideChange(e.target.value));
        });

        bgToggle.addEventListener('change', (e) => {
            if (!workingMargins) return;
            workingMargins.hasBg = e.target.checked;
            syncMarginInputsWithState();
            renderMarginPreviewSync();
        });

        colorBtn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            if (openColorModalGlobal) openColorModalGlobal(colorBtn, 'margin-bg');
        });

        cancelBtn.addEventListener('click', () => {
            workingMargins = null;
            if (marginRawBaseCanvas) { releaseCanvasMemory(marginRawBaseCanvas); marginRawBaseCanvas = null; }
            returnFromSubTool();
        });

        saveBtn.addEventListener('click', () => {
            if (!selectedPageId || !workingMargins) return;
            saveState();
            const stateObj = pagesState.find(p => p.id === selectedPageId);
            if (stateObj) {
                const active = hasActiveMargins(workingMargins);
                stateObj.margins = active ? { ...workingMargins } : null;
                stateObj.resize = (workingMargins.pageSize && workingMargins.pageSize !== 'original' && workingMargins.pageSize !== 'custom')
                    ? workingMargins.pageSize
                    : null;
            }
            workingMargins = null;
            if (marginRawBaseCanvas) { releaseCanvasMemory(marginRawBaseCanvas); marginRawBaseCanvas = null; }
            updateSingleCardBadge(selectedPageId);
            returnFromSubTool();
        });

        marginGuidesContainer.addEventListener('pointerdown', (e) => {
            if (!isMarginsMode || !workingMargins) return;
            const guide = e.target.closest('.margin-guide');
            if (!guide) return;

            isDraggingMarginGuide = true;
            activeMarginGuideSide = guide.dataset.side;
            marginDragStartX = e.clientX;
            marginDragStartY = e.clientY;
            marginDragStartVal = workingMargins[activeMarginGuideSide] || 0;
            marginDragInitialSign = 0;

            workingMargins.pageSize = 'custom';
            if (sideSelect.value !== 'custom') sideSelect.value = 'custom';
            syncMarginInputsWithState();

            if (guide.setPointerCapture) {
                try { guide.setPointerCapture(e.pointerId); } catch (err) {}
            }
            e.preventDefault(); e.stopPropagation();
        });
    }

    let isDraggingMarginGuide = false;
    let activeMarginGuideSide = null;
    let marginDragStartX = 0;
    let marginDragStartY = 0;
    let marginDragStartVal = 0;
    let marginDragInitialSign = 0;

    window.addEventListener('pointermove', (e) => {
        if (!isMarginsMode || !isDraggingMarginGuide || !activeMarginGuideSide || !workingMargins || !editorCanvas) return;

        const dx = (e.clientX - marginDragStartX) / (editorScale || 1);
        const dy = (e.clientY - marginDragStartY) / (editorScale || 1);

        let delta = 0;
        if (activeMarginGuideSide === 'top') delta = -dy;
        else if (activeMarginGuideSide === 'bottom') delta = dy;
        else if (activeMarginGuideSide === 'left') delta = -dx;
        else if (activeMarginGuideSide === 'right') delta = dx;

        if (marginDragStartVal === 0) {
            if (marginDragInitialSign === 0 && Math.abs(delta) > 3) {
                marginDragInitialSign = delta >= 0 ? 1 : -1;
            }
            if (marginDragInitialSign !== 0) delta = delta * marginDragInitialSign;
        }

        workingMargins[activeMarginGuideSide] = Math.max(0, Math.min(2000, Math.round(marginDragStartVal + delta)));
        workingMargins.pageSize = (workingMargins.top === 0 && workingMargins.bottom === 0 && workingMargins.left === 0 && workingMargins.right === 0) ? 'original' : 'custom';
        syncMarginInputsWithState();
        scheduleMarginPreviewRender();
        e.preventDefault();
    }, { passive: false });

    const stopMarginGuideDrag = () => {
        if (isDraggingMarginGuide) {
            isDraggingMarginGuide = false;
            activeMarginGuideSide = null;
            marginDragInitialSign = 0;
        }
    };
    window.addEventListener('pointerup', stopMarginGuideDrag);
    window.addEventListener('pointercancel', stopMarginGuideDrag);

    function updateMarginGuidesPosition() {
        if (!marginGuidesContainer || !isMarginsMode) return;
        marginGuidesContainer.classList.remove('hidden');

        const gTop = marginGuidesContainer.querySelector('.margin-guide.top');
        const gBottom = marginGuidesContainer.querySelector('.margin-guide.bottom');
        const gLeft = marginGuidesContainer.querySelector('.margin-guide.left');
        const gRight = marginGuidesContainer.querySelector('.margin-guide.right');

        if (gTop) gTop.style.top = '0px';
        if (gBottom) gBottom.style.bottom = '0px';
        if (gLeft) gLeft.style.left = '0px';
        if (gRight) gRight.style.right = '0px';
    }

    function syncMarginInputsWithState() {
        if (!workingMargins) return;

        const resizeSelect = document.getElementById('margin-resize-select');
        const sideSelect = document.getElementById('margin-side-select');
        const singleWrapper = document.getElementById('margin-single-wrapper');
        const singleLabel = document.getElementById('margin-single-label');
        const singleInput = document.getElementById('margin-single-input');
        const singleSlider = document.getElementById('margin-single-slider');
        const customWrappers = document.querySelectorAll('.custom-margin-item');
        const bgToggle = document.getElementById('margin-bg-toggle');
        const colorBtn = document.getElementById('margin-color-trigger-btn');

        if (resizeSelect) resizeSelect.value = workingMargins.pageSize || 'original';
        if (bgToggle) bgToggle.checked = Boolean(workingMargins.hasBg);
        if (colorBtn) {
            colorBtn.classList.toggle('hidden', !workingMargins.hasBg);
            colorBtn.style.backgroundColor = workingMargins.color || '#FFFFFF';
        }

        const mode = sideSelect ? sideSelect.value : 'all';

        ['top', 'bottom', 'left', 'right'].forEach(side => {
            const val = Math.round(workingMargins[side] || 0);
            const inp = document.getElementById(`margin-${side}-input`);
            const sld = document.getElementById(`margin-${side}-slider`);
            if (inp) inp.value = val;
            if (sld) sld.value = Math.min(600, val);
        });

        if (mode === 'custom') {
            if (singleWrapper) singleWrapper.style.display = 'none';
            customWrappers.forEach(w => w.classList.remove('hidden'));
        } else {
            if (singleWrapper) singleWrapper.style.display = 'flex';
            customWrappers.forEach(w => w.classList.add('hidden'));

            const labelMap = { all: 'All Sides', top: 'Top', bottom: 'Bottom', left: 'Left', right: 'Right' };
            if (singleLabel) singleLabel.innerText = labelMap[mode] || 'Size';

            const singleVal = (mode === 'all') ? (workingMargins.top || 0) : (workingMargins[mode] || 0);
            if (singleInput) singleInput.value = Math.round(singleVal);
            if (singleSlider) singleSlider.value = Math.min(600, Math.round(singleVal));
        }

        updateMarginGuidesPosition();
    }

    function renderMarginPreviewSync() {
        if (!isMarginsMode || !marginRawBaseCanvas || !selectedPageId) return;
        const stateObj = pagesState.find(p => p.id === selectedPageId);
        if (!stateObj) return;

        const m = workingMargins || getDefaultMargins();
        const totalUnscaledW = marginBaseRawW + (m.left || 0) + (m.right || 0);
        const totalUnscaledH = marginBaseRawH + (m.top || 0) + (m.bottom || 0);

        const isMobile = window.innerWidth <= 768;
        const availW = window.innerWidth - (isMobile ? 12 : 60);
        const availH = window.innerHeight - (isMobile ? 145 : 180);
        const maxCap = Math.min(DEVICE_PROFILE.isLowEnd ? 1.8 : 2.5, DEVICE_PROFILE.maxEditorDim / Math.max(totalUnscaledW, totalUnscaledH, 1));

        const maxFitScale = Math.min(availW / totalUnscaledW, availH / totalUnscaledH, maxCap) * (isMobile ? 0.95 : 0.90);
        const baseSteadyScale = Math.min(availW / marginBaseRawW, availH / marginBaseRawH, maxCap) * (isMobile ? 0.88 : 0.82);
        editorScale = Math.max(0.1, Math.min(baseSteadyScale, maxFitScale));

        const imgW = Math.round(marginBaseRawW * editorScale);
        const imgH = Math.round(marginBaseRawH * editorScale);
        const mTopPx = Math.round((m.top || 0) * editorScale);
        const mBottomPx = Math.round((m.bottom || 0) * editorScale);
        const mLeftPx = Math.round((m.left || 0) * editorScale);
        const mRightPx = Math.round((m.right || 0) * editorScale);

        const cw = imgW + mLeftPx + mRightPx;
        const ch = imgH + mTopPx + mBottomPx;

        if (editorCanvas.width !== cw) editorCanvas.width = cw;
        if (editorCanvas.height !== ch) editorCanvas.height = ch;
        editorCanvas.style.width = cw + 'px'; editorCanvas.style.height = ch + 'px';

        currentImgOffsetX = mLeftPx; currentImgOffsetY = mTopPx;
        currentImgDrawW = imgW; currentImgDrawH = imgH;

        const ctx = editorCanvas.getContext('2d');
        ctx.clearRect(0, 0, cw, ch);

        if (m.hasBg) {
            ctx.fillStyle = m.color || '#FFFFFF';
            ctx.fillRect(0, 0, cw, ch);
        }

        ctx.drawImage(marginRawBaseCanvas, mLeftPx, mTopPx, imgW, imgH);

        if (mTopPx > 0 || mBottomPx > 0 || mLeftPx > 0 || mRightPx > 0) {
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 230, 118, 0.45)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.strokeRect(mLeftPx, mTopPx, imgW, imgH);
            ctx.restore();
        }

        if (stateObj.drawings && stateObj.drawings.length > 0) {
            const tempDrawCanvas = document.createElement('canvas');
            tempDrawCanvas.width = cw; tempDrawCanvas.height = ch;
            const tempDrawCtx = tempDrawCanvas.getContext('2d', { willReadFrequently: true });
            replayDrawingsOnCanvas(tempDrawCanvas, tempDrawCtx, stateObj.drawings, editorScale, mLeftPx, mTopPx, imgW, imgH);
            ctx.drawImage(tempDrawCanvas, 0, 0);
            releaseCanvasMemory(tempDrawCanvas);
        }

        if (stateObj.texts && stateObj.texts.length > 0) {
            drawSavedTextsOnContext(ctx, stateObj.texts, mLeftPx, mTopPx, imgW, imgH, editorScale);
        }

        drawWatermarkAndPageNumOnContext(ctx, stateObj, cw, ch, editorScale);
        updateMarginGuidesPosition();
    }

    async function openMarginsView() {
        if (!selectedPageId) return;
        openedSubToolFromExpand = isDetailViewOpen && !isTextEditingOpen && !isDrawMode && !isMarginsMode;
        editorModal.classList.add('subtool-open');
        ensureMarginsUICreated();

        isDetailViewOpen = true; isTextEditingOpen = false; isDrawMode = false; isMarginsMode = true;

        const stateObj = pagesState.find(p => p.id === selectedPageId);
        workingMargins = (stateObj && stateObj.margins)
            ? { ...stateObj.margins }
            : getDefaultMargins();

        if (!workingMargins.pageSize) {
            workingMargins.pageSize = (stateObj && stateObj.resize) ? stateObj.resize : (hasActiveMargins(workingMargins) ? 'custom' : 'original');
        }

        const sideSelect = document.getElementById('margin-side-select');
        if (sideSelect) sideSelect.value = detectInitialMarginMode(workingMargins);

        editorModal.classList.remove('hidden');
        hideAllEditorHeadersAndToolbars();
        if (marginsHeaderGroup) marginsHeaderGroup.style.display = 'flex';
        if (marginsFormatToolbar) marginsFormatToolbar.style.display = 'flex';
        floatingToolbar.classList.add('hidden');

        editorOverlay.querySelectorAll('.text-wrapper').forEach(w => w.remove());
        editorOverlay.style.pointerEvents = 'auto';
        editorOverlay.style.overflow = 'visible';
        editorOverlay.style.cursor = 'default';

        await renderBigCanvas(selectedPageId, true, false);
        syncMarginInputsWithState();
        renderMarginPreviewSync();
    }

    if (fabMargins) {
        fabMargins.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            closeAllSubmenus();
            openMarginsView();
        });
    }

    // ==========================================
    // 13. GPU-ACCELERATED RAM-SAVING DRAW ENGINE
    // ==========================================
    function getCurrentMainDotDiameter() {
        const sizeVal = parseFloat(document.getElementById('draw-size').value) || 5;
        if (activeDrawTool === 'marker' || activeDrawTool === 'fill') return 14;
        return Math.max(4, sizeVal);
    }

    function updateMainPointStyle() {
        if (!djMain || !drawJoystick) return;
        const dotDiameter = getCurrentMainDotDiameter();
        const opacityInput = parseFloat(document.getElementById('draw-opacity').value);
        const opacityVal = (isNaN(opacityInput) ? 100 : Math.max(0, Math.min(100, opacityInput))) / 100;
        const col = getDrawColorRgb();

        djMain.style.boxSizing = 'border-box';
        djMain.style.flexShrink = '0';
        djMain.style.width = dotDiameter + 'px';
        djMain.style.height = dotDiameter + 'px';
        djMain.style.borderRadius = '50%';
        djMain.style.pointerEvents = 'auto';
        djMain.style.cursor = 'grab';
        djMain.style.touchAction = 'none';

        if (activeDrawTool === 'eraser') {
            djMain.style.backgroundColor = `rgba(255, 255, 255, ${opacityVal})`;
            djMain.style.border = '2px solid #ff5252';
            djMain.style.boxShadow = '0 0 5px rgba(0,0,0,0.6)';
        } else {
            djMain.style.backgroundColor = `rgba(${col.r}, ${col.g}, ${col.b}, ${opacityVal})`;
            djMain.style.border = '2px solid #ffffff';
            djMain.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';
        }

        const isOffsetOn = drawOffsetToggle && drawOffsetToggle.checked;
        const offsetVal = parseInt(document.getElementById('draw-offset').value, 10) || 60;

        drawJoystick.style.width = Math.max(40, dotDiameter + 12) + 'px';
        if (isOffsetOn) {
            if (djLine) djLine.style.display = 'block';
            if (djHandle) { djHandle.style.display = 'flex'; djHandle.style.flexShrink = '0'; djHandle.style.touchAction = 'none'; }
            drawJoystick.style.height = (dotDiameter + offsetVal + 35) + 'px';
        } else {
            if (djLine) djLine.style.display = 'none';
            if (djHandle) djHandle.style.display = 'none';
            drawJoystick.style.height = dotDiameter + 'px';
        }
        updateJoystickPos();
    }

    function updateJoystickPos() {
        if (!drawJoystick) return;
        const dotDiameter = getCurrentMainDotDiameter();
        drawJoystick.style.transform = 'translate(-50%, 0)';
        drawJoystick.style.left = mainPointX + 'px';
        drawJoystick.style.top = (mainPointY - dotDiameter / 2) + 'px';
    }

    function syncStrokeBufferCanvas() {
        if (!drawCanvas) return;
        if (!strokeBufferCanvas) {
            strokeBufferCanvas = document.createElement('canvas');
            strokeBufferCtx = strokeBufferCanvas.getContext('2d');
        }
        if (strokeBufferCanvas.width !== drawCanvas.width || strokeBufferCanvas.height !== drawCanvas.height) {
            strokeBufferCanvas.width = drawCanvas.width;
            strokeBufferCanvas.height = drawCanvas.height;
        }
        strokeBufferCtx.clearRect(0, 0, strokeBufferCanvas.width, strokeBufferCanvas.height);
        strokeBufferCtx.drawImage(drawCanvas, 0, 0);
    }

    function floodFillOnTarget(targetCanvas, targetCtx, startX, startY, colorHex, opacityPercentVal) {
        if (!targetCanvas || !targetCtx) return;
        const w = targetCanvas.width, h = targetCanvas.height;
        const x0 = Math.floor(startX), y0 = Math.floor(startY);
        if (x0 < 0 || x0 >= w || y0 < 0 || y0 >= h) return;

        const opacityPercent = isNaN(opacityPercentVal) ? 100 : Math.max(0, Math.min(100, opacityPercentVal));
        const fillAlpha = Math.round((opacityPercent / 100) * 255);
        if (fillAlpha === 0) return;

        const col = parseHexToRgbObj(colorHex);
        const imgData = targetCtx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const startPos = x0 + y0 * w;
        const startIdx = startPos * 4;

        const targetR = data[startIdx], targetG = data[startIdx + 1], targetB = data[startIdx + 2], targetA = data[startIdx + 3];
        if (targetA > 0 && Math.abs(targetR - col.r) <= 3 && Math.abs(targetG - col.g) <= 3 && Math.abs(targetB - col.b) <= 3 && Math.abs(targetA - fillAlpha) <= 3) return;

        const isTargetEmpty = targetA <= 20;
        const tolerance = 36;

        const matchesTarget = (idx) => {
            const a = data[idx + 3];
            if (isTargetEmpty) return a <= 20;
            return Math.abs(data[idx] - targetR) <= tolerance && Math.abs(data[idx + 1] - targetG) <= tolerance && Math.abs(data[idx + 2] - targetB) <= tolerance && Math.abs(a - targetA) <= tolerance;
        };

        const blendFringePixel = (idx) => {
            const edgeR = data[idx], edgeG = data[idx + 1], edgeB = data[idx + 2], edgeA = data[idx + 3] / 255;
            if (edgeA >= 0.98) return;
            const fA = fillAlpha / 255;
            const outA = edgeA + fA * (1 - edgeA);
            if (outA > 0) {
                data[idx] = Math.round((edgeR * edgeA + col.r * fA * (1 - edgeA)) / outA);
                data[idx + 1] = Math.round((edgeG * edgeA + col.g * fA * (1 - edgeA)) / outA);
                data[idx + 2] = Math.round((edgeB * edgeA + col.b * fA * (1 - edgeA)) / outA);
                data[idx + 3] = Math.round(outA * 255);
            }
        };

        const visited = new Uint8Array(w * h);
        const stack = new Int32Array(w * h);
        let stackPtr = 0;
        stack[stackPtr++] = startPos;
        visited[startPos] = 1;

        while (stackPtr > 0) {
            const pos = stack[--stackPtr];
            const cx = pos % w, cy = (pos / w) | 0, idx = pos * 4;
            data[idx] = col.r; data[idx + 1] = col.g; data[idx + 2] = col.b; data[idx + 3] = fillAlpha;

            if (cx > 0) {
                const nPos = pos - 1;
                if (visited[nPos] === 0) {
                    const nIdx = nPos * 4;
                    if (matchesTarget(nIdx)) { visited[nPos] = 1; stack[stackPtr++] = nPos; }
                    else if (isTargetEmpty) { visited[nPos] = 2; blendFringePixel(nIdx); }
                }
            }
            if (cx < w - 1) {
                const nPos = pos + 1;
                if (visited[nPos] === 0) {
                    const nIdx = nPos * 4;
                    if (matchesTarget(nIdx)) { visited[nPos] = 1; stack[stackPtr++] = nPos; }
                    else if (isTargetEmpty) { visited[nPos] = 2; blendFringePixel(nIdx); }
                }
            }
            if (cy > 0) {
                const nPos = pos - w;
                if (visited[nPos] === 0) {
                    const nIdx = nPos * 4;
                    if (matchesTarget(nIdx)) { visited[nPos] = 1; stack[stackPtr++] = nPos; }
                    else if (isTargetEmpty) { visited[nPos] = 2; blendFringePixel(nIdx); }
                }
            }
            if (cy < h - 1) {
                const nPos = pos + w;
                if (visited[nPos] === 0) {
                    const nIdx = nPos * 4;
                    if (matchesTarget(nIdx)) { visited[nPos] = 1; stack[stackPtr++] = nPos; }
                    else if (isTargetEmpty) { visited[nPos] = 2; blendFringePixel(nIdx); }
                }
            }
        }
        targetCtx.putImageData(imgData, 0, 0);
    }

    function renderSingleDrawingAction(targetCanvas, targetCtx, action, scaleFactor = 1.0, imgOffX = 0, imgOffY = 0, imgW = targetCanvas.width, imgH = targetCanvas.height) {
        if (!targetCanvas || !targetCtx || !action) return;
        const refW = action.relToImg ? (imgW || targetCanvas.width) : targetCanvas.width;
        const refH = action.relToImg ? (imgH || targetCanvas.height) : targetCanvas.height;
        const offX = action.relToImg ? imgOffX : 0;
        const offY = action.relToImg ? imgOffY : 0;

        if (action.type === 'fill' || action.tool === 'fill') {
            floodFillOnTarget(targetCanvas, targetCtx, offX + action.x * refW, offY + action.y * refH, action.color || '#FF5252', action.opacity ?? 100);
            return;
        }
        if (!action.points || action.points.length === 0) return;

        const pts = action.points.map(p => ({ x: offX + p.x * refW, y: offY + p.y * refH }));
        const lineWidth = action.sizeRatio ? (action.sizeRatio * refW) : ((action.sizeBase || 5) * scaleFactor);
        let opacityVal = ((action.opacity ?? 100) / 100);
        if (action.tool === 'marker') opacityVal = Math.min(0.65, opacityVal);

        const col = parseHexToRgbObj(action.color || '#FF5252');

        targetCtx.save();
        if (action.tool === 'eraser') {
            targetCtx.globalCompositeOperation = 'destination-out';
            targetCtx.globalAlpha = opacityVal;
            targetCtx.lineCap = 'round';
            targetCtx.lineJoin = 'round';
            targetCtx.lineWidth = lineWidth;
            targetCtx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            targetCtx.globalCompositeOperation = 'source-over';
            targetCtx.globalAlpha = opacityVal;
            if (action.tool === 'marker') {
                targetCtx.lineCap = 'butt'; targetCtx.lineJoin = 'miter'; targetCtx.miterLimit = 2;
            } else {
                targetCtx.lineCap = 'round'; targetCtx.lineJoin = 'round';
            }
            targetCtx.lineWidth = lineWidth;
            targetCtx.strokeStyle = `rgb(${col.r}, ${col.g}, ${col.b})`;
        }

        targetCtx.beginPath();
        if (pts.length === 1) {
            targetCtx.moveTo(pts[0].x, pts[0].y);
            targetCtx.lineTo(pts[0].x + (action.tool === 'marker' ? 1 : 0.01), pts[0].y);
        } else if (pts.length === 2) {
            targetCtx.moveTo(pts[0].x, pts[0].y);
            targetCtx.lineTo(pts[1].x, pts[1].y);
        } else {
            targetCtx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length - 1; i++) {
                const midX = (pts[i].x + pts[i + 1].x) / 2;
                const midY = (pts[i].y + pts[i + 1].y) / 2;
                targetCtx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
            }
            const last = pts[pts.length - 1];
            targetCtx.lineTo(last.x, last.y);
        }
        targetCtx.stroke();
        targetCtx.restore();
    }

    function replayDrawingsOnCanvas(targetCanvas, targetCtx, drawingsArray, scaleFactor = 1.0, imgOffX = 0, imgOffY = 0, imgW = targetCanvas.width, imgH = targetCanvas.height) {
        if (!targetCanvas || !targetCtx) return;
        targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
        if (!drawingsArray || drawingsArray.length === 0) return;
        for (let i = 0; i < drawingsArray.length; i++) {
            renderSingleDrawingAction(targetCanvas, targetCtx, drawingsArray[i], scaleFactor, imgOffX, imgOffY, imgW, imgH);
        }
    }

    function buildStrokeValueObject(pointsArray) {
        if (!drawCanvas || !pointsArray || pointsArray.length === 0) return null;
        const sizeVal = parseFloat(document.getElementById('draw-size').value) || 5;
        const opacityInput = parseFloat(document.getElementById('draw-opacity').value);
        const opacityVal = isNaN(opacityInput) ? 100 : opacityInput;
        const col = getDrawColorRgb();
        const refW = currentImgDrawW || drawCanvas.width || 1;
        const refH = currentImgDrawH || drawCanvas.height || 1;
        const offX = currentImgOffsetX || 0;
        const offY = currentImgOffsetY || 0;

        return {
            type: 'stroke', tool: activeDrawTool, relToImg: true, color: col.hex, opacity: opacityVal,
            sizeBase: sizeVal / (editorScale || 1), sizeRatio: sizeVal / refW,
            points: pointsArray.map(p => ({
                x: Math.round(((p.x - offX) / refW) * 10000) / 10000,
                y: Math.round(((p.y - offY) / refH) * 10000) / 10000
            }))
        };
    }

    async function openDrawView() {
        if (!selectedPageId) return;
        openedSubToolFromExpand = isDetailViewOpen && !isTextEditingOpen && !isDrawMode && !isMarginsMode;
        editorModal.classList.add('subtool-open');
        isDetailViewOpen = true; isTextEditingOpen = false; isDrawMode = true; isMarginsMode = false;

        editorModal.classList.remove('hidden');
        hideAllEditorHeadersAndToolbars();
        drawHeaderGroup.style.display = 'flex';
        drawFormatToolbar.style.display = 'flex';
        floatingToolbar.classList.add('hidden');

        editorOverlay.querySelectorAll('.text-wrapper').forEach(w => w.remove());
        editorOverlay.style.pointerEvents = 'auto';
        editorOverlay.style.touchAction = 'none';
        editorOverlay.style.overflow = 'visible';
        editorOverlay.style.cursor = 'crosshair';

        await renderBigCanvas(selectedPageId, true, true);

        const container = document.getElementById('editor-canvas-container');
        if (!drawCanvas) {
            drawCanvas = document.createElement('canvas');
            drawCanvas.className = 'draw-layer-canvas';
            container.insertBefore(drawCanvas, editorOverlay);
            drawCtx = drawCanvas.getContext('2d', { willReadFrequently: true });
        }

        drawCanvas.style.setProperty('position', 'absolute', 'important');
        drawCanvas.style.setProperty('top', '0', 'important');
        drawCanvas.style.setProperty('left', '0', 'important');
        drawCanvas.style.setProperty('width', editorCanvas.width + 'px', 'important');
        drawCanvas.style.setProperty('height', editorCanvas.height + 'px', 'important');
        drawCanvas.style.setProperty('background', 'transparent', 'important');
        drawCanvas.style.setProperty('z-index', '2', 'important');
        drawCanvas.style.setProperty('pointer-events', 'none', 'important');
        drawCanvas.style.setProperty('display', 'block', 'important');

        drawCanvas.width = editorCanvas.width;
        drawCanvas.height = editorCanvas.height;

        const stateObj = pagesState.find(p => p.id === selectedPageId);
        workingDrawings = (stateObj && stateObj.drawings)
            ? stateObj.drawings.map(d => ({ ...d, points: d.points ? d.points.slice() : undefined }))
            : [];
        replayDrawingsOnCanvas(drawCanvas, drawCtx, workingDrawings, editorScale, currentImgOffsetX, currentImgOffsetY, currentImgDrawW, currentImgDrawH);
        syncStrokeBufferCanvas();

        drawHistory = []; redoDrawHistory = [];
        updateDrawHistoryButtons();

        mainPointX = drawCanvas.width / 2;
        mainPointY = drawCanvas.height / 2;
        if (drawJoystick) drawJoystick.classList.remove('hidden');
        updateMainPointStyle();
    }

    if (fabDraw) {
        fabDraw.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            closeAllSubmenus(); openDrawView();
        });
    }

    if (btnDrawCancel) {
        btnDrawCancel.addEventListener('click', () => {
            workingDrawings = []; drawHistory = []; redoDrawHistory = [];
            returnFromSubTool();
        });
    }

    if (btnDrawSave) {
        btnDrawSave.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            if (isDraggingMainPoint && hasMovedDuringDrag && currentStrokePoints.length > 0) {
                const finalStrokeObj = buildStrokeValueObject(currentStrokePoints);
                if (finalStrokeObj) workingDrawings.push(finalStrokeObj);
                isDraggingMainPoint = false;
                hasMovedDuringDrag = false;
                currentStrokePoints = [];
            }
            if (!selectedPageId) return;
            saveState();
            const stateObj = pagesState.find(p => p.id === selectedPageId);
            if (stateObj) {
                stateObj.drawings = workingDrawings.map(d => ({
                    ...d,
                    points: d.points ? d.points.slice() : undefined
                }));
            }
            workingDrawings = []; drawHistory = []; redoDrawHistory = [];
            returnFromSubTool();
            updateSingleCardBadge(selectedPageId);
            if (selectedPageIds.length > 0) floatingToolbar.classList.remove('hidden');
        });
    }

    if (drawOffsetToggle) {
        drawOffsetToggle.addEventListener('change', () => { if (isDrawMode) updateMainPointStyle(); });
    }

    function updateDrawHistoryButtons() {
        if (drawUndoBtn) drawUndoBtn.disabled = drawHistory.length === 0;
        if (drawRedoBtn) drawRedoBtn.disabled = redoDrawHistory.length === 0;
    }

    function saveDrawState() {
        const snapshot = workingDrawings.slice();
        drawHistory.push(snapshot);
        if (drawHistory.length > DEVICE_PROFILE.maxUndoHistory) drawHistory.shift();
        redoDrawHistory = [];
        updateDrawHistoryButtons();
    }

    if (drawUndoBtn) {
        drawUndoBtn.addEventListener('click', () => {
            if (drawHistory.length === 0 || !drawCanvas || !drawCtx) return;
            redoDrawHistory.push(workingDrawings.slice());
            workingDrawings = drawHistory.pop();
            replayDrawingsOnCanvas(drawCanvas, drawCtx, workingDrawings, editorScale, currentImgOffsetX, currentImgOffsetY, currentImgDrawW, currentImgDrawH);
            syncStrokeBufferCanvas();
            updateDrawHistoryButtons();
        });
    }

    if (drawRedoBtn) {
        drawRedoBtn.addEventListener('click', () => {
            if (redoDrawHistory.length === 0 || !drawCanvas || !drawCtx) return;
            drawHistory.push(workingDrawings.slice());
            workingDrawings = redoDrawHistory.pop();
            replayDrawingsOnCanvas(drawCanvas, drawCtx, workingDrawings, editorScale, currentImgOffsetX, currentImgOffsetY, currentImgDrawW, currentImgDrawH);
            syncStrokeBufferCanvas();
            updateDrawHistoryButtons();
        });
    }

    function checkShouldSplitSubStroke(newPt, sizeVal) {
        const len = currentStrokePoints.length;
        if (len < 3) return false;
        const lastPt = currentStrokePoints[len - 1];
        const vx2 = newPt.x - lastPt.x, vy2 = newPt.y - lastPt.y;
        const mag2 = Math.hypot(vx2, vy2);
        if (mag2 < 1.5) return false;

        let anchorIdx = len - 2, distBack = 0;
        while (anchorIdx > 0) {
            const pA = currentStrokePoints[anchorIdx], pB = currentStrokePoints[anchorIdx + 1];
            distBack += Math.hypot(pB.x - pA.x, pB.y - pA.y);
            if (distBack >= Math.max(5, sizeVal * 0.4)) break;
            anchorIdx--;
        }
        if (distBack >= Math.max(4, sizeVal * 0.3)) {
            const anchorPt = currentStrokePoints[anchorIdx];
            const vx1 = lastPt.x - anchorPt.x, vy1 = lastPt.y - anchorPt.y;
            const mag1 = Math.hypot(vx1, vy1);
            if (mag1 > 1.5 && ((vx1 * vx2 + vy1 * vy2) / (mag1 * mag2)) < -0.25) return true;
        }

        let arcLen = 0;
        const minLoopArc = Math.max(24, sizeVal * 2.8);
        const hitRadius = Math.max(6, sizeVal * 0.85);
        for (let i = len - 1; i > 0; i--) {
            const p1 = currentStrokePoints[i], p0 = currentStrokePoints[i - 1];
            arcLen += Math.hypot(p1.x - p0.x, p1.y - p0.y);
            if (arcLen > minLoopArc) {
                if (Math.hypot(newPt.x - p0.x, newPt.y - p0.y) <= hitRadius && Math.hypot(lastPt.x - p0.x, lastPt.y - p0.y) > hitRadius) return true;
            }
        }
        return false;
    }

    function addStrokePointAndRender(pt) {
        if (!drawCtx || !drawCanvas) return;
        if (currentStrokePoints.length > 0) {
            const prev = currentStrokePoints[currentStrokePoints.length - 1];
            if (Math.hypot(pt.x - prev.x, pt.y - prev.y) < 1.8) return;
        }

        const sizeVal = parseFloat(document.getElementById('draw-size').value) || 5;
        const opacityInput = parseFloat(document.getElementById('draw-opacity').value);
        const rawOpacity = (isNaN(opacityInput) ? 100 : opacityInput) / 100;
        const isTranslucentStroke = (activeDrawTool === 'marker') || (activeDrawTool === 'pen' && rawOpacity < 0.98);

        if (isTranslucentStroke && checkShouldSplitSubStroke(pt, sizeVal)) {
            const completedSubStroke = buildStrokeValueObject(currentStrokePoints);
            if (completedSubStroke) workingDrawings.push(completedSubStroke);
            const prevPt = currentStrokePoints[currentStrokePoints.length - 1];
            syncStrokeBufferCanvas();
            currentStrokePoints = [prevPt, pt];
        } else {
            currentStrokePoints.push(pt);
        }
        renderCurrentStroke();
    }

    function renderCurrentStroke() {
        if (!drawCtx || !drawCanvas || currentStrokePoints.length === 0) return;
        const sizeVal = parseFloat(document.getElementById('draw-size').value) || 5;
        const opacityInput = parseFloat(document.getElementById('draw-opacity').value);
        let opacityVal = (isNaN(opacityInput) ? 100 : opacityInput) / 100;
        const col = getDrawColorRgb();

        if (activeDrawTool === 'marker') opacityVal = Math.min(0.65, opacityVal);

        if (activeDrawTool === 'eraser') {
            drawCtx.save();
            drawCtx.globalCompositeOperation = 'destination-out';
            drawCtx.globalAlpha = opacityVal;
            drawCtx.lineCap = 'round'; drawCtx.lineJoin = 'round';
            drawCtx.lineWidth = sizeVal; drawCtx.strokeStyle = 'rgba(0,0,0,1)';
            const len = currentStrokePoints.length;
            drawCtx.beginPath();
            if (len === 1) {
                drawCtx.moveTo(currentStrokePoints[0].x, currentStrokePoints[0].y);
                drawCtx.lineTo(currentStrokePoints[0].x + 0.01, currentStrokePoints[0].y);
            } else {
                drawCtx.moveTo(currentStrokePoints[len - 2].x, currentStrokePoints[len - 2].y);
                drawCtx.lineTo(currentStrokePoints[len - 1].x, currentStrokePoints[len - 1].y);
            }
            drawCtx.stroke();
            drawCtx.restore();
            return;
        }

        if (strokeBufferCanvas) {
            drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
            drawCtx.drawImage(strokeBufferCanvas, 0, 0);
        }

        drawCtx.save();
        drawCtx.globalCompositeOperation = 'source-over';
        drawCtx.globalAlpha = opacityVal;
        if (activeDrawTool === 'marker') {
            drawCtx.lineCap = 'butt'; drawCtx.lineJoin = 'miter'; drawCtx.miterLimit = 2;
        } else {
            drawCtx.lineCap = 'round'; drawCtx.lineJoin = 'round';
        }
        drawCtx.lineWidth = sizeVal;
        drawCtx.strokeStyle = `rgb(${col.r}, ${col.g}, ${col.b})`;

        drawCtx.beginPath();
        if (currentStrokePoints.length === 1) {
            drawCtx.moveTo(currentStrokePoints[0].x, currentStrokePoints[0].y);
            drawCtx.lineTo(currentStrokePoints[0].x + (activeDrawTool === 'marker' ? 1 : 0.01), currentStrokePoints[0].y);
        } else if (currentStrokePoints.length === 2) {
            drawCtx.moveTo(currentStrokePoints[0].x, currentStrokePoints[0].y);
            drawCtx.lineTo(currentStrokePoints[1].x, currentStrokePoints[1].y);
        } else {
            drawCtx.moveTo(currentStrokePoints[0].x, currentStrokePoints[0].y);
            for (let i = 1; i < currentStrokePoints.length - 1; i++) {
                const midX = (currentStrokePoints[i].x + currentStrokePoints[i + 1].x) / 2;
                const midY = (currentStrokePoints[i].y + currentStrokePoints[i + 1].y) / 2;
                drawCtx.quadraticCurveTo(currentStrokePoints[i].x, currentStrokePoints[i].y, midX, midY);
            }
            const last = currentStrokePoints[currentStrokePoints.length - 1];
            drawCtx.lineTo(last.x, last.y);
        }
        drawCtx.stroke();
        drawCtx.restore();
    }

    const dTools = [toolPen, toolMarker, toolEraser, toolFill];
    dTools.forEach(tool => {
        if (tool) {
            tool.addEventListener('click', (e) => {
                e.preventDefault();
                const prevTool = activeDrawTool;
                dTools.forEach(t => { if (t) t.classList.remove('active'); });
                tool.classList.add('active');
                activeDrawTool = tool.id.replace('tool-', '');

                const sizeInput = document.getElementById('draw-size'), sizeSlider = document.getElementById('draw-slider-size');
                const opInput = document.getElementById('draw-opacity'), opSlider = document.getElementById('draw-slider-opacity');

                if (activeDrawTool === 'marker') {
                    if (parseInt(opInput.value, 10) >= 85) { opInput.value = 38; opSlider.value = 38; }
                    if (parseInt(sizeInput.value, 10) < 12) { sizeInput.value = 22; sizeSlider.value = 22; }
                } else if (activeDrawTool === 'pen') {
                    if (prevTool === 'marker' && parseInt(opInput.value, 10) === 38) { opInput.value = 100; opSlider.value = 100; }
                    if (prevTool === 'marker' && parseInt(sizeInput.value, 10) === 22) { sizeInput.value = 5; sizeSlider.value = 5; }
                } else if (activeDrawTool === 'eraser') {
                    opInput.value = 100; opSlider.value = 100;
                }
                updateMainPointStyle();
            });
        }
    });

    function executeFillAndRecordValue(pxX, pxY) {
        if (!drawCanvas || !drawCtx) return;
        const opacityInput = parseFloat(document.getElementById('draw-opacity').value);
        const opacityVal = isNaN(opacityInput) ? 100 : opacityInput;
        const col = getDrawColorRgb();
        const refW = currentImgDrawW || drawCanvas.width || 1;
        const refH = currentImgDrawH || drawCanvas.height || 1;
        const offX = currentImgOffsetX || 0;
        const offY = currentImgOffsetY || 0;

        saveDrawState();
        const fillAction = {
            type: 'fill', tool: 'fill', relToImg: true,
            x: Math.round(((pxX - offX) / refW) * 10000) / 10000,
            y: Math.round(((pxY - offY) / refH) * 10000) / 10000,
            color: col.hex, opacity: opacityVal
        };
        workingDrawings.push(fillAction);
        renderSingleDrawingAction(drawCanvas, drawCtx, fillAction, editorScale, offX, offY, refW, refH);
        syncStrokeBufferCanvas();
    }

    function beginPointerDrag(e, targetEl) {
        if (!isDrawMode || !drawCanvas || !drawCtx) return;
        isDraggingMainPoint = true; hasMovedDuringDrag = false;
        dragStartClientX = e.clientX; dragStartClientY = e.clientY;
        startMainX = mainPointX; startMainY = mainPointY;

        if (activeDrawTool === 'fill') {
            executeFillAndRecordValue(mainPointX, mainPointY);
            isDraggingMainPoint = false;
        }
        if (targetEl && targetEl.setPointerCapture) {
            try { targetEl.setPointerCapture(e.pointerId); } catch (err) {}
        }
        e.preventDefault(); e.stopPropagation();
    }

    if (djMain) djMain.addEventListener('pointerdown', (e) => beginPointerDrag(e, djMain));
    if (djHandle) djHandle.addEventListener('pointerdown', (e) => beginPointerDrag(e, djHandle));

    editorOverlay.addEventListener('pointerdown', (e) => {
        if (!isDrawMode || !drawCanvas || !drawCtx) return;
        if (e.target === djHandle || e.target === djMain || e.target.closest('.text-wrapper') || e.target.closest('.margin-guide')) return;

        const canvasRect = drawCanvas.getBoundingClientRect();
        const scaleX = drawCanvas.width / (canvasRect.width || 1);
        const scaleY = drawCanvas.height / (canvasRect.height || 1);
        const clickX = (e.clientX - canvasRect.left) * scaleX;
        const clickY = (e.clientY - canvasRect.top) * scaleY;

        const distToMain = Math.hypot(clickX - mainPointX, clickY - mainPointY);
        const grabRadius = Math.max(18, getCurrentMainDotDiameter() / 2 + 8);

        if (activeDrawTool === 'fill') {
            mainPointX = clickX; mainPointY = clickY;
            updateJoystickPos();
            executeFillAndRecordValue(clickX, clickY);
            e.preventDefault();
            return;
        }

        if (distToMain > grabRadius) {
            mainPointX = clickX; mainPointY = clickY;
            updateJoystickPos();
        }

        isDraggingMainPoint = true; hasMovedDuringDrag = false;
        dragStartClientX = e.clientX; dragStartClientY = e.clientY;
        startMainX = mainPointX; startMainY = mainPointY;

        if (editorOverlay.setPointerCapture) {
            try { editorOverlay.setPointerCapture(e.pointerId); } catch (err) {}
        }
        e.preventDefault();
    });

    window.addEventListener('pointermove', (e) => {
        if (!isDrawMode || !drawCanvas || !isDraggingMainPoint) return;

        const dxClient = e.clientX - dragStartClientX;
        const dyClient = e.clientY - dragStartClientY;

        if (!hasMovedDuringDrag) {
            if (Math.hypot(dxClient, dyClient) < 3) return;
            hasMovedDuringDrag = true;
            saveDrawState();
            syncStrokeBufferCanvas();
            currentStrokePoints = [{ x: startMainX, y: startMainY }];
            renderCurrentStroke();
        }

        const canvasRect = drawCanvas.getBoundingClientRect();
        const scaleX = drawCanvas.width / (canvasRect.width || 1);
        const scaleY = drawCanvas.height / (canvasRect.height || 1);

        mainPointX = Math.max(0, Math.min(drawCanvas.width, startMainX + dxClient * scaleX));
        mainPointY = Math.max(0, Math.min(drawCanvas.height, startMainY + dyClient * scaleY));
        updateJoystickPos();

        addStrokePointAndRender({ x: mainPointX, y: mainPointY });
        e.preventDefault();
    }, { passive: false });

    const endDrawInteraction = () => {
        if (isDraggingMainPoint && hasMovedDuringDrag && currentStrokePoints.length > 0) {
            const finalStrokeObj = buildStrokeValueObject(currentStrokePoints);
            if (finalStrokeObj) workingDrawings.push(finalStrokeObj);
            syncStrokeBufferCanvas();
        }
        isDraggingMainPoint = false; hasMovedDuringDrag = false;
        currentStrokePoints = [];
    };

    window.addEventListener('pointerup', endDrawInteraction);
    window.addEventListener('pointercancel', endDrawInteraction);

    linkInputAndSlider('draw-size', 'draw-slider-size', null);
    linkInputAndSlider('draw-opacity', 'draw-slider-opacity', null);
    linkInputAndSlider('draw-offset', 'draw-slider-offset', null);

    ['draw-size', 'draw-slider-size', 'draw-opacity', 'draw-slider-opacity', 'draw-offset', 'draw-slider-offset'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => updateMainPointStyle());
    });

// ==========================================
    // 14. ZERO-COPY IN-PLACE PDF OVERLAY & EXTRACTION ENGINE
    // ==========================================
    function drawNativePageNumberOnPdfPage(finalPage, stateObj, helveticaFont) {
        const pn = stateObj.pageNumber;
        if (!pn || !pn.num || !helveticaFont) return;

        const { rgb, degrees } = window.PDFLib;
        const mediaBox = finalPage.getCropBox() || finalPage.getMediaBox();
        const boxOriginX = mediaBox.x || 0;
        const boxOriginY = mediaBox.y || 0;
        const width = mediaBox.width;
        const height = mediaBox.height;

        const totalRot = ((finalPage.getRotation().angle % 360) + 360) % 360;
        const isSideways = (totalRot === 90 || totalRot === 270);
        const visW = isSideways ? height : width;
        const visH = isSideways ? width : height;

        // Scale font size & padding proportionally to page dimensions so high-res photo PDFs don't get tiny page numbers
        const pageUnitScale = Math.min(visW, visH) / 595.28;
        const fontSize = (pn.size || 18) * pageUnitScale;
        const textStr = `Page - ${pn.num}`;
        const textW = helveticaFont.widthOfTextAtSize(textStr, fontSize);
        const textH = fontSize;
        const pad = 18 * pageUnitScale;

        let vx = visW - pad - textW;
        let vy = pad;

        switch (pn.pos) {
            case 'bottom-center': vx = (visW - textW) / 2; vy = pad; break;
            case 'bottom-right': vx = visW - pad - textW; vy = pad; break;
            case 'bottom-left': vx = pad; vy = pad; break;
            case 'top-center': vx = (visW - textW) / 2; vy = visH - pad - textH; break;
            case 'top-right': vx = visW - pad - textW; vy = visH - pad - textH; break;
            case 'top-left': vx = pad; vy = visH - pad - textH; break;
        }

        const cRgb = hexToRgbPdf(pn.color || '#000000');
        const drawOpts = {
            size: fontSize,
            font: helveticaFont,
            color: rgb(cRgb.r, cRgb.g, cRgb.b)
        };

        if (totalRot === 0) {
            finalPage.drawText(textStr, { ...drawOpts, x: boxOriginX + vx, y: boxOriginY + vy });
        } else if (totalRot === 90) {
            finalPage.drawText(textStr, { ...drawOpts, x: boxOriginX + vy, y: boxOriginY + height - vx, rotate: degrees(-90) });
        } else if (totalRot === 180) {
            finalPage.drawText(textStr, { ...drawOpts, x: boxOriginX + width - vx, y: boxOriginY + height - vy, rotate: degrees(-180) });
        } else if (totalRot === 270) {
            finalPage.drawText(textStr, { ...drawOpts, x: boxOriginX + width - vy, y: boxOriginY + vx, rotate: degrees(-270) });
        }
    }

    function drawCroppedOverlayOnPdfPage(finalPage, pdfOverlayImg, overlayInfo) {
        const { degrees } = window.PDFLib;
        const mediaBox = finalPage.getCropBox() || finalPage.getMediaBox();
        const boxOriginX = mediaBox.x || 0;
        const boxOriginY = mediaBox.y || 0;
        const width = mediaBox.width;
        const height = mediaBox.height;

        const totalRot = ((finalPage.getRotation().angle % 360) + 360) % 360;
        const { vx, vy, vw, vh } = overlayInfo;

        if (totalRot === 0) {
            finalPage.drawImage(pdfOverlayImg, { x: boxOriginX + vx, y: boxOriginY + vy, width: vw, height: vh });
        } else if (totalRot === 90) {
            finalPage.drawImage(pdfOverlayImg, { x: boxOriginX + vy, y: boxOriginY + height - vx, width: vw, height: vh, rotate: degrees(-90) });
        } else if (totalRot === 180) {
            finalPage.drawImage(pdfOverlayImg, { x: boxOriginX + width - vx, y: boxOriginY + height - vy, width: vw, height: vh, rotate: degrees(-180) });
        } else if (totalRot === 270) {
            finalPage.drawImage(pdfOverlayImg, { x: boxOriginX + width - vy, y: boxOriginY + vx, width: vw, height: vh, rotate: degrees(-270) });
        }
    }

    // Crops the overlay canvas to the tightest non-transparent bounding box so PDF-Lib embeds a tiny PNG instead of a 15MP full-page PNG
    async function generateCroppedOverlayForPdf(stateObj, pdfPageWidth, pdfPageHeight) {
        const hasDrawings = stateObj.drawings && stateObj.drawings.length > 0;
        const hasTexts = stateObj.texts && stateObj.texts.length > 0;
        const hasWm = Boolean(stateObj.watermark);
        if (!hasDrawings && !hasTexts && !hasWm) return null;

        const isSideways = Math.abs((stateObj.visualRotation || 0) % 180) === 90;
        const visW = isSideways ? pdfPageHeight : pdfPageWidth;
        const visH = isSideways ? pdfPageWidth : pdfPageHeight;

        const m = hasActiveMargins(stateObj.margins) ? stateObj.margins : { top: 0, bottom: 0, left: 0, right: 0 };
        const baseW = isSideways ? (stateObj.pageHeight || 595.28) : (stateObj.pageWidth || 595.28);
        const baseH = isSideways ? (stateObj.pageWidth || 841.89) : (stateObj.pageHeight || 841.89);
        const totalRawW = baseW + (m.left || 0) + (m.right || 0);
        const totalRawH = baseH + (m.top || 0) + (m.bottom || 0);

        const normScaleX = visW / (totalRawW || 1);
        const normScaleY = visH / (totalRawH || 1);

        const maxSide = Math.max(visW, visH, 1);
        const exportMultiplier = Math.min(DEVICE_PROFILE.exportScale, DEVICE_PROFILE.maxOverlayDim / maxSide);

        const cw = Math.max(1, Math.round(visW * exportMultiplier));
        const ch = Math.max(1, Math.round(visH * exportMultiplier));

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cw;
        tempCanvas.height = ch;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

        const offX = Math.round((m.left || 0) * normScaleX * exportMultiplier);
        const offY = Math.round((m.top || 0) * normScaleY * exportMultiplier);
        const imgW = Math.max(10, Math.round(baseW * normScaleX * exportMultiplier));
        const imgH = Math.max(10, Math.round(baseH * normScaleY * exportMultiplier));

        if (hasDrawings) {
            replayDrawingsOnCanvas(tempCanvas, tempCtx, stateObj.drawings, exportMultiplier * normScaleX, offX, offY, imgW, imgH);
        }
        if (hasTexts) {
            drawSavedTextsOnContext(tempCtx, stateObj.texts, offX, offY, imgW, imgH, exportMultiplier * normScaleX);
        }
        if (hasWm) {
            // Temporarily omit pageNumber from canvas because page numbers are drawn natively via vector font
            const savedPn = stateObj.pageNumber;
            stateObj.pageNumber = null;
            await drawWatermarkAndPageNumOnContext(tempCtx, stateObj, cw, ch, exportMultiplier);
            stateObj.pageNumber = savedPn;
        }

        // Fast 32-bit pixel scan to find tight non-empty bounding box
        let minX = 0, minY = 0, maxX = cw - 1, maxY = ch - 1;
        const isFullMosaic = hasWm && stateObj.watermark && stateObj.watermark.mosaic;

        if (!isFullMosaic) {
            const imgData = tempCtx.getImageData(0, 0, cw, ch);
            const buf32 = new Uint32Array(imgData.data.buffer);
            minX = cw; minY = ch; maxX = -1; maxY = -1;

            for (let y = 0; y < ch; y++) {
                const rowOffset = y * cw;
                for (let x = 0; x < cw; x++) {
                    if ((buf32[rowOffset + x] & 0xff000000) !== 0) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            if (maxX < minX || maxY < minY) {
                releaseCanvasMemory(tempCanvas);
                return null;
            }

            const pad = 4;
            minX = Math.max(0, minX - pad);
            minY = Math.max(0, minY - pad);
            maxX = Math.min(cw - 1, maxX + pad);
            maxY = Math.min(ch - 1, maxY + pad);
        }

        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;

        let pngBytes;
        if (cropW === cw && cropH === ch) {
            pngBytes = await canvasToArrayBuffer(tempCanvas, 'image/png');
            releaseCanvasMemory(tempCanvas);
        } else {
            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = cropW;
            cropCanvas.height = cropH;
            cropCanvas.getContext('2d').drawImage(tempCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
            releaseCanvasMemory(tempCanvas);
            pngBytes = await canvasToArrayBuffer(cropCanvas, 'image/png');
            releaseCanvasMemory(cropCanvas);
        }

        const u0 = minX / cw;
        const v0 = minY / ch;
        const uw = cropW / cw;
        const vhNorm = cropH / ch;

        return {
            pngBytes,
            vx: u0 * visW,
            vy: (1 - v0 - vhNorm) * visH,
            vw: uw * visW,
            vh: vhNorm * visH
        };
    }


// Expands the PDF page's MediaBox/CropBox directly around the existing page content (100% original image quality, zero CTM distortion)
    function applyMarginsToPdfPageInPlace(finalPage, stateObj, applyChanges) {
        const m = (applyChanges && hasActiveMargins(stateObj.margins)) ? stateObj.margins : null;
        if (!m) return;

        const { rgb, PDFName } = window.PDFLib;
        const cropBox = finalPage.getCropBox() || finalPage.getMediaBox();
        const boxX = cropBox.x || 0;
        const boxY = cropBox.y || 0;
        const rawW = cropBox.width || stateObj.pageWidth || 595.28;
        const rawH = cropBox.height || stateObj.pageHeight || 841.89;

        const srcRot = ((finalPage.getRotation().angle % 360) + 360) % 360;
        const visRot = applyChanges ? (((stateObj.visualRotation || 0) % 360) + 360) % 360 : 0;
        const totalRot = (srcRot + visRot) % 360;
        const isTotalSideways = (totalRot === 90 || totalRot === 270);

        const visBaseW = isTotalSideways ? rawH : rawW;
        const visBaseH = isTotalSideways ? rawW : rawH;

        let mTop = m.top || 0;
        let mBottom = m.bottom || 0;
        let mLeft = m.left || 0;
        let mRight = m.right || 0;

        // Recalculate exact preset padding from the page's actual raw dimensions so every page is centered accurately
        const preset = m.pageSize || stateObj.resize;
        if (preset && preset !== 'original' && preset !== 'custom') {
            let targetW = visBaseW, targetH = visBaseH;
            if (preset === 'Square') {
                const maxSide = Math.max(visBaseW, visBaseH);
                targetW = maxSide;
                targetH = maxSide;
            } else if (PAGE_SIZE_PRESETS[preset]) {
                const [pW, pH] = PAGE_SIZE_PRESETS[preset];
                const scale = Math.max(visBaseW / pW, visBaseH / pH);
                targetW = pW * scale;
                targetH = pH * scale;
            }
            const padX = Math.max(0, (targetW - visBaseW) / 2);
            const padY = Math.max(0, (targetH - visBaseH) / 2);
            mLeft = padX; mRight = padX;
            mTop = padY; mBottom = padY;
        } else {
            // Scale custom margin values if actual page dimensions differ from stateObj.pageWidth
            const stateVisW = isTotalSideways ? (stateObj.pageHeight || visBaseW) : (stateObj.pageWidth || visBaseW);
            const stateVisH = isTotalSideways ? (stateObj.pageWidth || visBaseH) : (stateObj.pageHeight || visBaseH);
            const ratioX = visBaseW / Math.max(1, stateVisW);
            const ratioY = visBaseH / Math.max(1, stateVisH);
            mLeft *= ratioX; mRight *= ratioX;
            mTop *= ratioY; mBottom *= ratioY;
        }

        let uTop = mTop, uBottom = mBottom, uLeft = mLeft, uRight = mRight;
        if (totalRot === 90) {
            uLeft = mTop; uRight = mBottom; uBottom = mLeft; uTop = mRight;
        } else if (totalRot === 180) {
            uBottom = mTop; uTop = mBottom; uRight = mLeft; uLeft = mRight;
        } else if (totalRot === 270) {
            uRight = mTop; uLeft = mBottom; uTop = mLeft; uBottom = mRight;
        }

        const newBoxX = boxX - uLeft;
        const newBoxY = boxY - uBottom;
        const newBoxW = rawW + uLeft + uRight;
        const newBoxH = rawH + uBottom + uTop;

        finalPage.setMediaBox(newBoxX, newBoxY, newBoxW, newBoxH);
        finalPage.setCropBox(newBoxX, newBoxY, newBoxW, newBoxH);
        if (finalPage.node.get(PDFName.of('BleedBox'))) finalPage.setBleedBox(newBoxX, newBoxY, newBoxW, newBoxH);
        if (finalPage.node.get(PDFName.of('TrimBox'))) finalPage.setTrimBox(newBoxX, newBoxY, newBoxW, newBoxH);
        if (finalPage.node.get(PDFName.of('ArtBox'))) finalPage.setArtBox(newBoxX, newBoxY, newBoxW, newBoxH);

        if (m.hasBg) {
            const bgRgb = hexToRgbPdf(m.color || '#FFFFFF');
            const fillCol = rgb(bgRgb.r, bgRgb.g, bgRgb.b);
            if (uBottom > 0.05) {
                finalPage.drawRectangle({ x: newBoxX, y: newBoxY, width: newBoxW, height: uBottom, color: fillCol });
            }
            if (uTop > 0.05) {
                finalPage.drawRectangle({ x: newBoxX, y: boxY + rawH, width: newBoxW, height: uTop, color: fillCol });
            }
            if (uLeft > 0.05) {
                finalPage.drawRectangle({ x: newBoxX, y: boxY, width: uLeft, height: rawH, color: fillCol });
            }
            if (uRight > 0.05) {
                finalPage.drawRectangle({ x: boxX + rawW, y: boxY, width: uRight, height: rawH, color: fillCol });
            }
        }
    }

    // Allows in-place export even when Page Size or Margins are enabled!
    function canExportSingleDocInPlace(targetStates) {
        const neededSources = new Set();
        let lastOrigIdx = -1;
        for (let i = 0; i < targetStates.length; i++) {
            const st = targetStates[i];
            if (!st) continue;
            if (st.type === 'original') {
                neededSources.add(st.sourceIndex);
                if (neededSources.size > 1) return false;
                if (st.originalIndex <= lastOrigIdx) return false;
                lastOrigIdx = st.originalIndex;
            }
        }
        return neededSources.size === 1;
    }

    async function exportPagesInPlaceSingleDoc(targetStates, applyChanges, onProgress) {
        const { PDFDocument, StandardFonts, degrees } = window.PDFLib;
        const firstOrig = targetStates.find(st => st && st.type === 'original');
        const sourceIdx = firstOrig.sourceIndex;

        const mainPdf = await PDFDocument.load(pdfSources[sourceIdx], { updateMetadata: false });
        mainPdf.setTitle('SArixa Organized Document');

        const keptOrigNumbers = new Set(
            targetStates.filter(st => st && st.type === 'original').map(st => st.originalIndex)
        );

        for (let pIdx = mainPdf.getPageCount() - 1; pIdx >= 0; pIdx--) {
            if (!keptOrigNumbers.has(pIdx + 1)) {
                mainPdf.removePage(pIdx);
            }
        }

        let helveticaFont = null;
        if (applyChanges && targetStates.some(st => st && st.pageNumber && st.pageNumber.num)) {
            helveticaFont = await mainPdf.embedFont(StandardFonts.Helvetica);
        }

        for (let i = 0; i < targetStates.length; i++) {
            const stateObj = targetStates[i];
            if (i % 2 === 0) await yieldToMain();
            if (onProgress) onProgress(i, targetStates.length);

            let finalPage;
            if (stateObj.type === 'original') {
                finalPage = mainPdf.getPage(i);
                if (applyChanges && hasActiveMargins(stateObj.margins)) {
                    applyMarginsToPdfPageInPlace(finalPage, stateObj, true);
                }
            } else {
                finalPage = await buildNonOriginalPdfPageWithMargins(mainPdf, stateObj, applyChanges, i);
            }

            if (applyChanges) {
                let exportRot = (stateObj.visualRotation || 0) % 360;
                if (exportRot < 0) exportRot += 360;
                if (exportRot !== 0) {
                    const currentRot = finalPage.getRotation().angle;
                    finalPage.setRotation(degrees(currentRot + exportRot));
                }

                const totalRot = ((finalPage.getRotation().angle % 360) + 360) % 360;
                const { width, height } = finalPage.getSize();
                const overlayInfo = await generateCroppedOverlayForPdf(stateObj, width, height);
                if (overlayInfo) {
                    const pdfOverlayImg = await mainPdf.embedPng(overlayInfo.pngBytes);
                    overlayInfo.pngBytes = null;
                    drawCroppedOverlayOnPdfPage(finalPage, pdfOverlayImg, overlayInfo, totalRot);
                }

                if (stateObj.pageNumber && stateObj.pageNumber.num) {
                    drawNativePageNumberOnPdfPage(finalPage, stateObj, helveticaFont, totalRot);
                }
            }
        }

        await yieldToMain();
        return await mainPdf.save({ useObjectStreams: false });
    }

    async function buildNonOriginalPdfPageWithMargins(pdfDoc, stateObj, applyChanges, insertAtIdx = null) {
        const { rgb } = window.PDFLib;
        const m = (applyChanges && hasActiveMargins(stateObj.margins)) ? stateObj.margins : null;
        const baseW = stateObj.pageWidth || 595.28;
        const baseH = stateObj.pageHeight || 841.89;

        const createPage = (dims) => (insertAtIdx !== null ? pdfDoc.insertPage(insertAtIdx, dims) : pdfDoc.addPage(dims));

        if (!m) {
            const finalPage = createPage([baseW, baseH]);
            if (stateObj.type === 'image') {
                const imgBytes = await fetch(stateObj.dataUrl || stateObj.cacheUrl).then(r => r.arrayBuffer());
                const pdfImg = (stateObj.mime === 'image/jpeg') ? await pdfDoc.embedJpg(imgBytes) : await pdfDoc.embedPng(imgBytes);
                const { width, height } = finalPage.getSize();
                const imgDims = pdfImg.scaleToFit(width, height);
                finalPage.drawImage(pdfImg, {
                    x: width / 2 - imgDims.width / 2,
                    y: height / 2 - imgDims.height / 2,
                    width: imgDims.width,
                    height: imgDims.height
                });
            } else {
                finalPage.drawRectangle({ x: 0, y: 0, width: baseW, height: baseH, color: rgb(1, 1, 1) });
            }
            return finalPage;
        }

        const isSideways = applyChanges && (Math.abs((stateObj.visualRotation || 0) % 180) === 90);
        const mTop = isSideways ? (m.right || 0) : (m.top || 0);
        const mBottom = isSideways ? (m.left || 0) : (m.bottom || 0);
        const mLeft = isSideways ? (m.top || 0) : (m.left || 0);
        const mRight = isSideways ? (m.bottom || 0) : (m.right || 0);

        const rawExpandedW = baseW + mLeft + mRight;
        const rawExpandedH = baseH + mTop + mBottom;

        let finalPageW = rawExpandedW;
        let finalPageH = rawExpandedH;
        const preset = m.pageSize || stateObj.resize;

        if (preset && preset !== 'original' && preset !== 'custom') {
            let stdW = 595.28, stdH = 841.89;
            if (preset === 'Square') {
                stdW = 595.28; stdH = 595.28;
            } else if (PAGE_SIZE_PRESETS[preset]) {
                [stdW, stdH] = PAGE_SIZE_PRESETS[preset];
            }
            finalPageW = isSideways ? stdH : stdW;
            finalPageH = isSideways ? stdW : stdH;
        }

        const scaleX = finalPageW / (rawExpandedW || 1);
        const scaleY = finalPageH / (rawExpandedH || 1);
        const drawX = mLeft * scaleX;
        const drawY = mBottom * scaleY;
        const drawW = baseW * scaleX;
        const drawH = baseH * scaleY;

        const finalPage = createPage([finalPageW, finalPageH]);
        if (m.hasBg) {
            const bgRgb = hexToRgbPdf(m.color || '#FFFFFF');
            finalPage.drawRectangle({
                x: 0, y: 0, width: finalPageW, height: finalPageH,
                color: rgb(bgRgb.r, bgRgb.g, bgRgb.b)
            });
        }

        if (stateObj.type === 'image') {
            const imgBytes = await fetch(stateObj.dataUrl || stateObj.cacheUrl).then(r => r.arrayBuffer());
            const pdfImg = (stateObj.mime === 'image/jpeg') ? await pdfDoc.embedJpg(imgBytes) : await pdfDoc.embedPng(imgBytes);
            finalPage.drawImage(pdfImg, { x: drawX, y: drawY, width: drawW, height: drawH });
        } else {
            finalPage.drawRectangle({ x: drawX, y: drawY, width: drawW, height: drawH, color: rgb(1, 1, 1) });
        }
        return finalPage;
    }

    async function loadRequiredPdfLibDocs(statesArray) {
        const { PDFDocument } = window.PDFLib;
        const neededIndices = new Set();
        statesArray.forEach(st => {
            if (st && st.type === 'original' && typeof st.sourceIndex === 'number' && pdfSources[st.sourceIndex]) {
                neededIndices.add(st.sourceIndex);
            }
        });
        const loadedDocs = {};
        for (const sIdx of neededIndices) {
            loadedDocs[sIdx] = await PDFDocument.load(pdfSources[sIdx], { updateMetadata: false });
            await yieldToMain();
        }
        return loadedDocs;
    }

    // Batch-copies ALL original pages (even those with Margins / Page Size!) in ONE single copyPages() call per source PDF
    async function preCopyOriginalPagesInBatch(newPdf, targetStates, loadedDocs) {
        const bySource = new Map();
        targetStates.forEach((st, idx) => {
            if (st && st.type === 'original' && loadedDocs[st.sourceIndex]) {
                if (!bySource.has(st.sourceIndex)) bySource.set(st.sourceIndex, []);
                bySource.get(st.sourceIndex).push({ targetIdx: idx, pageZeroIdx: st.originalIndex - 1 });
            }
        });

        const preCopiedMap = new Map();
        for (const [sIdx, items] of bySource.entries()) {
            const srcDoc = loadedDocs[sIdx];
            const pageIndices = items.map(it => it.pageZeroIdx);
            const copiedPages = await newPdf.copyPages(srcDoc, pageIndices);
            items.forEach((it, i) => {
                preCopiedMap.set(it.targetIdx, copiedPages[i]);
            });
            await yieldToMain();
        }
        return preCopiedMap;
    }

    async function buildPdfPageWithMargins(newPdf, stateObj, loadedDocs, applyChanges, preCopiedPage = null) {
        if (stateObj.type === 'original') {
            let finalPage;
            if (preCopiedPage) {
                finalPage = newPdf.addPage(preCopiedPage);
            } else {
                const srcDoc = loadedDocs[stateObj.sourceIndex];
                const [copiedPage] = await newPdf.copyPages(srcDoc, [stateObj.originalIndex - 1]);
                finalPage = newPdf.addPage(copiedPage);
            }
            if (applyChanges && hasActiveMargins(stateObj.margins)) {
                applyMarginsToPdfPageInPlace(finalPage, stateObj, true);
            }
            return finalPage;
        }
        return await buildNonOriginalPdfPageWithMargins(newPdf, stateObj, applyChanges, null);
    }


    function ensureExtractPopupCreated() {
        let popup = document.getElementById('extract-popup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'extract-popup';
            popup.className = 'popup-overlay hidden';
            document.body.appendChild(popup);
        }

        if (!popup.querySelector('input[name="extract-format"]')) {
            popup.innerHTML = `
                <div class="popup-content">
                    <h3 style="color: var(--accent-primary); margin-bottom: 10px;">Extract Page(s)</h3>
                    <p id="extract-selection-info" style="color: var(--text-main); font-size: 0.95rem; margin-bottom: 14px;">Select format & how you want to extract:</p>
                    <div class="extract-format-group">
                        <label class="extract-format-option">
                            <input type="radio" name="extract-format" value="pdf" checked>
                            <span class="extract-dot"></span>
                            <span class="extract-format-label">PDF</span>
                        </label>
                        <label class="extract-format-option">
                            <input type="radio" name="extract-format" value="png">
                            <span class="extract-dot"></span>
                            <span class="extract-format-label">PNG</span>
                        </label>
                        <label class="extract-format-option">
                            <input type="radio" name="extract-format" value="jpg">
                            <span class="extract-dot"></span>
                            <span class="extract-format-label">JPG</span>
                        </label>
                    </div>
                    <div id="extract-filename-container" style="margin-bottom: 14px; text-align: left;">
                        <label for="extract-filename-input" style="display: block; font-size: 0.85rem; color: var(--text-sub); margin-bottom: 5px; font-weight: 600;">PDF File Name:</label>
                        <input type="text" id="extract-filename-input" value="" placeholder="SArixa-PDF" style="width: 100%; padding: 8px 12px; background: #012f28; color: var(--text-bright); border: 1px solid rgba(0, 255, 200, 0.3); border-radius: 6px; box-sizing: border-box; font-size: 0.92rem; outline: none;" spellcheck="false">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 12px; width: 100%;">
                        <button id="btn-extract-with-changes" class="popup-btn popup-btn-green" style="margin: 0; width: 100%;">Extract With Modifications</button>
                        <button id="btn-extract-without-changes" class="popup-btn" style="margin: 0; width: 100%; background: transparent; border: 1px solid var(--accent-primary); color: var(--accent-primary);">Extract Without Modifications</button>
                        <button id="btn-extract-popup-cancel" class="popup-btn popup-btn-red" style="margin: 0; width: 100%;">Cancel</button>
                    </div>
                </div>
            `;
        } else if (!document.getElementById('extract-filename-container')) {
            const fmtGroup = popup.querySelector('.extract-format-group');
            if (fmtGroup) {
                const nameDiv = document.createElement('div');
                nameDiv.id = 'extract-filename-container';
                nameDiv.style.cssText = 'margin-bottom: 14px; text-align: left;';
                nameDiv.innerHTML = `
                    <label for="extract-filename-input" style="display: block; font-size: 0.85rem; color: var(--text-sub); margin-bottom: 5px; font-weight: 600;">PDF File Name:</label>
                    <input type="text" id="extract-filename-input" value="" placeholder="SArixa-PDF" style="width: 100%; padding: 8px 12px; background: #012f28; color: var(--text-bright); border: 1px solid rgba(0, 255, 200, 0.3); border-radius: 6px; box-sizing: border-box; font-size: 0.92rem; outline: none;" spellcheck="false">
                `;
                fmtGroup.insertAdjacentElement('afterend', nameDiv);
            }
        }

        const existingNameInp = document.getElementById('extract-filename-input');
        if (existingNameInp) {
            existingNameInp.placeholder = 'SArixa-PDF';
            if (existingNameInp.value === 'extracted-page' || existingNameInp.value === 'SArixa-PDF') {
                existingNameInp.value = '';
            }
        }

        const count = getTargetPagesForBatchAction().length || 1;
        const infoEl = document.getElementById('extract-selection-info');
        if (infoEl) {
            infoEl.innerText = count > 1
                ? `${count} pages selected (PDF = 1 combined PDF, PNG/JPG = ZIP archive):`
                : `1 page selected — choose format to download:`;
        }

        const getSelectedExtractFormat = () => {
            const checked = popup.querySelector('input[name="extract-format"]:checked');
            return checked ? checked.value : 'pdf';
        };

        const filenameContainer = document.getElementById('extract-filename-container');
        const filenameInput = document.getElementById('extract-filename-input');

        const syncFilenameBoxVisibility = () => {
            const fmt = getSelectedExtractFormat();
            if (filenameContainer) {
                filenameContainer.style.display = (fmt === 'pdf') ? 'block' : 'none';
            }
        };

        popup.querySelectorAll('input[name="extract-format"]').forEach(radio => {
            if (!radio.dataset.boundVis) {
                radio.dataset.boundVis = 'true';
                radio.addEventListener('change', syncFilenameBoxVisibility);
            }
        });
        syncFilenameBoxVisibility();

        const btnWith = document.getElementById('btn-extract-with-changes');
        const btnWithout = document.getElementById('btn-extract-without-changes');
        const btnCancel = document.getElementById('btn-extract-popup-cancel');

        if (btnWith && !btnWith.dataset.bound) {
            btnWith.dataset.bound = 'true';
            btnWith.addEventListener('click', () => {
                popup.classList.add('hidden');
                const fmt = getSelectedExtractFormat();
                if (fmt === 'pdf') {
                    const customName = filenameInput ? filenameInput.value.trim() : '';
                    downloadSelectedPagesAsPdf(true, customName);
                } else {
                    downloadSelectedPagesAsImages(fmt, true);
                }
            });
        }
        if (btnWithout && !btnWithout.dataset.bound) {
            btnWithout.dataset.bound = 'true';
            btnWithout.addEventListener('click', () => {
                popup.classList.add('hidden');
                const fmt = getSelectedExtractFormat();
                if (fmt === 'pdf') {
                    const customName = filenameInput ? filenameInput.value.trim() : '';
                    downloadSelectedPagesAsPdf(false, customName);
                } else {
                    downloadSelectedPagesAsImages(fmt, false);
                }
            });
        }
        if (btnCancel && !btnCancel.dataset.bound) {
            btnCancel.dataset.bound = 'true';
            btnCancel.addEventListener('click', () => {
                popup.classList.add('hidden');
            });
        }
        return popup;
    }

    async function renderSinglePageToImageBlob(stateObj, format, withChanges) {
        const rot = withChanges ? (stateObj.visualRotation || 0) : 0;
        const isSideways = Math.abs(rot % 180) === 90;
        let rawWidth = 0, rawHeight = 0, pageObj = null, imgObj = null;

        if (stateObj.type === 'original') {
            const pdf = await getCachedPdfDoc(stateObj.sourceIndex);
            pageObj = await pdf.getPage(stateObj.originalIndex);
            const totalRot = (pageObj.rotate || 0) + rot;
            const vp1 = pageObj.getViewport({ scale: 1, rotation: totalRot });
            rawWidth = vp1.width; rawHeight = vp1.height;
        } else {
            imgObj = new Image();
            const srcUrl = withChanges
                ? (stateObj.dataUrl || stateObj.cacheUrl)
                : (stateObj.cleanDataUrl || stateObj.cacheUrl || stateObj.dataUrl);
            imgObj.src = srcUrl;
            await new Promise(res => { imgObj.onload = res; imgObj.onerror = res; });
            rawWidth = isSideways ? imgObj.height : imgObj.width;
            rawHeight = isSideways ? imgObj.width : imgObj.height;
        }

        const m = (withChanges && hasActiveMargins(stateObj.margins))
            ? stateObj.margins
            : { top: 0, bottom: 0, left: 0, right: 0, hasBg: false, color: '#FFFFFF' };

        const totalUnscaledW = rawWidth + (m.left || 0) + (m.right || 0);
        const totalUnscaledH = rawHeight + (m.top || 0) + (m.bottom || 0);

        const maxDim = DEVICE_PROFILE.maxOverlayDim;
        const exportScale = Math.min(DEVICE_PROFILE.exportScale, maxDim / Math.max(totalUnscaledW, totalUnscaledH, 1));
        const imgW = Math.round(rawWidth * exportScale);
        const imgH = Math.round(rawHeight * exportScale);
        const mTopPx = Math.round((m.top || 0) * exportScale);
        const mBottomPx = Math.round((m.bottom || 0) * exportScale);
        const mLeftPx = Math.round((m.left || 0) * exportScale);
        const mRightPx = Math.round((m.right || 0) * exportScale);

        const cw = imgW + mLeftPx + mRightPx;
        const ch = imgH + mTopPx + mBottomPx;

        const outCanvas = document.createElement('canvas');
        outCanvas.width = cw; outCanvas.height = ch;
        const outCtx = outCanvas.getContext('2d');

        if (m.hasBg) {
            outCtx.fillStyle = m.color || '#FFFFFF';
            outCtx.fillRect(0, 0, cw, ch);
        } else if (format === 'jpg') {
            outCtx.fillStyle = '#FFFFFF';
            outCtx.fillRect(0, 0, cw, ch);
        } else {
            outCtx.clearRect(0, 0, cw, ch);
        }

        const baseCanvas = document.createElement('canvas');
        baseCanvas.width = imgW; baseCanvas.height = imgH;
        const bCtx = baseCanvas.getContext('2d');
        if (stateObj.type === 'original' || stateObj.type === 'blank' || format === 'jpg') {
            bCtx.fillStyle = '#FFFFFF';
            bCtx.fillRect(0, 0, imgW, imgH);
        } else {
            bCtx.clearRect(0, 0, imgW, imgH);
        }

        if (stateObj.type === 'original') {
            const totalRot = (pageObj.rotate || 0) + rot;
            const vp = pageObj.getViewport({ scale: exportScale, rotation: totalRot });
            await pageObj.render({ canvasContext: bCtx, viewport: vp }).promise;
            if (pageObj.cleanup) { try { pageObj.cleanup(); } catch (e) {} }
        } else if (imgObj) {
            const drawW = isSideways ? rawHeight : rawWidth;
            const drawH = isSideways ? rawWidth : rawHeight;
            bCtx.save();
            bCtx.translate(imgW / 2, imgH / 2);
            bCtx.rotate((rot * Math.PI) / 180);
            bCtx.scale(exportScale, exportScale);
            bCtx.drawImage(imgObj, -drawW / 2, -drawH / 2, drawW, drawH);
            bCtx.restore();
        }

        outCtx.drawImage(baseCanvas, mLeftPx, mTopPx, imgW, imgH);
        releaseCanvasMemory(baseCanvas);

        if (withChanges) {
            if (stateObj.drawings && stateObj.drawings.length > 0) {
                const tempDrawCanvas = document.createElement('canvas');
                tempDrawCanvas.width = cw; tempDrawCanvas.height = ch;
                const tempDrawCtx = tempDrawCanvas.getContext('2d', { willReadFrequently: true });
                replayDrawingsOnCanvas(tempDrawCanvas, tempDrawCtx, stateObj.drawings, exportScale, mLeftPx, mTopPx, imgW, imgH);
                outCtx.drawImage(tempDrawCanvas, 0, 0);
                releaseCanvasMemory(tempDrawCanvas);
            }
            if (stateObj.texts && stateObj.texts.length > 0) {
                drawSavedTextsOnContext(outCtx, stateObj.texts, mLeftPx, mTopPx, imgW, imgH, exportScale);
            }
            await drawWatermarkAndPageNumOnContext(outCtx, stateObj, cw, ch, exportScale);
        }

        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const blob = await canvasToBlob(outCanvas, mimeType, format === 'png' ? undefined : 0.92);
        releaseCanvasMemory(outCanvas);
        return blob;
    }

    async function downloadSelectedPagesAsImages(format, withChanges) {
        const targetStates = getTargetPagesForBatchAction();
        if (targetStates.length === 0) return;

        try {
            progressContainer.style.display = "block";

            if (targetStates.length === 1) {
                updateProgress(30, `Extracting ${format.toUpperCase()}...`);
                const imgBlob = await renderSinglePageToImageBlob(targetStates[0], format, withChanges);
                updateProgress(95, "Downloading...");
                const url = URL.createObjectURL(imgBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `extracted_page_${withChanges ? 'modified' : 'original'}_${Date.now()}.${format}`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(url), 1500);
                updateProgress(100, "Done!");
                return;
            }

            if (typeof JSZip === 'undefined') {
                await loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
            }

            const zip = new JSZip();
            for (let i = 0; i < targetStates.length; i++) {
                updateProgress(10 + ((i / targetStates.length) * 75), `Rendering Page ${i + 1} of ${targetStates.length}...`);
                await yieldToMain();
                const imgBlob = await renderSinglePageToImageBlob(targetStates[i], format, withChanges);
                zip.file(`page_${i + 1}.${format}`, imgBlob);
            }

            updateProgress(90, "Creating ZIP Archive...");
            const zipBlob = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `extracted_pages_${format.toUpperCase()}_${Date.now()}.zip`;
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1500);
            updateProgress(100, "Done!");
        } catch (err) {
            console.error("Image Extract Error:", err);
            alert("Failed to extract image(s).");
        } finally {
            setTimeout(() => progressContainer.style.display = "none", 800);
        }
    }

    async function downloadSelectedPagesAsPdf(withChanges, customName = "") {
        const targetStates = getTargetPagesForBatchAction();
        if (targetStates.length === 0) return;

        try {
            progressContainer.style.display = "block";
            updateProgress(12, "Freeing memory & preparing PDF...");
            await ResourceManager.suspendPdfJsDocsForExport();
            await yieldToMain();

            let pdfBytes;
            if (canExportSingleDocInPlace(targetStates, withChanges)) {
                pdfBytes = await exportPagesInPlaceSingleDoc(targetStates, withChanges, (i, total) => {
                    updateProgress(18 + ((i / total) * 72), `Packing Page ${i + 1} of ${total}...`);
                });
            } else {
                const { PDFDocument, StandardFonts, degrees } = window.PDFLib;
                const newPdf = await PDFDocument.create();
                let loadedDocs = await loadRequiredPdfLibDocs(targetStates);
                let preCopiedMap = await preCopyOriginalPagesInBatch(newPdf, targetStates, loadedDocs, withChanges);

                let helveticaFont = null;
                if (withChanges && targetStates.some(st => st && st.pageNumber && st.pageNumber.num)) {
                    helveticaFont = await newPdf.embedFont(StandardFonts.Helvetica);
                }

                for (let i = 0; i < targetStates.length; i++) {
                    const stateObj = targetStates[i];
                    updateProgress(18 + ((i / targetStates.length) * 68), `Packing Page ${i + 1} of ${targetStates.length}...`);
                    if (i % 3 === 0) await yieldToMain();

                    const preCopiedPage = preCopiedMap.get(i) || null;
                    const finalPage = await buildPdfPageWithMargins(newPdf, stateObj, loadedDocs, withChanges, preCopiedPage);
                    preCopiedMap.delete(i);

                    if (withChanges) {
                        let exportRot = (stateObj.visualRotation || 0) % 360;
                        if (exportRot < 0) exportRot += 360;
                        if (exportRot !== 0) {
                            const currentRot = finalPage.getRotation().angle;
                            finalPage.setRotation(degrees(currentRot + exportRot));
                        }

                        const { width, height } = finalPage.getSize();
                        const overlayInfo = await generateCroppedOverlayForPdf(stateObj, width, height);
                        if (overlayInfo) {
                            const pdfOverlayImg = await newPdf.embedPng(overlayInfo.pngBytes);
                            overlayInfo.pngBytes = null;
                            drawCroppedOverlayOnPdfPage(finalPage, pdfOverlayImg, overlayInfo, exportRot);
                        }

                        if (stateObj.pageNumber && stateObj.pageNumber.num) {
                            drawNativePageNumberOnPdfPage(finalPage, stateObj, helveticaFont, exportRot);
                        }
                    }
                }

                preCopiedMap.clear();
                preCopiedMap = null;
                loadedDocs = null;
                updateProgress(92, "Finalizing PDF...");
                await yieldToMain();
                pdfBytes = await newPdf.save({ useObjectStreams: false });
            }

            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            const cleanBaseName = (customName || "").replace(/\.pdf$/i, "").trim();
            a.download = cleanBaseName
                ? `${cleanBaseName}.pdf`
                : `SArixa-PDF-${targetStates.length}-pages.pdf`;

            document.body.appendChild(a); a.click(); document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            updateProgress(100, "Done!");
        } catch (err) {
            console.error("Extract Download Error:", err);
            alert("Failed to extract page(s).");
        } finally {
            setTimeout(() => progressContainer.style.display = "none", 800);
        }
    }

    if (fabExtract) {
        fabExtract.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            if (selectedPageIds.length === 0 && !selectedPageId) return;
            closeAllSubmenus();
            const popup = ensureExtractPopupCreated();
            popup.style.zIndex = '100010';
            popup.classList.remove('hidden');
        });
    }

    function closeDetailView() {
        closeCustomDropupMenu();
        if (textDragRafId) {
            cancelAnimationFrame(textDragRafId);
            textDragRafId = null;
        }
        if (currentPdfRenderTask) {
            try { currentPdfRenderTask.cancel(); } catch (e) {}
            currentPdfRenderTask = null;
        }
        isDetailViewOpen = false; isTextEditingOpen = false; isDrawMode = false; isMarginsMode = false;
        workingMargins = null; activeDragTextWrapper = null; textInteractionMode = null;

        if (marginRawBaseCanvas) {
            releaseCanvasMemory(marginRawBaseCanvas);
            marginRawBaseCanvas = null;
        }
        if (drawCanvas) {
            releaseCanvasMemory(drawCanvas);
            drawCanvas.remove(); drawCanvas = null; drawCtx = null;
        }
        if (strokeBufferCanvas) {
            releaseCanvasMemory(strokeBufferCanvas);
            strokeBufferCanvas = null; strokeBufferCtx = null;
        }
        if (editorCanvas) {
            releaseCanvasMemory(editorCanvas);
        }

        editorModal.classList.add('hidden');
        editorModal.classList.remove('subtool-open');
        floatingToolbar.style.zIndex = '9999';

        if (fabDuplicate) fabDuplicate.style.display = '';
        if (fabReplace) fabReplace.style.display = '';
        updateSelectionUI();

        if (drawJoystick) drawJoystick.classList.add('hidden');
        if (marginGuidesContainer) marginGuidesContainer.classList.add('hidden');
        editorOverlay.style.pointerEvents = 'none';
        editorOverlay.style.touchAction = 'auto';
        editorOverlay.style.overflow = 'hidden';
        editorOverlay.style.cursor = 'default';
    }

    btnDetailClose.addEventListener('click', closeDetailView);
    if (fabViewChanges) fabViewChanges.addEventListener('click', () => openDetailView());

    // ==========================================
    // 15. SAVED TEXT & MAIN CANVAS RENDERER
    // ==========================================
    function drawSavedTextsOnContext(ctx, textsArray, imgOffX, imgOffY, imgW, imgH, scaleFactor = editorScale) {
        if (!textsArray || textsArray.length === 0) return;
        textsArray.forEach(txt => {
            const refW = txt.relToImg ? (imgW || ctx.canvas.width) : ctx.canvas.width;
            const refH = txt.relToImg ? (imgH || ctx.canvas.height) : ctx.canvas.height;
            const offX = txt.relToImg ? imgOffX : 0;
            const offY = txt.relToImg ? imgOffY : 0;

            const pxX = offX + txt.x * refW;
            const pxY = offY + txt.y * refH;
            const scaledSize = txt.fontSizeRatio ? (txt.fontSizeRatio * refW) : (txt.fontSizeBase * scaleFactor);
            const boxW = txt.boxWidthRatio ? (txt.boxWidthRatio * refW) : ((txt.boxWidth || 0) * scaleFactor);
            const boxH = txt.boxHeightRatio ? (txt.boxHeightRatio * refH) : ((txt.boxHeight || 0) * scaleFactor);

            ctx.save();
            const centerX = pxX + boxW / 2;
            const centerY = pxY + boxH / 2;
            if (txt.rotation) {
                ctx.translate(centerX, centerY);
                ctx.rotate((txt.rotation * Math.PI) / 180);
                ctx.translate(-centerX, -centerY);
            }
            ctx.translate(pxX, pxY);

            const relScale = scaledSize / (txt.fontSizeBase || 24);

            if (txt.hasBg) {
                ctx.beginPath();
                const r = (txt.bgRadius || 0) * relScale;
                if (ctx.roundRect) ctx.roundRect(0, 0, boxW, boxH, r);
                else ctx.rect(0, 0, boxW, boxH);
                ctx.fillStyle = hexToRgba(txt.bgColor, (txt.bgOpacity ?? 100) / 100);
                ctx.fill();
            }

            ctx.font = `${txt.isItalic ? 'italic ' : ''}${txt.isBold ? 'bold ' : ''}${scaledSize}px ${txt.fontFamily}`;
            ctx.fillStyle = txt.color;
            const align = txt.align || 'left';
            ctx.textAlign = align;
            ctx.textBaseline = 'middle';

            if ('letterSpacing' in ctx) ctx.letterSpacing = ((txt.letterSpacing || 0) * relScale) + 'px';
            if ('wordSpacing' in ctx) ctx.wordSpacing = ((txt.wordSpacing || 0) * relScale) + 'px';

            const padX = txt.hasBg ? (0.6 * scaledSize) : 0;
            const padY = txt.hasBg ? (0.4 * scaledSize) : 0;
            const listIndent = (txt.listType && txt.listType !== 'none') ? (1.2 * scaledSize) : 0;

            let anchorX = padX + listIndent;
            if (align === 'center' && boxW > 0) anchorX = (boxW + listIndent) / 2;
            else if (align === 'right' && boxW > 0) anchorX = boxW - padX;

            const lineGap = txt.lineGap || 1.2;
            const lineHeightPx = scaledSize * lineGap;
            const lines = txt.text.split('\n');

            lines.forEach((line, idx) => {
                const yMiddle = padY + (idx + 0.5) * lineHeightPx;
                const strokePx = Math.max(0.8, (txt.borderWeight || 10) * 0.28 * relScale);

                if (txt.listType && txt.listType !== 'none') {
                    let prefix = '•';
                    if (txt.listType === 'number') prefix = (idx + 1) + '.';
                    else if (txt.listType === 'alpha') prefix = String.fromCharCode(97 + idx) + '.';

                    ctx.save();
                    ctx.textAlign = 'right';
                    const markerRightX = anchorX - (0.3 * scaledSize);
                    if (txt.hasBorder) {
                        ctx.lineJoin = 'round';
                        ctx.miterLimit = 2;
                        ctx.lineWidth = strokePx;
                        ctx.strokeStyle = txt.borderColor || '#00e676';
                        ctx.strokeText(prefix, markerRightX, yMiddle);
                    }
                    ctx.fillText(prefix, markerRightX, yMiddle);
                    ctx.restore();
                }

                if (txt.hasBorder) {
                    ctx.lineJoin = 'round';
                    ctx.miterLimit = 2;
                    ctx.lineWidth = strokePx;
                    ctx.strokeStyle = txt.borderColor || '#00e676';
                    ctx.strokeText(line, anchorX, yMiddle);
                }
                ctx.fillText(line, anchorX, yMiddle);

                if (txt.isUnderline || txt.isStrike) {
                    const lineW = ctx.measureText(line).width;
                    let startLineX = anchorX;
                    if (align === 'center') startLineX = anchorX - lineW / 2;
                    else if (align === 'right') startLineX = anchorX - lineW;

                    ctx.save();
                    ctx.strokeStyle = txt.color;
                    ctx.lineWidth = Math.max(1.2, scaledSize * 0.06);
                    if (txt.isUnderline) {
                        ctx.beginPath();
                        ctx.moveTo(startLineX, yMiddle + scaledSize * 0.42);
                        ctx.lineTo(startLineX + lineW, yMiddle + scaledSize * 0.42);
                        ctx.stroke();
                    }
                    if (txt.isStrike) {
                        ctx.beginPath();
                        ctx.moveTo(startLineX, yMiddle);
                        ctx.lineTo(startLineX + lineW, yMiddle);
                        ctx.stroke();
                    }
                    ctx.restore();
                }
            });
            ctx.restore();
        });
    }

    let bigCanvasRenderToken = 0;

    async function renderBigCanvas(pageId, drawTexts, skipDrawingLayer = false) {
        const stateObj = pagesState.find(p => p.id === pageId);
        if (!stateObj) return;

        const renderToken = ++bigCanvasRenderToken;

        if (currentPdfRenderTask) {
            try { currentPdfRenderTask.cancel(); } catch (e) {}
            currentPdfRenderTask = null;
        }

        const isMobile = window.innerWidth <= 768;
        let rawWidth = 0, rawHeight = 0, pageObj = null, imgObj = null;

        if (stateObj.type === 'original') {
            const pdf = await getCachedPdfDoc(stateObj.sourceIndex);
            if (renderToken !== bigCanvasRenderToken) return;
            pageObj = await pdf.getPage(stateObj.originalIndex);
            if (renderToken !== bigCanvasRenderToken) {
                if (pageObj.cleanup) { try { pageObj.cleanup(); } catch (e) {} }
                return;
            }
            const baseRot = (pageObj.rotate || 0) + (drawTexts ? (stateObj.visualRotation || 0) : 0);
            const tempViewport = pageObj.getViewport({ scale: 1, rotation: baseRot });
            rawWidth = tempViewport.width; rawHeight = tempViewport.height;
        } else {
            imgObj = new Image();
            imgObj.src = stateObj.dataUrl || stateObj.cacheUrl;
            await new Promise(res => { imgObj.onload = res; imgObj.onerror = res; });
            if (renderToken !== bigCanvasRenderToken) return;
            const isSideways = (drawTexts && Math.abs(stateObj.visualRotation % 180) === 90);
            rawWidth = isSideways ? imgObj.height : imgObj.width;
            rawHeight = isSideways ? imgObj.width : imgObj.height;
        }

        marginBaseRawW = rawWidth;
        marginBaseRawH = rawHeight;

        const activeMargins = isMarginsMode ? workingMargins : (drawTexts ? stateObj.margins : null);
        const m = hasActiveMargins(activeMargins) ? activeMargins : { top: 0, bottom: 0, left: 0, right: 0, hasBg: false, color: '#FFFFFF' };

        const totalUnscaledW = rawWidth + (m.left || 0) + (m.right || 0);
        const totalUnscaledH = rawHeight + (m.top || 0) + (m.bottom || 0);

        const gapX = isMobile ? 12 : 60;
        const gapY = isMobile ? 145 : 180;
        const availableWidth = window.innerWidth - gapX;
        const availableHeight = window.innerHeight - gapY;
        const maxSide = Math.max(totalUnscaledW, totalUnscaledH, 1);
        const maxCap = Math.min(2.5, DEVICE_PROFILE.maxEditorDim / maxSide);

        editorScale = Math.min(availableWidth / totalUnscaledW, availableHeight / totalUnscaledH, maxCap) * (isMobile ? 0.96 : 0.90);
        if (editorScale < 0.1) editorScale = 0.1;

        const imgW = Math.round(rawWidth * editorScale);
        const imgH = Math.round(rawHeight * editorScale);
        const mTopPx = Math.round((m.top || 0) * editorScale);
        const mBottomPx = Math.round((m.bottom || 0) * editorScale);
        const mLeftPx = Math.round((m.left || 0) * editorScale);
        const mRightPx = Math.round((m.right || 0) * editorScale);

        currentImgOffsetX = mLeftPx;
        currentImgOffsetY = mTopPx;
        currentImgDrawW = imgW;
        currentImgDrawH = imgH;

        const cssW = imgW + mLeftPx + mRightPx;
        const cssH = imgH + mTopPx + mBottomPx;

        // Use High-DPI supersampling in Expand & Text modes so text/images look razor sharp on AMOLED screens
        const dpr = (isDrawMode || isMarginsMode)
            ? 1
            : Math.min(DEVICE_PROFILE.editorDpr, DEVICE_PROFILE.maxEditorDim / Math.max(cssW, cssH, 1));

        const physImgW = Math.max(1, Math.round(imgW * dpr));
        const physImgH = Math.max(1, Math.round(imgH * dpr));

        const basePageCanvas = document.createElement('canvas');
        basePageCanvas.width = physImgW;
        basePageCanvas.height = physImgH;
        const bCtx = basePageCanvas.getContext('2d');
        bCtx.imageSmoothingEnabled = true;
        bCtx.imageSmoothingQuality = 'high';

        if (stateObj.type === 'original' || stateObj.type === 'blank') {
            bCtx.fillStyle = '#ffffff';
            bCtx.fillRect(0, 0, physImgW, physImgH);
        } else {
            bCtx.clearRect(0, 0, physImgW, physImgH);
        }

        if (stateObj.type === 'original') {
            const totalRot = (pageObj.rotate || 0) + (drawTexts ? (stateObj.visualRotation || 0) : 0);
            const viewport = pageObj.getViewport({ scale: editorScale * dpr, rotation: totalRot });
            currentPdfRenderTask = pageObj.render({ canvasContext: bCtx, viewport: viewport });
            try {
                await currentPdfRenderTask.promise;
            } catch (err) {
                releaseCanvasMemory(basePageCanvas);
                if (pageObj.cleanup) { try { pageObj.cleanup(); } catch (e) {} }
                if (err && err.name === 'RenderingCancelledException') return;
            }
            if (pageObj.cleanup) { try { pageObj.cleanup(); } catch (e) {} }
            currentPdfRenderTask = null;
            if (renderToken !== bigCanvasRenderToken) {
                releaseCanvasMemory(basePageCanvas);
                return;
            }
        } else {
            bCtx.save();
            bCtx.translate(physImgW / 2, physImgH / 2);
            if (drawTexts) bCtx.rotate((stateObj.visualRotation * Math.PI) / 180);
            const isSideways = (drawTexts && Math.abs(stateObj.visualRotation % 180) === 90);
            const drawW = isSideways ? rawHeight : rawWidth;
            const drawH = isSideways ? rawWidth : rawHeight;
            bCtx.scale(editorScale * dpr, editorScale * dpr);
            bCtx.drawImage(imgObj, -drawW / 2, -drawH / 2, drawW, drawH);
            bCtx.restore();
        }

        if (isMarginsMode) {
            if (marginRawBaseCanvas && marginRawBaseCanvas !== basePageCanvas) {
                releaseCanvasMemory(marginRawBaseCanvas);
            }
            marginRawBaseCanvas = basePageCanvas;
        }

        editorCanvas.width = Math.max(1, Math.round(cssW * dpr));
        editorCanvas.height = Math.max(1, Math.round(cssH * dpr));
        editorCanvas.style.width = cssW + 'px';
        editorCanvas.style.height = cssH + 'px';
        const ctx = editorCanvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.clearRect(0, 0, cssW, cssH);

        if (hasActiveMargins(activeMargins) && activeMargins.hasBg) {
            ctx.fillStyle = activeMargins.color || '#ffffff';
            ctx.fillRect(0, 0, cssW, cssH);
        }

        ctx.drawImage(basePageCanvas, 0, 0, physImgW, physImgH, mLeftPx, mTopPx, imgW, imgH);

        if (!isMarginsMode) {
            releaseCanvasMemory(basePageCanvas);
        }

        if (drawTexts && !skipDrawingLayer && stateObj.drawings && stateObj.drawings.length > 0) {
            const tempDrawCanvas = document.createElement('canvas');
            tempDrawCanvas.width = cssW; tempDrawCanvas.height = cssH;
            const tempDrawCtx = tempDrawCanvas.getContext('2d', { willReadFrequently: true });
            replayDrawingsOnCanvas(tempDrawCanvas, tempDrawCtx, stateObj.drawings, editorScale, mLeftPx, mTopPx, imgW, imgH);
            ctx.save();
            ctx.drawImage(tempDrawCanvas, 0, 0, cssW, cssH);
            ctx.restore();
            releaseCanvasMemory(tempDrawCanvas);
        }

        if (drawTexts && !isTextEditingOpen && stateObj.texts && stateObj.texts.length > 0) {
            drawSavedTextsOnContext(ctx, stateObj.texts, mLeftPx, mTopPx, imgW, imgH, editorScale);
        }

        if (drawTexts) {
            await drawWatermarkAndPageNumOnContext(ctx, stateObj, cssW, cssH, editorScale);
        }
    }

    // ==========================================
    // 16. ADD TEXT TOOL & FORMAT TOOLBAR (120Hz TOUCH OPTIMIZED)
    // ==========================================
    if (fabAddText) {
        fabAddText.addEventListener('click', async (e) => {
            e.preventDefault(); e.stopPropagation();
            if (!selectedPageId) return;
            openedSubToolFromExpand = isDetailViewOpen && !isTextEditingOpen && !isDrawMode && !isMarginsMode;
            editorModal.classList.add('subtool-open');
            isDetailViewOpen = true; isTextEditingOpen = true; isDrawMode = false; isMarginsMode = false;

            editorModal.classList.remove('hidden');
            hideAllEditorHeadersAndToolbars();

            document.getElementById('text-header-group').style.display = 'flex';
            document.getElementById('text-format-toolbar').style.display = 'flex';

            floatingToolbar.classList.add('hidden');
            if (fabAddMoreTextWrapper) fabAddMoreTextWrapper.style.display = 'flex';

            editorOverlay.querySelectorAll('.text-wrapper').forEach(w => w.remove());
            editorOverlay.style.pointerEvents = 'none';
            editorOverlay.style.overflow = 'hidden';

            await renderBigCanvas(selectedPageId, true, false);

            const stateObj = pagesState.find(p => p.id === selectedPageId);
            const refW = currentImgDrawW || editorCanvas.width;
            const refH = currentImgDrawH || editorCanvas.height;
            const offX = currentImgOffsetX || 0;
            const offY = currentImgOffsetY || 0;

            if (stateObj.texts && stateObj.texts.length > 0) {
                stateObj.texts.forEach(txt => {
                    const pxX = txt.relToImg ? (offX + txt.x * refW) : (txt.x * editorCanvas.width);
                    const pxY = txt.relToImg ? (offY + txt.y * refH) : (txt.y * editorCanvas.height);
                    createTextBox(pxX, pxY, txt, false);
                });
            } else {
                createTextBox(offX + refW / 2 - 50, offY + refH / 2 - 20, null, true);
            }
        });
    }

    if (fabAddMoreTextBtn) {
        fabAddMoreTextBtn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            const refW = currentImgDrawW || editorCanvas.width;
            const refH = currentImgDrawH || editorCanvas.height;
            const offX = currentImgOffsetX || 0;
            const offY = currentImgOffsetY || 0;
            createTextBox(offX + refW / 2 - 50, offY + refH / 2 - 20, null, true);
        });
    }

    linkInputAndSlider('format-size', 'slider-size', 'fontSize', editorScale);
    linkInputAndSlider('format-letter-spacing', 'slider-letter-spacing', 'letterSpacing');
    linkInputAndSlider('format-word-spacing', 'slider-word-spacing', 'wordSpacing');
    linkInputAndSlider('format-line-gap', 'slider-line-gap', 'lineHeight', 1, '');
    linkInputAndSlider('format-bg-radius', 'slider-bg-radius', 'bgRadius');
    linkInputAndSlider('format-bg-opacity', 'slider-bg-opacity', 'bgOpacity');
    linkInputAndSlider('format-border-weight', 'slider-border-weight', 'borderWeight');

    function updateBgStyles(content) {
        const target = content || getActiveTextElement();
        if (!target) return;
        const wrapper = target.parentElement;
        const hasBg = wrapper.dataset.hasBg === 'true';
        if (hasBg) {
            const hex = wrapper.dataset.bgColor || '#000000';
            const op = wrapper.dataset.bgOpacity || '100';
            const r = wrapper.dataset.bgRadius || '0';
            target.style.backgroundColor = hexToRgba(hex, op / 100);
            target.style.borderRadius = r + 'px';
            target.style.padding = '0.4em 0.6em';
            wrapper.setAttribute('data-has-bg', 'true');
        } else {
            target.style.backgroundColor = 'transparent';
            target.style.padding = '0px';
            wrapper.setAttribute('data-has-bg', 'false');
        }
    }

    function updateBorderStyles(content) {
        const target = content || getActiveTextElement();
        if (!target) return;
        const wrapper = target.parentElement;
        if (!wrapper) return;

        const hasBorder = wrapper.dataset.hasBorder === 'true';
        if (hasBorder) {
            const hex = wrapper.dataset.borderColor || '#00e676';
            const weight = parseFloat(wrapper.dataset.borderWeight) || 10;
            const strokePx = Math.max(0.6, weight * 0.25 * editorScale);
            target.style.setProperty('-webkit-text-stroke', `${strokePx}px ${hex}`, 'important');
            target.style.setProperty('paint-order', 'stroke fill', 'important');
            wrapper.setAttribute('data-has-border', 'true');
        } else {
            target.style.removeProperty('-webkit-text-stroke');
            target.style.removeProperty('paint-order');
            wrapper.setAttribute('data-has-border', 'false');
        }
        target.style.textShadow = 'none';
        target.style.border = 'none';
    }

    function updateBorderToolbarUI(wrapper) {
        const hasBorder = wrapper ? wrapper.dataset.hasBorder === 'true' : false;
        if (formatBorderToggle) formatBorderToggle.checked = hasBorder;
        document.querySelectorAll('.border-option-item').forEach(el => el.classList.toggle('hidden', !hasBorder));
        if (borderColorTriggerBtn) borderColorTriggerBtn.classList.toggle('hidden', !hasBorder);

        if (hasBorder && wrapper) {
            if (borderColorTriggerBtn) borderColorTriggerBtn.style.backgroundColor = wrapper.dataset.borderColor || '#00e676';
            const weight = wrapper.dataset.borderWeight || '10';
            const weightInput = document.getElementById('format-border-weight');
            const weightSlider = document.getElementById('slider-border-weight');
            if (weightInput) weightInput.value = weight;
            if (weightSlider) weightSlider.value = weight;
        }
    }

    formatBgToggle.addEventListener('change', () => {
        const show = formatBgToggle.checked;
        document.querySelectorAll('.bg-option-item').forEach(el => el.classList.toggle('hidden', !show));
        bgColorTriggerBtn.classList.toggle('hidden', !show);
        const targetContent = getActiveTextElement();
        if (!targetContent) return;

        targetContent.parentElement.dataset.hasBg = show ? 'true' : 'false';
        if (show && (!targetContent.parentElement.dataset.bgColor || targetContent.parentElement.dataset.bgColor === '#000000')) {
            const tColor = targetContent.style.color ? rgbToHex(targetContent.style.color) : '#000000';
            const oppColor = getContrastColor(tColor);
            targetContent.parentElement.dataset.bgColor = oppColor;
            bgColorTriggerBtn.style.backgroundColor = oppColor;
        }
        updateBgStyles(targetContent);
    });

    if (formatBorderToggle) {
        formatBorderToggle.addEventListener('change', (e) => {
            const targetContent = getActiveTextElement();
            if (!targetContent) { e.target.checked = false; return; }
            const show = e.target.checked;
            const wrapper = targetContent.parentElement;
            wrapper.dataset.hasBorder = show ? 'true' : 'false';

            if (show) {
                if (!wrapper.dataset.borderColor || wrapper.dataset.borderColor === '') {
                    const currentTextCol = targetContent.style.color ? rgbToHex(targetContent.style.color) : '#000000';
                    wrapper.dataset.borderColor = getContrastColor(currentTextCol);
                }
                if (!wrapper.dataset.borderWeight) wrapper.dataset.borderWeight = '10';
            }
            updateBorderToolbarUI(wrapper);
            updateBorderStyles(targetContent);
        });
    }

    btnEditorCancel.addEventListener('click', () => {
        returnFromSubTool();
    });

    btnEditorSave.addEventListener('click', () => {
        if (!selectedPageId) return;
        saveState();
        const stateObj = pagesState.find(p => p.id === selectedPageId);
        stateObj.texts = [];

        const refW = currentImgDrawW || editorCanvas.width || 1;
        const refH = currentImgDrawH || editorCanvas.height || 1;
        const offX = currentImgOffsetX || 0;
        const offY = currentImgOffsetY || 0;

        editorOverlay.querySelectorAll('.text-wrapper').forEach(wrapper => {
            const content = wrapper.querySelector('.text-content');
            let finalOutputText = '';
            if (content.classList.contains('is-list')) {
                const divs = content.querySelectorAll('div');
                divs.forEach((d, idx) => { finalOutputText += d.textContent + (idx < divs.length - 1 ? '\n' : ''); });
            } else {
                finalOutputText = content.innerText.replace(/\r\n/g, '\n');
            }
            if (!finalOutputText.trim()) finalOutputText = 'SArixa';

            const computedFontSizePx = parseFloat(content.style.fontSize) || parseFloat(window.getComputedStyle(content).fontSize) || (24 * editorScale);
            const leftPx = parseFloat(wrapper.style.left) || 0;
            const topPx = parseFloat(wrapper.style.top) || 0;

            stateObj.texts.push({
                text: finalOutputText,
                relToImg: true,
                x: (leftPx - offX) / refW,
                y: (topPx - offY) / refH,
                fontFamily: content.style.fontFamily || 'Arial',
                isBold: content.style.fontWeight === 'bold',
                isItalic: content.style.fontStyle === 'italic',
                isUnderline: content.style.textDecoration.includes('underline'),
                isStrike: content.style.textDecoration.includes('line-through'),
                fontSizeBase: computedFontSizePx / editorScale,
                fontSizeRatio: computedFontSizePx / refW,
                color: content.style.color ? rgbToHex(content.style.color) : '#000000',
                letterSpacing: parseFloat(content.style.letterSpacing) || 0,
                wordSpacing: parseFloat(content.style.wordSpacing) || 0,
                lineGap: parseFloat(content.style.lineHeight) || 1.2,
                align: content.style.textAlign || 'left',
                rotation: parseFloat(wrapper.dataset.rotation) || 0,
                listType: wrapper.dataset.listType || 'none',
                hasBg: wrapper.dataset.hasBg === 'true',
                bgColor: wrapper.dataset.bgColor || '#000000',
                bgOpacity: parseFloat(wrapper.dataset.bgOpacity) || 100,
                bgRadius: parseFloat(wrapper.dataset.bgRadius) || 0,
                hasBorder: wrapper.dataset.hasBorder === 'true',
                borderColor: wrapper.dataset.borderColor || '#00e676',
                borderWeight: parseFloat(wrapper.dataset.borderWeight) || 10,
                boxWidth: content.offsetWidth / editorScale,
                boxHeight: content.offsetHeight / editorScale,
                boxWidthRatio: content.offsetWidth / refW,
                boxHeightRatio: content.offsetHeight / refH
            });
        });

        updateSingleCardBadge(selectedPageId);
        returnFromSubTool();
    });

    // rAF-throttled pointermove for 120Hz mobile touch screens
    let pendingTextPointerX = 0;
    let pendingTextPointerY = 0;

    window.addEventListener('pointermove', (e) => {
        if (!isTextEditingOpen || !activeDragTextWrapper || !textInteractionMode) return;
        pendingTextPointerX = e.clientX;
        pendingTextPointerY = e.clientY;

        if (textInteractionMode === 'move') {
            const dx = pendingTextPointerX - textDragStartX;
            const dy = pendingTextPointerY - textDragStartY;
            if (!textHasDragged && Math.hypot(dx, dy) > 3) {
                textHasDragged = true;
                if (document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('text-content')) {
                    document.activeElement.blur();
                }
            }
            if (!textHasDragged) return;
        }

        if (e.cancelable) e.preventDefault();

        if (textDragRafId) return;
        textDragRafId = requestAnimationFrame(() => {
            textDragRafId = null;
            if (!isTextEditingOpen || !activeDragTextWrapper || !textInteractionMode) return;
            const content = activeDragTextWrapper.querySelector('.text-content');
            if (!content) return;

            if (textInteractionMode === 'move' && textHasDragged) {
                const dx = pendingTextPointerX - textDragStartX;
                const dy = pendingTextPointerY - textDragStartY;
                activeDragTextWrapper.style.left = Math.round(textInitialLeft + dx) + 'px';
                activeDragTextWrapper.style.top = Math.round(textInitialTop + dy) + 'px';
            } else if (textInteractionMode === 'resize') {
                const diff = pendingTextPointerY - textDragStartY;
                const newSize = Math.max(10, textInitialFontSize + diff);
                content.style.fontSize = newSize + 'px';
                if (activeTextContent === content) {
                    const dispSize = Math.round(newSize / editorScale);
                    document.getElementById('format-size').value = dispSize;
                    document.getElementById('slider-size').value = dispSize;
                }
                updateBorderStyles(content);
            } else if (textInteractionMode === 'rotate') {
                const rect = activeDragTextWrapper.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const angle = Math.atan2(pendingTextPointerY - centerY, pendingTextPointerX - centerX);
                const deg = (angle * 180 / Math.PI) - 90;
                activeDragTextWrapper.dataset.rotation = deg;
                activeDragTextWrapper.style.transform = `rotate(${deg}deg)`;
            }
        });
    }, { passive: false });

    const endTextPointerInteraction = () => {
        if (textDragRafId) {
            cancelAnimationFrame(textDragRafId);
            textDragRafId = null;
        }
        activeDragTextWrapper = null;
        textInteractionMode = null;
        textHasDragged = false;
    };
    window.addEventListener('pointerup', endTextPointerInteraction);
    window.addEventListener('pointercancel', endTextPointerInteraction);

    function createTextBox(x, y, txtObj = null, isNew = false) {
        const wrapper = document.createElement('div');
        wrapper.className = 'text-wrapper';
        wrapper.style.left = Math.round(x) + 'px';
        wrapper.style.top = Math.round(y) + 'px';
        wrapper.style.touchAction = 'none';
        wrapper.dataset.rotation = txtObj ? (txtObj.rotation || 0) : 0;
        wrapper.style.transform = `rotate(${wrapper.dataset.rotation}deg)`;
        wrapper.dataset.listType = txtObj && txtObj.listType ? txtObj.listType : 'none';

        if (txtObj && txtObj.hasBg) {
            wrapper.dataset.hasBg = 'true';
            wrapper.dataset.bgColor = txtObj.bgColor;
            wrapper.dataset.bgOpacity = txtObj.bgOpacity;
            wrapper.dataset.bgRadius = txtObj.bgRadius;
        } else {
            wrapper.dataset.hasBg = 'false';
            wrapper.dataset.bgColor = '#000000';
            wrapper.dataset.bgOpacity = '100';
            wrapper.dataset.bgRadius = '0';
        }

        const content = document.createElement('div');
        content.className = 'text-content';
        content.contentEditable = true;
        content.style.touchAction = 'none';

        let defaultTextColor = '#000000';
        const refW = currentImgDrawW || editorCanvas.width || 1;

        if (txtObj) {
            content.style.fontFamily = txtObj.fontFamily;
            content.style.fontWeight = txtObj.isBold ? 'bold' : 'normal';
            content.style.fontStyle = txtObj.isItalic ? 'italic' : 'normal';
            content.style.textDecoration = `${txtObj.isUnderline ? 'underline ' : ''}${txtObj.isStrike ? 'line-through' : ''}`.trim();
            content.style.color = txtObj.color;
            defaultTextColor = txtObj.color;
            const exactFontSizePx = txtObj.fontSizeRatio ? (txtObj.fontSizeRatio * refW) : (txtObj.fontSizeBase * editorScale);
            content.style.fontSize = exactFontSizePx + 'px';
            content.style.letterSpacing = (txtObj.letterSpacing || 0) + 'px';
            content.style.wordSpacing = (txtObj.wordSpacing || 0) + 'px';
            content.style.lineHeight = txtObj.lineGap || 1.2;
            content.style.textAlign = txtObj.align || 'left';

            if (txtObj.listType && txtObj.listType !== 'none') {
                content.classList.add('is-list', `list-${txtObj.listType}`);
                txtObj.text.split('\n').forEach(line => {
                    const lineDiv = document.createElement('div');
                    lineDiv.innerText = line;
                    content.appendChild(lineDiv);
                });
            } else {
                content.innerText = txtObj.text;
            }
        } else {
            content.innerText = "";
            content.setAttribute('data-placeholder', 'SArixa');
            content.style.fontFamily = 'Arial';
            content.style.fontSize = (24 * editorScale) + 'px';
            content.style.letterSpacing = '0px';
            content.style.wordSpacing = '0px';
            content.style.lineHeight = 1.2;
            content.style.textAlign = 'left';
            if (isNew) {
                const avgBg = getAverageRGB(editorCanvas.getContext('2d'), x, y, 100, 30);
                defaultTextColor = getContrastColor(avgBg);
                content.style.color = defaultTextColor;
            } else {
                content.style.color = '#000000';
            }
        }

        if (txtObj && txtObj.hasBorder) {
            wrapper.dataset.hasBorder = 'true';
            wrapper.dataset.borderColor = txtObj.borderColor || '#00e676';
            wrapper.dataset.borderWeight = txtObj.borderWeight || '10';
        } else {
            wrapper.dataset.hasBorder = 'false';
            wrapper.dataset.borderColor = getContrastColor(rgbToHex(defaultTextColor));
            wrapper.dataset.borderWeight = '10';
        }

        const handleDel = document.createElement('div'); handleDel.className = 'text-handle text-handle-delete'; handleDel.style.touchAction = 'none';
        const handleCopy = document.createElement('div'); handleCopy.className = 'text-handle text-handle-copy'; handleCopy.style.touchAction = 'none';
        const handleResize = document.createElement('div'); handleResize.className = 'text-handle text-handle-resize'; handleResize.style.touchAction = 'none';
        const handleRotate = document.createElement('div'); handleRotate.className = 'text-handle text-handle-rotate'; handleRotate.style.touchAction = 'none';

        wrapper.appendChild(content);
        wrapper.appendChild(handleDel);
        wrapper.appendChild(handleCopy);
        wrapper.appendChild(handleResize);
        wrapper.appendChild(handleRotate);
        editorOverlay.appendChild(wrapper);

        updateBgStyles(content);
        updateBorderStyles(content);

        wrapper.addEventListener('pointerdown', (e) => {
            if (e.target.classList.contains('text-handle')) return;
            document.querySelectorAll('.text-wrapper').forEach(w => w.classList.remove('selected'));
            wrapper.classList.add('selected');
            activeTextContent = content;
            updateFormatToolbarUI(content, wrapper);

            activeDragTextWrapper = wrapper;
            textInteractionMode = 'move';
            textHasDragged = false;
            textDragStartX = e.clientX;
            textDragStartY = e.clientY;
            textInitialLeft = parseFloat(wrapper.style.left) || 0;
            textInitialTop = parseFloat(wrapper.style.top) || 0;
        });

        handleResize.addEventListener('pointerdown', (e) => {
            e.stopPropagation(); e.preventDefault();
            activeDragTextWrapper = wrapper;
            textInteractionMode = 'resize';
            textDragStartY = e.clientY;
            textInitialFontSize = parseFloat(content.style.fontSize) || 24;
            if (handleResize.setPointerCapture) {
                try { handleResize.setPointerCapture(e.pointerId); } catch (err) {}
            }
        });

        handleRotate.addEventListener('pointerdown', (e) => {
            e.stopPropagation(); e.preventDefault();
            activeDragTextWrapper = wrapper;
            textInteractionMode = 'rotate';
            if (handleRotate.setPointerCapture) {
                try { handleRotate.setPointerCapture(e.pointerId); } catch (err) {}
            }
        });

        handleDel.addEventListener('pointerdown', (e) => {
            e.stopPropagation(); e.preventDefault();
            wrapper.remove();
            activeTextContent = null;
        });

        handleCopy.addEventListener('pointerdown', (e) => {
            e.stopPropagation(); e.preventDefault();
            const curFontSizePx = parseFloat(content.style.fontSize) || (24 * editorScale);
            const newObj = {
                text: content.innerText,
                fontFamily: content.style.fontFamily,
                isBold: content.style.fontWeight === 'bold',
                isItalic: content.style.fontStyle === 'italic',
                isUnderline: content.style.textDecoration.includes('underline'),
                isStrike: content.style.textDecoration.includes('line-through'),
                fontSizeBase: curFontSizePx / editorScale,
                fontSizeRatio: curFontSizePx / refW,
                color: content.style.color,
                letterSpacing: parseFloat(content.style.letterSpacing) || 0,
                wordSpacing: parseFloat(content.style.wordSpacing) || 0,
                lineGap: parseFloat(content.style.lineHeight) || 1.2,
                align: content.style.textAlign || 'left',
                rotation: parseFloat(wrapper.dataset.rotation) || 0,
                listType: wrapper.dataset.listType || 'none',
                hasBg: wrapper.dataset.hasBg === 'true',
                bgColor: wrapper.dataset.bgColor || '#000000',
                bgOpacity: parseFloat(wrapper.dataset.bgOpacity) || 100,
                bgRadius: parseFloat(wrapper.dataset.bgRadius) || 0,
                hasBorder: wrapper.dataset.hasBorder === 'true',
                borderColor: wrapper.dataset.borderColor || '#00e676',
                borderWeight: parseFloat(wrapper.dataset.borderWeight) || 10
            };
            createTextBox((parseFloat(wrapper.style.left) || x) + 20, (parseFloat(wrapper.style.top) || y) + 40, newObj, false);
        });

        if (isNew || txtObj) {
            document.querySelectorAll('.text-wrapper').forEach(w => w.classList.remove('selected'));
            wrapper.classList.add('selected');
            activeTextContent = content;
            updateFormatToolbarUI(content, wrapper);
        }
    }

    function updateFormatToolbarUI(content, wrapper) {
        let currentFont = (content.style.fontFamily || 'Arial').replace(/['"]/g, '');
        let matched = false;
        Array.from(formatFont.options).forEach(opt => {
            if (opt.value.replace(/['"]/g, '') === currentFont) { formatFont.value = opt.value; matched = true; }
        });
        if (!matched) formatFont.value = 'Arial';

        formatBold.classList.toggle('active', content.style.fontWeight === 'bold');
        formatItalic.classList.toggle('active', content.style.fontStyle === 'italic');
        formatUnderline.classList.toggle('active', content.style.textDecoration.includes('underline'));
        formatStrike.classList.toggle('active', content.style.textDecoration.includes('line-through'));

        colorTriggerBtn.style.backgroundColor = content.style.color || '#000000';

        const setSync = (idInput, idSlider, val) => {
            document.getElementById(idInput).value = val;
            document.getElementById(idSlider).value = val;
        };

        const fontSizePx = parseFloat(content.style.fontSize) || (24 * editorScale);
        setSync('format-size', 'slider-size', Math.round(fontSizePx / editorScale));
        setSync('format-letter-spacing', 'slider-letter-spacing', parseFloat(content.style.letterSpacing) || 0);
        setSync('format-word-spacing', 'slider-word-spacing', parseFloat(content.style.wordSpacing) || 0);
        setSync('format-line-gap', 'slider-line-gap', Math.round((parseFloat(content.style.lineHeight) || 1.2) * 10) / 10);

        alignBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.align === (content.style.textAlign || 'left')));

        if (wrapper) {
            pointerToggle.checked = wrapper.dataset.listType !== 'none';
            pointerStyleSelect.classList.toggle('hidden', !pointerToggle.checked);
            if (pointerToggle.checked) pointerStyleSelect.value = wrapper.dataset.listType;

            const hasBg = wrapper.dataset.hasBg === 'true';
            formatBgToggle.checked = hasBg;
            document.querySelectorAll('.bg-option-item').forEach(el => el.classList.toggle('hidden', !hasBg));
            bgColorTriggerBtn.classList.toggle('hidden', !hasBg);
            if (hasBg) {
                bgColorTriggerBtn.style.backgroundColor = wrapper.dataset.bgColor;
                setSync('format-bg-radius', 'slider-bg-radius', wrapper.dataset.bgRadius);
                setSync('format-bg-opacity', 'slider-bg-opacity', wrapper.dataset.bgOpacity);
            }

            updateBorderToolbarUI(wrapper);
        }
    }

    formatFont.addEventListener('change', () => {
        const target = getActiveTextElement();
        if (target) target.style.fontFamily = formatFont.value;
    });

    alignBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const target = getActiveTextElement();
            if (!target) return;
            const align = btn.dataset.align;
            target.style.textAlign = align;
            alignBtns.forEach(b => b.classList.toggle('active', b.dataset.align === align));
        });
    });

    if (formatBold) {
        formatBold.addEventListener('click', (e) => {
            e.preventDefault();
            const target = getActiveTextElement();
            if (!target) return;
            const isBold = target.style.fontWeight === 'bold';
            target.style.fontWeight = isBold ? 'normal' : 'bold';
            formatBold.classList.toggle('active', !isBold);
        });
    }

    if (formatItalic) {
        formatItalic.addEventListener('click', (e) => {
            e.preventDefault();
            const target = getActiveTextElement();
            if (!target) return;
            const isItalic = target.style.fontStyle === 'italic';
            target.style.fontStyle = isItalic ? 'normal' : 'italic';
            formatItalic.classList.toggle('active', !isItalic);
        });
    }

    if (formatUnderline) {
        formatUnderline.addEventListener('click', (e) => {
            e.preventDefault();
            const target = getActiveTextElement();
            if (!target) return;
            let dec = target.style.textDecoration;
            const hasU = dec.includes('underline');
            target.style.textDecoration = hasU ? dec.replace('underline', '').trim() : (dec + ' underline').trim();
            formatUnderline.classList.toggle('active', !hasU);
        });
    }

    if (formatStrike) {
        formatStrike.addEventListener('click', (e) => {
            e.preventDefault();
            const target = getActiveTextElement();
            if (!target) return;
            let dec = target.style.textDecoration;
            const hasS = dec.includes('line-through');
            target.style.textDecoration = hasS ? dec.replace('line-through', '').trim() : (dec + ' line-through').trim();
            formatStrike.classList.toggle('active', !hasS);
        });
    }

    pointerToggle.addEventListener('change', () => {
        pointerStyleSelect.classList.toggle('hidden', !pointerToggle.checked);
        const target = getActiveTextElement();
        if (!target) return;
        const wrapper = target.parentElement;

        if (pointerToggle.checked) {
            wrapper.dataset.listType = pointerStyleSelect.value || 'bullet';
            target.classList.add('is-list', `list-${wrapper.dataset.listType}`);
            const lines = target.innerText.split('\n');
            target.innerHTML = '';
            lines.forEach(l => { const d = document.createElement('div'); d.innerText = l; target.appendChild(d); });
        } else {
            wrapper.dataset.listType = 'none';
            target.className = 'text-content';
            target.innerHTML = target.innerText;
        }
    });

    pointerStyleSelect.addEventListener('change', () => {
        const target = getActiveTextElement();
        if (!target || !pointerToggle.checked) return;
        const wrapper = target.parentElement;
        wrapper.dataset.listType = pointerStyleSelect.value;
        target.className = `text-content is-list list-${pointerStyleSelect.value}`;
    });

    function hexToRgbPdf(hexOrRgb) {
        const cleanHex = rgbToHex(hexOrRgb);
        let r = 0, g = 0, b = 0;
        if (cleanHex.length === 7) {
            r = parseInt(cleanHex.substring(1, 3), 16);
            g = parseInt(cleanHex.substring(3, 5), 16);
            b = parseInt(cleanHex.substring(5, 7), 16);
        }
        return { r: r / 255, g: g / 255, b: b / 255 };
    }

    // ==========================================
    // 17. PDF EXPORT ENGINE, PREVIEW, DOWNLOAD & SHARE
    // ==========================================
    exportBtn.addEventListener('click', async () => {
        if (pagesState.length === 0) return;

        try {
            exportBtn.disabled = true;
            exportBtn.innerText = 'Processing...';
            exportedPdfBlob = null;
            hideExportResultArea();
            progressContainer.style.display = "block";
            updateProgress(8, "Freeing memory for export...");

            await ResourceManager.suspendPdfJsDocsForExport();
            await yieldToMain();

            if (globalWmToggle && globalWmToggle.checked) {
                const anyHasWm = pagesState.some(p => p.watermark);
                if (!anyHasWm) {
                    const typeVal = wmType ? wmType.value : 'text';
                    if (typeVal === 'text' || (typeVal === 'image' && wmOriginalImageDataUrl)) {
                        const wmCfg = buildCurrentWatermarkConfig();
                        if (wmCfg) {
                            const targets = getTargetPagesForBatchAction();
                            targets.forEach(p => { p.watermark = { ...wmCfg }; });
                        }
                    }
                }
            }

            let pdfBytes;
            if (canExportSingleDocInPlace(pagesState, true)) {
                updateProgress(15, "Optimizing PDF in-place...");
                pdfBytes = await exportPagesInPlaceSingleDoc(pagesState, true, (i, total) => {
                    updateProgress(18 + ((i / total) * 74), `Packing Page ${i + 1} of ${total}...`);
                });
            } else {
                updateProgress(14, "Loading PDF structure...");
                const { PDFDocument, StandardFonts, degrees } = window.PDFLib;
                const newPdf = await PDFDocument.create();
                newPdf.setTitle('SArixa Organized Document');

                let loadedDocs = await loadRequiredPdfLibDocs(pagesState);
                updateProgress(22, "Copying pages in batch...");
                let preCopiedMap = await preCopyOriginalPagesInBatch(newPdf, pagesState, loadedDocs, true);

                let helveticaFont = null;
                if (pagesState.some(st => st && st.pageNumber && st.pageNumber.num)) {
                    helveticaFont = await newPdf.embedFont(StandardFonts.Helvetica);
                }

                const totalCards = pagesState.length;

                for (let i = 0; i < totalCards; i++) {
                    const stateObj = pagesState[i];
                    if (i % 3 === 0) await yieldToMain();

                    const preCopiedPage = preCopiedMap.get(i) || null;
                    const finalPage = await buildPdfPageWithMargins(newPdf, stateObj, loadedDocs, true, preCopiedPage);
                    preCopiedMap.delete(i);

                    let exportRot = (stateObj.visualRotation || 0) % 360;
                    if (exportRot < 0) exportRot += 360;
                    if (exportRot !== 0) {
                        const currentRot = finalPage.getRotation().angle;
                        finalPage.setRotation(degrees(currentRot + exportRot));
                    }

                    const { width, height } = finalPage.getSize();
                    const overlayInfo = await generateCroppedOverlayForPdf(stateObj, width, height);
                    if (overlayInfo) {
                        const pdfOverlayImg = await newPdf.embedPng(overlayInfo.pngBytes);
                        overlayInfo.pngBytes = null;
                        drawCroppedOverlayOnPdfPage(finalPage, pdfOverlayImg, overlayInfo, exportRot);
                    }

                    if (stateObj.pageNumber && stateObj.pageNumber.num) {
                        drawNativePageNumberOnPdfPage(finalPage, stateObj, helveticaFont, exportRot);
                    }

                    updateProgress(22 + ((i / totalCards) * 68), `Packing Page ${i + 1} of ${totalCards}...`);
                }

                preCopiedMap.clear();
                preCopiedMap = null;
                loadedDocs = null;

                updateProgress(94, "Finalizing PDF...");
                await yieldToMain();
                pdfBytes = await newPdf.save({ useObjectStreams: false });
            }

            exportedPdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
            pdfBytes = null;
            updateProgress(100, "Done!");

            setTimeout(() => {
                progressContainer.style.display = "none";

                if (outputBox) {
                    outputBox.style.display = "block";
                    outputBox.innerHTML = `
                        <div class="success-card">
                            <div class="success-header">🎉 Export Successful!</div>
                            <div class="final-size-text">Final Size: ${formatBytes(exportedPdfBlob.size)}</div>
                            <p style="color: #b2ebf2; font-size: 0.95rem; margin: 0;">Your PDF has been organized and modified successfully.</p>
                        </div>
                    `;
                }

                if (finalActionArea) {
                    finalActionArea.style.display = "block";
                    finalActionArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }

                if (shareBtn) shareBtn.disabled = false;
                exportBtn.disabled = false;
                exportBtn.innerText = "Export Again";

                if (window.confetti) {
                    window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#00e676', '#b2ebf2', '#ffffff'] });
                }
                showToast('PDF exported successfully!');
            }, 400);

        } catch (error) {
            console.error(error);
            progressContainer.style.display = "none";
            exportBtn.disabled = false;
            exportBtn.innerText = "Try Again";
            showToast("Error generating the PDF.", "error");
        }
    });

    // Memory-Safe Lazy Scrollable PDF Preview Handler
    if (previewBtn) {
        previewBtn.addEventListener('click', async () => {
            if (!exportedPdfBlob) return;

            if (isExportPreviewOpen) {
                cleanupPreviewResources();
                isExportPreviewOpen = false;
                previewBtn.innerHTML = "Preview PDF";
                return;
            }

            isExportPreviewOpen = true;
            previewBtn.innerHTML = "Close Preview";

            const vContainer = document.createElement('div');
            vContainer.id = 'pdfViewerContainer';
            vContainer.style.cssText = "display: flex; flex-direction: column; gap: 15px; max-height: 60vh; overflow-y: auto; align-items: center; padding: 20px; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(0, 230, 118, 0.3); border-radius: 12px; margin-top: 25px; width: 100%; box-sizing: border-box;";

            finalActionArea.appendChild(vContainer);
            vContainer.innerHTML = "<p style='color:#00e676; font-weight:bold;'>Rendering preview... Please wait.</p>";

            try {
                const arrayBuf = await exportedPdfBlob.arrayBuffer();
                const typedArray = new Uint8Array(arrayBuf);
                const task = pdfjsLib.getDocument({
                    data: typedArray,
                    verbosity: 0,
                    disableAutoFetch: true,
                    disableStream: false
                });
                const pdfDoc = await task.promise;
                activePreviewPdfDoc = pdfDoc;

                vContainer.innerHTML = "";
                const outputScale = DEVICE_PROFILE.previewDpr || Math.min(window.devicePixelRatio || 1, 2.25);
                const totalPages = pdfDoc.numPages;

                const renderPreviewPageCanvas = async (pageNum, canvas) => {
                    if (!isExportPreviewOpen || !activePreviewPdfDoc || canvas.dataset.rendered === 'true') return;
                    canvas.dataset.rendered = 'true';
                    let page = null;
                    try {
                        page = await pdfDoc.getPage(pageNum);
                        const unscaledViewport = page.getViewport({ scale: 1 });
                        const containerWidth = vContainer.clientWidth > 0 ? vContainer.clientWidth - 40 : window.innerWidth - 60;
                        const scale = Math.min(containerWidth / unscaledViewport.width, 1.2);
                        const viewport = page.getViewport({ scale: scale });

                        const ctx = canvas.getContext("2d");
                        canvas.width = Math.floor(viewport.width * outputScale);
                        canvas.height = Math.floor(viewport.height * outputScale);
                        canvas.style.width = Math.floor(viewport.width) + "px";
                        canvas.style.height = Math.floor(viewport.height) + "px";

                        await page.render({
                            canvasContext: ctx,
                            transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
                            viewport: viewport
                        }).promise;
                    } catch (e) {} finally {
                        if (page && page.cleanup) { try { page.cleanup(); } catch (err) {} }
                    }
                };

                const previewObserver = (typeof IntersectionObserver !== 'undefined')
                    ? new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            const c = entry.target;
                            const pNum = parseInt(c.dataset.pageNum, 10);
                            if (entry.isIntersecting) {
                                renderPreviewPageCanvas(pNum, c);
                            } else if (DEVICE_PROFILE.isMobile && c.dataset.rendered === 'true') {
                                releaseCanvasMemory(c);
                                c.dataset.rendered = 'false';
                            }
                        });
                    }, { root: vContainer, rootMargin: '250px 0px', threshold: 0.01 })
                    : null;

                for (let i = 1; i <= totalPages; i++) {
                    if (!isExportPreviewOpen) break;
                    const canvas = document.createElement("canvas");
                    canvas.dataset.pageNum = i;
                    canvas.dataset.rendered = 'false';
                    canvas.width = 1;
                    canvas.height = 1;
                    canvas.style.width = "100%";
                    canvas.style.maxWidth = "560px";
                    canvas.style.minHeight = "260px";
                    canvas.style.border = "1px solid #00e676";
                    canvas.style.borderRadius = "5px";
                    canvas.style.marginBottom = "10px";
                    vContainer.appendChild(canvas);

                    if (previewObserver) {
                        previewObserver.observe(canvas);
                        if (i <= 2) await renderPreviewPageCanvas(i, canvas);
                    } else {
                        await renderPreviewPageCanvas(i, canvas);
                    }
                }
            } catch (err) {
                console.error(err);
                vContainer.innerHTML = "<p style='color:#ff5252;'>Preview failed to load.</p>";
            }
        });
    }

    // Download Handler
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (!exportedPdfBlob) return;

            let name = (fileNameInput && fileNameInput.value.trim()) ? fileNameInput.value.trim() : "sarixa-organized";
            if (!name.toLowerCase().endsWith(".pdf")) name += ".pdf";

            const url = URL.createObjectURL(exportedPdfBlob);
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

    // Native File Share Handler
    if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
            if (!exportedPdfBlob) return showToast("Please export the PDF first!", "error");

            let name = (fileNameInput && fileNameInput.value.trim()) ? fileNameInput.value.trim() : "sarixa-organized";
            if (!name.toLowerCase().endsWith(".pdf")) name += ".pdf";

            const customMessage = "Here is the PDF document I organized & edited securely using *SArixa* (100% Private, Zero Uploads).";
            await sharePdfFile(exportedPdfBlob, name, shareBtn, customMessage);
        });
    }

    function updateProgress(percentage, statusText) {
        progressBar.style.width = `${percentage}%`;
        progressText.innerText = `${Math.round(percentage)}%`;
        if (statusText) progressStatus.innerText = statusText;
    }
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOrganisePdfTool);
} else {
    initOrganisePdfTool();
}