const fs = require('fs');
const path = require('path');

// Check if a file uses proper data fetching patterns
function auditDataFetching(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  const issues = [];
  
  // Check for service imports
  const hasServiceImport = /import.*from.*['"].*\/services\//.test(content);
  const hasAdminService = /adminService/.test(content);
  const hasUseEffect = /useEffect/.test(content);
  const hasLoadingState = /loading|isLoading/.test(content);
  const hasErrorState = /error|hasError/.test(content);
  const hasEmptyState = /No.*found|empty|length === 0/.test(content);
  
  if (!hasServiceImport && !hasAdminService) {
    issues.push('❌ Missing service layer import');
  }
  
  if (!hasUseEffect) {
    issues.push('⚠️  No useEffect for data fetching');
  }
  
  if (!hasLoadingState) {
    issues.push('⚠️  Missing loading state');
  }
  
  if (!hasErrorState) {
    issues.push('⚠️  Missing error handling');
  }
  
  return {
    file: fileName,
    hasData: hasServiceImport || hasAdminService,
    hasLoading: hasLoadingState,
    hasError: hasErrorState,
    hasEmpty: hasEmptyState,
    issues
  };
}

// Audit admin pages
console.log('🔍 AUDITING ADMIN DASHBOARD PAGES\n');
console.log('='.repeat(60));

const adminDir = 'src/pages/admin';
const adminFiles = fs.readdirSync(adminDir)
  .filter(f => f.endsWith('.jsx') && !f.includes('_Broken') && !f.includes('_Original'));

adminFiles.forEach(file => {
  const filePath = path.join(adminDir, file);
  const result = auditDataFetching(filePath);
  
  console.log(`\n📄 ${result.file}`);
  console.log(`   Data Fetching: ${result.hasData ? '✅' : '❌'}`);
  console.log(`   Loading State: ${result.hasLoading ? '✅' : '⚠️'}`);
  console.log(`   Error Handling: ${result.hasError ? '✅' : '⚠️'}`);
  console.log(`   Empty State: ${result.hasEmpty ? '✅' : '⚠️'}`);
  
  if (result.issues.length > 0) {
    result.issues.forEach(issue => console.log(`   ${issue}`));
  }
});

// Audit user dashboard pages
console.log('\n\n🔍 AUDITING USER DASHBOARD PAGES\n');
console.log('='.repeat(60));

const dashboardDir = 'src/pages/dashboard';
const dashboardFiles = fs.readdirSync(dashboardDir)
  .filter(f => f.endsWith('.jsx'));

dashboardFiles.forEach(file => {
  const filePath = path.join(dashboardDir, file);
  const result = auditDataFetching(filePath);
  
  console.log(`\n📄 ${result.file}`);
  console.log(`   Data Fetching: ${result.hasData ? '✅' : '❌'}`);
  console.log(`   Loading State: ${result.hasLoading ? '✅' : '⚠️'}`);
  console.log(`   Error Handling: ${result.hasError ? '✅' : '⚠️'}`);
  console.log(`   Empty State: ${result.hasEmpty ? '✅' : '⚠️'}`);
  
  if (result.issues.length > 0) {
    result.issues.forEach(issue => console.log(`   ${issue}`));
  }
});

console.log('\n\n' + '='.repeat(60));
console.log('✅ Audit complete!');
