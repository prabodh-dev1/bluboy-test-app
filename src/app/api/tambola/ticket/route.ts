import { NextRequest, NextResponse } from 'next/server';

interface TicketRequest {
  tournamentId: string;
  userId: string;
  userToken: string;
  environment: 'test' | 'production';
}

interface TicketResponse {
  success: boolean;
  message: string;
  ticket?: {
    id: string;
    numbers: (number | null)[][];
    tournamentId: string;
    userId: string;
    createdAt: number;
    isActive: boolean;
  };
  calledNumbers?: number[];
}

interface UpdateTicketRequest {
  ticketId: string;
  markedNumbers: number[];
  userToken: string;
}

// Mock storage for tickets (in real app, this would be a database)
const mockTickets = new Map<string, any>();
const mockCalledNumbers = new Map<string, number[]>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const userId = searchParams.get('userId');
    const userToken = request.headers.get('authorization');

    if (!tournamentId || !userId || !userToken) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required parameters: tournamentId, userId, or authorization header' 
        },
        { status: 400 }
      );
    }

    console.log(`Retrieving ticket for user ${userId} in tournament ${tournamentId}`);

    // In a real implementation, this would:
    // 1. Validate the user token
    // 2. Retrieve the ticket from database
    // 3. Check if the tournament is active
    // 4. Return ticket data and current called numbers

    const ticketKey = `${tournamentId}-${userId}`;
    const ticket = mockTickets.get(ticketKey);

    if (!ticket) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No ticket found for this user in the tournament' 
        },
        { status: 404 }
      );
    }

    // Get called numbers for this tournament
    const calledNumbers = mockCalledNumbers.get(tournamentId) || [];

    const response: TicketResponse = {
      success: true,
      message: 'Ticket retrieved successfully',
      ticket,
      calledNumbers
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Ticket retrieval error:', error);
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

export async function PUT(request: NextRequest) {
  try {
    const body: UpdateTicketRequest = await request.json();
    const { ticketId, markedNumbers, userToken } = body;

    if (!ticketId || !markedNumbers || !userToken) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: ticketId, markedNumbers, userToken' 
        },
        { status: 400 }
      );
    }

    console.log(`Updating ticket ${ticketId} with marked numbers:`, markedNumbers);

    // In a real implementation, this would:
    // 1. Validate the user token
    // 2. Verify the user owns this ticket
    // 3. Update the marked numbers in database
    // 4. Validate marked numbers against called numbers
    // 5. Check for auto-claims

    // For now, just acknowledge the update
    await new Promise(resolve => setTimeout(resolve, 200));

    return NextResponse.json({
      success: true,
      message: 'Ticket updated successfully',
      markedNumbers,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Ticket update error:', error);
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
    const body: TicketRequest = await request.json();
    const { tournamentId, userId, userToken, environment } = body;

    if (!tournamentId || !userId || !userToken) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: tournamentId, userId, userToken' 
        },
        { status: 400 }
      );
    }

    console.log(`Creating new ticket for user ${userId} in tournament ${tournamentId}`);

    // Generate a new ticket (this logic should match the subscription endpoint)
    const ticket = {
      id: `ticket-${tournamentId}-${userId}-${Date.now()}`,
      numbers: generateTambolaTicket(),
      tournamentId,
      userId,
      createdAt: Date.now(),
      isActive: true
    };

    // Store in mock storage
    const ticketKey = `${tournamentId}-${userId}`;
    mockTickets.set(ticketKey, ticket);

    // Initialize called numbers for tournament if not exists
    if (!mockCalledNumbers.has(tournamentId)) {
      mockCalledNumbers.set(tournamentId, []);
    }

    const response: TicketResponse = {
      success: true,
      message: 'Ticket created successfully',
      ticket,
      calledNumbers: mockCalledNumbers.get(tournamentId) || []
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Ticket creation error:', error);
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

// Helper function to generate Tambola ticket
function generateTambolaTicket(): (number | null)[][] {
  const ticket: (number | null)[][] = Array(3).fill(null).map(() => Array(9).fill(null));
  
  const ranges = [
    [1, 9], [10, 19], [20, 29], [30, 39], [40, 49], 
    [50, 59], [60, 69], [70, 79], [80, 90]
  ];

  for (let col = 0; col < 9; col++) {
    const [min, max] = ranges[col];
    const availableNumbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    
    // Shuffle
    for (let i = availableNumbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableNumbers[i], availableNumbers[j]] = [availableNumbers[j], availableNumbers[i]];
    }
    
    const numbersToPlace = Math.floor(Math.random() * 2) + 1;
    const positions = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, numbersToPlace);
    
    positions.forEach((row, index) => {
      if (index < availableNumbers.length) {
        ticket[row][col] = availableNumbers[index];
      }
    });
  }

  // Ensure each row has exactly 5 numbers
  for (let row = 0; row < 3; row++) {
    const numbersInRow = ticket[row].filter(n => n !== null).length;
    
    if (numbersInRow < 5) {
      const emptyCols = ticket[row].map((n, i) => n === null ? i : -1).filter(i => i !== -1);
      const needed = 5 - numbersInRow;
      
      for (let i = 0; i < needed && i < emptyCols.length; i++) {
        const col = emptyCols[i];
        const [min, max] = ranges[col];
        const availableNumbers = Array.from({ length: max - min + 1 }, (_, j) => min + j)
          .filter(num => !ticket.flat().includes(num));
        
        if (availableNumbers.length > 0) {
          ticket[row][col] = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
        }
      }
    } else if (numbersInRow > 5) {
      const filledCols = ticket[row].map((n, i) => n !== null ? i : -1).filter(i => i !== -1);
      const toRemove = numbersInRow - 5;
      
      for (let i = 0; i < toRemove; i++) {
        const randomIndex = Math.floor(Math.random() * filledCols.length);
        const col = filledCols.splice(randomIndex, 1)[0];
        ticket[row][col] = null;
      }
    }
  }

  return ticket;
}

