# AutoJobr Chrome Extension

## Quick Setup

1. **Download Extension**: Save the entire `/extension/` folder to your computer
2. **Install Extension**: 
   - Open Chrome → `chrome://extensions/`
   - Enable "Developer mode" 
   - Click "Load unpacked" → Select the extension folder
3. **Configure API URL**: 
   - Edit `background.js` line 14
   - Replace with your AutoJobr web app URL
4. **Login**: Sign into AutoJobr web app first
5. **Use Extension**: Click the AutoJobr icon on any job board

## Supported Job Boards
- LinkedIn (EasyApply)
- Indeed  
- Workday
- Greenhouse
- Lever
- iCIMS
- Glassdoor
- Monster
- ZipRecruiter
- SmartRecruiters
- Jobvite
- BambooHR

## Features
- Auto-fill application forms
- Real-time job match scoring
- Missing skills analysis
- Application tracking
- Profile sync with web app

## Troubleshooting
If the extension shows "Not logged in":
1. Open your AutoJobr web app and sign in
2. Refresh the extension (go to chrome://extensions/ and click refresh)
3. Test connection at `/extension/connection-test.html`

The extension syncs with your AutoJobr account for seamless job application automation.