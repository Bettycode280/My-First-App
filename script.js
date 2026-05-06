// 1. FIREBASE CONFIGURATION
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

// Global State Management
let isInitialLoad = true;
let unsubscribeActiveMissions = null; // The "Reset Switch" for tab switching

// 2. MISSION CONTROL LISTENER (Active Tab)
function displayMissions() {
    const missionList = document.getElementById('mission-list');
    const activeTab = document.getElementById('tab-active');
    const archiveTab = document.getElementById('tab-archive');

    // UI: Update button styles
    if (activeTab) activeTab.className = 'toggle-btn btn-active-style';
    if (archiveTab) archiveTab.className = 'toggle-btn btn-inactive-style';

    // CRITICAL FIX: Kill previous listener to prevent the "Dead Tab" bug
    if (unsubscribeActiveMissions) {
        unsubscribeActiveMissions();
        unsubscribeActiveMissions = null;
    }

    missionList.innerHTML = "<p style='text-align:center; padding:20px; color:#00d4ff;'>Establishing Secure Link...</p>";

    // Start real-time listener
    unsubscribeActiveMissions = db.collection("missionRequests").orderBy("timestamp", "desc").onSnapshot((querySnapshot) => {
        
        // Alert Logic for New Entries
        if (!isInitialLoad) {
            querySnapshot.docChanges().forEach((change) => {
                if (change.type === "added") { alert("🚨 NEW MISSION RECEIVED!"); }
            });
        }

        // Only render if user is on the Active tab
        if (activeTab && activeTab.classList.contains('btn-active-style')) {
            missionList.innerHTML = ""; 
            
            if (querySnapshot.empty) {
                missionList.innerHTML = "<p style='text-align:center; padding:40px; opacity:0.5;'>No active missions found.</p>";
                return;
            }

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const id = doc.id;
                const priorityClass = (data.priority || 'low').toLowerCase();

                // Addresses Hypothesis: Show arrival time and priority color
                missionList.innerHTML += `
                    <div class="mission-card priority-${priorityClass}" style="margin-bottom:15px; padding:18px; background:#1a3a4a; border-radius:12px; border-left: 8px solid;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="width: 75%;">
                                <span style="font-weight: bold; color: #00d4ff; text-transform: uppercase;">PRIORITY: ${data.priority || 'Normal'}</span>
                                <p style="font-size: 1.2rem; margin: 10px 0; color: white; font-weight: 500;">${data.description}</p>
                                <small style="opacity: 0.6; color: #aaa;">Received: ${data.timestamp ? data.timestamp.toDate().toLocaleString() : 'Recent'}</small>
                            </div>
                            <button onclick="deleteMission('${id}')" 
                                    style="background:#ff4b2b; color:white; border:none; padding:12px; border-radius:8px; cursor:pointer; font-weight:bold; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                                Complete
                            </button>
                        </div>
                    </div>
                `;
            }); 
        }
        isInitialLoad = false;
    }, (error) => {
        console.error("Firebase Error:", error);
        missionList.innerHTML = "<p style='color:red; text-align:center;'>Connection Error. Refresh Page.</p>";
    });
}

// 3. ARCHIVE DATA LOADER (Folder View with Delete Option)
function showArchiveData() {
    const missionList = document.getElementById('mission-list');
    const activeTab = document.getElementById('tab-active');
    const archiveTab = document.getElementById('tab-archive');

    // Stop active listener to free up memory
    if (unsubscribeActiveMissions) {
        unsubscribeActiveMissions();
        unsubscribeActiveMissions = null;
    }

    if (archiveTab) archiveTab.className = 'toggle-btn btn-active-style';
    if (activeTab) activeTab.className = 'toggle-btn btn-inactive-style';

    // UI: Add the "Wipe Archive" button at the top
    missionList.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding:10px; border-bottom:1px solid #00d4ff33;">
            <span style="color:#00d4ff; font-weight:bold;">COMPLETED HISTORY</span>
            <button onclick="wipeAllArchives()" style="background:transparent; color:#ff4b2b; border:1px solid #ff4b2b; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:0.8rem;">
                EMPTY ARCHIVE
            </button>
        </div>
        <div id="archive-items-list">Loading Archived Files...</div>
    `;

    db.collection("completedMissions").orderBy("completedAt", "desc").get()
        .then((querySnapshot) => {
            const container = document.getElementById('archive-items-list');
            container.innerHTML = "";
            
            if (querySnapshot.empty) {
                container.innerHTML = "<p style='text-align:center; padding:20px; opacity:0.5;'>The Archive is empty.</p>";
                return;
            }

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // Addresses Hypothesis: Show completion time
                container.innerHTML += `
                    <div class="mission-card" style="border-left: 5px solid #555; background: #0d2530; margin-bottom: 12px; padding: 15px; border-radius: 10px; opacity: 0.9;">
                        <h3 style="margin:0; color:#888; font-size:0.9rem; text-transform: uppercase;">Closed Mission</h3>
                        <p style="margin:10px 0; color: #eee; font-size: 1rem;">${data.description}</p>
                        <p style="font-size:0.75rem; color:#555; margin: 0;">Finalized: ${data.completedAt ? data.completedAt.toDate().toLocaleString() : 'N/A'}</p>
                    </div>
                `;
            });
        });
}

// 4. ARCHIVE ACTIONS (Archive Single & Wipe All)
function deleteMission(id) {
    if (confirm("Mark as complete and move to Archive?")) {
        const missionRef = db.collection("missionRequests").doc(id);
        missionRef.get().then((doc) => {
            if (doc.exists) {
                const missionData = doc.data();
                missionData.completedAt = firebase.firestore.FieldValue.serverTimestamp();
                
                db.collection("completedMissions").add(missionData)
                    .then(() => missionRef.delete())
                    .then(() => alert("Mission successfully moved to archives."));
            }
        });
    }
}

async function wipeAllArchives() {
    if (confirm("🚨 DANGER: This will permanently delete ALL archived mission history. Continue?")) {
        try {
            const snapshot = await db.collection("completedMissions").get();
            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            alert("Archive has been successfully emptied.");
            showArchiveData(); // Refresh view
        } catch (error) {
            console.error("Wipe error:", error);
            alert("Error clearing archives.");
        }
    }
}

// 5. SECURITY & UI INITIALIZATION
function checkPass() {
    const input = document.getElementById('pass-input');
    if (input.value === '1234') { 
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('admin-ui').style.display = 'flex';
        
        // Reset scroll and start
        window.scrollTo(0, 0); 
        displayMissions();
    } else {
        alert("Access Denied: Unauthorized Personnel Only.");
    }
}

window.onload = () => { 
    const missionList = document.getElementById('mission-list');
    if (missionList) {
        // Fix for Stagnant Header: Make the list container take up the space and scroll internally
        missionList.style.height = "calc(100vh - 200px)"; 
        missionList.style.overflowY = "auto";
        // Pre-load if already authed or for structural setup
    }
};
