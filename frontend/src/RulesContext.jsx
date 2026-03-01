import React, { createContext, useContext, useState } from "react";

const RulesContext = createContext();

export function RulesProvider({ children }) {
  const [accepted, setAccepted] = useState(false);
  return (
    <RulesContext.Provider value={{ accepted, setAccepted }}>
      {children}
    </RulesContext.Provider>
  );
}

export function useRules() {
  return useContext(RulesContext);
}