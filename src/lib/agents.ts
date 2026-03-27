export const phases = [
  { id: 1, name: "Context" },
  { id: 2, name: "Plan" },
  { id: 3, name: "Create" },
  { id: 4, name: "Build" },
  { id: 5, name: "Test" },
  { id: 6, name: "Heal" },
  { id: 7, name: "Retest" },
  { id: 8, name: "Close" },
];

export const phaseStatusMap: Record<number, string> = {
  1: "todo",
  2: "doing",
  3: "doing",
  4: "doing",
  5: "doing",
  6: "needs_input",
  7: "doing",
  8: "done",
};

export const agentRoleMap: Record<string, string> = {
  Rin: "Lead Orchestrator",
  Sakura: "Artwork Generator",
  Hinata: "Builder",
  Mikasa: "Analyst",
};

export const agentPhaseMap: Record<string, number[]> = {
  Rin: [1, 2, 8],
  Sakura: [3],
  Hinata: [4, 5],
  Mikasa: [6, 7],
};

export const phaseAgentMap: Record<number, string> = Object.entries(agentPhaseMap).reduce<Record<number, string>>(
  (map, [agentName, ownedPhases]) => {
    ownedPhases.forEach((phase) => {
      map[phase] = agentName;
    });
    return map;
  },
  {},
);

export const agentForPhase = (phase: number) => phaseAgentMap[phase] || "Rin";

export const nextPhaseForAgent = (agentName: string, currentPhase: number) => {
  const ownedPhases = agentPhaseMap[agentName] || [];
  const nextOwnedPhase = ownedPhases.find((phase) => phase > currentPhase);
  if (nextOwnedPhase) return nextOwnedPhase;
  return Math.min(currentPhase + 1, 8);
};
