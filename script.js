
// 1. YOUR FIREBASE CONFIG (KEEP YOUR ACTUAL KEYS HERE)
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

// 2. THE REAL-TIME LISTENER (Addresses the Connectivity Hypothesis)
function displayMissions() {
    const list = document.getElementById('mission-list');
    
    // We use .onSnapshot so it PINGS the second a new request hits the database
    db.collection("missionRequests").onSnapshot((querySnapshot) => {
        
        // Ensure we only draw this if the "Active" tab is selected
        const activeTab = document.getElementById('tab-active');
        if (activeTab && activeTab.classList.contains('btn-active-style')) {
            list.innerHTML = ""; 

            if (querySnapshot.empty) {
                list.innerHTML = "<p style='text-align:center; padding:20px; opacity:0.5;'>No active missions. Standing by...</p>";
                return;
            }

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const card = document.createElement('div');
                card.className = "mission-card";
                
                // Add back the full details and the Archive button
                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <h3 style="margin:0; color:#00d4ff;">${data.name}</h3>
                            <p style="margin:5px 0;"><strong>Mission:</strong> ${data.mission}</p>
                            <p style="margin:5px 0; font-size:0.9em;"><strong>Contact:</strong> ${data.contact || 'N/A'}</p>
                        </div>
                    </div>
                    <button class="delete-btn" onclick="deleteMission('${doc.id}')" style="width:100%; margin-top:15px;">
                        Complete & Archive
                    </button>
                `;
                list.appendChild(card);
            });
        }
    }, (error) => {
        console.error("Database connection lost:", error);
    });
}

// 3. THE ARCHIVE LOGIC (Addresses the Data Retention Hypothesis)
function deleteMission(id) {
    if (confirm("Move this mission to the permanent Archives?")) {
        const missionRef = db.collection("missionRequests").doc(id);

        missionRef.get().then((doc) => {
            if (doc.exists) {
                const missionData = doc.data();
                missionData.completedAt = firebase.firestore.FieldValue.serverTimestamp();

                // Step A: Copy to Archive
                db.collection("completedMissions").add(missionData)
                    .then(() => {
                        // Step B: Delete from Active only after Step A succeeds
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
