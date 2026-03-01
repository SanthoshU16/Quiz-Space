import React, { createContext, useContext, useState } from "react";

const ScoreContext = createContext();

export function ScoreProvider({ children }) {
  const [levelScores, setLevelScores] = useState(null);
  return (
    <ScoreContext.Provider value={{ levelScores, setLevelScores }}>
      {children}
    </ScoreContext.Provider>
  );
}

export function useScore() {
  return useContext(ScoreContext);
}
