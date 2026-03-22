import React, { useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { parseCSV, validateProductRow, csvRowToProduct, downloadTemplate } from '../../services/csvService';
import { adminService } from '../../services/adminService';
import { getCategories } from '../../services/categoryService';

export default function CSVUploadModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [successCount, setSuccessCount] = useState(0);
  const [preview, setPreview] = useState([]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setValidationErrors(['Please select a CSV file']);
      return;
    }

    setFile(selectedFile);
    setValidationErrors([]);
    setPreview([]);

    // Preview file
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvText = event.target.result;
        const rows = parseCSV(csvText);
        
        // Show first 5 rows as preview
        setPreview(rows.slice(0, 5));

        // Validate all rows
        const categories = await getCategories();
        const errors = [];
        
        rows.forEach((row, index) => {
          const rowErrors = validateProductRow(row, index, categories);
          errors.push(...rowErrors);
        });

        setValidationErrors(errors);
      } catch (err) {
        setValidationErrors([err.message]);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || validationErrors.length > 0) return;

    setUploading(true);
    setSuccessCount(0);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csvText = event.target.result;
          const rows = parseCSV(csvText);
          const categories = await getCategories();

          // Convert rows to product objects
          const products = rows.map(row => csvRowToProduct(row, categories));

          // Bulk insert
          const inserted = await adminService.bulkInsertProducts(products);
          
          setSuccessCount(inserted.length);
          setTimeout(() => {
            onSuccess();
            handleClose();
          }, 2000);
        } catch (err) {
          setValidationErrors([err.message || 'Failed to upload products']);
        } finally {
          setUploading(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setValidationErrors([err.message || 'Failed to read file']);
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setValidationErrors([]);
    setPreview([]);
    setSuccessCount(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Upload Products via CSV</h2>
            <p className="text-sm text-gray-600 mt-1">Bulk import products from a CSV file</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Download Template */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Need a template?</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Download our CSV template with example data and required columns
                </p>
                <button
                  onClick={downloadTemplate}
                  className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download Template
                </button>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gold transition-colors">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer text-gold hover:text-gold-dark font-medium"
              >
                Choose CSV file
              </label>
              <p className="text-sm text-gray-500 mt-2">or drag and drop</p>
              {file && (
                <p className="text-sm text-gray-700 mt-4 font-medium">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-2">Validation Errors</h3>
                  <ul className="text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900">Upload Successful!</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Successfully uploaded {successCount} product{successCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {preview.length > 0 && validationErrors.length === 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Preview (first 5 rows)</h3>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Name</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Slug</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Category</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Price</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {preview.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2">{row.name}</td>
                        <td className="px-4 py-2 text-gray-600">{row.slug}</td>
                        <td className="px-4 py-2 text-gray-600">{row.category_slug}</td>
                        <td className="px-4 py-2 text-gray-600">${row.base_price}</td>
                        <td className="px-4 py-2 text-gray-600">{row.product_type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || validationErrors.length > 0 || uploading || successCount > 0}
            className="flex items-center gap-2 px-6 py-2 bg-gold text-white rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Products
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
