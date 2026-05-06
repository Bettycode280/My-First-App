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
let activeListener = null; 

// ==========================================
// 2. ACTIVE MISSIONS (FIXED: Reliable Switching)
// ==========================================
function displayMissions() {
    const missionList = document.getElementById('mission-list');
    
    // Explicitly toggle button styles
    document.getElementById('tab-active').classList.add('btn-active-style');
    document.getElementById('tab-archive').classList.remove('btn-active-style');

    // Kill any existing listener to prevent "freezing"
    if (activeListener) activeListener();

    missionList.innerHTML = "<p style='text-align:center; padding:20px; color:#00d4ff;'>Linking to Active Stream...</p>";

    // Start a fresh real-time listener
    activeListener = db.collection("missionRequests").orderBy("timestamp", "desc").onSnapshot((querySnapshot) => {
        
        if (!isInitialLoad) {
            querySnapshot.docChanges().forEach((change) => {
                if (change.type === "added") { alert("🚨 NEW MISSION RECEIVED!"); }
            });
        }

        // Final check to ensure we are still on the Active Tab
        if (document.getElementById('tab-active').classList.contains('btn-active-style')) {
            missionList.innerHTML = ""; 
            
            if (querySnapshot.empty) {
                missionList.innerHTML = "<p style='text-align:center; padding:40px; opacity:0.5;'>No active missions.</p>";
                return;
            }

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                missionList.innerHTML += `
                    <div class="mission-card priority-${(data.priority || 'low').toLowerCase()}" style="margin-bottom:12px; padding:15px; background:#1a1a1a; border-radius:8px; border:1px solid #333;">
                        <div style="display:flex; justify-content:space-between; align-items:start;">
                            <div style="width:75%;">
                                <span style="font-weight:bold; color:#00d4ff;">PRIORITY: ${data.priority || 'N/A'}</span>
                                <p style="margin:8px 0; color:white; font-size:1.1rem;">${data.description}</p>
                                <small style="opacity:0.6; color:#888;">Received: ${data.timestamp ? data.timestamp.toDate().toLocaleString() : 'Recent'}</small>
                            </div>
                            <button onclick="deleteMission('${doc.id}')" style="background:#ff4b2b; color:white; border:none; padding:8px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">Complete</button>
                        </div>
                    </div>`;
            }); 
        }
        isInitialLoad = false;
    });
}

// ==========================================
// 3. ARCHIVE DATA (FIXED: Scrollable "Folder" View)
// ==========================================
function showArchiveData() {
    const missionList = document.getElementById('mission-list');
    
    // Explicitly toggle button styles
    document.getElementById('tab-archive').classList.add('btn-active-style');
    document.getElementById('tab-active').classList.remove('btn-active-style');

    // Stop the active listener
    if (activeListener) {
        activeListener();
        activeListener = null;
    }

    missionList.innerHTML = "<p style='text-align:center; padding:20px; color:#aaa;'>Opening Archived Records...</p>";

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
                    <div class="mission-card" style="border-left:4px solid #444; background:#111; margin-bottom:10px; padding:12px; border-radius:6px;">
                        <h3 style="margin:0; color:#888; font-size:0.9rem;">${data.category || 'Mission'} (Completed)</h3>
                        <p style="margin:5px 0; color:#ddd; font-size:1rem;">${data.description}</p>
                        <p style="font-size:0.75rem; color:#555; margin:0;">Archived: ${data.completedAt ? data.completedAt.toDate().toLocaleString() : 'N/A'}</p>
                    </div>`;
            });
        });
}

// ==========================================
// 4. ARCHIVE LOGIC & UI HELPERS
// ==========================================
function deleteMission(missionId) {
    if (!confirm("Move to Archive?")) return;
    const ref = db.collection("missionRequests").doc(missionId);
    ref.get().then(doc => {
        if (doc.exists) {
            db.collection("completedMissions").add({
                ...doc.data(),
                completedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => ref.delete());
        }
    });
}

function checkPass() {
    if (document.getElementById('pass-input').value === '1234') { 
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('admin-ui').style.display = 'block';
        displayMissions();
    } else { alert("Unauthorized"); }
}

// ==========================================
// 5. STAGNANT UI FIX (The Scroll Container)
// ==========================================
window.onload = () => { 
    const missionList = document.getElementById('mission-list');
    if (missionList) {
        // This creates the "Folder" effect: Fixed height with internal scrolling
        missionList.style.height = "65vh"; 
        missionList.style.overflowY = "auto"; 
        missionList.style.overflowX = "hidden";
        missionList.style.padding = "10px";
        missionList.style.border = "1px solid #222";
        missionList.style.background = "rgba(0,0,0,0.2)";
    }
};
