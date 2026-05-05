
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
