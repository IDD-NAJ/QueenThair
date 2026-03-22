import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function InactivityWarning({ countdown, onStayLoggedIn }) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
        {/* Modal */}
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Session Expiring Soon
          </h2>

          {/* Message */}
          <p className="text-center text-gray-600 mb-6">
            You will be automatically logged out due to inactivity in
          </p>

          {/* Countdown */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-lg px-8 py-4 shadow-lg">
              <div className="text-5xl font-bold tabular-nums">
                {countdown}
              </div>
              <div className="text-sm font-medium text-amber-100 text-center mt-1">
                seconds
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-center text-gray-500 mb-6">
            Click the button below to stay logged in and continue your session.
          </p>

          {/* Action Button */}
          <Button
            onClick={onStayLoggedIn}
            variant="primary"
            size="lg"
            fullWidth
            className="shadow-lg"
          >
            Stay Logged In
          </Button>

          {/* Footer */}
          <p className="text-xs text-center text-gray-400 mt-4">
            For your security, we automatically log you out after 5 minutes of inactivity.
          </p>
        </div>
      </div>
    </>
  );
}
