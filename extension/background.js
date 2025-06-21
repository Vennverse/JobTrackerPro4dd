// Background script for AutoJobr Chrome Extension
// Handles extension lifecycle, storage, and communication between components

// Extension installation and update handling
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('AutoJobr extension installed');
    // Set default settings
    // Use the current deployment URL
    const apiUrl = 'https://60e68a76-86c4-4eef-b2f5-8a97de774d09-00-f9a0u7nh8k0p.kirk.replit.dev';
    
    chrome.storage.sync.set({
      autofillEnabled: true,
      apiUrl: apiUrl,
      lastAnalysis: null,
      userProfile: null
    });
  }
});

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeJob') {
    handleJobAnalysis(request.data, sendResponse);
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'trackApplication') {
    handleApplicationTracking(request.data, sendResponse);
    return true;
  }
  
  if (request.action === 'getUserProfile') {
    getUserProfile(sendResponse);
    return true;
  }
  
  if (request.action === 'getSettings') {
    getSettings(sendResponse);
    return true;
  }
  
  if (request.action === 'updateSettings') {
    updateSettings(request.data, sendResponse);
    return true;
  }
});

// Get user profile from web app API
async function getUserProfile(sendResponse) {
  try {
    const { apiUrl } = await chrome.storage.sync.get(['apiUrl']);
    const response = await fetch(`${apiUrl}/api/auth/user`, {
      credentials: 'include'
    });
    
    if (response.ok) {
      const user = await response.json();
      
      // Also get profile data
      const profileResponse = await fetch(`${apiUrl}/api/profile`, {
        credentials: 'include'
      });
      
      const skillsResponse = await fetch(`${apiUrl}/api/skills`, {
        credentials: 'include'
      });
      
      const profile = profileResponse.ok ? await profileResponse.json() : null;
      const skills = skillsResponse.ok ? await skillsResponse.json() : [];
      
      const userProfile = {
        user,
        profile,
        skills
      };
      
      // Cache profile data
      await chrome.storage.sync.set({ userProfile });
      
      sendResponse({ success: true, data: userProfile });
    } else {
      sendResponse({ success: false, error: 'Not authenticated' });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle job analysis and matching
async function handleJobAnalysis(jobData, sendResponse) {
  try {
    const { userProfile } = await chrome.storage.sync.get(['userProfile']);
    
    if (!userProfile || !userProfile.skills) {
      sendResponse({ success: false, error: 'User profile not available' });
      return;
    }
    
    // Perform job matching analysis
    const analysis = analyzeJobMatch(jobData, userProfile);
    
    // Store analysis results
    await chrome.storage.sync.set({ lastAnalysis: analysis });
    
    sendResponse({ success: true, data: analysis });
  } catch (error) {
    console.error('Error analyzing job:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Analyze job match against user profile
function analyzeJobMatch(jobData, userProfile) {
  const userSkills = userProfile.skills.map(skill => skill.skillName.toLowerCase());
  const jobSkills = jobData.requiredSkills || [];
  const jobText = (jobData.description || '').toLowerCase();
  
  // Calculate skill matches
  const matchingSkills = [];
  const missingSkills = [];
  
  jobSkills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    if (userSkills.some(userSkill => userSkill.includes(skillLower) || skillLower.includes(userSkill))) {
      matchingSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });
  
  // Calculate match score
  const totalRequiredSkills = jobSkills.length;
  const matchScore = totalRequiredSkills > 0 
    ? Math.round((matchingSkills.length / totalRequiredSkills) * 100)
    : 0;
  
  // Detect seniority level
  const seniorityKeywords = {
    entry: ['entry', 'junior', 'associate', 'intern', 'graduate', 'trainee'],
    mid: ['mid', 'intermediate', 'experienced', '3-5 years', '2-4 years'],
    senior: ['senior', 'lead', 'principal', 'architect', '5+ years', 'expert']
  };
  
  let detectedSeniority = 'Not specified';
  for (const [level, keywords] of Object.entries(seniorityKeywords)) {
    if (keywords.some(keyword => jobText.includes(keyword))) {
      detectedSeniority = level.charAt(0).toUpperCase() + level.slice(1);
      break;
    }
  }
  
  // Detect work mode
  const remoteKeywords = ['remote', 'work from home', 'distributed', 'virtual'];
  const hybridKeywords = ['hybrid', 'flexible', 'mixed'];
  const onsiteKeywords = ['on-site', 'office', 'in-person', 'local'];
  
  let workMode = 'Not specified';
  if (remoteKeywords.some(keyword => jobText.includes(keyword))) {
    workMode = 'Remote';
  } else if (hybridKeywords.some(keyword => jobText.includes(keyword))) {
    workMode = 'Hybrid';
  } else if (onsiteKeywords.some(keyword => jobText.includes(keyword))) {
    workMode = 'On-site';
  }
  
  return {
    matchScore,
    matchingSkills,
    missingSkills,
    detectedSeniority,
    workMode,
    jobTitle: jobData.title,
    company: jobData.company,
    analyzedAt: new Date().toISOString()
  };
}

// Track job application
async function handleApplicationTracking(applicationData, sendResponse) {
  try {
    const { apiUrl } = await chrome.storage.sync.get(['apiUrl']);
    
    const response = await fetch(`${apiUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        jobTitle: applicationData.jobTitle,
        company: applicationData.company,
        jobUrl: applicationData.jobUrl,
        location: applicationData.location,
        jobType: applicationData.jobType,
        workMode: applicationData.workMode,
        salaryRange: applicationData.salaryRange,
        status: 'applied',
        jobDescription: applicationData.jobDescription,
        requiredSkills: applicationData.requiredSkills,
        matchScore: applicationData.matchScore,
        source: 'chrome_extension'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      sendResponse({ success: true, data: result });
    } else {
      sendResponse({ success: false, error: 'Failed to track application' });
    }
  } catch (error) {
    console.error('Error tracking application:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Get extension settings
async function getSettings(sendResponse) {
  try {
    const settings = await chrome.storage.sync.get([
      'autofillEnabled',
      'apiUrl',
      'lastAnalysis'
    ]);
    sendResponse({ success: true, data: settings });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Update extension settings
async function updateSettings(settings, sendResponse) {
  try {
    await chrome.storage.sync.set(settings);
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Handle tab updates to refresh analysis
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if it's a job site
    const jobSites = ['workday.com', 'greenhouse.io', 'lever.co', 'icims.com', 'linkedin.com'];
    const isJobSite = jobSites.some(site => tab.url.includes(site));
    
    if (isJobSite) {
      // Clear previous analysis when navigating to new job pages
      chrome.storage.sync.set({ lastAnalysis: null });
    }
  }
});