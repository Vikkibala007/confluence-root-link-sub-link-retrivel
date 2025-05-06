require('dotenv').config({ path: './docs.env' });
const axios = require('axios');

// Load env variables
const domain = process.env.CONFLUENCE_DOMAIN;
const email = process.env.CONFLUENCE_EMAIL;
const token = process.env.CONFLUENCE_API_TOKEN;
const rootPageId = process.env.PAGE_ID;

// Auth header
const auth = Buffer.from(`${email}:${token}`).toString('base64');

// Store all URLs here
const allUrls = [];

// Generate human-readable Confluence page URL
const fetchWebUrl = (page) => {
  return `${domain}${page._links.webui}`;
};

// Recursive function to collect page URLs
const getAllPagesRecursively = async (pageId, isRoot = false) => {
  try {
    const pageDetailUrl = `${domain}/wiki/rest/api/content/${pageId}`;
    const detailRes = await axios.get(pageDetailUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    });

    const page = detailRes.data;
    const pageUrl = fetchWebUrl(page);

    // Only add to list if not root
    if (!isRoot) {
      allUrls.push(pageUrl);
    }

    // Fetch child pages
    const childrenUrl = `${domain}/wiki/rest/api/content/${pageId}/child/page?limit=100`;
    const response = await axios.get(childrenUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      },
    });

    const children = response.data.results;

    // Recurse through children
    for (const child of children) {
      await getAllPagesRecursively(child.id);
    }

  } catch (error) {
    console.error(` Error with page ${pageId}:`, error.response?.data || error.message);
  }
};

// Main logic
(async () => {
  console.log(` Starting from Root Page ID: ${rootPageId}\n`);

  try {
    // Fetch and add root page URL
    const rootRes = await axios.get(`${domain}/wiki/rest/api/content/${rootPageId}`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      }
    });

    const rootPage = rootRes.data;
    const rootPageUrl = fetchWebUrl(rootPage);
    allUrls.push(rootPageUrl);
  } catch (error) {
    console.error(' Failed to fetch root page:', error.response?.data || error.message);
  }

  // Recursively fetch children
  await getAllPagesRecursively(rootPageId, true);

  // Print all collected URLs at once
  console.log(`\n All Page URLs:`);
  allUrls.forEach(url => console.log(url));
})();
