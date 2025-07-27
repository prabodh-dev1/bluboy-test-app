import { NextRequest, NextResponse } from 'next/server';

interface ClaimRequest {
  tournamentId: string;
  userId: string;
  ticketId: string;
  claimType: 'fast-five' | 'first-row' | 'second-row' | 'third-row' | 'full-house' | 'second-full-house';
  markedNumbers: number[];
  userToken: string;
  environment: 'test' | 'production';
}

interface ClaimResponse {
  success: boolean;
  message: string;
  claimId?: string;
  isValid?: boolean;
  prize?: {
    amount: number;
    currency: string;
  };
  timestamp?: number;
}

// Validate claim based on type and marked numbers
function validateClaim(
  claimType: ClaimRequest['claimType'], 
  markedNumbers: number[], 
  ticketNumbers: (number | null)[][]
): { isValid: boolean; message: string } {
  
  const flatTicketNumbers = ticketNumbers.flat().filter(n => n !== null) as number[];
  
  // Check if all marked numbers are on the ticket
  const invalidNumbers = markedNumbers.filter(num => !flatTicketNumbers.includes(num));
  if (invalidNumbers.length > 0) {
    return {
      isValid: false,
      message: `Invalid numbers marked: ${invalidNumbers.join(', ')}`
    };
  }

  switch (claimType) {
    case 'fast-five':
      if (markedNumbers.length < 5) {
        return {
          isValid: false,
          message: 'Fast Five requires at least 5 marked numbers'
        };
      }
      return { isValid: true, message: 'Valid Fast Five claim' };

    case 'first-row':
    case 'second-row':
    case 'third-row':
      const rowIndex = claimType === 'first-row' ? 0 : claimType === 'second-row' ? 1 : 2;
      const rowNumbers = ticketNumbers[rowIndex].filter(n => n !== null) as number[];
      const rowComplete = rowNumbers.every(num => markedNumbers.includes(num));
      
      if (!rowComplete) {
        return {
          isValid: false,
          message: `${claimType.replace('-', ' ')} is not complete. Missing numbers: ${
            rowNumbers.filter(num => !markedNumbers.includes(num)).join(', ')
          }`
        };
      }
      return { isValid: true, message: `Valid ${claimType.replace('-', ' ')} claim` };

    case 'full-house':
    case 'second-full-house':
      const allComplete = flatTicketNumbers.every(num => markedNumbers.includes(num));
      
      if (!allComplete) {
        return {
          isValid: false,
          message: `Full House is not complete. Missing numbers: ${
            flatTicketNumbers.filter(num => !markedNumbers.includes(num)).join(', ')
          }`
        };
      }
      return { isValid: true, message: `Valid ${claimType.replace('-', ' ')} claim` };

    default:
      return {
        isValid: false,
        message: 'Invalid claim type'
      };
  }
}

// Generate mock ticket for validation (in real app, this would come from database)
function getMockTicket(ticketId: string): (number | null)[][] {
  // This is a simplified mock - in real implementation, retrieve from database
  return [
    [5, null, 23, null, 45, null, 67, null, 89],
    [null, 12, null, 34, null, 56, null, 78, null],
    [8, null, 29, null, 41, null, 63, null, 85]
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body: ClaimRequest = await request.json();
    const { 
      tournamentId, 
      userId, 
      ticketId, 
      claimType, 
      markedNumbers, 
      userToken, 
      environment 
    } = body;

    // Validate required fields
    if (!tournamentId || !userId || !ticketId || !claimType || !markedNumbers || !userToken) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields' 
        },
        { status: 400 }
      );
    }

    // Validate claim type
    const validClaimTypes = ['fast-five', 'first-row', 'second-row', 'third-row', 'full-house', 'second-full-house'];
    if (!validClaimTypes.includes(claimType)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid claim type' 
        },
        { status: 400 }
      );
    }

    console.log(`Processing ${claimType} claim for user ${userId} in tournament ${tournamentId}`);

    // In a real implementation, this would:
    // 1. Validate the user token
    // 2. Retrieve the actual ticket from database
    // 3. Check if the claim type hasn't been claimed already
    // 4. Validate the claim against called numbers
    // 5. Check claim timing and order
    // 6. Award prize if valid
    // 7. Store claim record

    // For now, use mock ticket data
    const ticketNumbers = getMockTicket(ticketId);
    
    // Validate the claim
    const validation = validateClaim(claimType, markedNumbers, ticketNumbers);
    
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        message: validation.message,
        isValid: false
      });
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Generate mock prize amounts
    const prizeAmounts = {
      'fast-five': 100,
      'first-row': 200,
      'second-row': 200,
      'third-row': 200,
      'full-house': 1000,
      'second-full-house': 500
    };

    const response: ClaimResponse = {
      success: true,
      message: `${claimType.replace('-', ' ')} claim accepted successfully!`,
      claimId: `claim-${tournamentId}-${userId}-${claimType}-${Date.now()}`,
      isValid: true,
      prize: {
        amount: prizeAmounts[claimType],
        currency: 'INR'
      },
      timestamp: Date.now()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Claim processing error:', error);
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

    // In a real implementation, this would retrieve claim history from database
    console.log(`Retrieving claim history for user ${userId} in tournament ${tournamentId}`);

    // Mock claim history
    const mockClaimHistory = [
      {
        claimId: `claim-${tournamentId}-${userId}-fast-five-${Date.now() - 300000}`,
        claimType: 'fast-five',
        timestamp: Date.now() - 300000,
        isValid: true,
        prize: { amount: 100, currency: 'INR' }
      }
    ];

    return NextResponse.json({
      success: true,
      claims: mockClaimHistory
    });

  } catch (error) {
    console.error('Claim history retrieval error:', error);
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

