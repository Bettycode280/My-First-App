
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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 2. MISSION NEEDS FUNCTION
async function addTask() {
    const input = document.getElementById("taskInput");
    const category = document.getElementById("categorySelect").value;
    const priority = document.getElementById("prioritySelect").value;
    
    if (input.value.trim() !== "") {
        try {
            // This sends the data directly to the Firestore screen you see now!
            await db.collection("missionRequests").add({
                category: category,
                description: input.value,
                priority: priority,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: "New"
            });
            
            alert("Success! Request sent to Beatrice.");
            input.value = "";
        } catch (error) {
            console.error("Error sending: ", error);
            alert("Failed to send. Please try again.");
        }
    }
}

// 3. CREATE ACCOUNT FUNCTION
async function handleCreateAccount(e) {
    if(e) e.preventDefault();
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPass").value;

    try {
        await db.collection("users").add({
            email: email,
            password: password,
            createdAt: new Date()
        });
        alert("Account Created! You can now log in.");
        switchView('loginView');
    } catch (error) {
        alert("Error: " + error.message);
    }
}

// 4. NAVIGATION
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    const target = document.getElementById(viewId);
    if(target) target.style.display = 'block';
}

window.onload = () => { 
    console.log("GloryWheels is connected to Firebase!");
    switchView('homeView'); 
};
// --- ADMIN VIEW FUNCTIONS ---

function displayMissions() {
    const missionList = document.getElementById('mission-list');
    
    // Listen to Firebase for ANY changes in real-time
    db.collection("missionRequests").orderBy("timestamp", "desc").onSnapshot((querySnapshot) => {
        missionList.innerHTML = ""; // Clear current list
        
        if (querySnapshot.empty) {
            missionList.innerHTML = "<p>No active missions found.</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const id = doc.id;

            missionList.innerHTML += `
                <div class="mission-card priority-${data.priority ? data.priority.toLowerCase() : 'low'}">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div>
                            <span style="font-weight: bold; color: #00d4ff;">PRIORITY: ${data.priority || 'N/A'}</span>
                            <p style="font-size: 1.2rem; margin: 10px 0;">${data.description}</p>
                            <small style="opacity: 0.6;">Received: ${data.timestamp ? data.timestamp.toDate().toLocaleString() : 'Recent'}</small>
                        </div>
                        <button class="delete-btn" onclick="deleteMission('${id}')">Complete</button>
                    </div>
                </div>
            `;
        });
    });
}

function deleteMission(id) {
    if (confirm("Mark this mission as complete and move to Archives?")) {
        const missionRef = db.collection("missionRequests").doc(id);

        // 1. Get the data from the active mission
        missionRef.get().then((doc) => {
            if (doc.exists) {
                const missionData = doc.data();
                
                // Add a "Completed At" timestamp so you know when it happened
                missionData.completedAt = firebase.firestore.FieldValue.serverTimestamp();

                // 2. Save it into the Archive folder (completedMissions)
                db.collection("completedMissions").add(missionData)
                    .then(() => {
                        console.log("Mission safely archived!");
                        // 3. Now it is safe to delete from the active list
                        return missionRef.delete();
                    })
                    .then(() => {
                        alert("Mission Accomplished and Archived!");
                    })
                    .catch((error) => {
                        console.error("Error archiving mission: ", error);
                    });
            }
        }).catch((error) => {
            console.error("Error finding mission: ", error);
        });
    }
}


