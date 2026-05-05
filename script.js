
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

// Variable to manage the initial data pull so the alert doesn't fire for old missions
let isInitialLoad = true;

// 2. MISSION CONTROL LISTENER (Real-time Alerts & Active Tab)
function displayMissions() {
    const missionList = document.getElementById('mission-list');
    
    // Listen to Firebase for ANY changes in real-time
    db.collection("missionRequests").orderBy("timestamp", "desc").onSnapshot((querySnapshot) => {
        
        // --- EMERGENCY ALERT LOGIC ---
        if (!isInitialLoad) {
            querySnapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    alert("🚨 NEW MISSION RECEIVED!");
                }
            });
        }

        const activeTab = document.getElementById('tab-active');
        // Only update the screen if the "Active" tab is currently selected
        if (activeTab && activeTab.classList.contains('btn-active-style')) {
            missionList.innerHTML = ""; 
            
            if (querySnapshot.empty) {
                missionList.innerHTML = "<p style='text-align:center; padding:40px; opacity:0.5;'>No active missions found.</p>";
                return;
            }

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const id = doc.id;

                // Priority color logic
                const priorityClass = data.priority ? data.priority.toLowerCase() : 'low';

                missionList.innerHTML += `
                    <div class="mission-card priority-${priorityClass}">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="width: 80%;">
                                <span style="font-weight: bold; color: #00d4ff;">PRIORITY: ${data.priority || 'N/A'}</span>
                                <p style="font-size: 1.2rem; margin: 10px 0; color: white;">${data.description}</p>
                                <small style="opacity: 0.6;">Received: ${data.timestamp ? data.timestamp.toDate().toLocaleString() : 'Recent'}</small>
                            </div>
                            <button class="delete-btn" onclick="deleteMission('${id}')" 
                                    style="background:#ff4b2b; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer; font-weight:bold;">
                                Complete
                            </button>
                        </div>
                    </div>
                `;
            });
        }
        isInitialLoad = false;
    }, (error) => {
        console.error("Connection Error: ", error);
    });
}

// 3. ARCHIVE DATA LOADER (For the Archive Tab)
function showArchiveData() {
    const missionList = document.getElementById('mission-list');
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
                    <div class="mission-card" style="border-left-color: #555;">
                        <h3 style="margin:0; color:#aaa;">${data.category || 'Mission'} (Completed)</h3>
                        <p style="margin:10px 0; color: white;">${data.description}</p>
                        <p style="font-size:0.8rem; color:#666;">Archived: ${data.completedAt ? data.completedAt.toDate().toLocaleString() : 'Date Unknown'}</p>
                    </div>
                `;
            });
        })
        .catch((error) => {
            console.error("Error loading archive: ", error);
            missionList.innerHTML = "<p>Error loading records.</p>";
        });
}

// 4. MOVE TO ARCHIVE FUNCTION
function deleteMission(id) {
    if (confirm("Mark this mission as complete and move to Archives?")) {
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
                        alert("Mission Accomplished and Archived!");
                    })
                    .catch((error) => {
                        console.error("Archive Error: ", error);
                        alert("Failed to archive mission.");
                    });
            }
        });
    }
}

// 5. NAVIGATION & INITIALIZATION
window.onload = () => { 
    console.log("GloryWheels Admin is Connected!");
    // If we are on the admin page, start listening immediately
    if (document.getElementById('mission-list')) {
        displayMissions(); 
    }
};

