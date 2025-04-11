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
  const [stars, setStars] = useState(utils.random(1, 9));
  const [availableNums, setAvailableNums] = useState<number[]>(utils.range(1, 9));
  const [candidateNums, setCandidateNums] = useState<number[]>([]);
  const [secondsLeft, setSecondsLeft] = useState<number>(timeLimit);

  useEffect(() => {
    if (secondsLeft > 0 && availableNums.length > 0) {
      const timerId = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [secondsLeft, availableNums]);

  const setGameState = (newCandidateNums: number[]) => {
    if (utils.sum(newCandidateNums) !== stars) {
      setCandidateNums(newCandidateNums);
    } else {
      const newAvailableNums = availableNums.filter((n) => !newCandidateNums.includes(n));
      setStars(utils.randomSumIn(newAvailableNums, 9));
      setAvailableNums(newAvailableNums);
      setCandidateNums([]);
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

  const candidatesAreWrong = utils.sum(candidateNums) > stars;
  let gameStatus: "won" | "lost" | "active";
  if (availableNums.length === 0) {
    gameStatus = "won";
  } else if (secondsLeft === 0) {
    gameStatus = "lost";
  } else {
    gameStatus = "active";
  }

  const numberStatus = (number: number): keyof typeof colors => {
    if (!availableNums.includes(number)) return "used";
    if (candidateNums.includes(number)) return candidatesAreWrong ? "wrong" : "candidate";
    return "available";
  };

  const onNumberClick = (number: number, currentStatus: keyof typeof colors) => {
    if (currentStatus === "used" || secondsLeft === 0) return;

    const newCandidateNums =
      currentStatus === "available"
        ? candidateNums.concat(number)
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
    const sets: number[][] = [[]];
    const sums: number[] = [];

    for (const num of arr) {
      const currentSetsLength = sets.length;
      for (let j = 0; j < currentSetsLength; j++) {
        const candidateSet = [...sets[j], num];
        const candidateSum = utils.sum(candidateSet);
        if (candidateSum <= max) {
          sets.push(candidateSet);
          sums.push(candidateSum);
        }
      }
    }
    return sums.length > 0 ? sums[utils.random(0, sums.length - 1)] : 0;
  },
};

export default App;