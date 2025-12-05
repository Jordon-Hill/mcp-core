/**
 * MCP v1.1 Legal Routing Graph
 * 
 * Implements: Legal Routing Graph section
 * Only specific routes are permitted. Direct routes are disallowed.
 */

import { Identity, Intent } from "./message";

/**
 * Subsystem identifiers
 */
export type Subsystem =
  | "LDS"
  | "TKD"
  | "MCP"
  | "CRYSTALLINE"
  | "ALIGNMENT"
  | "AGENTS"
  | "PROJECTIONS"
  | "KG";

/**
 * Legal route definition
 */
export interface LegalRoute {
  from: Subsystem;
  to: Subsystem;
  intent: Intent[];
  description: string;
}

/**
 * Legal routing graph as specified in MCP v1.1
 * 
 * Legal routes:
 * - LDS → TKD → MCP → Crystalline
 * - MCP → Alignment (Actor/Judge/Mediator)
 * - MCP → Agents (tool execution) under Alignment supervision
 * - MCP → Projections for scenario generation
 * 
 * Disallowed routes:
 * - Agents → KG
 * - TKD → Agents
 * - Any direct route bypassing MCP
 */
export const LEGAL_ROUTES: LegalRoute[] = [
  {
    from: "LDS",
    to: "TKD",
    intent: ["DATA_INGEST"],
    description: "LDS forwards ingested data to TKD for processing"
  },
  {
    from: "TKD",
    to: "MCP",
    intent: ["DATA_INGEST", "PATTERN_EXTRACTION"],
    description: "TKD sends processed data to MCP for routing"
  },
  {
    from: "MCP",
    to: "CRYSTALLINE",
    intent: ["KG_MUTATION_PROPOSAL", "QUERY"],
    description: "MCP routes KG operations to Crystalline"
  },
  {
    from: "MCP",
    to: "ALIGNMENT",
    intent: ["ALIGNMENT_REVIEW", "ANALYSIS"],
    description: "MCP forwards requests for constitutional review to Alignment"
  },
  {
    from: "MCP",
    to: "AGENTS",
    intent: ["AGENT_EXECUTION"],
    description: "MCP routes agent execution requests under Alignment supervision"
  },
  {
    from: "MCP",
    to: "PROJECTIONS",
    intent: ["PROJECTION_GENERATION"],
    description: "MCP routes projection generation requests"
  },
  {
    from: "ALIGNMENT",
    to: "MCP",
    intent: ["ALIGNMENT_REVIEW"],
    description: "Alignment returns review results to MCP"
  },
  {
    from: "AGENTS",
    to: "MCP",
    intent: ["AGENT_EXECUTION"],
    description: "Agents return execution results to MCP"
  },
  {
    from: "PROJECTIONS",
    to: "MCP",
    intent: ["PROJECTION_GENERATION"],
    description: "Projections return generated scenarios to MCP"
  },
  {
    from: "CRYSTALLINE",
    to: "MCP",
    intent: ["QUERY", "KG_MUTATION_PROPOSAL"],
    description: "Crystalline returns KG operation results to MCP"
  }
];

/**
 * Validates if a route is legal according to MCP v1.1 specification
 */
export function isLegalRoute(
  from: Subsystem,
  to: Subsystem,
  intent: Intent
): boolean {
  return LEGAL_ROUTES.some(
    (route) =>
      route.from === from &&
      route.to === to &&
      route.intent.includes(intent)
  );
}

/**
 * Gets all legal routes from a source subsystem
 */
export function getLegalRoutesFrom(from: Subsystem): LegalRoute[] {
  return LEGAL_ROUTES.filter((route) => route.from === from);
}

/**
 * Gets all legal routes to a target subsystem
 */
export function getLegalRoutesTo(to: Subsystem): LegalRoute[] {
  return LEGAL_ROUTES.filter((route) => route.to === to);
}
