'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tournament } from '@/lib/api-config';
import { useApiService } from '@/hooks/useApiService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Trophy, 
  Clock, 
  Users, 
  DollarSign, 
  RefreshCw, 
  Calendar,
  Play,
  AlertCircle
} from 'lucide-react';

export const TournamentList: React.FC = () => {
  const { authenticatedUsers, currentEnvironment } = useAuth();
  const { fetchTambolaTournaments, fetchUpcomingTournaments, isLoading, error } = useApiService();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [upcomingTournaments, setUpcomingTournaments] = useState<Tournament[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadTournaments = useCallback(async () => {
    if (authenticatedUsers.length === 0) {
      // Clear tournaments when no users are authenticated
      setTournaments([]);
      setUpcomingTournaments([]);
      setLastRefresh(null);
      return;
    }

    try {
      const [allTournaments, upcoming] = await Promise.all([
        fetchTambolaTournaments(),
        fetchUpcomingTournaments()
      ]);
      
      setTournaments(allTournaments);
      setUpcomingTournaments(upcoming);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to load tournaments:', err);
    }
  }, [authenticatedUsers, fetchTambolaTournaments, fetchUpcomingTournaments]);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const formatDateTime = (epochTime: number): string => {
    return new Date(epochTime * 1000).toLocaleString();
  };

  const formatTimeRemaining = (epochTime: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const diff = epochTime - now;
    
    if (diff <= 0) return 'Started';
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getTournamentStatus = (tournament: Tournament): { status: string; color: string } => {
    const now = Math.floor(Date.now() / 1000);
    
    if (now < tournament.start) {
      return { status: 'Upcoming', color: 'text-blue-600 bg-blue-100' };
    } else if (now >= tournament.start && now < tournament.end) {
      return { status: 'Active', color: 'text-green-600 bg-green-100' };
    } else {
      return { status: 'Completed', color: 'text-gray-600 bg-gray-100' };
    }
  };

  if (authenticatedUsers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Trophy className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Tambola Tournaments</h3>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Please sign in at least one player to view tournaments
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Trophy className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Tambola Tournaments ({currentEnvironment})
          </h3>
        </div>
        <div className="flex items-center space-x-3">
          {lastRefresh && (
            <span className="text-xs text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={loadTournaments}
            disabled={isLoading}
            className="flex items-center space-x-1 btn-primary text-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div key="error-section" className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800 font-medium">Error loading tournaments</span>
          </div>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Upcoming Tournaments Section */}
      {upcomingTournaments.length > 0 && (
        <div key="upcoming-section" className="mb-8">
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Upcoming Tournaments ({upcomingTournaments.length})</span>
          </h4>
          <div className="grid gap-4">
            {upcomingTournaments.slice(0, 3).map((tournament) => {
              const { status, color } = getTournamentStatus(tournament);
              return (
                <div key={tournament.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-gray-900">{tournament.name}</h5>
                      <p className="text-sm text-gray-600">ID: {tournament.id}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                      {status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div key={`time-${tournament.id}`} className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Starts in {formatTimeRemaining(tournament.start)}</span>
                    </div>
                    <div key={`date-${tournament.id}`} className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{formatDateTime(tournament.start)}</span>
                    </div>
                    {tournament.entry_fee && (
                      <div key={`fee-${tournament.id}`} className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">₹{tournament.entry_fee}</span>
                      </div>
                    )}
                    {tournament.max_players && (
                      <div key={`players-${tournament.id}`} className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {tournament.current_players || 0}/{tournament.max_players}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button className="btn-primary text-sm w-full flex items-center justify-center space-x-1">
                      <Play className="h-4 w-4" />
                      <span>Subscribe for Testing</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Tournaments Section */}
      <div key="all-tournaments-section">
        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center space-x-2">
          <Trophy className="h-4 w-4" />
          <span>All Tambola Tournaments ({tournaments.length})</span>
        </h4>
        
        {tournaments.length === 0 ? (
          <div key="empty-state" className="text-center py-8">
            {isLoading ? (
              <div key="loading-state" className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                <span className="text-gray-600">Loading tournaments...</span>
              </div>
            ) : (
              <p key="no-tournaments" className="text-gray-600">No Tambola tournaments found</p>
            )}
          </div>
        ) : (
          <div key="tournaments-list" className="space-y-3 max-h-96 overflow-y-auto">
            {tournaments.map((tournament) => {
              const { status, color } = getTournamentStatus(tournament);
              return (
                <div key={tournament.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h6 className="font-medium text-gray-900 truncate">{tournament.name}</h6>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                          {status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span key={`id-${tournament.id}`}>ID: {tournament.id}</span>
                        <span key={`start-${tournament.id}`}>Start: {formatDateTime(tournament.start)}</span>
                        <span key={`end-${tournament.id}`}>End: {formatDateTime(tournament.end)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

