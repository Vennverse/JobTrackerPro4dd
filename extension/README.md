# AutoJobr Chrome Extension

The AutoJobr Chrome Extension is a powerful companion to the AutoJobr web application that automates job application form filling, provides real-time job analysis, and tracks your applications across major job boards.

## Features

### 🔄 Auto-Fill Application Forms
- Automatically detects and fills job application forms with your profile data
- Supports major ATS platforms: Workday, Greenhouse, Lever, iCIMS, LinkedIn, BambooHR, and more
- Intelligent field mapping for names, contact info, professional URLs, and experience
- Visual indicators show which fields have been auto-filled

### 🎯 Real-Time Job Analysis
- Analyzes job descriptions using in-browser NLP processing
- Calculates match scores based on your skills vs job requirements
- Identifies missing skills to help you prepare
- Detects seniority level (Entry/Mid/Senior) and work mode (Remote/Hybrid/On-site)
- Shows results in an elegant floating widget

### 📊 Application Tracking
- Automatically tracks when you apply to jobs through the extension
- Syncs application data with your AutoJobr dashboard
- Includes job details, match scores, and application timestamps
- View all tracked applications in the main web app

### 🎨 Smart Interface
- Clean, modern popup with dark mode support
- Toggle auto-fill on/off as needed
- View your profile summary and recent analysis
- Quick access to refresh job analysis
- Direct link to your AutoJobr dashboard

## Installation

### Method 1: Load as Unpacked Extension (Developer Mode)

1. **Download the Extension**
   - Download all files from the `extension/` folder
   - Or clone the AutoJobr repository and navigate to the `extension/` directory

2. **Enable Developer Mode in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Toggle "Developer mode" on (top right corner)

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `extension` folder
   - The AutoJobr extension should now appear in your extensions list

4. **Pin the Extension**
   - Click the extensions icon (puzzle piece) in Chrome toolbar
   - Find "AutoJobr - Job Application Assistant"
   - Click the pin icon to keep it visible

### Method 2: Install from Chrome Web Store
*Coming soon - the extension will be available on the Chrome Web Store after review.*

## Setup and Configuration

### 1. Connect to AutoJobr Web App
- First, sign up and create your profile at the AutoJobr web application
- Add your skills, work experience, and contact information
- The extension pulls your data from the web app automatically

### 2. Configure Extension Settings
- Click the AutoJobr extension icon in your browser toolbar
- Ensure "Auto-fill Forms" is enabled
- If using a custom deployment, update the API URL in extension settings

### 3. Start Using on Job Sites
- Navigate to any supported job board (LinkedIn, Indeed, company career pages)
- The extension will show an "AutoJobr Active" indicator when ready
- Job analysis will appear automatically when viewing job postings
- Forms will be auto-filled when you start applying

## Supported Platforms

The extension works on these major job boards and ATS systems:

**Job Boards:**
- LinkedIn Jobs
- Indeed
- Glassdoor
- Monster
- ZipRecruiter

**ATS Platforms:**
- Workday
- Greenhouse
- Lever
- iCIMS
- BambooHR
- JobVite
- SmartRecruiters

**Generic Support:**
- Most company career pages
- Custom application forms
- University job portals

## How It Works

### Auto-Fill Process
1. Extension detects job application forms on supported sites
2. Retrieves your profile data from AutoJobr backend
3. Intelligently maps profile fields to form inputs
4. Fills forms with visual confirmation
5. Preserves your ability to edit before submitting

### Job Analysis Process
1. Extracts job description text from the current page
2. Uses in-browser NLP to identify required skills and qualifications
3. Compares requirements against your profile skills
4. Calculates match percentage and identifies gaps
5. Displays results in floating analysis widget

### Application Tracking
1. Detects when you submit job applications
2. Captures job details (title, company, description, etc.)
3. Sends application data to AutoJobr backend
4. Updates your dashboard with new application entry
5. Includes match score and analysis data

## Privacy and Security

### Data Protection
- Your profile data is only accessed when auto-filling forms
- Job analysis happens locally in your browser
- No job descriptions are sent to external servers
- All communication with AutoJobr backend uses secure HTTPS

### Permissions Explained
- **activeTab**: Access current tab to analyze job postings and fill forms
- **storage**: Store extension settings and cache profile data
- **scripting**: Inject content scripts on job sites
- **host_permissions**: Access supported job boards and ATS platforms

### Data Storage
- Extension settings stored locally in Chrome sync storage
- Profile data cached temporarily for faster form filling
- No sensitive information stored permanently in the extension

## Troubleshooting

### Extension Not Working
1. Ensure you're logged into the AutoJobr web app
2. Check that the extension has proper permissions
3. Refresh the job page and try again
4. Verify the site is in our supported platforms list

### Forms Not Auto-Filling
1. Make sure "Auto-fill Forms" is enabled in the popup
2. Complete your profile in the AutoJobr web app
3. Some forms may have unusual field names - use manual fill option
4. Try clicking "Fill Forms Now" button in the extension popup

### Job Analysis Not Showing
1. Ensure you're on a job posting page (not search results)
2. Wait a few seconds for the page to fully load
3. Click "Refresh Analysis" in the extension popup
4. Some sites may block content scripts - try refreshing the page

### Connection Issues
1. Check your internet connection
2. Verify AutoJobr web app is accessible
3. If using custom deployment, confirm API URL is correct
4. Try logging out and back into the web app

## Development

### Building from Source
```bash
# Clone the repository
git clone <repository-url>
cd autojobr/extension

# The extension is ready to load - no build process required
```

### Testing
1. Load the extension in developer mode
2. Navigate to a test job posting
3. Check browser console for any errors
4. Test auto-fill functionality on various forms

### Contributing
We welcome contributions to improve the extension:
- Report bugs through the main AutoJobr repository
- Suggest new ATS platforms to support
- Submit pull requests with improvements
- Help test on different job sites

## License

This Chrome extension is part of the AutoJobr project and follows the same license terms as the main application.

## Support

For help with the Chrome extension:
1. Check this README for common solutions
2. Review the troubleshooting section
3. Contact support through the AutoJobr web application
4. Report bugs in the main project repository

---

**Made with ❤️ by the AutoJobr Team**

Transform your job search with intelligent automation!