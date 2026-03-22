/**
 * Fix remaining imports from deleted mock data files
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const filesToFix = [
  'src/components/Header.jsx',
  'src/components/SearchOverlay.jsx',
  'src/components/layout/Header.jsx',
  'src/components/layout/MobileMenu.jsx',
  'src/components/product/ProductCard.jsx',
  'src/components/search/SearchModal.jsx',
  'src/pages/CollectionPage.jsx',
  'src/pages/WishlistPage.jsx',
];

const NAV_CONSTANT = `
export const NAV = [
  { label: 'Shop', href: '/shop' },
  { label: 'New Arrivals', href: '/collections/new-arrivals' },
  { label: 'Best Sellers', href: '/collections/best-sellers' },
  { label: 'Hair Accessories', href: '/hair-accessories' },
];
`;

for (const file of filesToFix) {
  const filePath = join(process.cwd(), file);
  
  try {
    let content = readFileSync(filePath, 'utf-8');
    
    // Remove imports from data/products
    content = content.replace(/import\s+{[^}]*}\s+from\s+['"]\.\.\/\.\.\/data\/products['"];?\s*/g, '');
    content = content.replace(/import\s+{[^}]*}\s+from\s+['"]\.\.\/data\/products['"];?\s*/g, '');
    content = content.replace(/import\s+{[^}]*}\s+from\s+['"]\.\.\/data\/accessories['"];?\s*/g, '');
    
    // If file uses NAV constant, add it inline
    if (content.includes('NAV')) {
      content = NAV_CONSTANT + '\n' + content;
    }
    
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ Fixed: ${file}`);
  } catch (error) {
    console.log(`⚠️  Skipped: ${file} - ${error.message}`);
  }
}

console.log('\n✅ Import fixes complete!');
