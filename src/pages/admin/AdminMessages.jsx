import React, { useState, useEffect } from 'react';
import { Mail, Eye, Trash2, CheckCircle } from 'lucide-react';
import { adminService } from '../../services/adminService';
import LoadingState from '../../components/dashboard/LoadingState';
import ErrorState from '../../components/dashboard/ErrorState';
import useStore from '../../store/useStore';
import { format } from 'date-fns';

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('new');
  const showToast = useStore(state => state.showToast);

  useEffect(() => {
    loadMessages();
  }, [filter]);

  const loadMessages = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await adminService.getContactMessages({ status: filter });
      setMessages(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading messages..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadMessages} />;
  }

  const handleMarkAsRead = async (id) => {
    try {
      await adminService.updateContactMessageStatus(id, 'read');
      showToast('Message marked as read');
      loadMessages();
    } catch (err) {
      showToast('Failed to update message status');
    }
  };

  const handleMarkAsClosed = async (id) => {
    try {
      await adminService.updateContactMessageStatus(id, 'closed');
      showToast('Message marked as closed');
      loadMessages();
    } catch (err) {
      showToast('Failed to update message status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await adminService.deleteContactMessage(id);
      showToast('Message deleted');
      loadMessages();
    } catch (err) {
      showToast('Failed to delete message');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Contact Messages</h1>
        <p className="text-sm sm:text-base text-gray-600">{messages.length} messages</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-1 inline-flex flex-wrap gap-1">
        <button
          onClick={() => setFilter('new')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'new' ? 'bg-gold/10 text-purple-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          New
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'read' ? 'bg-gold/10 text-purple-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Read
        </button>
        <button
          onClick={() => setFilter('closed')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'closed' ? 'bg-gold/10 text-purple-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Closed
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-gold/10 text-purple-700' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All
        </button>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {messages.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No {filter !== 'all' ? filter : ''} messages</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {messages.map(message => (
              <div key={message.id} className="p-4 sm:p-6 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{message.subject || 'No Subject'}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        message.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        message.status === 'read' ? 'bg-gray-100 text-gray-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {message.status}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2 break-words">{message.message}</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <span>{message.name}</span>
                      <span>•</span>
                      <span>{message.email}</span>
                      {message.phone && (
                        <>
                          <span>•</span>
                          <span>{message.phone}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{format(new Date(message.created_at), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:ml-4 flex-shrink-0">
                    {message.status === 'new' && (
                      <button 
                        onClick={() => handleMarkAsRead(message.id)}
                        className="p-2 text-gold hover:bg-purple-50 rounded-lg"
                        title="Mark as read"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {message.status !== 'closed' && (
                      <button 
                        onClick={() => handleMarkAsClosed(message.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Mark as closed"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(message.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
