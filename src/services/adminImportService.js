import { supabase } from '../lib/supabaseClient';

export async function uploadCSVImport(file, options) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-products-csv`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Import failed');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('CSV import error:', error);
    throw error;
  }
}

export async function getImportLogs(limit = 20) {
  try {
    const { data, error } = await supabase
      .from('product_import_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching import logs:', error);
    throw error;
  }
}

export async function getImportLogById(id) {
  try {
    const { data, error } = await supabase
      .from('product_import_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching import log:', error);
    throw error;
  }
}

export function validateImportOptions(options) {
  const errors = [];

  if (!['upsert', 'full_sync', 'inventory_only', 'pricing_only'].includes(options.mode)) {
    errors.push('Invalid import mode');
  }

  if (typeof options.dryRun !== 'boolean') {
    errors.push('dryRun must be a boolean');
  }

  if (typeof options.autoCreateCategories !== 'boolean') {
    errors.push('autoCreateCategories must be a boolean');
  }

  if (typeof options.autoCreateCollections !== 'boolean') {
    errors.push('autoCreateCollections must be a boolean');
  }

  if (typeof options.replaceImages !== 'boolean') {
    errors.push('replaceImages must be a boolean');
  }

  if (typeof options.replaceCollections !== 'boolean') {
    errors.push('replaceCollections must be a boolean');
  }

  if (typeof options.archiveMissing !== 'boolean') {
    errors.push('archiveMissing must be a boolean');
  }

  return errors;
}

export function getDefaultImportOptions() {
  return {
    mode: 'upsert',
    dryRun: true,
    autoCreateCategories: false,
    autoCreateCollections: false,
    replaceImages: false,
    replaceCollections: false,
    archiveMissing: false,
  };
}

export function formatImportReport(report) {
  if (!report) return null;

  return {
    summary: {
      total: report.totalRows,
      valid: report.validRows,
      invalid: report.invalidRows,
      created: report.productsCreated,
      updated: report.productsUpdated,
      failed: report.failedRows?.length || 0,
    },
    details: {
      products: {
        created: report.productsCreated,
        updated: report.productsUpdated,
      },
      variants: {
        created: report.variantsCreated,
        updated: report.variantsUpdated,
      },
      inventory: {
        updated: report.inventoryUpdated,
      },
      categories: {
        created: report.categoriesCreated,
      },
      collections: {
        created: report.collectionsCreated,
      },
      images: {
        created: report.imagesCreated,
        updated: report.imagesUpdated,
      },
    },
    errors: report.errors || [],
    warnings: report.warnings || [],
    failedRows: report.failedRows || [],
  };
}

export function getImportStatusColor(status) {
  switch (status) {
    case 'success':
      return 'green';
    case 'partial':
      return 'yellow';
    case 'failed':
      return 'red';
    default:
      return 'gray';
  }
}

export function getImportStatusText(report) {
  if (!report) return 'Unknown';

  const failed = report.failedRows?.length || 0;
  const total = report.totalRows;

  if (failed === 0 && total > 0) {
    return 'Success';
  } else if (failed > 0 && failed < total) {
    return 'Partial Success';
  } else if (failed === total) {
    return 'Failed';
  } else {
    return 'Unknown';
  }
}

export function calculateImportStats(logs) {
  if (!logs || logs.length === 0) {
    return {
      totalImports: 0,
      totalProducts: 0,
      totalVariants: 0,
      successRate: 0,
    };
  }

  const totalImports = logs.length;
  const totalProducts = logs.reduce((sum, log) => sum + (log.products_created || 0) + (log.products_updated || 0), 0);
  const totalVariants = logs.reduce((sum, log) => sum + (log.variants_created || 0) + (log.variants_updated || 0), 0);
  const successCount = logs.reduce((sum, log) => sum + (log.success_count || 0), 0);
  const totalRows = logs.reduce((sum, log) => sum + (log.total_rows || 0), 0);
  const successRate = totalRows > 0 ? (successCount / totalRows) * 100 : 0;

  return {
    totalImports,
    totalProducts,
    totalVariants,
    successRate: Math.round(successRate),
  };
}
