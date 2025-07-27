import { NextRequest, NextResponse } from 'next/server';

interface SubscriptionRequest {
  tournamentId: string;
  userId: string;
  userToken: string;
  environment: 'test' | 'production';
}

interface SubscriptionResponse {
  success: boolean;
  message: string;
  ticketId?: string;
  ticketData?: {
    id: string;
    numbers: (number | null)[][];
    tournamentId: string;
    userId: string;
  };
}

// Generate a random Tambola ticket
function generateTambolaTicket(tournamentId: string, userId: string) {
  const ticket: (number | null)[][] = Array(3).fill(null).map(() => Array(9).fill(null));
  
  // Each column has specific number ranges
  const ranges = [
    [1, 9],   // Column 0: 1-9
    [10, 19], // Column 1: 10-19
    [20, 29], // Column 2: 20-29
    [30, 39], // Column 3: 30-39
    [40, 49], // Column 4: 40-49
    [50, 59], // Column 5: 50-59
    [60, 69], // Column 6: 60-69
    [70, 79], // Column 7: 70-79
    [80, 90]  // Column 8: 80-90
  ];

  // Fill each column with numbers
  for (let col = 0; col < 9; col++) {
    const [min, max] = ranges[col];
    const availableNumbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    
    // Shuffle available numbers
    for (let i = availableNumbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableNumbers[i], availableNumbers[j]] = [availableNumbers[j], availableNumbers[i]];
    }
    
    // Place 1-2 numbers in this column
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
      // Add more numbers
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
      // Remove excess numbers
      const filledCols = ticket[row].map((n, i) => n !== null ? i : -1).filter(i => i !== -1);
      const toRemove = numbersInRow - 5;
      
      for (let i = 0; i < toRemove; i++) {
        const randomIndex = Math.floor(Math.random() * filledCols.length);
        const col = filledCols.splice(randomIndex, 1)[0];
        ticket[row][col] = null;
      }
    }
  }

  return {
    id: `ticket-${tournamentId}-${userId}-${Date.now()}`,
    numbers: ticket,
    tournamentId,
    userId
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: SubscriptionRequest = await request.json();
    const { tournamentId, userId, userToken, environment } = body;

    // Validate required fields
    if (!tournamentId || !userId || !userToken) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: tournamentId, userId, userToken' 
        },
        { status: 400 }
      );
    }

    // Simulate subscription process
    console.log(`Processing subscription for user ${userId} to tournament ${tournamentId} in ${environment} environment`);

    // In a real implementation, this would:
    // 1. Validate the user token
    // 2. Check if the tournament exists and is open for subscription
    // 3. Verify the user hasn't already subscribed
    // 4. Process payment if required
    // 5. Generate and store the ticket
    // 6. Return the ticket data

    // For now, simulate a delay and generate a ticket
    await new Promise(resolve => setTimeout(resolve, 1000));

    const ticketData = generateTambolaTicket(tournamentId, userId);

    const response: SubscriptionResponse = {
      success: true,
      message: 'Successfully subscribed to tournament',
      ticketId: ticketData.id,
      ticketData
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Subscription error:', error);
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

    // Simulate unsubscription process
    console.log(`Processing unsubscription for user ${userId} from tournament ${tournamentId}`);

    // In a real implementation, this would:
    // 1. Validate the user token
    // 2. Check if the user is subscribed to the tournament
    // 3. Remove the subscription and ticket
    // 4. Process refund if applicable

    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from tournament'
    });

  } catch (error) {
    console.error('Unsubscription error:', error);
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

