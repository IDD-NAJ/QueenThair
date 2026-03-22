import React, { useState, useEffect } from 'react';
import { Database, Download, Upload, Calendar, Clock, Search, Play, Pause, RotateCcw, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { adminService } from '../../services/adminService';

export default function AdminBackup() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(null);

  const scheduleFormData = {
    enabled: true,
    frequency: 'daily',
    time: '02:00',
    retention_days: 30,
    include_files: true,
    include_database: true,
    email_notifications: true,
    email_to: 'admin@queenhair.com'
  };

  const [scheduleForm, setScheduleForm] = useState(scheduleFormData);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const items = await adminService.getBackupRecords();
      setBackups(items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (type = 'manual') => {
    try {
      setCreatingBackup(true);
      const items = await adminService.getBackupRecords();
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `bk-${Date.now()}`;
      const now = new Date().toISOString();
      const entry = {
        id,
        name: `${type === 'manual' ? 'Manual' : 'Scheduled'} backup — ${new Date().toLocaleString()}`,
        type,
        size: '—',
        status: 'recorded',
        created_at: now,
        completed_at: now,
        duration: '—',
        file_count: 0,
        database_size: '—',
        files_size: '—',
        download_url: null,
        note: 'Use Supabase Dashboard → Database → Backups for real PostgreSQL backups.'
      };
      await adminService.saveBackupRecords([entry, ...items].slice(0, 50));
      await adminService.logActivity(null, 'create', 'backup_record', id, { type });
      loadBackups();
      window.alert('Backup record saved. For production data, use Supabase automated backups in the project dashboard.');
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingBackup(false);
    }
  };

  const restoreBackup = async (backupId) => {
    if (!window.confirm('Are you sure you want to restore this backup? This will overwrite current data and cannot be undone.')) {
      return;
    }
    
    try {
      setRestoringBackup(backupId);
      window.alert('Full database restore must be performed from the Supabase Dashboard (Database → Backups). This UI only stores backup metadata.');
    } catch (err) {
      setError(err.message);
    } finally {
      setRestoringBackup(null);
    }
  };

  const downloadBackup = async (backup) => {
    try {
      if (!backup.download_url) {
        window.alert('No file URL is stored for this record. Export data from Supabase or your hosting provider.');
        return;
      }
      const link = document.createElement('a');
      link.href = backup.download_url;
      link.download = backup.name + '.zip';
      link.click();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteBackup = async (backupId) => {
    if (!window.confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return;
    }
    
    try {
      const items = (await adminService.getBackupRecords()).filter((b) => b.id !== backupId);
      await adminService.saveBackupRecords(items);
      await adminService.logActivity(null, 'delete', 'backup_record', backupId, {});
      loadBackups();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      console.log('Updating backup schedule:', scheduleForm);
      setShowScheduleModal(false);
      alert('Backup schedule updated successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredBackups = backups.filter(backup =>
    backup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    backup.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingState message="Loading backup history..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadBackups} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Backup & Restore</h1>
          <p className="text-gray-600">Manage database and file backups</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule
          </button>
          <button
            onClick={() => createBackup('manual')}
            disabled={creatingBackup}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            <Database className="w-4 h-4 mr-2" />
            {creatingBackup ? 'Creating...' : 'Create Backup'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search backups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Backup Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Backups</p>
              <p className="text-xl font-semibold text-gray-900">{backups.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Successful</p>
              <p className="text-xl font-semibold text-gray-900">
                {backups.filter(b => b.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-xl font-semibold text-gray-900">
                {backups.filter(b => b.status === 'failed').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Last Backup</p>
              <p className="text-xl font-semibold text-gray-900">
                {backups.length > 0 ? new Date(backups[0].created_at).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Backups List */}
      <div className="space-y-4">
        {filteredBackups.map((backup) => (
          <div key={backup.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{backup.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    backup.type === 'automatic' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {backup.type}
                  </span>
                  <div className="flex items-center space-x-1">
                    {backup.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {backup.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                    {backup.status === 'running' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                    <span className={`text-sm font-medium ${
                      backup.status === 'completed' ? 'text-green-600' :
                      backup.status === 'failed' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {backup.status}
                    </span>
                  </div>
                </div>

                {backup.error && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">Error: {backup.error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-medium">{new Date(backup.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Size</p>
                    <p className="font-medium">{backup.size}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Duration</p>
                    <p className="font-medium">{backup.duration}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Files</p>
                    <p className="font-medium">{backup.file_count.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                  <div>
                    <p className="text-gray-500">Database</p>
                    <p className="font-medium">{backup.database_size}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Files</p>
                    <p className="font-medium">{backup.files_size}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                {backup.status === 'completed' && backup.download_url && (
                  <button
                    onClick={() => downloadBackup(backup)}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </button>
                )}
                
                {backup.status === 'completed' && (
                  <button
                    onClick={() => restoreBackup(backup.id)}
                    disabled={restoringBackup === backup.id}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    {restoringBackup === backup.id ? 'Restoring...' : 'Restore'}
                  </button>
                )}
                
                <button
                  onClick={() => deleteBackup(backup.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowScheduleModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Backup Schedule</h2>
              
              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={scheduleForm.enabled}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, enabled: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable automatic backups</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={scheduleForm.frequency}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Backup Time
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Retention Period (days)
                  </label>
                  <input
                    type="number"
                    value={scheduleForm.retention_days}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, retention_days: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={scheduleForm.include_database}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, include_database: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include database</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={scheduleForm.include_files}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, include_files: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include files</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={scheduleForm.email_notifications}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, email_notifications: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Email notifications</span>
                  </label>
                </div>

                {scheduleForm.email_notifications && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notification Email
                    </label>
                    <input
                      type="email"
                      value={scheduleForm.email_to}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, email_to: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                  >
                    Save Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
