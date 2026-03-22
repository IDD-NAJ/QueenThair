import { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, XCircle, FileText, Settings, History } from 'lucide-react';
import { uploadCSVImport, getImportLogs, formatImportReport, getDefaultImportOptions, validateImportOptions } from '../../services/adminImportService';
import { downloadCSVTemplate, parseCSVFile, exportFailedRows, generateInstructionsHTML } from '../../services/csvTemplateService';

const IMPORT_STATES = {
  IDLE: 'idle',
  PARSING: 'parsing',
  VALIDATING: 'validating',
  PREVIEW: 'preview',
  IMPORTING: 'importing',
  SUCCESS: 'success',
  PARTIAL: 'partial',
  FAILED: 'failed',
};

export default function ProductImportPage() {
  const [state, setState] = useState(IMPORT_STATES.IDLE);
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [importOptions, setImportOptions] = useState(getDefaultImportOptions());
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [importLogs, setImportLogs] = useState([]);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setState(IMPORT_STATES.PARSING);

    try {
      const rows = await parseCSVFile(selectedFile);
      setParsedData(rows);
      setState(IMPORT_STATES.IDLE);
    } catch (err) {
      setError(`Failed to parse CSV: ${err.message}`);
      setState(IMPORT_STATES.FAILED);
    }
  };

  const handleValidate = async () => {
    if (!file || !parsedData) return;

    const optionErrors = validateImportOptions(importOptions);
    if (optionErrors.length > 0) {
      setError(optionErrors.join(', '));
      return;
    }

    setState(IMPORT_STATES.VALIDATING);
    setError(null);

    try {
      const result = await uploadCSVImport(file, { ...importOptions, dryRun: true });
      setReport(formatImportReport(result.report));
      setState(IMPORT_STATES.PREVIEW);
    } catch (err) {
      setError(`Validation failed: ${err.message}`);
      setState(IMPORT_STATES.FAILED);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setState(IMPORT_STATES.IMPORTING);
    setError(null);

    try {
      const result = await uploadCSVImport(file, { ...importOptions, dryRun: false });
      const formattedReport = formatImportReport(result.report);
      setReport(formattedReport);

      if (formattedReport.summary.failed === 0) {
        setState(IMPORT_STATES.SUCCESS);
      } else if (formattedReport.summary.failed < formattedReport.summary.total) {
        setState(IMPORT_STATES.PARTIAL);
      } else {
        setState(IMPORT_STATES.FAILED);
      }

      loadImportHistory();
    } catch (err) {
      setError(`Import failed: ${err.message}`);
      setState(IMPORT_STATES.FAILED);
    }
  };

  const handleReset = () => {
    setState(IMPORT_STATES.IDLE);
    setFile(null);
    setParsedData(null);
    setReport(null);
    setError(null);
  };

  const loadImportHistory = async () => {
    try {
      const logs = await getImportLogs(10);
      setImportLogs(logs);
    } catch (err) {
      console.error('Failed to load import history:', err);
    }
  };

  const toggleHistory = async () => {
    if (!showHistory) {
      await loadImportHistory();
    }
    setShowHistory(!showHistory);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Product CSV Import</h1>
        <p className="mt-2 text-gray-600">
          Upload a CSV file to create or update products in bulk
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Upload CSV File</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadCSVTemplate(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Template
                </button>
                <button
                  onClick={() => downloadCSVTemplate(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  With Samples
                </button>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
                disabled={state === IMPORT_STATES.IMPORTING}
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {file ? file.name : 'Click to upload CSV file'}
                </p>
                <p className="text-xs text-gray-500">
                  {file ? `${parsedData?.length || 0} rows parsed` : 'CSV files only'}
                </p>
              </label>
            </div>

            {parsedData && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-900">
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">
                    {parsedData.length} rows ready for import
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">Import Options</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Import Mode
                </label>
                <select
                  value={importOptions.mode}
                  onChange={(e) => setImportOptions({ ...importOptions, mode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={state === IMPORT_STATES.IMPORTING}
                >
                  <option value="upsert">Upsert (Create/Update)</option>
                  <option value="full_sync">Full Sync (Replace)</option>
                  <option value="inventory_only">Inventory Only</option>
                  <option value="pricing_only">Pricing Only</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.autoCreateCategories}
                    onChange={(e) => setImportOptions({ ...importOptions, autoCreateCategories: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    disabled={state === IMPORT_STATES.IMPORTING}
                  />
                  <span className="text-sm text-gray-700">Auto-create categories</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.autoCreateCollections}
                    onChange={(e) => setImportOptions({ ...importOptions, autoCreateCollections: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    disabled={state === IMPORT_STATES.IMPORTING}
                  />
                  <span className="text-sm text-gray-700">Auto-create collections</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.replaceImages}
                    onChange={(e) => setImportOptions({ ...importOptions, replaceImages: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    disabled={state === IMPORT_STATES.IMPORTING}
                  />
                  <span className="text-sm text-gray-700">Replace product images</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importOptions.replaceCollections}
                    onChange={(e) => setImportOptions({ ...importOptions, replaceCollections: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    disabled={state === IMPORT_STATES.IMPORTING}
                  />
                  <span className="text-sm text-gray-700">Replace collections</span>
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              {state === IMPORT_STATES.IDLE && parsedData && (
                <button
                  onClick={handleValidate}
                  className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Validate & Preview
                </button>
              )}

              {state === IMPORT_STATES.PREVIEW && (
                <>
                  <button
                    onClick={handleImport}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Commit Import
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}

              {state === IMPORT_STATES.IMPORTING && (
                <button
                  disabled
                  className="flex-1 bg-purple-400 text-white px-6 py-3 rounded-lg font-medium cursor-not-allowed"
                >
                  Importing...
                </button>
              )}

              {(state === IMPORT_STATES.SUCCESS || state === IMPORT_STATES.PARTIAL || state === IMPORT_STATES.FAILED) && (
                <button
                  onClick={handleReset}
                  className="flex-1 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  New Import
                </button>
              )}
            </div>
          </div>

          {report && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Import Report</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-900">{report.summary.total}</div>
                  <div className="text-sm text-blue-700">Total Rows</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-900">{report.summary.valid}</div>
                  <div className="text-sm text-green-700">Valid Rows</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-900">{report.summary.created + report.summary.updated}</div>
                  <div className="text-sm text-yellow-700">Processed</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-900">{report.summary.failed}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Products Created:</span>
                      <span className="ml-2 font-medium">{report.details.products.created}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Products Updated:</span>
                      <span className="ml-2 font-medium">{report.details.products.updated}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Variants Created:</span>
                      <span className="ml-2 font-medium">{report.details.variants.created}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Variants Updated:</span>
                      <span className="ml-2 font-medium">{report.details.variants.updated}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Inventory Updated:</span>
                      <span className="ml-2 font-medium">{report.details.inventory.updated}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Categories Created:</span>
                      <span className="ml-2 font-medium">{report.details.categories.created}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Collections Created:</span>
                      <span className="ml-2 font-medium">{report.details.collections.created}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Images Created/Updated:</span>
                      <span className="ml-2 font-medium">{report.details.images.created + report.details.images.updated}</span>
                    </div>
                  </div>
                </div>

                {report.errors.length > 0 && (
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <h3 className="font-semibold text-red-900 mb-3">Validation Errors</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {report.errors.map((err, idx) => (
                        <div key={idx} className="text-sm text-red-700">
                          <span className="font-medium">Row {err.row}:</span> {err.message}
                          {err.field && <span className="text-red-600"> ({err.field})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {report.failedRows.length > 0 && (
                  <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-yellow-900">Failed Rows</h3>
                      <button
                        onClick={() => exportFailedRows(report.failedRows)}
                        className="text-sm text-yellow-700 hover:text-yellow-900 underline"
                      >
                        Export Failed Rows
                      </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {report.failedRows.map((failed, idx) => (
                        <div key={idx} className="text-sm text-yellow-700">
                          <span className="font-medium">Row {failed.row}:</span> {failed.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {report.warnings.length > 0 && (
                  <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                    <h3 className="font-semibold text-yellow-900 mb-3">Warnings</h3>
                    <div className="space-y-1">
                      {report.warnings.map((warning, idx) => (
                        <div key={idx} className="text-sm text-yellow-700">
                          {warning}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex items-center justify-between mb-4"
            >
              <h2 className="text-lg font-semibold text-gray-900">Instructions</h2>
              <AlertCircle className="w-5 h-5 text-gray-400" />
            </button>
            
            {showInstructions && (
              <div
                className="prose prose-sm max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: generateInstructionsHTML() }}
              />
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <button
              onClick={toggleHistory}
              className="w-full flex items-center justify-between mb-4"
            >
              <h2 className="text-lg font-semibold text-gray-900">Import History</h2>
              <History className="w-5 h-5 text-gray-400" />
            </button>

            {showHistory && (
              <div className="space-y-3">
                {importLogs.length === 0 ? (
                  <p className="text-sm text-gray-500">No import history yet</p>
                ) : (
                  importLogs.map((log) => (
                    <div key={log.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {log.filename}
                        </div>
                        {log.failure_count === 0 ? (
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : log.success_count > 0 ? (
                          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Mode: {log.import_mode}</div>
                        <div>Success: {log.success_count} / {log.total_rows}</div>
                        <div>{new Date(log.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
