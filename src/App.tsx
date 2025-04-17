import React, { useState, useEffect } from "react";
import './App.css';

// Define types for the props
interface StarsDisplayProps {
  count: number;
}

interface PlayNumberProps {
  number: number;
  status: keyof typeof colors;
  onClick: (num: number, status: keyof typeof colors) => void;
}

interface PlayAgainProps {
  gameStatus: "won" | "lost" | "active";
  onClick: () => void;
}


// ✅ Display Stars
const StarsDisplay: React.FC<StarsDisplayProps> = ({ count }) => (
  <>
    {utils.range(1, count).map((starId) => (
      <div key={starId} className="star" />
    ))}
  </>
);

// ✅ Number Buttons
const PlayNumber: React.FC<PlayNumberProps> = ({ number, status, onClick }) => (
  <button
    className="number"
    style={{ backgroundColor: colors[status] }}
    onClick={() => onClick(number, status)}
  >
    {number}
  </button>
);

// ✅ Play Again Button
const PlayAgain: React.FC<PlayAgainProps> = ({ gameStatus, onClick }) => (
  <div className="game-done">
    <div
      className="message"
      style={{ color: gameStatus === "lost" ? "red" : "green" }}
    >
      {gameStatus === "lost" ? "Game Over" : "Nice"}
    </div>
    <button onClick={onClick}>Play Again</button>
  </div>
);

// ✅ Game Hook (State Management)
const useGameState = (timeLimit: number = 10) => {
  const [stars, setStars] = useState(() => utils.random(1, 9));
  const [availableNums, setAvailableNums] = useState<number[]>(() => utils.range(1, 9));
  const [candidateNums, setCandidateNums] = useState<number[]>([]);
  const [secondsLeft, setSecondsLeft] = useState<number>(timeLimit);

  useEffect(() => {
    if (secondsLeft > 0 && availableNums.length > 0) {
      const timerId = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [secondsLeft, availableNums]);

  const setGameState = (newCandidateNums: number[]) => {
    const candidateSum = utils.sum(newCandidateNums);
    
    if (candidateSum !== stars) {
      setCandidateNums(newCandidateNums);
    } else {
      // Remove used numbers from available numbers
      const newAvailableNums = availableNums.filter(
        (n) => !newCandidateNums.includes(n)
      );
      
      // Generate new stars or end the game
      if (newAvailableNums.length > 0) {
        // Keep trying to generate valid stars
        let attempts = 0;
        let newStars;
        
        do {
          newStars = utils.randomSumIn(newAvailableNums, 9);
          attempts++;
        } while (newStars === 0 && attempts < 10);

        // If we couldn't find a valid sum, pick a single available number
        if (newStars === 0) {
          newStars = newAvailableNums[utils.random(0, newAvailableNums.length - 1)];
        }
        
        setStars(newStars);
        setAvailableNums(newAvailableNums);
        setCandidateNums([]);
      } else {
        // All numbers have been used - game won
        setAvailableNums(newAvailableNums);
        setCandidateNums([]);
      }
    }
  };

  return { stars, availableNums, candidateNums, secondsLeft, setGameState };
};


// ✅ Game Component
interface GameProps {
  startNewGame: () => void;
}

const Game: React.FC<GameProps> = ({ startNewGame }) => {
  const { stars, availableNums, candidateNums, secondsLeft, setGameState } = useGameState();

  // Calculate wrong selections before rendering
  const candidateSum = utils.sum(candidateNums);
  const candidatesAreWrong = candidateSum > stars;
  
  let gameStatus: "won" | "lost" | "active";
  if (secondsLeft === 0) {
    gameStatus = "lost";
  } else if (availableNums.length === 0) {
    gameStatus = "won";
  } else {
    gameStatus = "active";
  }

  const numberStatus = (number: number): keyof typeof colors => {
    if (!availableNums.includes(number)) return "used";
    if (candidateNums.includes(number)) {
      return candidatesAreWrong ? "wrong" : "candidate";
    }
    return "available";
  };

  const onNumberClick = (number: number, currentStatus: keyof typeof colors) => {
    // Prevent clicks if game is not active or number is already used
    if (gameStatus !== "active" || currentStatus === "used") {
      return;
    }

    // Toggle number selection
    const newCandidateNums =
      currentStatus === "available"
        ? [...candidateNums, number].sort((a, b) => a - b) // Keep numbers sorted
        : candidateNums.filter((cn) => cn !== number);

    setGameState(newCandidateNums);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="game">
          <div className="help">Pick 1 or more numbers that sum to the number of stars</div>
          <div className="body">
            <div className="left">
              {gameStatus !== "active" ? (
                <PlayAgain onClick={startNewGame} gameStatus={gameStatus} />
              ) : (
                <StarsDisplay count={stars} />
              )}
            </div>
            <div className="right">
              {utils.range(1, 9).map((number) => (
                <PlayNumber key={number} status={numberStatus(number)} number={number} onClick={onNumberClick} />
              ))}
            </div>
          </div>
          <div className="timer">Time Remaining: {secondsLeft}</div>
        </div>
      </header>
    </div>
  );
};



// ✅ Main App Component
const App: React.FC = () => {
  const [gameId, setGameId] = useState(1);
  return <Game key={gameId} startNewGame={() => setGameId(gameId + 1)} />;
};


// ✅ Color Theme
const colors = {
  available: "lightgray",
  used: "lightgreen",
  wrong: "lightcoral",
  candidate: "deepskyblue",
};

// ✅ Utility Functions
const utils = {
  sum: (arr: number[]): number => arr.reduce((acc, curr) => acc + curr, 0),
  range: (min: number, max: number): number[] => Array.from({ length: max - min + 1 }, (_, i) => min + i),
  random: (min: number, max: number): number => min + Math.floor(Math.random() * (max - min + 1)),
  randomSumIn: (arr: number[], max: number): number => {
    if (arr.length === 0) return 0;
    
    // Generate all possible combinations and their sums
    const sets: number[][] = [[]];
    const sums: Set<number> = new Set();
    
    for (const num of arr) {
      const len = sets.length;
      for (let i = 0; i < len; i++) {
        const subset = [...sets[i], num];
        const sum = utils.sum(subset);
        if (sum <= max) {
          sets.push(subset);
          sums.add(sum);
        }
      }
    }
    
    // Filter valid sums (greater than 0 and less than or equal to max)
    const validSums = Array.from(sums).filter(sum => sum > 0 && sum <= max);
    
    // If no valid sums, return a single number if possible
    if (validSums.length === 0) {
      const singleNumbers = arr.filter(n => n <= max);
      return singleNumbers.length > 0 ? singleNumbers[utils.random(0, singleNumbers.length - 1)] : 0;
    }
    
    return validSums[utils.random(0, validSums.length - 1)];
  },
};

export default App;