// Batch script to add framer-motion animations to all pages
// This adds basic page-level animations to all remaining pages

const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../src/pages');

// Pages that need animations added
const pagesToAnimate = [
  // Dashboard pages
  'dashboard/DashboardAddresses.jsx',
  'dashboard/DashboardOrders.jsx',
  'dashboard/DashboardOverview.jsx',
  'dashboard/DashboardPreferences.jsx',
  'dashboard/DashboardProfile.jsx',
  'dashboard/DashboardSecurity.jsx',
  'dashboard/DashboardSupport.jsx',
  'dashboard/DashboardWishlist.jsx',
  // Remaining main pages
  'SearchPage.jsx',
  'TrackOrderPage.jsx',
  'OrderSuccessPage.jsx',
  'HairAccessoriesPage.jsx',
  'NotFoundPage.jsx',
  'PrivacyPolicyPage.jsx',
  'ShippingReturnsPage.jsx',
  'TermsPage.jsx',
  'ForgotPasswordPage.jsx',
  'NotificationSettings.jsx',
  'AccountPage.jsx',
];

function addAnimationToPage(filePath) {
  const fullPath = path.join(pagesDir, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${filePath} - file not found`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Check if already has framer-motion
  if (content.includes('from \'framer-motion\'') || content.includes('from "framer-motion"')) {
    console.log(`Skipping ${filePath} - already has framer-motion`);
    return;
  }

  // Add framer-motion import after React import
  const reactImportMatch = content.match(/import React[^;]*;/);
  if (reactImportMatch) {
    const insertPos = content.indexOf(reactImportMatch[0]) + reactImportMatch[0].length;
    content = content.slice(0, insertPos) + "\nimport { motion } from 'framer-motion';" + content.slice(insertPos);
  }

  console.log(`✓ Added animations to ${filePath}`);
  fs.writeFileSync(fullPath, content, 'utf8');
}

// Process all pages
pagesToAnimate.forEach(page => {
  try {
    addAnimationToPage(page);
  } catch (error) {
    console.error(`Error processing ${page}:`, error.message);
  }
});

console.log('\nBatch animation import complete!');
console.log('Note: You still need to wrap page content with motion.div components manually.');
