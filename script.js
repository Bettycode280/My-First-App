// 1. YOUR UNIQUE FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyDhLq4p_W0ArYVXYHmOZbsuyyvLqWde6js",
  authDomain: "glorywheels-507df.firebaseapp.com",
  projectId: "glorywheels-507df",
  storageBucket: "glorywheels-507df.firebasestorage.app",
  messagingSenderId: "369831733781",
  appId: "1:369831733781:web:a7402fd123de519d7e3c1c",
  measurementId: "G-RJMCECXXZP"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Variables for state management
let isInitialLoad = true;
let activeListener = null; // CRITICAL: This allows the app to switch back and forth

// 2. MISSION CONTROL LISTENER (Active Tab)
function displayMissions() {
    const missionList = document.getElementById('mission-list');
    const activeTab = document.getElementById('tab-active');
    const archiveTab = document.getElementById('tab-archive');

    // UI: Update Tab Styles immediately
    if (activeTab) activeTab.classList.add('btn-active-style');
    if (archiveTab) archiveTab.classList.remove('btn-active-style');

    // FIX: Kill the old listener before starting a new one so it doesn't get stuck
    if (activeListener) {
        activeListener();
    }

    missionList.innerHTML = "<p style='text-align:center; padding:20px; color:#00d4ff;'>Re-establishing Active Link...</p>";

    // Start fresh real-time listener
    activeListener = db.collection("missionRequests").orderBy("timestamp", "desc").onSnapshot((querySnapshot) => {
        
        if (!isInitialLoad) {
            querySnapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    alert("🚨 NEW MISSION RECEIVED!");
                }
            });
        }

        // Only render if the user is still on the Active tab
        if (activeTab && activeTab.classList.contains('btn-active-style')) {
            missionList.innerHTML = ""; 
            
            if (querySnapshot.empty) {
                missionList.innerHTML = "<p style='text-align:center; padding:40px; opacity:0.5;'>No active missions found.</p>";
                return;
            }

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const id = doc.id;
                const priorityClass = data.priority ? data.priority.toLowerCase() : 'low';

                missionList.innerHTML += `
                    <div class="mission-card priority-${priorityClass}" style="margin-bottom:15px; padding:15px; background:#1a1a1a; border-radius:10px;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="width: 75%;">
                                <span style="font-weight: bold; color: #00d4ff;">PRIORITY: ${data.priority || 'N/A'}</span>
                                <p style="font-size: 1.1rem; margin: 10px 0; color: white;">${data.description}</p>
                                <small style="opacity: 0.6;">Received: ${data.timestamp ? data.timestamp.toDate().toLocaleString() : 'Recent'}</small>
                            </div>
                            <button onclick="deleteMission('${id}')" 
                                    style="background:#ff4b2b; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer; font-weight:bold;">
                                Complete
                            </button>
                        </div>
                    </div>
                `;
            }); 
        }
        isInitialLoad = false;
    });
}

// 3. ARCHIVE DATA LOADER
function showArchiveData() {
    const missionList = document.getElementById('mission-list');
    const activeTab = document.getElementById('tab-active');
    const archiveTab = document.getElementById('tab-archive');

    // FIX: Stop the active listener when viewing archives to prevent conflicts
    if (activeListener) {
        activeListener();
        activeListener = null;
    }

    if (archiveTab) archiveTab.classList.add('btn-active-style');
    if (activeTab) activeTab.classList.remove('btn-active-style');

    missionList.innerHTML = "<p style='text-align:center; padding:20px;'>Accessing Archives...</p>";

    db.collection("completedMissions").orderBy("completedAt", "desc").get()
        .then((querySnapshot) => {
            missionList.innerHTML = "";
            if (querySnapshot.empty) {
                missionList.innerHTML = "<p style='text-align:center; padding:20px; opacity:0.5;'>The Archive is empty.</p>";
                return;
            }

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                missionList.innerHTML += `
                    <div class="mission-card" style="border-left: 5px solid #555; background: #111; margin-bottom: 10px; padding: 15px; border-radius: 8px;">
                        <h3 style="margin:0; color:#aaa; font-size:0.9rem;">${data.category || 'Mission'} (Completed)</h3>
                        <p style="margin:10px 0; color: white;">${data.description}</p>
                        <p style="font-size:0.8rem; color:#666;">Archived: ${data.completedAt ? data.completedAt.toDate().toLocaleString() : 'Date Unknown'}</p>
                    </div>
                `;
            });
        });
}

// 4. MOVE TO ARCHIVE FUNCTION
function deleteMission(id) {
    if (confirm("Mark this mission as complete?")) {
        const missionRef = db.collection("missionRequests").doc(id);
        missionRef.get().then((doc) => {
            if (doc.exists) {
                const missionData = doc.data();
                missionData.completedAt = firebase.firestore.FieldValue.serverTimestamp();
                db.collection("completedMissions").add(missionData)
                    .then(() => missionRef.delete())
                    .then(() => alert("Mission Archived!"));
            }
        });
    }
}

// 5. STAGNANT UI & NAVIGATION
window.onload = () => { 
    const missionList = document.getElementById('mission-list');
    if (missionList) {
        // FIX: Makes the mission list a scrollable "folder" while keeping head stagnant
        missionList.style.height = "68vh"; 
        missionList.style.overflowY = "auto";
        displayMissions(); 
    }
};

function checkPass() {
    const code = document.getElementById('pass-input').value;
    if (code === '1234') { 
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('admin-ui').style.display = 'block';
        window.scrollTo(0, 0); 
        displayMissions();
    } else {
        alert("Unauthorized Access");
    }
}
