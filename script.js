document.addEventListener('DOMContentLoaded', function () {
    const tg = window.Telegram.WebApp;
    tg.expand();

    // Firebase Configuration (আপনার নিজের কনফিগ ব্যবহার করুন)
    const firebaseConfig = {
        apiKey: "AIzaSyCWgG5KdYFoqHPLe53765BfsNQ8-pxGme8",
        authDomain: "telegam-5ea9f.firebaseapp.com",
        projectId: "telegam-5ea9f",
        databaseURL: "https://telegam-5ea9f-default-rtdb.firebaseio.com", // Add your databaseURL
        storageBucket: "telegam-5ea9f.firebasestorage.app",
        messagingSenderId: "393475568911",
        appId: "1:393475568911:web:b7fdb4ebb3d3be03df3a7a"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    
    // !!! আপনার Railway অ্যাপের URL এখানে দিন !!!
    const BACKEND_URL = 'https://your-railway-app-name.up.railway.app'; 

    const user = tg.initDataUnsafe?.user;
    
    if (!user) {
        document.body.innerHTML = "<h1>Please open this app through Telegram.</h1>";
        return;
    }
    
    const userId = user.id;
    const userRef = database.ref('users/' + userId);

    // DOM Elements
    const pages = document.querySelectorAll('.page');
    const navButtons = document.querySelectorAll('.nav-btn');
    const balanceDisplay = document.getElementById('balance-display');
    const watchAdBtn = document.getElementById('watch-ad-btn');

    // --- User Data Handling ---
    userRef.on('value', (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
            updateUI(userData);
        } else {
            console.log("User data not found, probably a new user.");
        }
    });

    function updateUI(data) {
        // General
        balanceDisplay.innerText = data.balance || 0;
        document.getElementById('user-greeting').innerText = `Hello, ${data.first_name || user.first_name}!`;

        // Account Page
        document.getElementById('account-name').innerText = data.first_name || user.first_name;
        document.getElementById('account-username').innerText = `@${data.username || user.username}`;
        document.getElementById('account-uid').innerText = userId;
        document.getElementById('account-balance').innerText = data.balance || 0;

        // Task Page
        const adsWatched = data.ads_watched_today || 0;
        const dailyLimit = 400;
        document.getElementById('watched-ads').innerText = adsWatched;
        document.getElementById('remaining-ads').innerText = dailyLimit - adsWatched;
        
        if (adsWatched >= dailyLimit) {
            watchAdBtn.innerText = "Daily Limit Reached";
            watchAdBtn.disabled = true;
        } else {
            watchAdBtn.innerText = "Watch Ad (100 Coins)";
            watchAdBtn.disabled = false;
        }
    }

    // --- Navigation ---
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.getAttribute('data-page');
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
        });
    });

    // --- Ad Watching Logic ---
    watchAdBtn.addEventListener('click', () => {
        watchAdBtn.disabled = true;
        watchAdBtn.innerText = "Loading Ad...";

        // Call Monetag SDK
        show_9604026().then(() => {
            // Ad watched successfully, now reward the user securely
            rewardUserForAd();
        }).catch(error => {
            console.error('Ad could not be shown:', error);
            alert('Ad failed to load. Please try again.');
            watchAdBtn.disabled = false; // Re-enable button
        });
    });
    
    async function rewardUserForAd() {
        try {
            const response = await fetch(`${BACKEND_URL}/reward_ad`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initData: tg.initData }) // Send initData for server-side verification
            });
            const result = await response.json();

            if (response.ok) {
                alert(result.message); // e.g., "You have been rewarded 100 coins!"
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            // The UI will update automatically via the firebase listener.
            // We just re-enable the button if needed.
            userRef.once('value', (snapshot) => {
                const userData = snapshot.val();
                if (userData.ads_watched_today < 400) {
                     watchAdBtn.disabled = false;
                }
            });
        }
    }

    // Referral Link Button
    document.getElementById('referral-link-btn').addEventListener('click', () => {
       const referralLink = `https://t.me/YOUR_BOT_USERNAME?start=${userId}`;
       tg.showPopup({
           title: 'Your Referral Link',
           message: `Share this link with your friends: ${referralLink}`,
           buttons: [{ type: 'ok' }]
       });
    });
});
