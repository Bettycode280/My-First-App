// ==========================================
// 1. FIREBASE CONFIGURATION
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDhLq4p_W0ArYVXYHmOZbsuyyvLqWde6js",
  authDomain: "glorywheels-507df.firebaseapp.com",
  projectId: "glorywheels-507df",
  storageBucket: "glorywheels-507df.firebasestorage.app",
  messagingSenderId: "369831733781",
  appId: "1:369831733781:web:a7402fd123de519d7e3c1c",
  measurementId: "G-RJMCECXXZP"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
let isInitialLoad = true;
let activeListener = null; // Track the listener so we can stop/start it

// ==========================================
// 2. ACTIVE MISSIONS (With Fix for Switching)
// ==========================================
function displayMissions() {
    const missionList = document.getElementById('mission-list');
    const activeTab = document.getElementById('tab-active');
    const archiveTab = document.getElementById('tab-archive');

    // UI: Update Tab Styles
    if (activeTab) activeTab.classList.add('btn-active-style');
    if (archiveTab) archiveTab.classList.remove('btn-active-style');

    // Clean up any old listener before starting a new one
    if (activeListener) activeListener();

    missionList.innerHTML = "<p style='text-align:center; padding:20px; color:#00d4ff;'>Connecting to Command...</p>";

    activeListener = db.collection("missionRequests").orderBy("timestamp", "desc").onSnapshot((querySnapshot) => {
        
        if (!isInitialLoad) {
            querySnapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    alert("🚨 NEW MISSION RECEIVED!");
                }
            });
        }

        // Only update if we are still on the Active tab
        if (activeTab && activeTab.classList.contains('btn-active-style')) {
            missionList.innerHTML = ""; 
            
            if (querySnapshot.empty) {
                missionList.innerHTML = "<p style='text-align:center; padding:40px; opacity:0.5;'>No active missions.</p>";
                return;
            }

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const id = doc.id;
                const priorityClass = data.priority ? data.priority.toLowerCase() : 'low';

                missionList.innerHTML += `
                    <div class="mission-card priority-${priorityClass}" style="margin-bottom: 15px; padding: 15px; border-radius: 10px; background: #1a1a1a; border: 1px solid #333;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="width: 75%;">
                                <span style="font-weight: bold; color: #00d4ff;">PRIORITY: ${data.priority || 'N/A'}</span>
                                <p style="font-size: 1.1rem; margin: 10px 0; color: white;">${data.description}</p>
                                <small style="opacity: 0.6; color: #888;">Received: ${data.timestamp ? data.timestamp.toDate().toLocaleString() : 'Recent'}</small>
                            </div>
                            <button onclick="deleteMission('${id}')" style="background:#ff4b2b; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer; font-weight:bold;">Complete</button>
                        </div>
                    </div>`;
            }); 
        }
        isInitialLoad = false;
    }, (error) => {
        console.error("Link Error: ", error);
        missionList.innerHTML = "<p style='color:red; text-align:center;'>Link Broken.</p>";
    });
}

// ==========================================
// 3. ARCHIVE DATA LOADER
// ==========================================
function showArchiveData() {
    const missionList = document.getElementById('mission-list');
    const activeTab = document.getElementById('tab-active');
    const archiveTab = document.getElementById('tab-archive');

    // UI: Update Tab Styles
    if (archiveTab) archiveTab.classList.add('btn-active-style');
    if (activeTab) activeTab.classList.remove('btn-active-style');

    // Stop the active listener to save data/prevent conflicts
    if (activeListener) {
        activeListener();
        activeListener = null;
    }

    missionList.innerHTML = "<p style='text-align:center; padding:20px; color:#aaa;'>Accessing Records...</p>";

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
                    <div class="mission-card" style="border-left: 5px solid #555; background: #111; margin-bottom: 15px; padding: 15px; border-radius: 10px;">
                        <h3 style="margin:0; color:#00d4ff; font-size: 0.9rem;">${data.category || 'Mission'} (Completed)</h3>
                        <p style="margin:10px 0; color: white; font-size: 1.1rem;">${data.description}</p>
                        <p style="font-size:0.75rem; color:#666; margin: 0;">Archived: ${data.completedAt ? data.completedAt.toDate().toLocaleString() : 'N/A'}</p>
                    </div>`;
            });
        });
}

// ==========================================
// 4. ARCHIVE ACTION (The "Complete" Function)
// ==========================================
function deleteMission(missionId) {
    if (!confirm("Mark as accomplished?")) return;
    const missionRef = db.collection("missionRequests").doc(missionId);

    missionRef.get().then((doc) => {
        if (doc.exists) {
            db.collection("completedMissions").add({
                ...doc.data(),
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                return missionRef.delete();
            }).then(() => {
                alert("Mission Archived!");
            });
        }
    });
}

// ==========================================
// 5. LOGIN & UI INITIALIZATION
// ==========================================
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

window.onload = () => { 
    // FIXED: Ensure Header is Visible and List is Stagnant
    const adminUI = document.getElementById('admin-ui');
    const missionList = document.getElementById('mission-list');
    
    if (adminUI) {
        adminUI.style.position = "relative";
        adminUI.style.zIndex = "10";
    }

    if (missionList) {
        missionList.style.height = "70vh"; // Fixed height
        missionList.style.overflowY = "auto"; // Scrollable list
        missionList.style.marginTop = "20px";
    }
};
