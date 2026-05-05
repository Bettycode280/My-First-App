// 1. FIREBASE CONFIGURATION
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// 2. REAL-TIME LISTENER & ALERT SYSTEM
function displayMissions() {
    const list = document.getElementById('mission-list');
    
    // This addresses the Connectivity Hypothesis by staying 'awake' for updates
    db.collection("missionRequests").onSnapshot((querySnapshot) => {
        
        // --- EMERGENCY ALERT LOGIC ---
        // This triggers even if you are looking at the Archive tab
        querySnapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                // Ignore old missions already in the database when you first log in
                if (!querySnapshot.metadata.hasPendingWrites) {
                    alert("🚨 NEW MISSION RECEIVED!"); 
                    console.log("New mission detected:", change.doc.data().name);
                }
            }
        });

        // --- UI DISPLAY LOGIC ---
        const activeTab = document.getElementById('tab-active');
        // Check if we are currently viewing the Archive
        const isArchiveSelected = activeTab && activeTab.classList.contains('btn-inactive-style');

        if (!isArchiveSelected) {
            list.innerHTML = ""; 

            if (querySnapshot.empty) {
                list.innerHTML = "<p style='text-align:center; padding:20px; opacity:0.5;'>No active missions. Standing by...</p>";
                return;
            }

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const card = document.createElement('div');
                card.className = "mission-card";
                
                // Full data display including Contact info
                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <h3 style="margin:0; color:#00d4ff;">${data.name}</h3>
                            <p style="margin:5px 0;"><strong>Mission:</strong> ${data.mission}</p>
                            <p style="margin:5px 0; font-size:0.9em;"><strong>Contact:</strong> ${data.contact || 'N/A'}</p>
                        </div>
                    </div>
                    <button class="delete-btn" onclick="deleteMission('${doc.id}')" style="width:100%; margin-top:15px; background:#ff4b2b; color:white; border:none; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer;">
                        Complete & Archive
                    </button>
                `;
                list.appendChild(card);
            });
        }
    }, (error) => {
        console.error("Critical Connection Error:", error);
    });
}

// 3. ARCHIVE LOGIC (Data Retention Hypothesis)
function deleteMission(id) {
    if (confirm("Move this mission to the permanent Archives?")) {
        const missionRef = db.collection("missionRequests").doc(id);

        missionRef.get().then((doc) => {
            if (doc.exists) {
                const missionData = doc.data();
                // Add a completion date for your records
                missionData.completedAt = firebase.firestore.FieldValue.serverTimestamp();

                // Step A: Store in Archive
                db.collection("completedMissions").add(missionData)
                    .then(() => {
                        // Step B: Only delete if Step A was successful
                        return missionRef.delete();
                    })
                    .then(() => {
                        alert("Mission stored in Archive.");
                    })
                    .catch((error) => {
                        console.error("Archive Failed:", error);
                        alert("Error saving to archive. Mission remains active.");
                    });
            }
        });
    }
}
