import React, { useState, useEffect } from 'react';
import { Activity, Edit, Trash2, Plus } from 'lucide-react';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import { format } from 'date-fns';
import { adminService } from '../../services/adminService';

export default function AdminActivity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await adminService.getActivities({ limit: 100 });
      setActivities(
        (rows || []).map((row) => ({
          id: row.id,
          action: row.action,
          entity_type: row.entity_type,
          entity_id: row.entity_id,
          details: row.details,
          created_at: row.created_at,
          admin_name: row.profiles
            ? [row.profiles.first_name, row.profiles.last_name].filter(Boolean).join(' ') || 'Admin'
            : 'System'
        }))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const getActionIcon = (action) => {
    switch (action) {
      case 'create': return <Plus className="w-4 h-4" />;
      case 'update': return <Edit className="w-4 h-4" />;
      case 'delete': return <Trash2 className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-700';
      case 'update': return 'bg-blue-100 text-blue-700';
      case 'delete': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <LoadingState message="Loading activity log..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadActivities} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Activity Log</h1>
        <p className="text-sm sm:text-base text-gray-600">Track all admin actions and changes</p>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg border border-gray-200">
        {activities.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm sm:text-base">No activity recorded yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activities.map(activity => (
              <div key={activity.id} className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActionColor(activity.action)}`}>
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">
                        {activity.admin_name}
                      </p>
                      <span className="text-gray-500">•</span>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {format(new Date(activity.created_at), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-gray-700 break-words">
                      <span className="capitalize">{activity.action}</span> {activity.entity_type} 
                      {activity.entity_id && ` (ID: ${activity.entity_id.slice(0, 8)}...)`}
                    </p>
                    {activity.details && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                        {JSON.stringify(activity.details, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
