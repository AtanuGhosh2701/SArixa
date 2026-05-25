document.addEventListener("DOMContentLoaded", function() {
    
    // ==========================================
    // 1. Active Link Magic (Highlight current page)
    // ==========================================
    let currentUrl = window.location.href;
    let links = document.querySelectorAll("#nav-links a");

    // Clean URL to get exact file name (e.g., "img-to-pdf.html")
    let cleanCurrentUrl = currentUrl.split('/').pop().split('?')[0].split('#')[0];

    links.forEach(link => {
        let linkHref = link.getAttribute("href");
        
        // Skip empty or trigger links
        if (!linkHref || linkHref === "#" || linkHref === "javascript:void(0);") return;

        // Clean href to match with current URL
        let cleanHref = linkHref.split('/').pop(); 
        
        if (cleanCurrentUrl === "" || cleanCurrentUrl === "index.html") {
            // Only highlight main Home link, not dropdown items
            if (cleanHref === "index.html" && !link.classList.contains("dropdown-item")) {
                link.classList.add("active");
            }
        } else if (cleanHref === cleanCurrentUrl) {
            link.classList.add("active");
            
            // If the active link is inside the dropdown, also keep the main "Tools" button active!
            if (link.classList.contains("dropdown-item")) {
                let toolsBtn = document.getElementById("toolsBtn");
                if (toolsBtn) toolsBtn.classList.add("active");
            }
        }
    });

    // ==========================================
    // 2. Dropdown Menu Logic (Moved to global so it works everywhere)
    // ==========================================
    const toolsBtn = document.getElementById('toolsBtn');
    const dropdown = document.querySelector('.dropdown');

    if (toolsBtn && dropdown) {
        toolsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });

        // Close Dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }

    // ==========================================
    // 3. Bulletproof Hamburger Menu (Mobile Menu)
    // ==========================================
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.getElementById('nav-links');

    if (hamburger && navMenu) {
        // Toggle menu on hamburger click
        hamburger.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent event from bubbling to document
            navMenu.classList.toggle('active');
        });

        // Close menu automatically when clicking outside (Pro UX)
        document.addEventListener('click', function(event) {
            if (!navMenu.contains(event.target) && !hamburger.contains(event.target)) {
                navMenu.classList.remove('active');
            }
        });
    }

    // ==========================================
    // 4. Smart Scroll Navbar (Hide on scroll down, show on scroll up)
    // ==========================================
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');

    if (navbar) {
        window.addEventListener('scroll', function() {
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Do not hide navbar if mobile menu is open
            if (navMenu && navMenu.classList.contains('active')) {
                return;
            }

            // Apply animation only after scrolling down 80px
            if (scrollTop > lastScrollTop && scrollTop > 80) {
                // Scroll Down -> Hide navbar
                navbar.classList.add('hidden-nav');
            } else {
                // Scroll Up -> Show navbar
                navbar.classList.remove('hidden-nav');
            }
            
            // Prevent negative scrolling values on mobile (bounce effect)
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; 
        }, { passive: true }); // Optimized for smooth scrolling performance
    }
    
});