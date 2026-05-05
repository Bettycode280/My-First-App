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

// Variable to track if the very first load is finished
let isInitialLoad = true;

// 2. REAL-TIME LISTENER & ALERT SYSTEM
function displayMissions() {
    const list = document.getElementById('mission-list');
    
    db.collection("missionRequests").onSnapshot((querySnapshot) => {
        
        // --- IMPROVED ALERT LOGIC ---
        if (!isInitialLoad) {
            querySnapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    // This will now trigger a popup on your phone for every new mission
                    alert("🚨 NEW MISSION RECEIVED!");
                    
                    // Optional: Play a sound if you have one
                    console.log("New data arrived!");
                }
            });
        }

        // --- UI DISPLAY LOGIC ---
        const activeTab = document.getElementById('tab-active');
        const isArchiveSelected = activeTab && activeTab.classList.contains('btn-inactive-style');

        if (!isArchiveSelected) {
            list.innerHTML = ""; 

            if (querySnapshot.empty) {
                list.innerHTML = "<p style='text-align:center; padding:20px; opacity:0.5;'>No active missions. Standing by...</p>";
            } else {
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const card = document.createElement('div');
                    card.className = "mission-card";
                    card.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <div>
                                <h3 style="margin:0; color:#00d4ff;">${data.name}</h3>
                                <p style="margin:5px 0;"><strong>Mission:</strong> ${data.mission}</p>
                                <p style="margin:5px 0; font-size:0.9em;"><strong>Contact:</strong> ${data.contact || 'N/A'}</p>
                            </div>
                        </div>
                        <button class="delete-btn" onclick="deleteMission('${doc.id}')" style="width:100%; margin-top:15px; background:#ff4b2b; color:white; border:none; padding:12px; border-radius:8px; font-weight:bold;">
                            Complete & Archive
                        </button>
                    `;
                    list.appendChild(card);
                });
            }
        }
        
        // After the first check, set load to false so future additions trigger alerts
        isInitialLoad = false;
        
    }, (error) => {
        console.error("Connection Error:", error);
    });
}

// 3. ARCHIVE LOGIC
function deleteMission(id) {
    if (confirm("Move this mission to the permanent Archives?")) {
        const missionRef = db.collection("missionRequests").doc(id);

        missionRef.get().then((doc) => {
            if (doc.exists) {
                const missionData = doc.data();
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
