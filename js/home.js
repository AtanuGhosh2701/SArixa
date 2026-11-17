/**
 * SArixa Home Page Logic
 */

document.addEventListener("DOMContentLoaded", () => {
    // Dropdown logic has been moved to global.js so it works on all tool pages seamlessly.
    
    // Advanced Search Bar Functionality with Weighted Sorting
    const searchInput = document.getElementById("tool-search");
    const toolCards = Array.from(document.querySelectorAll(".tool-card"));

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();

            // If search is empty, reset display and order to default
            if (!searchTerm) {
                toolCards.forEach(card => {
                    card.style.display = "block";
                    card.style.order = "0";
                });
                return;
            }

            toolCards.forEach(card => {
                const title = card.querySelector("h3").textContent.toLowerCase().trim();
                const desc = card.querySelector("p").textContent.toLowerCase().trim();
                
                let score = 0; // 0 means no match (will be hidden)

                // Weighted Scoring Logic for accuracy (Matches Navbar system)
                if (title === searchTerm) {
                    score = 1; // Exact title match (Highest Priority)
                } else if (title.startsWith(searchTerm)) {
                    score = 2; // Starts with search term (High Priority)
                } else if (title.includes(searchTerm)) {
                    score = 3; // Contains search term in title
                } else if (desc.includes(searchTerm)) {
                    score = 4; // Contains search term in description (Lowest Priority)
                }

                // Apply visibility and dynamic grid order based on score
                if (score > 0) {
                    card.style.display = "block";
                    card.style.order = score; // Smaller number moves to the top of the grid
                } else {
                    card.style.display = "none";
                }
            });
        });
    }
    
    console.log("SArixa Platform Initialized 🚀");
});