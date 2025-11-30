// Background Service Worker
console.log("TabSaver Background Worker Started");

// Listener for tab updates to track history
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
        console.log("Tab updated:", tab.url);
        saveToDailyHistory(tab);
    }
});

function saveToDailyHistory(tab) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = `history_${today}`;

    chrome.storage.local.get([key], (result) => {
        let history = result[key] || [];

        // Create new entry
        const newEntry = {
            url: tab.url,
            title: tab.title,
            time: new Date().toISOString(),
            favIconUrl: tab.favIconUrl
        };

        // Optional: Check for duplicates to avoid spamming the same URL?
        // For now, let's just push everything to see the flow.
        history.push(newEntry);

        chrome.storage.local.set({ [key]: history }, () => {
            console.log(`Saved to ${key}:`, newEntry.title);
        });
    });
}
