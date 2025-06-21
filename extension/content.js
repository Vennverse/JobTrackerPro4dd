// Content script for AutoJobr Chrome Extension
// Handles form auto-filling, job description analysis, and page interaction

(function() {
  'use strict';
  
  let isAutofillEnabled = true;
  let userProfile = null;
  let currentJobData = null;
  
  // Initialize extension on page load
  initializeExtension();
  
  async function initializeExtension() {
    // Get user profile and settings
    await loadUserProfile();
    await loadSettings();
    
    // Set up observers for dynamic content
    setupFormObserver();
    setupJobDescriptionObserver();
    
    // Add AutoJobr indicator
    addAutojobrIndicator();
    
    console.log('AutoJobr extension initialized on', window.location.hostname);
  }
  
  // Load user profile from background script
  async function loadUserProfile() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getUserProfile' }, (response) => {
        if (response && response.success) {
          userProfile = response.data;
          console.log('User profile loaded:', userProfile.user?.firstName);
        }
        resolve();
      });
    });
  }
  
  // Load extension settings
  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
        if (response && response.success) {
          isAutofillEnabled = response.data.autofillEnabled;
        }
        resolve();
      });
    });
  }
  
  // Add visual indicator that AutoJobr is active
  function addAutojobrIndicator() {
    if (document.getElementById('autojobr-indicator')) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'autojobr-indicator';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        padding: 8px 12px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        transition: all 0.2s ease;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 6px; height: 6px; background: #10b981; border-radius: 50%;"></div>
          AutoJobr Active
        </div>
      </div>
    `;
    
    indicator.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openPopup' });
    });
    
    document.body.appendChild(indicator);
  }
  
  // Set up form field observer for auto-filling
  function setupFormObserver() {
    const observer = new MutationObserver(() => {
      if (isAutofillEnabled && userProfile) {
        detectAndFillForms();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Initial form detection
    setTimeout(() => {
      if (isAutofillEnabled && userProfile) {
        detectAndFillForms();
      }
    }, 2000);
  }
  
  // Set up job description observer for analysis
  function setupJobDescriptionObserver() {
    const observer = new MutationObserver(() => {
      analyzeJobDescription();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Initial analysis
    setTimeout(() => {
      analyzeJobDescription();
    }, 3000);
  }
  
  // Detect and auto-fill form fields with comprehensive data
  function detectAndFillForms() {
    if (!userProfile) return;
    
    const { user, profile, skills, workExperience, education } = userProfile;
    
    // Comprehensive field selectors for all major ATS platforms and job application forms
    const fieldMappings = {
      // Basic Information
      firstName: [
        'input[name*="first" i][name*="name" i]',
        'input[id*="first" i][id*="name" i]',
        'input[placeholder*="first" i][placeholder*="name" i]',
        'input[name="firstName"]',
        'input[name="fname"]',
        'input[name="first_name"]'
      ],
      lastName: [
        'input[name*="last" i][name*="name" i]',
        'input[id*="last" i][id*="name" i]',
        'input[placeholder*="last" i][placeholder*="name" i]',
        'input[name="lastName"]',
        'input[name="lname"]',
        'input[name="last_name"]'
      ],
      fullName: [
        'input[name*="full" i][name*="name" i]',
        'input[name="name"]',
        'input[name="fullName"]',
        'input[placeholder*="full name" i]',
        'input[name="applicant_name"]'
      ],
      
      // Contact Information
      email: [
        'input[type="email"]',
        'input[name*="email" i]',
        'input[id*="email" i]',
        'input[placeholder*="email" i]'
      ],
      phone: [
        'input[type="tel"]',
        'input[name*="phone" i]',
        'input[id*="phone" i]',
        'input[placeholder*="phone" i]',
        'input[name*="mobile" i]',
        'input[name="phoneNumber"]'
      ],
      
      // Address Information
      address: [
        'input[name*="address" i]',
        'input[id*="address" i]',
        'input[placeholder*="address" i]',
        'textarea[name*="address" i]',
        'input[name="street"]'
      ],
      city: [
        'input[name*="city" i]',
        'input[id*="city" i]',
        'input[placeholder*="city" i]'
      ],
      state: [
        'input[name*="state" i]',
        'input[id*="state" i]',
        'select[name*="state" i]',
        'input[placeholder*="state" i]',
        'input[name="province"]'
      ],
      zipCode: [
        'input[name*="zip" i]',
        'input[name*="postal" i]',
        'input[id*="zip" i]',
        'input[placeholder*="zip" i]',
        'input[name="zipCode"]'
      ],
      country: [
        'select[name*="country" i]',
        'input[name*="country" i]',
        'select[id*="country" i]'
      ],
      
      // Personal Information
      dateOfBirth: [
        'input[name*="birth" i]',
        'input[name*="dob" i]',
        'input[id*="birth" i]',
        'input[type="date"][name*="birth" i]'
      ],
      
      // Work Authorization
      workAuthorization: [
        'select[name*="work" i][name*="auth" i]',
        'select[name*="visa" i]',
        'select[name*="citizenship" i]',
        'input[name*="work_authorization" i]',
        'select[name*="legal" i][name*="work" i]'
      ],
      requiresSponsorship: [
        'input[type="checkbox"][name*="sponsor" i]',
        'input[type="radio"][name*="sponsor" i]',
        'select[name*="sponsor" i]'
      ],
      
      // Professional Information
      professionalTitle: [
        'input[name*="title" i]',
        'input[name*="position" i]',
        'input[id*="title" i]',
        'input[placeholder*="title" i]',
        'input[name="currentTitle"]'
      ],
      yearsExperience: [
        'input[name*="experience" i][name*="year" i]',
        'select[name*="experience" i]',
        'input[name*="years" i]',
        'input[type="number"][name*="experience" i]'
      ],
      
      // Salary Expectations
      salaryMin: [
        'input[name*="salary" i][name*="min" i]',
        'input[name*="compensation" i][name*="min" i]',
        'input[name*="expected" i][name*="salary" i]'
      ],
      salaryMax: [
        'input[name*="salary" i][name*="max" i]',
        'input[name*="compensation" i][name*="max" i]'
      ],
      
      // Availability
      noticePeriod: [
        'select[name*="notice" i]',
        'select[name*="availability" i]',
        'input[name*="start" i][name*="date" i]'
      ],
      
      // Work Preferences
      preferredWorkMode: [
        'select[name*="remote" i]',
        'select[name*="work" i][name*="mode" i]',
        'input[name*="remote" i]'
      ],
      willingToRelocate: [
        'input[type="checkbox"][name*="relocate" i]',
        'input[type="radio"][name*="relocate" i]',
        'select[name*="relocate" i]'
      ],
      
      // Education
      highestDegree: [
        'select[name*="degree" i]',
        'select[name*="education" i]',
        'input[name*="degree" i]'
      ],
      graduationYear: [
        'input[name*="graduation" i]',
        'select[name*="year" i]',
        'input[type="number"][name*="year" i]'
      ],
      fieldOfStudy: [
        'input[name*="major" i]',
        'input[name*="field" i]',
        'input[name*="study" i]'
      ],
      
      // Emergency Contact
      emergencyContactName: [
        'input[name*="emergency" i][name*="name" i]',
        'input[name*="contact" i][name*="name" i]'
      ],
      emergencyContactPhone: [
        'input[name*="emergency" i][name*="phone" i]',
        'input[name*="contact" i][name*="phone" i]'
      ],
      
      // Diversity and Background
      veteranStatus: [
        'select[name*="veteran" i]',
        'input[name*="veteran" i]'
      ],
      ethnicity: [
        'select[name*="ethnicity" i]',
        'select[name*="race" i]'
      ],
      gender: [
        'select[name*="gender" i]',
        'input[name*="gender" i]'
      ],
      disabilityStatus: [
        'select[name*="disability" i]',
        'input[name*="disability" i]'
      ],
      
      // LinkedIn and Social
      linkedinUrl: [
        'input[name*="linkedin" i]',
        'input[placeholder*="linkedin" i]',
        'input[name*="profile" i]'
      ],
      githubUrl: [
        'input[name*="github" i]',
        'input[placeholder*="github" i]'
      ],
      portfolioUrl: [
        'input[name*="portfolio" i]',
        'input[placeholder*="portfolio" i]',
        'input[name*="website" i]'
      ],
      
      // Resume/CV
      coverLetter: [
        'textarea[name*="cover" i]',
        'textarea[name*="letter" i]',
        'textarea[placeholder*="cover" i]'
      ],
      additionalInfo: [
        'textarea[name*="additional" i]',
        'textarea[name*="other" i]',
        'textarea[name*="comments" i]'
      ]
    };
    
    // Comprehensive data mapping for auto-fill based on user profile
    const fillData = {
      // Basic Information
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      fullName: profile?.fullName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : ''),
      email: user?.email || '',
      phone: profile?.phone || '',
      
      // Address Information
      address: profile?.currentAddress || '',
      city: profile?.city || '',
      state: profile?.state || '',
      zipCode: profile?.zipCode || '',
      country: profile?.country || 'United States',
      
      // Personal Information
      dateOfBirth: profile?.dateOfBirth || '',
      gender: profile?.gender || '',
      
      // Work Authorization
      workAuthorization: profile?.workAuthorization || '',
      requiresSponsorship: profile?.requiresSponsorship || false,
      
      // Professional Information
      professionalTitle: profile?.professionalTitle || '',
      yearsExperience: profile?.yearsExperience?.toString() || '',
      
      // Salary and Preferences
      salaryMin: profile?.desiredSalaryMin?.toString() || '',
      salaryMax: profile?.desiredSalaryMax?.toString() || '',
      noticePeriod: profile?.noticePeriod || '',
      preferredWorkMode: profile?.preferredWorkMode || '',
      willingToRelocate: profile?.willingToRelocate || false,
      
      // Education
      highestDegree: profile?.highestDegree || '',
      graduationYear: profile?.graduationYear?.toString() || '',
      fieldOfStudy: profile?.majorFieldOfStudy || '',
      
      // Emergency Contact
      emergencyContactName: profile?.emergencyContactName || '',
      emergencyContactPhone: profile?.emergencyContactPhone || '',
      
      // Background Information
      veteranStatus: profile?.veteranStatus || '',
      ethnicity: profile?.ethnicity || '',
      disabilityStatus: profile?.disabilityStatus || '',
      
      // Professional URLs
      linkedinUrl: profile?.linkedinUrl || '',
      githubUrl: profile?.githubUrl || '',
      portfolioUrl: profile?.portfolioUrl || '',
      
      // Additional Information
      coverLetter: generateCoverLetter(profile, workExperience),
      additionalInfo: profile?.summary || ''
    };
    
    Object.entries(fieldMappings).forEach(([fieldType, selectors]) => {
      const value = fillData[fieldType];
      if (!value) return;
      
      selectors.forEach(selector => {
        const fields = document.querySelectorAll(selector);
        fields.forEach(field => {
          if (!field.value && !field.hasAttribute('data-autojobr-filled')) {
            fillField(field, value);
            field.setAttribute('data-autojobr-filled', 'true');
          }
        });
      });
    });
    
    // Handle text areas for summaries
    const summarySelectors = [
      'textarea[name*="summary" i]',
      'textarea[name*="bio" i]',
      'textarea[name*="about" i]',
      'textarea[placeholder*="tell us about" i]',
      'textarea[placeholder*="summary" i]'
    ];
    
    if (profile?.summary) {
      summarySelectors.forEach(selector => {
        const fields = document.querySelectorAll(selector);
        fields.forEach(field => {
          if (!field.value && !field.hasAttribute('data-autojobr-filled')) {
            fillField(field, profile.summary);
            field.setAttribute('data-autojobr-filled', 'true');
          }
        });
      });
    }
  }
  
  // Fill individual form field with proper event triggering
  function fillField(field, value) {
    // Set the value
    field.value = value;
    
    // Trigger events to ensure form validation and frameworks detect the change
    const events = ['input', 'change', 'blur', 'keyup'];
    events.forEach(eventType => {
      const event = new Event(eventType, { bubbles: true });
      field.dispatchEvent(event);
    });
    
    // Add visual indication
    const originalStyle = field.style.borderColor;
    field.style.borderColor = '#10b981';
    field.style.transition = 'border-color 0.3s ease';
    
    setTimeout(() => {
      field.style.borderColor = originalStyle;
    }, 2000);
  }
  
  // Analyze job description on the current page
  function analyzeJobDescription() {
    try {
      const jobData = extractJobData();
      if (!jobData || !jobData.description) return;
      
      // Only analyze if this is new job data
      if (currentJobData && currentJobData.description === jobData.description) return;
      currentJobData = jobData;
      
      // Extract skills and requirements using simple NLP
      const skills = extractSkillsFromText(jobData.description);
      jobData.requiredSkills = skills;
      
      // Send to background script for analysis
      chrome.runtime.sendMessage({
        action: 'analyzeJob',
        data: jobData
      }, (response) => {
        if (response && response.success) {
          console.log('Job analysis completed:', response.data);
          showAnalysisResults(response.data);
        }
      });
      
    } catch (error) {
      console.error('Error analyzing job description:', error);
    }
  }
  
  // Extract job data from the current page
  function extractJobData() {
    const hostname = window.location.hostname;
    let jobData = {};
    
    // Platform-specific extraction
    if (hostname.includes('linkedin.com')) {
      jobData = extractLinkedInJobData();
    } else if (hostname.includes('greenhouse.io')) {
      jobData = extractGreenhouseJobData();
    } else if (hostname.includes('lever.co')) {
      jobData = extractLeverJobData();
    } else if (hostname.includes('workday.com')) {
      jobData = extractWorkdayJobData();
    } else {
      jobData = extractGenericJobData();
    }
    
    return jobData;
  }
  
  // Generic job data extraction
  function extractGenericJobData() {
    const titleSelectors = [
      'h1',
      '[class*="job-title" i]',
      '[class*="position" i]',
      '[id*="job-title" i]'
    ];
    
    const companySelectors = [
      '[class*="company" i]',
      '[class*="employer" i]',
      '[data-testid*="company" i]'
    ];
    
    const descriptionSelectors = [
      '[class*="description" i]',
      '[class*="job-content" i]',
      '[class*="details" i]',
      'section:contains("description")',
      'div:contains("responsibilities")'
    ];
    
    const title = findTextContent(titleSelectors);
    const company = findTextContent(companySelectors);
    const description = findTextContent(descriptionSelectors);
    
    return {
      title: title || document.title,
      company: company || '',
      description: description || document.body.innerText,
      url: window.location.href,
      location: extractLocation(),
      platform: window.location.hostname
    };
  }
  
  // LinkedIn-specific extraction
  function extractLinkedInJobData() {
    const titleEl = document.querySelector('.top-card-layout__title, .job-details-jobs-unified-top-card__job-title');
    const companyEl = document.querySelector('.topcard__flavor--bullet, .job-details-jobs-unified-top-card__company-name');
    const descriptionEl = document.querySelector('.jobs-box__html-content, .jobs-description-content__text');
    
    return {
      title: titleEl?.innerText?.trim() || '',
      company: companyEl?.innerText?.trim() || '',
      description: descriptionEl?.innerText?.trim() || '',
      url: window.location.href,
      location: extractLocation(),
      platform: 'LinkedIn'
    };
  }
  
  // Greenhouse-specific extraction
  function extractGreenhouseJobData() {
    const titleEl = document.querySelector('.app-title, .job-post-title');
    const companyEl = document.querySelector('.company-name, .app-company');
    const descriptionEl = document.querySelector('.job-post-content, .application-content');
    
    return {
      title: titleEl?.innerText?.trim() || '',
      company: companyEl?.innerText?.trim() || '',
      description: descriptionEl?.innerText?.trim() || '',
      url: window.location.href,
      location: extractLocation(),
      platform: 'Greenhouse'
    };
  }
  
  // Lever-specific extraction
  function extractLeverJobData() {
    const titleEl = document.querySelector('.posting-headline h2');
    const companyEl = document.querySelector('.posting-headline .company-name');
    const descriptionEl = document.querySelector('.posting-content .content');
    
    return {
      title: titleEl?.innerText?.trim() || '',
      company: companyEl?.innerText?.trim() || '',
      description: descriptionEl?.innerText?.trim() || '',
      url: window.location.href,
      location: extractLocation(),
      platform: 'Lever'
    };
  }
  
  // Workday-specific extraction
  function extractWorkdayJobData() {
    const titleEl = document.querySelector('[data-automation-id="jobPostingHeader"]');
    const companyEl = document.querySelector('[data-automation-id="jobPostingCompany"]');
    const descriptionEl = document.querySelector('[data-automation-id="jobPostingDescription"]');
    
    return {
      title: titleEl?.innerText?.trim() || '',
      company: companyEl?.innerText?.trim() || '',
      description: descriptionEl?.innerText?.trim() || '',
      url: window.location.href,
      location: extractLocation(),
      platform: 'Workday'
    };
  }
  
  // Helper function to find text content from multiple selectors
  function findTextContent(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.innerText?.trim()) {
        return element.innerText.trim();
      }
    }
    return '';
  }
  
  // Extract location information
  function extractLocation() {
    const locationSelectors = [
      '[class*="location" i]',
      '[class*="city" i]',
      '[data-testid*="location" i]',
      '.job-location',
      '.location-info'
    ];
    
    return findTextContent(locationSelectors);
  }
  
  // Extract skills from job description text
  function extractSkillsFromText(text) {
    const commonSkills = [
      // Programming languages
      'JavaScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
      'TypeScript', 'Scala', 'R', 'MATLAB', 'SQL', 'HTML', 'CSS', 'SASS', 'LESS',
      
      // Frameworks and libraries
      'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Rails', 'Spring',
      'Laravel', 'jQuery', 'Bootstrap', 'Tailwind', 'Next.js', 'Nuxt.js', 'Svelte',
      
      // Databases
      'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite', 'Oracle',
      'DynamoDB', 'Cassandra', 'Neo4j',
      
      // Cloud and DevOps
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab', 'GitHub Actions',
      'Terraform', 'Ansible', 'Chef', 'Puppet', 'Vagrant',
      
      // Tools and technologies
      'Git', 'Jira', 'Confluence', 'Slack', 'Figma', 'Adobe', 'Photoshop', 'Illustrator',
      'Sketch', 'InVision', 'Postman', 'Swagger', 'REST', 'GraphQL', 'SOAP',
      
      // Soft skills
      'Leadership', 'Communication', 'Problem Solving', 'Critical Thinking', 'Teamwork',
      'Project Management', 'Agile', 'Scrum', 'Kanban', 'Time Management'
    ];
    
    const foundSkills = [];
    const textLower = text.toLowerCase();
    
    commonSkills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      if (textLower.includes(skillLower)) {
        foundSkills.push(skill);
      }
    });
    
    return foundSkills;
  }
  
  // Show analysis results in a floating widget
  function showAnalysisResults(analysis) {
    // Remove existing widget
    const existingWidget = document.getElementById('autojobr-analysis-widget');
    if (existingWidget) {
      existingWidget.remove();
    }
    
    const widget = document.createElement('div');
    widget.id = 'autojobr-analysis-widget';
    widget.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 320px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        z-index: 10001;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border: 1px solid #e5e7eb;
        overflow: hidden;
      ">
        <div style="
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div style="font-weight: 600; font-size: 14px;">Job Match Analysis</div>
          <button id="close-analysis" style="
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
          ">✕</button>
        </div>
        
        <div style="padding: 16px;">
          <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 14px; color: #6b7280;">Match Score</span>
              <span style="
                font-weight: 600;
                color: ${analysis.matchScore >= 75 ? '#10b981' : analysis.matchScore >= 50 ? '#f59e0b' : '#ef4444'};
                font-size: 16px;
              ">${analysis.matchScore}%</span>
            </div>
            <div style="
              background: #f3f4f6;
              height: 8px;
              border-radius: 4px;
              overflow: hidden;
            ">
              <div style="
                background: ${analysis.matchScore >= 75 ? '#10b981' : analysis.matchScore >= 50 ? '#f59e0b' : '#ef4444'};
                height: 100%;
                width: ${analysis.matchScore}%;
                transition: width 0.3s ease;
              "></div>
            </div>
          </div>
          
          <div style="margin-bottom: 12px;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Seniority Level</div>
            <div style="font-size: 14px; color: #374151;">${analysis.detectedSeniority}</div>
          </div>
          
          <div style="margin-bottom: 12px;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Work Mode</div>
            <div style="font-size: 14px; color: #374151;">${analysis.workMode}</div>
          </div>
          
          ${analysis.matchingSkills.length > 0 ? `
            <div style="margin-bottom: 12px;">
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">Matching Skills</div>
              <div style="display: flex; flex-wrap: gap: 4px;">
                ${analysis.matchingSkills.slice(0, 3).map(skill => `
                  <span style="
                    background: #10b981;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 500;
                  ">${skill}</span>
                `).join('')}
                ${analysis.matchingSkills.length > 3 ? `
                  <span style="
                    background: #6b7280;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                  ">+${analysis.matchingSkills.length - 3}</span>
                ` : ''}
              </div>
            </div>
          ` : ''}
          
          ${analysis.missingSkills.length > 0 ? `
            <div style="margin-bottom: 16px;">
              <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">Missing Skills</div>
              <div style="display: flex; flex-wrap: gap: 4px;">
                ${analysis.missingSkills.slice(0, 3).map(skill => `
                  <span style="
                    background: #fef3c7;
                    color: #d97706;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 500;
                  ">${skill}</span>
                `).join('')}
                ${analysis.missingSkills.length > 3 ? `
                  <span style="
                    background: #6b7280;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                  ">+${analysis.missingSkills.length - 3}</span>
                ` : ''}
              </div>
            </div>
          ` : ''}
          
          <button id="track-application" style="
            width: 100%;
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.2s ease;
          " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
            Track Application
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(widget);
    
    // Add event listeners
    document.getElementById('close-analysis').addEventListener('click', () => {
      widget.remove();
    });
    
    document.getElementById('track-application').addEventListener('click', () => {
      trackCurrentJob(analysis);
    });
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (document.getElementById('autojobr-analysis-widget')) {
        widget.style.opacity = '0.7';
      }
    }, 10000);
  }
  
  // Track current job application
  function trackCurrentJob(analysis) {
    if (!currentJobData) return;
    
    const applicationData = {
      ...currentJobData,
      matchScore: analysis.matchScore,
      requiredSkills: analysis.matchingSkills.concat(analysis.missingSkills)
    };
    
    chrome.runtime.sendMessage({
      action: 'trackApplication',
      data: applicationData
    }, (response) => {
      if (response && response.success) {
        showNotification('Application tracked successfully!', 'success');
      } else {
        showNotification('Failed to track application', 'error');
      }
    });
  }
  
  // Show notification
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 10002;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleAutofill') {
      isAutofillEnabled = request.enabled;
      showNotification(`Autofill ${isAutofillEnabled ? 'enabled' : 'disabled'}`, 'info');
    }
    
    if (request.action === 'refreshAnalysis') {
      currentJobData = null; // Force re-analysis
      analyzeJobDescription();
    }
    
    if (request.action === 'fillForms') {
      detectAndFillForms();
      showNotification('Forms filled with your profile data', 'success');
    }
  });
  
})();