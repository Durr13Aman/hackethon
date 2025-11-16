// Content script for extracting course data from enroll.wisc.edu
console.log('Course Planning Assistant: Content script loaded');

// Extract course data from the page
function extractCourseData() {
  const data = {};

  // This is a generic extraction function
  // You'll need to customize selectors based on the actual page structure

  // Try to extract course name/title
  const titleSelectors = [
    'h1',
    '[class*="course-title"]',
    '[class*="courseTitle"]',
    '[data-testid*="title"]',
    '.course-name',
    '#course-title'
  ];

  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      data.courseName = element.textContent.trim();
      break;
    }
  }

  // Try to extract course code
  const codeSelectors = [
    '[class*="course-code"]',
    '[class*="courseCode"]',
    '[data-testid*="code"]',
    '.course-number',
    '#course-code'
  ];

  for (const selector of codeSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      data.courseCode = element.textContent.trim();
      break;
    }
  }

  // Try to extract credits
  const creditSelectors = [
    '[class*="credit"]',
    '[class*="units"]',
    '[data-testid*="credit"]'
  ];

  for (const selector of creditSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      const creditText = element.textContent.trim();
      const creditMatch = creditText.match(/(\d+)/);
      if (creditMatch) {
        data.credits = creditMatch[1];
      }
      break;
    }
  }

  // Try to extract course description
  const descSelectors = [
    '[class*="description"]',
    '[class*="desc"]',
    '[data-testid*="description"]',
    'p.course-description'
  ];

  for (const selector of descSelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim().length > 50) {
      data.description = element.textContent.trim().substring(0, 300);
      break;
    }
  }

  // Try to extract sections/time information
  const sections = [];
  const sectionElements = document.querySelectorAll('[class*="section"], [class*="class-section"], tr[data-testid*="section"]');

  sectionElements.forEach((section, index) => {
    if (index < 5) { // Limit to first 5 sections
      const sectionData = {
        text: section.textContent.trim().substring(0, 100)
      };
      sections.push(sectionData);
    }
  });

  if (sections.length > 0) {
    data.sections = sections;
  }

  // Extract any visible text content for general context
  if (Object.keys(data).length === 0) {
    // If we haven't found structured data, get general page info
    const mainContent = document.querySelector('main, #main, [role="main"], .content');
    if (mainContent) {
      const text = mainContent.textContent.trim();
      if (text.length > 100) {
        data.pageContent = text.substring(0, 500) + '...';
      }
    }
  }

  // Add URL for context
  data.url = window.location.href;
  data.pageTitle = document.title;

  return data;
}

// Listen for messages from side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCourseData') {
    const courseData = extractCourseData();
    sendResponse({ data: courseData });
  }
  return true; // Keep the message channel open for async response
});

// Watch for page changes and notify side panel
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    lastUrl = window.location.href;

    // Wait a bit for the page to load
    setTimeout(() => {
      const courseData = extractCourseData();
      chrome.runtime.sendMessage({
        action: 'courseDataUpdated',
        data: courseData
      }).catch(() => {
        // Ignore errors if side panel is not open
      });
    }, 1000);
  }
});

// Start observing
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Send initial data when content script loads
setTimeout(() => {
  const courseData = extractCourseData();
  chrome.runtime.sendMessage({
    action: 'courseDataUpdated',
    data: courseData
  }).catch(() => {
    // Ignore errors if side panel is not open
  });
}, 1500);