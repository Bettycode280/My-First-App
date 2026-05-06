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

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.firestore();
let isInitialLoad = true;
let unsubscribeActiveMissions = null; 

// 2. MISSION CONTROL LISTENER (Active Tab)
function displayMissions() {
    const missionList = document.getElementById('mission-list');
    const activeTab = document.getElementById('tab-active');
    const archiveTab = document.getElementById('tab-archive');

    if (activeTab) activeTab.classList.add('btn-active-style');
    if (archiveTab) archiveTab.classList.remove('btn-active-style');

    if (unsubscribeActiveMissions) {
        unsubscribeActiveMissions();
        unsubscribeActiveMissions = null;
    }

    missionList.innerHTML = "<p style='text-align:center; padding:20px; color:#00d4ff;'>Syncing Active Missions...</p>";

    unsubscribeActiveMissions = db.collection("missionRequests")
        .orderBy("timestamp", "desc")
        .onSnapshot((querySnapshot) => {
            if (!isInitialLoad) {
                querySnapshot.docChanges().forEach((change) => {
                    if (change.type === "added") { alert("🚨 NEW MISSION RECEIVED!"); }
                });
            }

            if (activeTab && activeTab.classList.contains('btn-active-style')) {
                missionList.innerHTML = ""; 
                if (querySnapshot.empty) {
                    missionList.innerHTML = "<p style='text-align:center; padding:40px; opacity:0.5;'>No active missions found.</p>";
                    return;
                }

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const priorityClass = data.priority ? data.priority.toLowerCase() : 'low';
                    missionList.innerHTML += `
                        <div class="mission-card priority-${priorityClass}" style="margin-bottom:15px; padding:15px; background:#1a1a1a; border-radius:10px; border-left: 6px solid;">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div style="width: 70%;">
                                    <span style="font-weight: bold; color: #00d4ff;">PRIORITY: ${data.priority || 'NORMAL'}</span>
                                    <p style="font-size: 1.1rem; margin: 10px 0; color: white;">${data.description}</p>
                                    <small style="opacity: 0.5;">Received: ${data.timestamp ? data.timestamp.toDate().toLocaleString() : 'Recent'}</small>
                                </div>
                                <button onclick="deleteMission('${doc.id}')" style="background:#ff4b2b; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer; font-weight:bold;">Complete</button>
                            </div>
                        </div>`;
                }); 
            }
            isInitialLoad = false;
        });
}

// 3. ARCHIVE DATA LOADER (With Wipe Option)
function showArchiveData() {
    const missionList = document.getElementById('mission-list');
    const activeTab = document.getElementById('tab-active');
    const archiveTab = document.getElementById('tab-archive');

    if (unsubscribeActiveMissions) {
        unsubscribeActiveMissions();
        unsubscribeActiveMissions = null;
    }

    if (archiveTab) archiveTab.classList.add('btn-active-style');
    if (activeTab) activeTab.classList.remove('btn-active-style');

    missionList.innerHTML = "<p style='text-align:center; padding:20px; color:#aaa;'>Retrieving Archives...</p>";

    db.collection("completedMissions").orderBy("completedAt", "desc").get()
        .then((querySnapshot) => {
            missionList.innerHTML = "";
            
            // Add Wipe Button at the top of the archive list
            if (!querySnapshot.empty) {
                missionList.innerHTML = `
                    <div style="text-align:right; margin-bottom:15px;">
                        <button onclick="wipeAllArchives()" style="background:transparent; color:#ff4b2b; border:1px solid #ff4b2b; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:0.8rem;">
                            Empty Archive Folder
                        </button>
                    </div>
                `;
            } else {
                missionList.innerHTML = "<p style='text-align:center; padding:20px; opacity:0.5;'>The Archive is empty.</p>";
                return;
            }

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                missionList.innerHTML += `
                    <div class="mission-card" style="border-left: 5px solid #444; background: #111; margin-bottom: 10px; padding: 12px; border-radius: 8px;">
                        <h3 style="margin:0; color:#00d4ff; font-size:0.9rem;">COMPLETED MISSION</h3>
                        <p style="margin:8px 0; color: #ddd; font-size: 1rem;">${data.description}</p>
                        <p style="font-size:0.75rem; color:#555; margin: 0;">Archived: ${data.completedAt ? data.completedAt.toDate().toLocaleString() : 'Date Unknown'}</p>
                    </div>`;
            });
        });
}

// 4. DELETE LOGIC (Individual & Mass Wipe)
function deleteMission(id) {
    if (confirm("Move this mission to Archives?")) {
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

// Function to delete everything in the archive
async function wipeAllArchives() {
    if (confirm("🚨 WARNING: This will permanently delete ALL archived records. Are you sure?")) {
        const snapshot = await db.collection("completedMissions").get();
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        alert("Archive cleared successfully.");
        showArchiveData(); // Refresh the view
    }
}

// 5. INITIALIZATION
window.onload = () => { 
    const missionList = document.getElementById('mission-list');
    if (missionList) {
        missionList.style.maxHeight = "70vh"; 
        missionList.style.overflowY = "auto";
        displayMissions(); 
    }
};

function checkPass() {
    if (document.getElementById('pass-input').value === '1234') { 
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('admin-ui').style.display = 'block';
        window.scrollTo(0, 0); 
        displayMissions();
    } else { alert("Unauthorized"); }
}
