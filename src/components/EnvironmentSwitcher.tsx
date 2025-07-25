'use client';

import React from 'react';
import { Environment } from '@/lib/firebase-config';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, TestTube, Building } from 'lucide-react';

export const EnvironmentSwitcher: React.FC = () => {
  const { currentEnvironment, setCurrentEnvironment, getActiveUsersCount } = useAuth();

  const handleEnvironmentChange = (env: Environment) => {
    if (env === currentEnvironment) return;
    
    const userCount = getActiveUsersCount();
    if (userCount > 0) {
      const confirmed = window.confirm(
        `Switching environments will sign out all ${userCount} authenticated players. Continue?`
      );
      if (!confirmed) return;
    }
    
    setCurrentEnvironment(env);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Settings className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Environment</h3>
      </div>
      
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Select the environment to test. All players will authenticate against the selected environment.
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Test Environment */}
          <button
            onClick={() => handleEnvironmentChange('test')}
            className={`
              flex items-center space-x-3 p-4 rounded-lg border-2 transition-all
              ${currentEnvironment === 'test'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              }
            `}
          >
            <TestTube className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Test</div>
              <div className="text-xs opacity-75">Development testing</div>
            </div>
          </button>

          {/* Production Environment */}
          <button
            onClick={() => handleEnvironmentChange('production')}
            className={`
              flex items-center space-x-3 p-4 rounded-lg border-2 transition-all
              ${currentEnvironment === 'production'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-green-300 hover:bg-green-50'
              }
            `}
          >
            <Building className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Production</div>
              <div className="text-xs opacity-75">Live environment</div>
            </div>
          </button>
        </div>

        {/* Current Environment Info */}
        <div className={`
          p-3 rounded-lg text-sm
          ${currentEnvironment === 'test'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-green-100 text-green-800'
          }
        `}>
          <div className="font-medium">
            Currently testing: {currentEnvironment.charAt(0).toUpperCase() + currentEnvironment.slice(1)}
          </div>
          <div className="text-xs mt-1 opacity-75">
            API Endpoint: {currentEnvironment === 'test' 
              ? 'https://bluboy.ddns.net/test1' 
              : 'https://bluboy.ddns.net/prod1'
            }
          </div>
        </div>
      </div>
    </div>
  );
};

