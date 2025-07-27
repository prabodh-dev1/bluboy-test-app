import { NextRequest, NextResponse } from 'next/server';

interface CalledNumbersResponse {
  success: boolean;
  message: string;
  tournamentId: string;
  calledNumbers: number[];
  latestNumber?: number;
  totalCalled: number;
  timestamp: number;
}

interface AddNumberRequest {
  tournamentId: string;
  number: number;
  userToken: string;
  environment: 'test' | 'production';
}

// Mock storage for called numbers (in real app, this would be a database)
const mockCalledNumbers = new Map<string, number[]>();
const mockTournamentStatus = new Map<string, { isActive: boolean; startTime: number }>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const userToken = request.headers.get('authorization');

    if (!tournamentId || !userToken) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required parameters: tournamentId or authorization header' 
        },
        { status: 400 }
      );
    }

    console.log(`Retrieving called numbers for tournament ${tournamentId}`);

    // In a real implementation, this would:
    // 1. Validate the user token
    // 2. Check if the tournament exists and is active
    // 3. Retrieve called numbers from database
    // 4. Return the current state

    // Initialize if not exists
    if (!mockCalledNumbers.has(tournamentId)) {
      mockCalledNumbers.set(tournamentId, []);
      mockTournamentStatus.set(tournamentId, { 
        isActive: true, 
        startTime: Date.now() 
      });
    }

    const calledNumbers = mockCalledNumbers.get(tournamentId) || [];
    const latestNumber = calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1] : undefined;

    const response: CalledNumbersResponse = {
      success: true,
      message: 'Called numbers retrieved successfully',
      tournamentId,
      calledNumbers,
      latestNumber,
      totalCalled: calledNumbers.length,
      timestamp: Date.now()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Called numbers retrieval error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: AddNumberRequest = await request.json();
    const { tournamentId, number, userToken, environment } = body;

    if (!tournamentId || number === undefined || !userToken) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: tournamentId, number, userToken' 
        },
        { status: 400 }
      );
    }

    // Validate number range
    if (number < 1 || number > 90) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Number must be between 1 and 90' 
        },
        { status: 400 }
      );
    }

    console.log(`Adding called number ${number} to tournament ${tournamentId}`);

    // In a real implementation, this would:
    // 1. Validate the user token and permissions (only game host can call numbers)
    // 2. Check if the tournament is active
    // 3. Verify the number hasn't been called already
    // 4. Add the number to the database
    // 5. Notify all players via WebSocket/SSE
    // 6. Check for auto-claims

    // Get or initialize called numbers
    const calledNumbers = mockCalledNumbers.get(tournamentId) || [];

    // Check if number already called
    if (calledNumbers.includes(number)) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Number ${number} has already been called` 
        },
        { status: 400 }
      );
    }

    // Add the number
    calledNumbers.push(number);
    mockCalledNumbers.set(tournamentId, calledNumbers);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const response: CalledNumbersResponse = {
      success: true,
      message: `Number ${number} called successfully`,
      tournamentId,
      calledNumbers,
      latestNumber: number,
      totalCalled: calledNumbers.length,
      timestamp: Date.now()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Add called number error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const userToken = request.headers.get('authorization');

    if (!tournamentId || !userToken) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required parameters: tournamentId or authorization header' 
        },
        { status: 400 }
      );
    }

    console.log(`Resetting called numbers for tournament ${tournamentId}`);

    // In a real implementation, this would:
    // 1. Validate the user token and permissions (only game host can reset)
    // 2. Clear all called numbers for the tournament
    // 3. Reset all player tickets
    // 4. Notify all players

    // Reset called numbers
    mockCalledNumbers.set(tournamentId, []);

    return NextResponse.json({
      success: true,
      message: 'Called numbers reset successfully',
      tournamentId,
      calledNumbers: [],
      totalCalled: 0,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Reset called numbers error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Auto-generate numbers for demo purposes
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const count = parseInt(searchParams.get('count') || '1');
    const userToken = request.headers.get('authorization');

    if (!tournamentId || !userToken) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required parameters: tournamentId or authorization header' 
        },
        { status: 400 }
      );
    }

    if (count < 1 || count > 10) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Count must be between 1 and 10' 
        },
        { status: 400 }
      );
    }

    console.log(`Auto-generating ${count} numbers for tournament ${tournamentId}`);

    const calledNumbers = mockCalledNumbers.get(tournamentId) || [];
    const availableNumbers = Array.from({ length: 90 }, (_, i) => i + 1)
      .filter(num => !calledNumbers.includes(num));

    if (availableNumbers.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'All numbers have been called' 
        },
        { status: 400 }
      );
    }

    const numbersToAdd = Math.min(count, availableNumbers.length);
    const newNumbers: number[] = [];

    for (let i = 0; i < numbersToAdd; i++) {
      const randomIndex = Math.floor(Math.random() * availableNumbers.length);
      const number = availableNumbers.splice(randomIndex, 1)[0];
      newNumbers.push(number);
      calledNumbers.push(number);
    }

    mockCalledNumbers.set(tournamentId, calledNumbers);

    return NextResponse.json({
      success: true,
      message: `Generated ${numbersToAdd} new numbers`,
      tournamentId,
      calledNumbers,
      newNumbers,
      latestNumber: newNumbers[newNumbers.length - 1],
      totalCalled: calledNumbers.length,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Auto-generate numbers error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

