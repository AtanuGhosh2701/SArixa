import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// ==========================================
// RATING HTML TEMPLATE (Direct Injection - No Fetch needed!)
// ==========================================
const ratingHTMLTemplate = `
<div id="rating-reminder-bar" class="reminder-bar">
    <span>Enjoying SArixa? Give a quick rating ⭐</span>
    <button id="open-reminder-btn" aria-label="Rate SArixa Application">Rate Now</button>
</div>

<div id="rating-popup" class="popup-overlay">
    <div class="popup-content">
        <span id="close-popup-top" class="close-btn" aria-label="Close rating popup" role="button" tabindex="0">&times;</span>
        
        <div id="rating-step-1">
            <h3 id="rating-title">Did SArixa save your time? ❤️</h3>
            <div id="stars" class="rating-stars" aria-label="Rate SArixa from 1 to 5 stars">
                <span data-value="1" aria-label="1 Star" role="button" tabindex="0">☆</span>
                <span data-value="2" aria-label="2 Stars" role="button" tabindex="0">☆</span>
                <span data-value="3" aria-label="3 Stars" role="button" tabindex="0">☆</span>
                <span data-value="4" aria-label="4 Stars" role="button" tabindex="0">☆</span>
                <span data-value="5" aria-label="5 Stars" role="button" tabindex="0">☆</span>
            </div>
        </div>

        <div id="rating-step-happy" style="display: none;">
            <h3 style="margin-bottom: 5px;">You just saved time using SArixa ❤️ Help your friends too!</h3>
            <p style="color: #b2ebf2; font-size: 0.9rem; margin-bottom: 15px;">Share with your friends 🚀</p>
            <div class="share-btns">
                <a id="whatsapp-share-btn" href="#" target="_blank" class="whatsapp-btn" aria-label="Share via WhatsApp">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="vertical-align: middle; margin-right: 5px;" aria-hidden="true">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                    WhatsApp Share
                </a>
                <button id="copy-link-btn" class="popup-btn popup-btn-green" style="margin: 0;" aria-label="Copy website link">Copy Link</button>
            </div>
        </div>

        <div id="rating-step-sad" style="display: none;">
            <h3 style="margin-bottom: 5px;">Thanks for your feedback 🙏</h3>
            <p style="color: #b2ebf2; font-size: 0.9rem; margin-bottom: 10px;">What can we improve?</p>
            <textarea id="feedback-text" placeholder="Tell us about any bugs or feature ideas..." aria-label="Enter your feedback here"></textarea>
            <button id="btn-submit-feedback" class="popup-btn popup-btn-green" style="margin-top: 10px; width: 100%;" aria-label="Submit feedback">Submit</button>
            <p style="color: #9be7d8; font-size: 0.8rem; margin-top: 10px;">We’re constantly improving SArixa ❤️</p>
        </div>

        <div id="rating-success-state" class="rating-success-state" style="display: none;">
            <svg class="success-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" aria-hidden="true">
                <circle class="success-circle" cx="26" cy="26" r="25" fill="none"/>
                <path class="success-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <h3 class="rating-success-title" style="margin-top: 15px;">Thank You!</h3>
        </div>
    </div>
</div>
`;

// ==========================================
// INJECTION & INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const placeholder = document.getElementById("rating-placeholder");
    
    if (placeholder) {
        // Direct injection (No fetch error possible!)
        placeholder.innerHTML = ratingHTMLTemplate;
        initRatingSystem();
    }
});

function initRatingSystem() {
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

    const toolPath = window.location.pathname.split('/').pop().replace('.html', '');
    const trackingType = toolPath ? `${toolPath}_rating` : 'general_rating';

    let selectedRating = 0;
    const popup = document.getElementById('rating-popup');
    const closeTopBtn = document.getElementById('close-popup-top');
    const stars = document.querySelectorAll('#stars span');

    const step1 = document.getElementById('rating-step-1');
    const stepHappy = document.getElementById('rating-step-happy');
    const stepSad = document.getElementById('rating-step-sad');
    const successState = document.getElementById('rating-success-state');

    const copyLinkBtn = document.getElementById('copy-link-btn');
    const btnSubmitFeedback = document.getElementById('btn-submit-feedback');
    const feedbackText = document.getElementById('feedback-text');

    const reminderBar = document.getElementById('rating-reminder-bar');
    const openReminderBtn = document.getElementById('open-reminder-btn');

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
        
        stars.forEach(s => { 
            s.innerHTML = '☆'; 
            s.style.color = '#555';
            s.classList.remove('selected');
        });
    };

    const completeClose = () => {
        popup.style.display = 'none';
        if (!localStorage.getItem('hasSubmittedSarixaRating')) {
            localStorage.setItem('sarixaRatingDismissed', 'true');
            if(reminderBar) reminderBar.style.display = 'flex'; 
        }
        setTimeout(resetPopupUI, 500);
    };

    if(closeTopBtn) closeTopBtn.addEventListener('click', completeClose);

    stars.forEach(star => {
      star.addEventListener('click', function() {
        selectedRating = parseInt(this.getAttribute('data-value'));

        stars.forEach(s => {
          const sVal = parseInt(s.getAttribute('data-value'));
          s.innerHTML = (sVal <= selectedRating) ? '⭐' : '☆';
          s.style.color = (sVal <= selectedRating) ? '#ffc107' : '#555';
          if(sVal <= selectedRating) s.classList.add('selected');
          else s.classList.remove('selected');
        });

        push(ref(database, 'sarixa_ratings'), {
            rating: selectedRating,
            timestamp: Date.now(),
            type: trackingType 
        });

        localStorage.setItem('hasSubmittedSarixaRating', 'true');
        if(reminderBar) reminderBar.style.display = 'none'; 

        setTimeout(() => {
            step1.style.display = 'none';
            if(selectedRating >= 4) {
                stepHappy.style.display = 'block';
                // 🔥 UPDATED EXCITING WHATSAPP SHARE MESSAGE 🔥
                const shareText = "Hey! 👋 I just found this amazing free PDF tool called SArixa. It lets you compress, merge, or convert PDFs instantly. Best part? It's 100% private and offline, so our files are safe. Thought you might need this! Check it out here: https://sarixa-tools.vercel.app/ ✨";
                document.getElementById('whatsapp-share-btn').href = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
            } else {
                stepSad.style.display = 'block';
            }
        }, 400); 
      });
    });

    if(copyLinkBtn) {
        copyLinkBtn.addEventListener('click', () => {
            navigator.clipboard.writeText("https://sarixa-tools.vercel.app/");
            copyLinkBtn.innerText = "Copied! ✔";
            setTimeout(() => { completeClose(); }, 1500);
        });
    }

    if(btnSubmitFeedback) {
        btnSubmitFeedback.addEventListener('click', () => {
            const feedback = feedbackText.value.trim();
            btnSubmitFeedback.innerText = "Sending...";
            
            push(ref(database, 'sarixa_feedback'), {
                rating: selectedRating,
                feedback: feedback || "No text provided",
                timestamp: Date.now(),
                type: trackingType
            }).then(() => {
                stepSad.style.display = 'none';
                successState.style.display = 'flex';
                setTimeout(completeClose, 2500);
            }).catch(err => {
                console.error(err);
                completeClose();
            });
        });
    }

    if(openReminderBtn) {
        openReminderBtn.addEventListener('click', () => {
            popup.style.display = 'flex';
            if(reminderBar) reminderBar.style.display = 'none'; 
        });
    }

    window.triggerGlobalRatingPopup = function() {
        const hasSubmitted = localStorage.getItem('hasSubmittedSarixaRating');
        if (!hasSubmitted) {
            let count = parseInt(localStorage.getItem('sarixaDownloadCount') || '0');
            count++;
            localStorage.setItem('sarixaDownloadCount', count.toString());

            if (count === 2 || (count >= 5 && count % 5 === 0)) {
                if (popup) popup.style.display = 'flex';
                if (reminderBar) reminderBar.style.display = 'none';
            }
        }
    };
}