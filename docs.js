require('dotenv').config({ path: './docs.env' });
const axios = require('axios');

const domain = process.env.CONFLUENCE_DOMAIN;
const email = process.env.CONFLUENCE_EMAIL;
const token = process.env.CONFLUENCE_API_TOKEN;
const rootPageId = process.env.PAGE_ID;

const auth = Buffer.from(`${email}:${token}`).toString('base64');

// === Fetch page URL by ID ===
const fetchPageUrl = (pageId) => {
  return `${domain}/wiki/rest/api/content/${pageId}?expand=body.storage`;
};

// === Recursively fetch all subpages and print their URLs ===
const getAllPagesRecursively = async (pageId, isRoot = false) => {
  // Print the URL of the root page once
  if (!isRoot) {
    const pageUrl = fetchPageUrl(pageId);
    console.log(` URL: ${pageUrl}`);
  }

  // Fetch child pages
  const childrenUrl = `${domain}/wiki/rest/api/content/${pageId}/child/page?limit=100`;
  try {
    const response = await axios.get(childrenUrl, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: 'application/json',
      }
    });

    const children = response.data.results;
    for (const child of children) {
      // Print child page URL recursively
      await getAllPagesRecursively(child.id);
    }

  } catch (error) {
    console.error(` Error fetching children for page ${pageId}:`, error.response?.data || error.message);
  }
};

// === Entry Point ===
(async () => {
  console.log(` Starting from Root Page ID: ${rootPageId}\n`);

  // Print the root page URL first, and set isRoot to true to prevent it being printed again in child pages
  const rootPageUrl = fetchPageUrl(rootPageId);
  console.log(` Root Page URL: ${rootPageUrl}\n`);

  // Then, recursively fetch and print URLs for all child pages
  console.log(` Fetching child pages...\n`);
  await getAllPagesRecursively(rootPageId, true);
})();

