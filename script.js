function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    const target = document.getElementById(viewId);
    if(target) target.style.display = 'block';
    
    // Safety: Pause videos when moving away
    if(viewId !== 'aboutView') {
        document.querySelectorAll('video').forEach(v => v.pause());
    }
}

function startClock() {
    setInterval(() => {
        const clock = document.getElementById('liveClock');
        if(clock) clock.innerText = new Date().toLocaleTimeString();
    }, 1000);
}

function addTask() {
    const input = document.getElementById("taskInput");
    const category = document.getElementById("categorySelect").value;
    const priority = document.getElementById("prioritySelect").value;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (input.value.trim() !== "") {
        const list = document.getElementById("taskList");
        const li = document.createElement("li");
        li.style.borderLeftColor = (priority === 'Critical' ? '#ef4444' : '#10b981');
        
        li.innerHTML = `
            <div style="flex:1">
                <span style="color:#D4AF37; font-weight:900; font-size:0.65rem; letter-spacing:1px;">${category.toUpperCase()}</span>
                <div style="margin:5px 0;">${input.value}</div>
                <small style="color:#94a3b8;">${priority} • ${time}</small>
            </div>
            <button onclick="this.parentElement.remove(); updateDashboard();" style="background:none; border:none; color:#ef4444; font-weight:bold; cursor:pointer;">✕</button>
        `;
        list.prepend(li);
        updateDashboard();
        input.value = "";
    }
}

function updateDashboard() {
    const total = document.querySelectorAll("#taskList li").length;
    const crit = document.querySelectorAll("#taskList li[style*='rgb(239, 68, 68)']").length;
    document.getElementById("totalCount").innerText = `${total} Impacted`;
    document.getElementById("criticalCount").innerText = `${crit} Critical`;
}

window.onload = () => { 
    startClock(); 
    updateDashboard();
};