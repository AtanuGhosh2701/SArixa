document.addEventListener("DOMContentLoaded", function() {
    
    // ==========================================
    // 1. Active Link Magic (Highlight current page)
    // ==========================================
    let currentUrl = window.location.href;
    let links = document.querySelectorAll("#nav-links a");

    links.forEach(link => {
        let linkHref = link.getAttribute("href");
        if (currentUrl.endsWith("/") || currentUrl.endsWith("index.html")) {
            if (linkHref === "index.html") link.classList.add("active");
        } else if (currentUrl.includes(linkHref) && linkHref !== "#") {
            link.classList.add("active");
        }
    });


    // ==========================================
    // 2. Bulletproof Hamburger Menu (Mobile Menu)
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
    // 3. Smart Scroll Navbar (Hide on scroll down, show on scroll up)
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