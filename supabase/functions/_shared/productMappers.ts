type DbProduct = Record<string, any>;

export function entityToDomain(row: DbProduct) {
  if (!row) return null;

  const images = (row.images ?? []).slice().sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const primaryImage = images.find((i: any) => i.is_primary) ?? images[0] ?? null;

  const inventory = row.inventory
    ? {
        ...row.inventory,
        available:
          (row.inventory.quantity_available ?? 0) - (row.inventory.quantity_reserved ?? 0),
        inStock:
          !row.inventory.track_inventory ||
          row.inventory.allow_backorder ||
          (row.inventory.quantity_available ?? 0) - (row.inventory.quantity_reserved ?? 0) > 0,
        isLowStock:
          row.inventory.track_inventory &&
          (row.inventory.quantity_available ?? 0) - (row.inventory.quantity_reserved ?? 0) <=
            (row.inventory.low_stock_threshold ?? 0),
      }
    : null;

  return {
    ...row,
    images,
    primaryImage,
    inventory,
    priceEffective: Number(row.base_price ?? 0),
    imageCount: images.length,
  };
}

export type DtoType = 'list' | 'detail' | 'admin';

export function domainToDTO(domain: any, dtoType: DtoType) {
  if (!domain) {
    throw new Error('domainToDTO: domain object is required');
  }

  const base = {
    id: domain.id,
    name: domain.name,
    slug: domain.slug,
    product_type: domain.product_type,
    base_price: Number(domain.base_price ?? 0),
    compare_at_price:
      domain.compare_at_price != null ? Number(domain.compare_at_price) : null,
    featured: !!domain.featured,
    new_arrival: !!domain.new_arrival,
    best_seller: !!domain.best_seller,
    on_sale: !!domain.on_sale,
    badge: domain.badge ?? null,
    rating_average: Number(domain.rating_average ?? 0),
    review_count: Number(domain.review_count ?? 0),
    short_description: domain.short_description ?? null,
    is_active: !!domain.is_active,
    category: domain.category ?? null,
    primaryImage: domain.primaryImage ?? null,
  };

  if (dtoType === 'list') {
    return base;
  }

  const detail = {
    ...base,
    description: domain.description ?? null,
    seo_title: domain.seo_title ?? null,
    seo_description: domain.seo_description ?? null,
    images: domain.images ?? [],
    variants: domain.variants ?? [],
    inventory: domain.inventory ?? null,
  };

  if (dtoType === 'detail') {
    return detail;
  }

  if (dtoType === 'admin') {
    return {
      ...detail,
      category_id: domain.category_id ?? null,
      created_at: domain.created_at ?? null,
      updated_at: domain.updated_at ?? null,
    };
  }

  throw new Error(`domainToDTO: unsupported dtoType "${dtoType}"`);
}

