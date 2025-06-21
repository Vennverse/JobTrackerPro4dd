// Background script for AutoJobr Chrome Extension
// Handles extension lifecycle, storage, and communication between components

// Extension installation and update handling
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('AutoJobr extension installed');
    
    // Try to auto-detect the correct API URL
    let apiUrl = 'http://localhost:5000'; // Default fallback
    
    // Check for common AutoJobr deployment patterns
    const possibleUrls = [
      'https://60e68a76-86c4-4eef-b2f5-8a97de774d09-00-f9a0u7nh8k0p.kirk.replit.dev',
      'http://localhost:5000'
    ];
    
    for (const url of possibleUrls) {
      if (url) {
        try {
          const response = await fetch(`${url}/api/auth/user`, { 
            method: 'HEAD',
            mode: 'no-cors'
          });
          apiUrl = url;
          break;
        } catch (e) {
          continue;
        }
      }
    }
    
    chrome.storage.sync.set({
      autofillEnabled: true,
      apiUrl: apiUrl,
      lastAnalysis: null,
      userProfile: null
    });
    
    console.log('AutoJobr configured with API URL:', apiUrl);
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
    
    // First check authentication
    const authResponse = await fetch(`${apiUrl}/api/auth/user`, {
      method: 'GET',
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!authResponse.ok) {
      sendResponse({ success: false, error: 'Please log in to AutoJobr web app first' });
      return;
    }
    
    const user = await authResponse.json();
    
    // Get profile data
    let profile = null;
    let skills = [];
    
    try {
      const profileResponse = await fetch(`${apiUrl}/api/profile`, {
        method: 'GET',
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (profileResponse.ok) {
        profile = await profileResponse.json();
      }
    } catch (e) {
      console.log('Profile not found, using basic user data');
    }
    
    try {
      const skillsResponse = await fetch(`${apiUrl}/api/skills`, {
        method: 'GET',
        credentials: 'include',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (skillsResponse.ok) {
        skills = await skillsResponse.json();
      }
    } catch (e) {
      console.log('Skills not found');
    }
    
    const userProfile = {
      user,
      profile,
      skills
    };
    
    // Cache profile data
    await chrome.storage.sync.set({ userProfile });
    
    sendResponse({ success: true, data: userProfile });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    sendResponse({ success: false, error: 'Connection failed. Please ensure you are logged in to AutoJobr.' });
  }
}

// Handle enhanced AI job analysis with Groq
async function handleJobAnalysis(jobData, sendResponse) {
  try {
    const config = new ExtensionConfig();
    const apiUrl = await config.getApiUrl();
    
    if (!apiUrl) {
      sendResponse({ success: false, error: 'API URL not configured' });
      return;
    }

    // Send job data to backend for AI analysis
    const response = await fetch(`${apiUrl}/api/jobs/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        jobUrl: jobData.url || window.location.href,
        jobTitle: jobData.title,
        company: jobData.company,
        jobDescription: jobData.description,
        requirements: jobData.requirements,
        qualifications: jobData.qualifications,
        benefits: jobData.benefits
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const analysisResult = await response.json();
    
    // Store enhanced analysis results
    await chrome.storage.sync.set({ 
      lastAnalysis: analysisResult,
      lastAnalysisTimestamp: Date.now()
    });
    
    sendResponse({ success: true, data: analysisResult });
  } catch (error) {
    console.error('Error analyzing job with AI:', error);
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