
// 1. Your Firebase Configuration (Keep your existing config here)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// 2. Display Active Missions
function displayMissions() {
    const list = document.getElementById('mission-list');
    
    // We listen to the "missionRequests" collection for active tasks
    db.collection("missionRequests").onSnapshot((querySnapshot) => {
        // Only clear and update if we are currently looking at the "Active" tab
        const activeTab = document.getElementById('tab-active');
        if (activeTab && activeTab.classList.contains('btn-active-style')) {
            list.innerHTML = "";
            if (querySnapshot.empty) {
                list.innerHTML = "<p>No active missions. Ready for new requests!</p>";
                return;
            }
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const card = document.createElement('div');
                card.className = `mission-card priority-${data.priority || 'medium'}`;
                card.innerHTML = `
                    <h3>${data.name}</h3>
                    <p><strong>Mission:</strong> ${data.mission}</p>
                    <p><strong>Contact:</strong> ${data.contact || 'Not provided'}</p>
                    <button class="delete-btn" onclick="deleteMission('${doc.id}')">Complete Mission</button>
                `;
                list.appendChild(card);
            });
        }
    });
}

// 3. The Archive Logic (The "Move" instead of "Delete")
function deleteMission(id) {
    if (confirm("Mark this mission as complete and move to Archives?")) {
        const missionRef = db.collection("missionRequests").doc(id);

        // Get the data first
        missionRef.get().then((doc) => {
            if (doc.exists) {
                const missionData = doc.data();
                // Add a completion timestamp
                missionData.completedAt = firebase.firestore.FieldValue.serverTimestamp();

                // Save to Archive
                db.collection("completedMissions").add(missionData)
                    .then(() => {
                        // Once archived, delete from active
                        return missionRef.delete();
                    })
                    .then(() => {
                        alert("Mission safely archived!");
                    })
                    .catch((error) => console.error("Archive error:", error));
            }
        });
    }
}
