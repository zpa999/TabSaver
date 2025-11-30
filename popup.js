// Popup Logic
console.log("TabSaver Popup Loaded");

document.addEventListener('DOMContentLoaded', () => {
    // Tab Switching Logic
    const tabSessions = document.getElementById('tab-sessions');
    const tabHistory = document.getElementById('tab-history');
    const viewSessions = document.getElementById('view-sessions');
    const viewHistory = document.getElementById('view-history');

    tabSessions.addEventListener('click', () => {
        tabSessions.classList.add('active');
        tabHistory.classList.remove('active');
        viewSessions.classList.remove('hidden');
        viewHistory.classList.add('hidden');
    });

    tabHistory.addEventListener('click', () => {
        tabHistory.classList.add('active');
        tabSessions.classList.remove('active');
        viewHistory.classList.remove('hidden');
        viewSessions.classList.add('hidden');
        loadDailyHistory(); // Load history when tab is clicked
    });

    // Session Management Logic
    document.getElementById('btn-save').addEventListener('click', saveCurrentTabs);
    document.getElementById('btn-export').addEventListener('click', exportHistory);

    // Initial Load
    loadSessions();
});

function saveCurrentTabs() {
    const nameInput = document.getElementById('session-name');
    const sessionName = nameInput.value.trim() || new Date().toLocaleString();

    chrome.tabs.query({ currentWindow: true }, (tabs) => {
        const session = {
            id: Date.now(),
            name: sessionName,
            date: new Date().toISOString(),
            tabs: tabs.map(tab => ({ url: tab.url, title: tab.title, favIconUrl: tab.favIconUrl }))
        };

        chrome.storage.local.get(['sessions'], (result) => {
            const sessions = result.sessions || [];
            sessions.unshift(session); // Add to top
            chrome.storage.local.set({ sessions: sessions }, () => {
                nameInput.value = ''; // Clear input
                loadSessions(); // Reload list
            });
        });
    });
}

function loadSessions() {
    const listContainer = document.getElementById('session-list');

    chrome.storage.local.get(['sessions'], (result) => {
        const sessions = result.sessions || [];
        listContainer.innerHTML = ''; // Clear current list

        if (sessions.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">No saved sessions yet.</div>';
            return;
        }

        sessions.forEach(session => {
            const item = document.createElement('div');
            item.className = 'session-item';

            const tabCount = session.tabs.length;
            const dateStr = new Date(session.date).toLocaleString();

            item.innerHTML = `
        <div class="session-header">
          <span class="session-title">${session.name}</span>
          <span class="session-meta">${tabCount} tabs</span>
        </div>
        <div class="session-meta">${dateStr}</div>
        <div class="session-actions">
          <button class="btn-restore" data-id="${session.id}">Restore</button>
          <button class="btn-edit" data-id="${session.id}">Edit</button>
          <button class="btn-delete" data-id="${session.id}">Delete</button>
        </div>
      `;

            listContainer.appendChild(item);
        });

        // Add event listeners to buttons
        document.querySelectorAll('.btn-restore').forEach(btn => {
            btn.addEventListener('click', (e) => restoreSession(parseInt(e.target.dataset.id)));
        });
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => editSession(parseInt(e.target.dataset.id)));
        });
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => deleteSession(parseInt(e.target.dataset.id)));
        });
    });
}

function editSession(sessionId) {
    chrome.storage.local.get(['sessions'], (result) => {
        const sessions = result.sessions || [];
        const sessionIndex = sessions.findIndex(s => s.id === sessionId);

        if (sessionIndex !== -1) {
            const newName = prompt("Enter new session name:", sessions[sessionIndex].name);
            if (newName && newName.trim() !== "") {
                sessions[sessionIndex].name = newName.trim();
                chrome.storage.local.set({ sessions: sessions }, () => {
                    loadSessions();
                });
            }
        }
    });
}

function restoreSession(sessionId) {
    chrome.storage.local.get(['sessions'], (result) => {
        const sessions = result.sessions || [];
        const session = sessions.find(s => s.id === sessionId);

        if (session && session.tabs.length > 0) {
            const urls = session.tabs.map(t => t.url);
            chrome.windows.create({ url: urls });
        }
    });
}

function deleteSession(sessionId) {
    if (!confirm("Are you sure you want to delete this session?")) return;

    chrome.storage.local.get(['sessions'], (result) => {
        let sessions = result.sessions || [];
        sessions = sessions.filter(s => s.id !== sessionId);

        chrome.storage.local.set({ sessions: sessions }, () => {
            loadSessions();
        });
    });
}

function loadDailyHistory() {
    const listContainer = document.getElementById('history-list');
    const today = new Date().toISOString().split('T')[0];
    const key = `history_${today}`;

    chrome.storage.local.get([key], (result) => {
        const history = result[key] || [];
        listContainer.innerHTML = '';

        if (history.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">No history recorded today.</div>';
            return;
        }

        // Reverse to show newest first
        const reversedHistory = [...history].reverse();

        reversedHistory.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';

            const timeStr = new Date(item.time).toLocaleTimeString();

            div.innerHTML = `
        <div class="session-header">
          <span class="session-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">
            <a href="${item.url}" target="_blank" style="text-decoration: none; color: inherit;">${item.title || item.url}</a>
          </span>
          <span class="session-meta">${timeStr}</span>
        </div>
        <div class="session-meta" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.url}</div>
      `;
            listContainer.appendChild(div);
        });
    });
}

function exportHistory() {
    chrome.storage.local.get(null, (items) => {
        const historyKeys = Object.keys(items).filter(k => k.startsWith('history_'));
        let allHistory = [];

        historyKeys.forEach(key => {
            const date = key.replace('history_', '');
            const dayHistory = items[key].map(h => ({ ...h, date }));
            allHistory = allHistory.concat(dayHistory);
        });

        if (allHistory.length === 0) {
            alert("No history to export.");
            return;
        }

        // Convert to CSV
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Date,Time,Title,URL\n"
            + allHistory.map(e => {
                const title = (e.title || "").replace(/"/g, '""'); // Escape quotes
                return `${e.date},${new Date(e.time).toLocaleTimeString()},"${title}","${e.url}"`;
            }).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "tabsaver_history.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}
