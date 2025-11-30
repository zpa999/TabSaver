# TabSaver Chrome Extension - 크롬웹스토어 배포 전...

## Overview
TabSaver is a Chrome extension that allows you to save your current open tabs as a session, restore them later, and track your daily browsing history.

## Features
- **Save Session**: Save all tabs in the current window with a custom name.
- **Restore Session**: Open a saved session in a new window.
- **Daily History**: Automatically tracks visited pages and saves them by date.
- **Export History**: Download your browsing history as a CSV file.

## Installation (Developer Mode)
1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select the `TabSaver` folder.

## Deployment to Chrome Web Store
1. **Prepare Icons**:
   - You need to add icon files to the `icons` folder:
     - `icon16.png` (16x16)
     - `icon48.png` (48x48)
     - `icon128.png` (128x128)
   - Update `manifest.json` to reference these icons if they are not already linked (currently they are not linked in the manifest, you should add them).

2. **Update Manifest**:
   - Add the `icons` field to `manifest.json`:
     ```json
     "icons": {
       "16": "icons/icon16.png",
       "48": "icons/icon48.png",
       "128": "icons/icon128.png"
     }
     ```

3. **Package**:
   - Zip the contents of the `TabSaver` folder (excluding `.git` or other dev files).
   - The `TabSaver.zip` file created in this folder is ready for upload (once you add icons).

4. **Upload**:
   - Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
   - Click **New Item** and upload the ZIP file.
   - Fill in the store listing details, screenshots, and privacy policy.

## Privacy Policy
This extension stores data locally using `chrome.storage.local`. No data is sent to external servers.
