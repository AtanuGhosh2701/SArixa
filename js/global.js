document.addEventListener("DOMContentLoaded", function() {
    
    // ==========================================
    // ১. Active Link Magic (পেজ চিনে কালার করা)
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
    // ২. Bulletproof Hamburger Menu (মোবাইল মেনু)
    // ==========================================
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.getElementById('nav-links');

    if (hamburger && navMenu) {
        // হ্যামবার্গারে ক্লিক করলে মেনু খুলবে বা বন্ধ হবে
        hamburger.addEventListener('click', function(event) {
            event.stopPropagation(); // ইভেন্টকে বাইরে যেতে বাধা দেয়
            navMenu.classList.toggle('active');
        });

        // মেনুর বাইরে স্ক্রিনের কোথাও ক্লিক করলে মেনু অটোমেটিক বন্ধ হয়ে যাবে (Pro UX)
        document.addEventListener('click', function(event) {
            if (!navMenu.contains(event.target) && !hamburger.contains(event.target)) {
                navMenu.classList.remove('active');
            }
        });
    }
    
});