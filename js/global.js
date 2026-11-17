document.addEventListener("DOMContentLoaded", () => {
    // Start the dynamic loading process
    loadComponents();
});

async function loadComponents() {
    try {
        // 1. Load Navbar
        const navPlaceholder = document.getElementById("navbar-placeholder");
        if (navPlaceholder) {
            const navResponse = await fetch('/components/navbar.html');
            navPlaceholder.innerHTML = await navResponse.text();
        }

        // 2. Load Footer
        const footerPlaceholder = document.getElementById("footer-placeholder");
        if (footerPlaceholder) {
            const footerResponse = await fetch('/components/footer.html');
            footerPlaceholder.innerHTML = await footerResponse.text();
        }

        // 3. Initialize Interactive Logic (Only after elements are in the DOM)
        initNavbarLogic();

    } catch (error) {
        console.error("Component load error:", error);
    }
}

function initNavbarLogic() {
    // ==========================================
    // 1. Active Link Magic & Move Active to Top
    // ==========================================
    let currentUrl = window.location.href;
    let links = document.querySelectorAll("#nav-links a");
    let cleanCurrentUrl = currentUrl.split('/').pop().split('?')[0].split('#')[0];
    const navToolsList = document.getElementById("navToolsList");

    links.forEach(link => {
        let linkHref = link.getAttribute("href");
        
        if (!linkHref || linkHref === "#" || linkHref === "javascript:void(0);") return;

        let cleanHref = linkHref.split('/').pop(); 
        
        if (cleanCurrentUrl === "" || cleanCurrentUrl === "index.html") {
            if (cleanHref === "index.html" && !link.classList.contains("dropdown-item")) {
                link.classList.add("active");
            }
        } else if (cleanHref === cleanCurrentUrl) {
            link.classList.add("active");
            
            if (link.classList.contains("dropdown-item")) {
                let toolsBtn = document.getElementById("toolsBtn");
                if (toolsBtn) toolsBtn.classList.add("active");

                // Magic: Move the currently active tool to the TOP of the scrollable list
                if (navToolsList) {
                    navToolsList.prepend(link);
                }
            }
        }
    });

    // ==========================================
    // 1.5. Navbar Search Functionality (Advanced Sorting)
    // ==========================================
    const navSearchInput = document.getElementById("nav-tool-search");
    const navSearchContainer = document.getElementById("navSearchContainer");
    const dropdownItems = Array.from(document.querySelectorAll("#navToolsList .dropdown-item"));

    if (navSearchInput && navSearchContainer) {
        // Prevent dropdown from closing when clicking inside search
        navSearchContainer.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        // Real-time advanced filtering inside nav
        navSearchInput.addEventListener("input", (e) => {
            const term = e.target.value.toLowerCase().trim();

            // Reset display and order if search is empty
            if (!term) {
                dropdownItems.forEach(item => {
                    item.style.display = "flex";
                    item.style.order = "0"; // Reset to default DOM order (keeps active at top)
                });
                return;
            }

            dropdownItems.forEach(item => {
                const title = item.textContent.toLowerCase().trim();
                let score = 0;

                // Weighted Scoring Logic
                if (title === term) {
                    score = 1; // Exact match (Top priority)
                } else if (title.startsWith(term)) {
                    score = 2; // Starts with search term (High priority)
                } else if (title.includes(term)) {
                    score = 3; // Contains search term anywhere (Lower priority)
                }

                // Apply visibility and flex order based on score
                if (score > 0) {
                    item.style.display = "flex";
                    item.style.order = score;
                } else {
                    item.style.display = "none";
                }
            });
        });
    }

    // ==========================================
    // 2. Dropdown Menu Logic
    // ==========================================
    const toolsBtn = document.getElementById('toolsBtn');
    const dropdown = document.querySelector('.dropdown');

    if (toolsBtn && dropdown) {
        toolsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
                
                // Reset nav search when dropdown is closed
                if (navSearchInput) {
                    navSearchInput.value = "";
                    dropdownItems.forEach(item => {
                        item.style.display = "flex";
                        item.style.order = "0";
                    });
                }
            }
        });
    }

    // ==========================================
    // 3. Hamburger Menu (Mobile Menu) & X Icon Morph
    // ==========================================
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.getElementById('nav-links');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function(event) {
            event.stopPropagation(); 
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active'); // Trigger the X animation
        });

        document.addEventListener('click', function(event) {
            if (!navMenu.contains(event.target) && !hamburger.contains(event.target)) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active'); // Revert back to hamburger
            }
        });
    }

    // ==========================================
    // 4. Smart Scroll Navbar
    // ==========================================
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');

    if (navbar) {
        window.addEventListener('scroll', function() {
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (navMenu && navMenu.classList.contains('active')) {
                return;
            }

            if (scrollTop > lastScrollTop && scrollTop > 80) {
                navbar.classList.add('hidden-nav');
            } else {
                navbar.classList.remove('hidden-nav');
            }
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; 
        }, { passive: true });
    }
}

// ==========================================
// DOUBLE BACK TO EXIT / GO HOME (PC & MOBILE)
// ==========================================
(function enableDoubleBackProtection() {
    // Home page-e ei protection bondho rakhar jonno (sudhu tool/inner page-e kaj korbe)
    const path = window.location.pathname;
    if (path === '/' || path.endsWith('/index.html')) return;

    let lastBackPressTime = 0;
    let allowBackNavigation = false;
    const DOUBLE_PRESS_DELAY = 2000; // 2 seconds delay

    // 1. Toast Notification (Warning Message) in English
    function showBackWarningToast() {
        let toast = document.getElementById('double-back-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'double-back-toast';
            Object.assign(toast.style, {
                position: 'fixed',
                bottom: '30px',
                left: '50%',
                transform: 'translateX(-50%) translateY(20px)',
                backgroundColor: '#012f28',
                color: '#ffffff',
                border: '1px solid #00e676',
                padding: '10px 22px',
                borderRadius: '30px',
                fontSize: '0.9rem',
                fontWeight: '600',
                fontFamily: "'Inter', sans-serif",
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.6)',
                zIndex: '999999',
                pointerEvents: 'none',
                opacity: '0',
                transition: 'opacity 0.25s ease, transform 0.25s ease',
                whiteSpace: 'nowrap'
            });
            toast.innerText = '⚠️ Press Back again to go home';
            document.body.appendChild(toast);
        }

        // Show toast
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Hide toast after 2 seconds
        clearTimeout(toast.hideTimer);
        toast.hideTimer = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(20px)';
        }, DOUBLE_PRESS_DELAY);
    }

    // 2. Push dummy history state so the 1st back press doesn't exit immediately
    function pushGuardState() {
        if (!window.history.state || !window.history.state.isBackGuard) {
            window.history.pushState({ isBackGuard: true }, '', window.location.href);
        }
    }

    pushGuardState();

    // Bypass mobile/browser restrictions on first user interaction
    ['pointerdown', 'keydown'].forEach(evt => {
        window.addEventListener(evt, () => {
            pushGuardState();
        }, { once: true, passive: true });
    });

    // 3. Handle Back Button Press (popstate)
    window.addEventListener('popstate', (event) => {
        if (allowBackNavigation) return;

        const currentTime = Date.now();

        // If double clicked / pressed within 2 seconds
        if (currentTime - lastBackPressTime < DOUBLE_PRESS_DELAY) {
            allowBackNavigation = true;
            if (document.referrer && document.referrer.includes(window.location.host)) {
                window.history.back();
            } else {
                window.location.href = '../index.html';
            }
        } else {
            // 1st back press catches the event and shows the English toast
            lastBackPressTime = currentTime;
            window.history.pushState({ isBackGuard: true }, '', window.location.href);
            showBackWarningToast();
        }
    });
})();