# Add Individual Images to "Shop by Category" Section

## ✅ Code Updated

The HomePage.jsx has been updated to use local image paths instead of Unsplash URLs.

## Next Steps: Add Your Images

### 1. Place Your Images

Add your category images to: `public/images/categories/`

Required image files:
- `full-lace-wigs.jpg` - For Full Lace Wigs category
- `lace-front-wigs.jpg` - For Lace Front Wigs category  
- `360-lace-wigs.jpg` - For 360 Lace Wigs category
- `headband-wigs.jpg` - For Headband Wigs category
- `closure-wigs.jpg` - For Closures & Frontals category
- `hair-extensions.jpg` - For Hair Extensions category
- `hair-clips.jpg` - For Hair Clips category
- `wig-caps.jpg` - For Wig Caps category
- `bonnets-caps.jpg` - For Bonnets & Caps category
- `storage-care.jpg` - For Storage & Care category
- `styling-products.jpg` - For Styling Products category
- `accessories.jpg` - For Accessories category

### 2. Image Specifications

- **Format**: JPG, PNG, or WebP
- **Size**: 800x1000px recommended (4:5 aspect ratio)
- **Quality**: Optimized for web (under 500KB per image)
- **Naming**: Use lowercase with hyphens as shown above

### 3. How It Works

The code now follows this priority:
1. **Database image_url** (if set in your categories table)
2. **Local image** from `/images/categories/[slug].jpg`
3. **Fallback Unsplash image** (if local image missing)

### 4. Example Directory Structure

```
public/
└── images/
    └── categories/
        ├── full-lace-wigs.jpg
        ├── lace-front-wigs.jpg
        ├── 360-lace-wigs.jpg
        ├── headband-wigs.jpg
        ├── closure-wigs.jpg
        ├── hair-extensions.jpg
        ├── hair-clips.jpg
        ├── wig-caps.jpg
        ├── bonnets-caps.jpg
        ├── storage-care.jpg
        ├── styling-products.jpg
        └── accessories.jpg
```

### 5. Alternative: Use Different Image Formats

If you prefer PNG or WebP, update the paths in HomePage.jsx:

```javascript
'full-lace-wigs': '/images/categories/full-lace-wigs.png',
// or
'full-lace-wigs': '/images/categories/full-lace-wigs.webp',
```

### 6. Testing

After adding images:
1. Refresh your browser
2. Navigate to homepage
3. Check "Shop by Category" section
4. Images should appear with hover effects

### 7. Troubleshooting

**Images not showing?**
- Verify file names match exactly (case-sensitive)
- Check images are in the correct folder
- Open browser DevTools and check Network tab for 404 errors

**Want different images for specific categories?**
- Just replace the individual image file
- Or update the path in HomePage.jsx line 174-185

**Need to add more categories?**
- Add new image to categories folder
- Add new entry to categoryImages object in HomePage.jsx

---

**Status**: ✅ Code ready - just add your images to `public/images/categories/`
