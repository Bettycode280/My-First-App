
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

// 2. REAL-TIME LISTENER
function displayMissions() {
    const list = document.getElementById('mission-list');
    
    // This addresses the Connectivity Hypothesis by staying 'awake' for new missions
    db.collection("missionRequests").onSnapshot((querySnapshot) => {
        
        // BUG FIX: We check if we are on the Active tab. 
        // If the button isn't found, we show missions anyway so you don't lose data!
        const activeTab = document.getElementById('tab-active');
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
                
                // Detailed card view
                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <h3 style="margin:0; color:#00d4ff;">${data.name}</h3>
                            <p style="margin:5px 0;"><strong>Mission:</strong> ${data.mission}</p>
                            <p style="margin:5px 0; font-size:0.9em;"><strong>Contact:</strong> ${data.contact || 'N/A'}</p>
                        </div>
                    </div>
                    <button class="delete-btn" onclick="deleteMission('${doc.id}')" style="width:100%; margin-top:15px; background:#ff4b2b; color:white; border:none; padding:10px; border-radius:5px; font-weight:bold;">
                        Complete & Archive
                    </button>
                `;
                list.appendChild(card);
            });

            // Trigger an alert if a brand new mission arrives
            querySnapshot.docChanges().forEach((change) => {
                if (change.type === "added" && !querySnapshot.metadata.hasPendingWrites) {
                    console.log("New Mission Alert!");
                    // Optional: alert("New Mission Received!");
                }
            });
        }
    }, (error) => {
        console.error("Database connection lost:", error);
    });
}

// 3. ARCHIVE LOGIC
function deleteMission(id) {
    if (confirm("Move this mission to the permanent Archives?")) {
        const missionRef = db.collection("missionRequests").doc(id);

        missionRef.get().then((doc) => {
            if (doc.exists) {
                const missionData = doc.data();
                // This addresses the Data Retention Hypothesis
                missionData.completedAt = firebase.firestore.FieldValue.serverTimestamp();

                db.collection("completedMissions").add(missionData)
                    .then(() => {
                        return missionRef.delete();
                    })
                    .then(() => {
                        alert("Mission stored in Archive.");
                    })
                    .catch((error) => alert("Error: " + error));
            }
        });
    }
}
