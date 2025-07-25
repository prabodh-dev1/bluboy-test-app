'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MultiPlayerAuth } from '@/components/MultiPlayerAuth';
import { EnvironmentSwitcher } from '@/components/EnvironmentSwitcher';
import { TournamentList } from '@/components/TournamentList';
import { AuthenticatedUser } from '@/types/auth';
import { 
  GamepadIcon, 
  Users, 
  Settings, 
  Trophy,
  AlertCircle,
  Info
} from 'lucide-react';

export default function Dashboard() {
  const { 
    currentEnvironment, 
    authenticatedUsers, 
    setAuthenticatedUsers,
    error: authError 
  } = useAuth();

  const handleUsersChange = (users: AuthenticatedUser[]) => {
    setAuthenticatedUsers(users);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <GamepadIcon className="h-8 w-8 text-primary-500" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Tambola Multi-Player Testing
                </h1>
                <p className="text-sm text-gray-600">
                  Test multi-player Tambola functionality with multiple authenticated users
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">
                  {authenticatedUsers.length} players signed in
                </span>
              </div>
              <div className={`
                px-3 py-1 rounded-full text-sm font-medium
                ${currentEnvironment === 'test' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
                }
              `}>
                {currentEnvironment.charAt(0).toUpperCase() + currentEnvironment.slice(1)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Global Error Display */}
        {authError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">Authentication Error</span>
            </div>
            <p className="text-red-700 text-sm mt-1">{authError}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <Info className="h-6 w-6 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                How to Test Multi-Player Tambola
              </h3>
              <div className="text-blue-800 space-y-2 text-sm">
                <p><strong>Step 1:</strong> Select your testing environment (Test or Production)</p>
                <p><strong>Step 2:</strong> Sign in multiple players using different Google accounts</p>
                <p><strong>Step 3:</strong> View available Tambola tournaments for the selected environment</p>
                <p><strong>Step 4:</strong> Subscribe players to tournaments and test multi-player functionality</p>
                <p><strong>Note:</strong> Each player will have their own Firebase authentication token for API calls</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Environment & Authentication */}
          <div className="lg:col-span-1 space-y-6">
            {/* Environment Switcher */}
            <EnvironmentSwitcher />

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Testing Status</span>
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Environment:</span>
                  <span className="font-medium text-gray-900">
                    {currentEnvironment.charAt(0).toUpperCase() + currentEnvironment.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Authenticated Players:</span>
                  <span className="font-medium text-gray-900">
                    {authenticatedUsers.length}/4
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">API Endpoint:</span>
                  <span className="font-medium text-gray-900 text-xs">
                    /{currentEnvironment === 'test' ? 'test1' : 'prod1'}/
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Multi-Player Authentication */}
            <MultiPlayerAuth
              environment={currentEnvironment}
              onUsersChange={handleUsersChange}
              maxPlayers={4}
            />

            {/* Tournament List */}
            <TournamentList />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center text-sm text-gray-600">
            <p>
              Tambola Multi-Player Testing App - Built for testing multi-player game functionality
            </p>
            <p className="mt-1">
              Environment: <strong>{currentEnvironment}</strong> | 
              Players: <strong>{authenticatedUsers.length}</strong>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

