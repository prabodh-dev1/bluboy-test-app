'use client';

import React, { useState, useEffect } from 'react';
import { AuthenticatedUser } from '@/types/auth';
import { 
  X, 
  Trophy, 
  Target, 
  CheckCircle, 
  AlertCircle,
  RotateCcw
} from 'lucide-react';

interface TambolaTicketProps {
  user: AuthenticatedUser;
  tournamentId: string;
  onClose: () => void;
}

interface TicketData {
  id: string;
  numbers: (number | null)[][];
  markedNumbers: Set<number>;
}

interface ClaimState {
  fastFive: boolean;
  firstRow: boolean;
  secondRow: boolean;
  thirdRow: boolean;
  fullHouse: boolean;
  secondFullHouse: boolean;
}

export const TambolaTicket: React.FC<TambolaTicketProps> = ({ 
  user, 
  tournamentId, 
  onClose 
}) => {
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [claimState, setClaimState] = useState<ClaimState>({
    fastFive: false,
    firstRow: false,
    secondRow: false,
    thirdRow: false,
    fullHouse: false,
    secondFullHouse: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);

  // Generate a random Tambola ticket
  const generateTicket = (): TicketData => {
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

    // Fill each column with 1-2 numbers per row
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
      id: `ticket-${Date.now()}`,
      numbers: ticket,
      markedNumbers: new Set()
    };
  };

  useEffect(() => {
    // Simulate loading ticket data
    const loadTicket = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTicketData(generateTicket());
      setIsLoading(false);
    };

    loadTicket();
  }, [tournamentId, user.id]);

  // Simulate called numbers for demo
  useEffect(() => {
    const interval = setInterval(() => {
      if (calledNumbers.length < 20) {
        const newNumber = Math.floor(Math.random() * 90) + 1;
        if (!calledNumbers.includes(newNumber)) {
          setCalledNumbers(prev => [...prev, newNumber]);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [calledNumbers]);

  const toggleNumber = (number: number) => {
    if (!ticketData) return;
    
    const newMarkedNumbers = new Set(ticketData.markedNumbers);
    if (newMarkedNumbers.has(number)) {
      newMarkedNumbers.delete(number);
    } else {
      newMarkedNumbers.add(number);
    }
    
    setTicketData({
      ...ticketData,
      markedNumbers: newMarkedNumbers
    });
  };

  const checkRowComplete = (rowIndex: number): boolean => {
    if (!ticketData) return false;
    const row = ticketData.numbers[rowIndex];
    return row.every(num => num === null || ticketData.markedNumbers.has(num));
  };

  const checkFastFive = (): boolean => {
    if (!ticketData) return false;
    return ticketData.markedNumbers.size >= 5;
  };

  const checkFullHouse = (): boolean => {
    if (!ticketData) return false;
    const allNumbers = ticketData.numbers.flat().filter(n => n !== null) as number[];
    return allNumbers.every(num => ticketData.markedNumbers.has(num));
  };

  const handleClaim = async (claimType: keyof ClaimState) => {
    if (!ticketData) return;

    let isValid = false;
    
    switch (claimType) {
      case 'fastFive':
        isValid = checkFastFive() && !claimState.fastFive;
        break;
      case 'firstRow':
        isValid = checkRowComplete(0) && !claimState.firstRow;
        break;
      case 'secondRow':
        isValid = checkRowComplete(1) && !claimState.secondRow;
        break;
      case 'thirdRow':
        isValid = checkRowComplete(2) && !claimState.thirdRow;
        break;
      case 'fullHouse':
        isValid = checkFullHouse() && !claimState.fullHouse;
        break;
      case 'secondFullHouse':
        isValid = checkFullHouse() && claimState.fullHouse && !claimState.secondFullHouse;
        break;
    }

    if (isValid) {
      // Placeholder API call
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setClaimState(prev => ({ ...prev, [claimType]: true }));
        console.log(`${user.displayName} claimed ${claimType} for tournament ${tournamentId}`);
      } catch (error) {
        console.error('Claim failed:', error);
      }
    } else {
      alert(`Cannot claim ${claimType}. Requirements not met or already claimed.`);
    }
  };

  const resetTicket = () => {
    if (ticketData) {
      setTicketData({
        ...ticketData,
        markedNumbers: new Set()
      });
      setClaimState({
        fastFive: false,
        firstRow: false,
        secondRow: false,
        thirdRow: false,
        fullHouse: false,
        secondFullHouse: false
      });
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span>Loading ticket...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!ticketData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-8 h-8 rounded-full"
              />
            )}
            <div>
              <h2 className="text-lg font-semibold">{user.displayName}'s Tambola Ticket</h2>
              <p className="text-sm text-gray-600">Tournament: {tournamentId}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={resetTicket}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket Grid */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-200">
              <h3 className="text-center font-bold text-lg mb-4 text-blue-800">TAMBOLA TICKET</h3>
              <div className="grid grid-cols-9 gap-1 mb-4">
                {/* Column headers */}
                {Array.from({ length: 9 }, (_, i) => (
                  <div key={i} className="text-center text-xs font-medium text-gray-600 py-1">
                    {i === 0 ? '1-9' : i === 8 ? '80-90' : `${i}0-${i}9`}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-9 gap-1">
                {ticketData.numbers.flat().map((number, index) => {
                  const row = Math.floor(index / 9);
                  const col = index % 9;
                  const isMarked = number !== null && ticketData.markedNumbers.has(number);
                  const isCalled = number !== null && calledNumbers.includes(number);
                  
                  return (
                    <div
                      key={`${row}-${col}`}
                      className={`
                        aspect-square flex items-center justify-center text-sm font-medium border-2 rounded cursor-pointer transition-all
                        ${number === null 
                          ? 'bg-gray-100 border-gray-200' 
                          : isMarked 
                            ? 'bg-green-500 text-white border-green-600' 
                            : isCalled
                              ? 'bg-yellow-200 border-yellow-400 text-yellow-800'
                              : 'bg-white border-gray-300 hover:border-blue-400'
                        }
                      `}
                      onClick={() => number && toggleNumber(number)}
                    >
                      {number || ''}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-600">
                  Marked: {ticketData.markedNumbers.size} | 
                  Called: {calledNumbers.length} |
                  Latest: {calledNumbers[calledNumbers.length - 1] || 'None'}
                </p>
              </div>
            </div>
          </div>

          {/* Claim Buttons */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Claim Options</h3>
            
            <div className="space-y-2">
              <ClaimButton
                type="fastFive"
                label="Fast Five"
                description="Mark any 5 numbers"
                isValid={checkFastFive()}
                isClaimed={claimState.fastFive}
                onClaim={() => handleClaim('fastFive')}
              />
              
              <ClaimButton
                type="firstRow"
                label="First Row"
                description="Complete first row"
                isValid={checkRowComplete(0)}
                isClaimed={claimState.firstRow}
                onClaim={() => handleClaim('firstRow')}
              />
              
              <ClaimButton
                type="secondRow"
                label="Second Row"
                description="Complete second row"
                isValid={checkRowComplete(1)}
                isClaimed={claimState.secondRow}
                onClaim={() => handleClaim('secondRow')}
              />
              
              <ClaimButton
                type="thirdRow"
                label="Third Row"
                description="Complete third row"
                isValid={checkRowComplete(2)}
                isClaimed={claimState.thirdRow}
                onClaim={() => handleClaim('thirdRow')}
              />
              
              <ClaimButton
                type="fullHouse"
                label="Full House"
                description="Complete entire ticket"
                isValid={checkFullHouse()}
                isClaimed={claimState.fullHouse}
                onClaim={() => handleClaim('fullHouse')}
              />
              
              <ClaimButton
                type="secondFullHouse"
                label="Second Full House"
                description="For those who missed first"
                isValid={checkFullHouse() && claimState.fullHouse}
                isClaimed={claimState.secondFullHouse}
                onClaim={() => handleClaim('secondFullHouse')}
              />
            </div>

            {/* Called Numbers Display */}
            <div className="mt-6">
              <h4 className="font-medium mb-2">Called Numbers</h4>
              <div className="bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-1">
                  {calledNumbers.map((number, index) => (
                    <span
                      key={index}
                      className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                    >
                      {number}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ClaimButtonProps {
  type: string;
  label: string;
  description: string;
  isValid: boolean;
  isClaimed: boolean;
  onClaim: () => void;
}

const ClaimButton: React.FC<ClaimButtonProps> = ({
  type,
  label,
  description,
  isValid,
  isClaimed,
  onClaim
}) => {
  return (
    <button
      onClick={onClaim}
      disabled={!isValid || isClaimed}
      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
        isClaimed
          ? 'bg-green-100 border-green-300 text-green-800'
          : isValid
            ? 'bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100'
            : 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">{label}</div>
          <div className="text-xs opacity-75">{description}</div>
        </div>
        <div>
          {isClaimed ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : isValid ? (
            <Target className="h-5 w-5 text-blue-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>
    </button>
  );
};

