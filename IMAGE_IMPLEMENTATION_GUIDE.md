# IMAGE IMPLEMENTATION GUIDE - PRODUCTION READY

**Status**: 🚧 IN PROGRESS  
**Date**: March 17, 2026

---

## 📁 FOLDER STRUCTURE CREATED

```
public/
  images/
    hero/           - Homepage hero images (1600-2200px wide)
    products/       - Product catalog images (800-1200px)
    accessories/    - Hair accessories images (800-1200px)
    categories/     - Category cards (600-800px)
    banners/        - Promotional banners (1200-1600px)
    editorial/      - Marketing/lifestyle images (variable)
```

---

## 🎨 IMAGE SOURCING STRATEGY

### **Free Stock Photo Sources**

**Unsplash** (https://unsplash.com)
- Search terms: "black woman hair", "wig", "hair extensions", "lace front wig", "hair bundles"
- License: Free for commercial use
- Quality: Professional, high-resolution

**Pexels** (https://pexels.com)
- Search terms: "african american hair", "natural hair", "hair styling", "beauty salon"
- License: Free for commercial use
- Quality: Professional

**Pixabay** (https://pixabay.com)
- Search terms: "hair care", "beauty products", "hair accessories"
- License: Free for commercial use

### **Image Selection Criteria**

✅ **Must Have:**
- High resolution (minimum 1200px width for products)
- Professional lighting
- Neutral or luxury backgrounds
- Clear focus on product/hair
- Consistent color tones (warm, neutral, luxury aesthetic)

❌ **Avoid:**
- Watermarks
- Low resolution
- Cluttered backgrounds
- Overly bright/saturated colors
- Mixed quality
- Stock photo clichés

---

## 📊 IMAGE SPECIFICATIONS

### **Product Images**
- **Format**: WebP (fallback: JPG)
- **Dimensions**: 1200x1600px (3:4 aspect ratio)
- **File size**: < 200KB after compression
- **Naming**: `product-{id}-{variant}.webp`
- **Example**: `product-001-front.webp`, `product-001-back.webp`

### **Hero Images**
- **Format**: WebP (fallback: JPG)
- **Dimensions**: 2000x1200px (5:3 aspect ratio)
- **File size**: < 400KB after compression
- **Naming**: `hero-{section}.webp`
- **Example**: `hero-main.webp`, `hero-collection.webp`

### **Category Images**
- **Format**: WebP (fallback: JPG)
- **Dimensions**: 800x1000px (4:5 aspect ratio)
- **File size**: < 150KB
- **Naming**: `category-{name}.webp`
- **Example**: `category-lace-front.webp`

### **Accessory Images**
- **Format**: WebP (fallback: JPG)
- **Dimensions**: 800x800px (1:1 aspect ratio)
- **File size**: < 100KB
- **Naming**: `accessory-{id}.webp`
- **Example**: `accessory-bonnet-001.webp`

---

## 🛠️ IMAGE OPTIMIZATION WORKFLOW

### **Step 1: Download Images**
Download high-quality images from Unsplash/Pexels/Pixabay

### **Step 2: Resize**
Use online tools or CLI:
```bash
# Using ImageMagick (if installed)
magick input.jpg -resize 1200x1600^ -gravity center -extent 1200x1600 output.jpg

# Or use online tools:
# - Squoosh.app (Google)
# - TinyPNG.com
# - Compressor.io
```

### **Step 3: Convert to WebP**
```bash
# Using online converter or CLI
magick input.jpg -quality 85 output.webp
```

### **Step 4: Compress**
- Target: 70-85% quality
- Ensure file size meets specifications
- Maintain visual quality

### **Step 5: Rename and Organize**
Move to appropriate folder with proper naming convention

---

## 📝 DATA STRUCTURE UPDATES

### **Product Data Schema**

```javascript
{
  id: 1,
  name: "Luxury Body Wave Lace Front Wig",
  slug: "luxury-body-wave-lace-front",
  
  // NEW IMAGE FIELDS
  images: [
    {
      url: "/images/products/product-001-front.webp",
      alt: "Luxury body wave lace front wig - front view",
      isPrimary: true
    },
    {
      url: "/images/products/product-001-side.webp",
      alt: "Luxury body wave lace front wig - side view",
      isPrimary: false
    },
    {
      url: "/images/products/product-001-back.webp",
      alt: "Luxury body wave lace front wig - back view",
      isPrimary: false
    }
  ],
  
  // Fallback for simple implementation
  image: "/images/products/product-001-front.webp",
  imageAlt: "Luxury body wave lace front wig",
  
  // Rest of product data...
  price: 299.99,
  category: "lace-front-wigs",
  // ...
}
```

### **Accessory Data Schema**

```javascript
{
  id: "acc-001",
  name: "Satin Bonnet - Black",
  
  // NEW IMAGE FIELDS
  image: "/images/accessories/bonnet-black.webp",
  imageAlt: "Black satin bonnet for hair protection",
  
  // Optional: Multiple images
  images: [
    "/images/accessories/bonnet-black-front.webp",
    "/images/accessories/bonnet-black-detail.webp"
  ],
  
  price: 12.99,
  category: "bonnets",
  // ...
}
```

---

## 🔧 COMPONENT REFACTORING

### **Updated Img Component**

```jsx
// src/components/common/Img.jsx
import React, { useState } from 'react';
import { Image } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function Img({ 
  src, 
  alt = 'Product image', 
  className = '', 
  loading = 'lazy',
  fallback = '/images/placeholder.webp'
}) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (error || !src) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center w-full h-full bg-neutral-100',
          className
        )}
        role="img"
        aria-label={alt}
      >
        <Image className="w-8 h-8 text-neutral-300" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div className={cn('flex items-center justify-center w-full h-full bg-neutral-100', className)}>
          <Image className="w-8 h-8 text-neutral-300 animate-pulse" strokeWidth={1.5} />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading={loading}
        className={cn(
          'w-full h-full object-cover',
          !loaded && 'hidden',
          className
        )}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </>
  );
}
```

### **Usage Examples**

```jsx
// ProductCard.jsx
<Img 
  src={product.image || product.images?.[0]?.url}
  alt={product.imageAlt || product.name}
  className="aspect-[3/4]"
  loading="lazy"
/>

// ProductPage.jsx
{images.map((img, i) => (
  <Img
    key={i}
    src={img.url || img}
    alt={img.alt || `${product.name} - view ${i + 1}`}
    loading={i === 0 ? 'eager' : 'lazy'}
  />
))}

// HomePage.jsx hero
<Img
  src="/images/hero/hero-main.webp"
  alt="Luxury hair extensions and wigs"
  loading="eager"
  className="w-full h-full"
/>
```

---

## 📋 IMPLEMENTATION CHECKLIST

### **Phase 1: Setup** ✅
- [x] Create folder structure
- [ ] Download 20-30 high-quality images
- [ ] Optimize and convert to WebP
- [ ] Organize into folders

### **Phase 2: Data Updates**
- [ ] Update `src/data/products.js` with image fields
- [ ] Update `src/data/accessories.js` with image fields
- [ ] Add image data to all products (minimum 3 images each)
- [ ] Add image data to all accessories (minimum 1 image each)

### **Phase 3: Component Refactoring**
- [ ] Refactor `Img.jsx` to support real images
- [ ] Update `ProductCard.jsx` to use new image structure
- [ ] Update `ProductPage.jsx` gallery to use real images
- [ ] Update `HomePage.jsx` hero sections
- [ ] Update `HairAccessoriesPage.jsx`
- [ ] Update `CartDrawer.jsx` and `CartPage.jsx`
- [ ] Update `SearchModal.jsx` results
- [ ] Update `MegaMenu.jsx` category images

### **Phase 4: Testing**
- [ ] Verify all pages load images correctly
- [ ] Test image fallbacks for broken URLs
- [ ] Test lazy loading performance
- [ ] Test responsive image scaling
- [ ] Verify no placeholder gradients visible
- [ ] Check Lighthouse performance score

### **Phase 5: Cleanup**
- [ ] Remove all `seed` prop usage
- [ ] Remove placeholder gradient logic
- [ ] Update documentation
- [ ] Commit changes

---

## 🎯 RECOMMENDED IMAGE CATALOG

### **Products (Wigs)**
1. **Lace Front Wigs** (10 products × 3-4 images each)
   - Body wave
   - Straight
   - Deep wave
   - Curly
   - Kinky straight

2. **Full Lace Wigs** (5 products × 3-4 images each)
   - Natural wave
   - Yaki straight
   - Jerry curl

3. **360 Lace Wigs** (5 products × 3-4 images each)
   - Water wave
   - Loose wave

### **Accessories**
1. **Bonnets** (3-5 products)
2. **Wig Caps** (3-5 products)
3. **Hair Brushes** (2-3 products)
4. **Adhesives** (2-3 products)
5. **Styling Tools** (3-5 products)

### **Hero/Marketing**
1. Main hero (homepage)
2. Collection banners (2-3)
3. Category headers (5-6)
4. Promotional banners (2-3)

---

## 🚀 QUICK START COMMANDS

```bash
# Navigate to project
cd c:\Users\DANE\Documents\website\QueenTEE

# Image folders already created at:
# public/images/hero
# public/images/products
# public/images/accessories
# public/images/categories
# public/images/banners
# public/images/editorial

# Next steps:
# 1. Download images from Unsplash/Pexels
# 2. Optimize using Squoosh.app or TinyPNG
# 3. Place in appropriate folders
# 4. Update data files
# 5. Refactor components
```

---

## 📌 IMPORTANT NOTES

1. **Do not commit large images to Git** - Consider using Git LFS or CDN for production
2. **Always provide alt text** - Critical for accessibility and SEO
3. **Use WebP with JPG fallback** - Better compression, wider support
4. **Lazy load below-the-fold images** - Improves initial page load
5. **Maintain aspect ratios** - Prevents layout shift (CLS)
6. **Test on slow connections** - Ensure graceful loading states

---

## 🔗 USEFUL RESOURCES

- **Unsplash**: https://unsplash.com/s/photos/black-woman-hair
- **Pexels**: https://www.pexels.com/search/african%20american%20hair/
- **Squoosh (Image Optimizer)**: https://squoosh.app
- **TinyPNG**: https://tinypng.com
- **WebP Converter**: https://cloudconvert.com/webp-converter

---

**Next Action**: Download and optimize images, then update data structures.
