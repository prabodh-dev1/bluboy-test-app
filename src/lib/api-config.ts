import { Environment } from './firebase-config';

export interface ApiConfig {
  baseUrl: string;
  appKey: string;
}

export const getApiConfig = (environment: Environment): ApiConfig => {
  const baseUrl = environment === 'test' 
    ? 'https://bluboy.ddns.net/test1'
    : 'https://bluboy.ddns.net/prod1';
    
  return {
    baseUrl,
    appKey: 'test-key' // Using the same app-key for both environments as shown in the example
  };
};

export interface Tournament {
  id: string;
  name: string;
  game_id: number;
  start: number; // epoch time
  end: number; // epoch time
  status: string;
  entry_fee?: number;
  prize_pool?: number;
  max_players?: number;
  current_players?: number;
  [key: string]: any; // For additional properties
}

export interface AppConfigResponse {
  success: boolean;
  message: string;
  error: string | null;
  appConfig: Array<{
    configName: string;
    configValue: string;
  }>;
  tournaments: Tournament[];
  games: Array<{
    id: number;
    name: string;
    [key: string]: any;
  }>;
}

export class ApiService {
  private config: ApiConfig;
  private environment: Environment;

  constructor(environment: Environment) {
    this.environment = environment;
    this.config = getApiConfig(environment);
  }

  private getHeaders(authToken: string): HeadersInit {
    return {
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Authorization': authToken,
      'Connection': 'keep-alive',
      'NOTIFICATION-PERMISSION-STATUS': 'true',
      'User-Agent': 'TambolaMultiPlayerApp/1.0.0',
      'app-key': this.config.appKey,
      'client-time': Math.floor(Date.now() / 1000).toString()
    };
  }

  async getAppConfig(authToken: string): Promise<AppConfigResponse> {
    // Use local API proxy to bypass CORS
    const url = `/api/proxy/app/config?environment=${this.environment}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(authToken)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed: ${response.status} ${response.statusText}`);
      }

      const data: AppConfigResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching app config:', error);
      throw error;
    }
  }

  async getTambolaTournaments(authToken: string): Promise<Tournament[]> {
    const appConfig = await this.getAppConfig(authToken);
    
    // Filter tournaments for Tambola (game_id: 7)
    const tambolaTournaments = appConfig.tournaments.filter(
      tournament => tournament.game_id === 7
    );

    // Sort by start time (earliest first)
    tambolaTournaments.sort((a, b) => a.start - b.start);

    return tambolaTournaments;
  }

  async getUpcomingTambolaTournaments(authToken: string): Promise<Tournament[]> {
    const tournaments = await this.getTambolaTournaments(authToken);
    const currentTime = Math.floor(Date.now() / 1000);

    // Filter for upcoming tournaments (start time is in the future)
    return tournaments.filter(tournament => tournament.start > currentTime);
  }

  async getActiveTambolaTournaments(authToken: string): Promise<Tournament[]> {
    const tournaments = await this.getTambolaTournaments(authToken);
    const currentTime = Math.floor(Date.now() / 1000);

    // Filter for active tournaments (current time is between start and end)
    return tournaments.filter(tournament => 
      tournament.start <= currentTime && tournament.end > currentTime
    );
  }

  getEnvironment(): Environment {
    return this.environment;
  }

  switchEnvironment(newEnvironment: Environment): void {
    this.environment = newEnvironment;
    this.config = getApiConfig(newEnvironment);
  }
}

