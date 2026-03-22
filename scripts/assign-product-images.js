/**
 * Assign real images to all products using curated Unsplash URLs
 * This script updates the database with production-ready images
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Curated high-quality images for luxury hair products
const CURATED_IMAGES = {
  // Lace Front Wigs
  'lace-front': [
    'https://images.unsplash.com/photo-1595475884562-073c30d45670?w=1200&q=80',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80',
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=1200&q=80',
    'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=1200&q=80',
    'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=1200&q=80',
  ],
  
  // Body Wave / Wavy Wigs
  'body-wave': [
    'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=1200&q=80',
    'https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=1200&q=80',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=1200&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&q=80',
  ],
  
  // Straight Wigs
  'straight': [
    'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=1200&q=80',
    'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=1200&q=80',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=1200&q=80',
  ],
  
  // Curly Wigs
  'curly': [
    'https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=1200&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=1200&q=80',
    'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=1200&q=80',
  ],
  
  // 360 Lace Wigs
  '360-lace': [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80',
  ],
  
  // U-Part Wigs
  'u-part': [
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1200&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&q=80',
  ],
  
  // Headband Wigs
  'headband': [
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=1200&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1200&q=80',
  ],
  
  // Closures & Frontals
  'closure': [
    'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=1200&q=80',
    'https://images.unsplash.com/photo-1521146764736-56c929d59c83?w=1200&q=80',
  ],
  
  // Accessories - Bonnets
  'bonnet': [
    'https://images.unsplash.com/photo-1583003870684-9e5b1e8b4b3f?w=800&q=80',
    'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&q=80',
  ],
  
  // Accessories - Brushes & Combs
  'brush': [
    'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&q=80',
    'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&q=80',
  ],
  
  // Accessories - Wig Caps
  'wig-cap': [
    'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=800&q=80',
    'https://images.unsplash.com/photo-1583003870684-9e5b1e8b4b3f?w=800&q=80',
  ],
  
  // Accessories - Styling Products
  'styling-product': [
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80',
    'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80',
  ],
  
  // Accessories - Adhesives
  'adhesive': [
    'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&q=80',
  ],
  
  // Accessories - Storage
  'storage': [
    'https://images.unsplash.com/photo-1595475038665-f08d2b0f9b2d?w=800&q=80',
  ],
  
  // Accessories - Hair Clips
  'clip': [
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
  ],
  
  // Default fallback
  'default': [
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80',
  ],
};

// Map product names/slugs to image categories
function getImageCategory(product) {
  const name = product.name.toLowerCase();
  const slug = product.slug.toLowerCase();
  
  // Wigs
  if (name.includes('lace front') || slug.includes('lace-front')) return 'lace-front';
  if (name.includes('360') || slug.includes('360')) return '360-lace';
  if (name.includes('u-part') || slug.includes('u-part')) return 'u-part';
  if (name.includes('headband') || slug.includes('headband')) return 'headband';
  if (name.includes('closure') || name.includes('frontal')) return 'closure';
  
  // Hair textures
  if (name.includes('body wave') || name.includes('wavy')) return 'body-wave';
  if (name.includes('straight')) return 'straight';
  if (name.includes('curly') || name.includes('curl')) return 'curly';
  
  // Accessories
  if (name.includes('bonnet') || name.includes('cap')) return 'bonnet';
  if (name.includes('brush') || name.includes('comb')) return 'brush';
  if (name.includes('wig cap') || name.includes('liner')) return 'wig-cap';
  if (name.includes('spray') || name.includes('gel') || name.includes('oil')) return 'styling-product';
  if (name.includes('glue') || name.includes('adhesive')) return 'adhesive';
  if (name.includes('stand') || name.includes('storage')) return 'storage';
  if (name.includes('clip') || name.includes('pin')) return 'clip';
  
  // Default
  if (product.product_type === 'accessory') return 'brush';
  return 'lace-front';
}

// Get random image from category
function getRandomImage(category) {
  const images = CURATED_IMAGES[category] || CURATED_IMAGES.default;
  return images[Math.floor(Math.random() * images.length)];
}

async function assignProductImages() {
  console.log('🎨 Starting product image assignment...\n');

  try {
    // Fetch all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug, product_type');

    if (productsError) throw productsError;

    console.log(`📦 Found ${products.length} products\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        const category = getImageCategory(product);
        const imageUrl = getRandomImage(category);
        
        // Check if image already exists
        const { data: existingImages } = await supabase
          .from('product_images')
          .select('id')
          .eq('product_id', product.id)
          .limit(1);

        if (existingImages && existingImages.length > 0) {
          console.log(`⏭️  Skipping ${product.name} (already has images)`);
          continue;
        }

        // Insert product image
        const { error: imageError } = await supabase
          .from('product_images')
          .insert({
            product_id: product.id,
            image_url: imageUrl,
            alt_text: product.name,
            sort_order: 0,
            is_primary: true,
          });

        if (imageError) throw imageError;

        console.log(`✅ Assigned image to: ${product.name} (${category})`);
        successCount++;

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (err) {
        console.error(`❌ Error assigning image to ${product.name}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📦 Total: ${products.length}`);
    console.log('\n✨ Image assignment complete!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
assignProductImages();
