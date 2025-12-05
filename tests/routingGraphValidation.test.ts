/**
 * Tests for MCP v1.1 Routing Graph Validation
 * 
 * Covers:
 * 1. All legal routes defined in MCP_v1.1.md are accepted by isLegalRoute
 * 2. All illegal subsystem routes return routing errors
 * 3. Round-trip legality checks (symmetrical vs directional)
 */

import {
  isLegalRoute,
  LEGAL_ROUTES,
  Subsystem,
} from "../src/mcp/core/routing";
import { Intent } from "../src/mcp/core/message";
import { createRoutingError } from "../mcp/src/core/error";

/**
 * Helper to convert illegal route to MCP error
 */
function illegalRouteToError(
  from: Subsystem,
  to: Subsystem,
  intent: Intent,
  correlationId: string
) {
  return createRoutingError(
    `Illegal route: ${from} → ${to} with intent ${intent}`,
    correlationId,
    "ROUTING_5001",
    { from, to, intent }
  );
}

describe("MCP v1.1 Routing Graph Validation", () => {
  const correlationId = "test-correlation-routing-graph";

  describe("1. All Legal Routes from MCP_v1.1.md", () => {
    describe("LDS → TKD → MCP → Crystalline chain", () => {
      test("LDS → TKD with DATA_INGEST", () => {
        expect(isLegalRoute("LDS", "TKD", "DATA_INGEST")).toBe(true);
      });

      test("TKD → MCP with DATA_INGEST", () => {
        expect(isLegalRoute("TKD", "MCP", "DATA_INGEST")).toBe(true);
      });

      test("TKD → MCP with PATTERN_EXTRACTION", () => {
        expect(isLegalRoute("TKD", "MCP", "PATTERN_EXTRACTION")).toBe(true);
      });

      test("MCP → CRYSTALLINE with KG_MUTATION_PROPOSAL", () => {
        expect(isLegalRoute("MCP", "CRYSTALLINE", "KG_MUTATION_PROPOSAL")).toBe(true);
      });

      test("MCP → CRYSTALLINE with QUERY", () => {
        expect(isLegalRoute("MCP", "CRYSTALLINE", "QUERY")).toBe(true);
      });
    });

    describe("MCP → Alignment routes", () => {
      test("MCP → ALIGNMENT with ALIGNMENT_REVIEW", () => {
        expect(isLegalRoute("MCP", "ALIGNMENT", "ALIGNMENT_REVIEW")).toBe(true);
      });

      test("MCP → ALIGNMENT with ANALYSIS", () => {
        expect(isLegalRoute("MCP", "ALIGNMENT", "ANALYSIS")).toBe(true);
      });
    });

    describe("MCP → Agents routes", () => {
      test("MCP → AGENTS with AGENT_EXECUTION", () => {
        expect(isLegalRoute("MCP", "AGENTS", "AGENT_EXECUTION")).toBe(true);
      });
    });

    describe("MCP → Projections routes", () => {
      test("MCP → PROJECTIONS with PROJECTION_GENERATION", () => {
        expect(isLegalRoute("MCP", "PROJECTIONS", "PROJECTION_GENERATION")).toBe(true);
      });
    });

    describe("Return routes from subsystems to MCP", () => {
      test("ALIGNMENT → MCP with ALIGNMENT_REVIEW", () => {
        expect(isLegalRoute("ALIGNMENT", "MCP", "ALIGNMENT_REVIEW")).toBe(true);
      });

      test("AGENTS → MCP with AGENT_EXECUTION", () => {
        expect(isLegalRoute("AGENTS", "MCP", "AGENT_EXECUTION")).toBe(true);
      });

      test("PROJECTIONS → MCP with PROJECTION_GENERATION", () => {
        expect(isLegalRoute("PROJECTIONS", "MCP", "PROJECTION_GENERATION")).toBe(true);
      });

      test("CRYSTALLINE → MCP with QUERY", () => {
        expect(isLegalRoute("CRYSTALLINE", "MCP", "QUERY")).toBe(true);
      });

      test("CRYSTALLINE → MCP with KG_MUTATION_PROPOSAL", () => {
        expect(isLegalRoute("CRYSTALLINE", "MCP", "KG_MUTATION_PROPOSAL")).toBe(true);
      });
    });

    describe("All legal routes from LEGAL_ROUTES array", () => {
      test("every route in LEGAL_ROUTES is accepted by isLegalRoute", () => {
        for (const route of LEGAL_ROUTES) {
          for (const intent of route.intent) {
            expect(isLegalRoute(route.from, route.to, intent)).toBe(true);
          }
        }
      });
    });
  });

  describe("2. All Illegal Subsystem Routes", () => {
    describe("Explicitly disallowed routes from spec", () => {
      test("AGENTS → KG is illegal (all intents)", () => {
        const intents: Intent[] = [
          "UPDATE",
          "QUERY",
          "KG_MUTATION_PROPOSAL",
          "AGENT_EXECUTION",
          "ANALYSIS",
        ];
        for (const intent of intents) {
          expect(isLegalRoute("AGENTS", "KG", intent)).toBe(false);
          const error = illegalRouteToError("AGENTS", "KG", intent, correlationId);
          expect(error.errorClass).toBe("ERROR.ROUTING");
          expect(error.errorCode).toBe("ROUTING_5001");
        }
      });

      test("TKD → AGENTS is illegal (all intents)", () => {
        const intents: Intent[] = [
          "AGENT_EXECUTION",
          "UPDATE",
          "DATA_INGEST",
          "PATTERN_EXTRACTION",
        ];
        for (const intent of intents) {
          expect(isLegalRoute("TKD", "AGENTS", intent)).toBe(false);
          const error = illegalRouteToError("TKD", "AGENTS", intent, correlationId);
          expect(error.errorClass).toBe("ERROR.ROUTING");
        }
      });
    });

    describe("Direct routes bypassing MCP", () => {
      test("LDS → CRYSTALLINE is illegal", () => {
        expect(isLegalRoute("LDS", "CRYSTALLINE", "QUERY")).toBe(false);
        expect(isLegalRoute("LDS", "CRYSTALLINE", "KG_MUTATION_PROPOSAL")).toBe(false);
        expect(isLegalRoute("LDS", "CRYSTALLINE", "DATA_INGEST")).toBe(false);
      });

      test("LDS → ALIGNMENT is illegal", () => {
        expect(isLegalRoute("LDS", "ALIGNMENT", "ALIGNMENT_REVIEW")).toBe(false);
        expect(isLegalRoute("LDS", "ALIGNMENT", "ANALYSIS")).toBe(false);
      });

      test("LDS → AGENTS is illegal", () => {
        expect(isLegalRoute("LDS", "AGENTS", "AGENT_EXECUTION")).toBe(false);
      });

      test("LDS → PROJECTIONS is illegal", () => {
        expect(isLegalRoute("LDS", "PROJECTIONS", "PROJECTION_GENERATION")).toBe(false);
      });

      test("TKD → CRYSTALLINE is illegal", () => {
        expect(isLegalRoute("TKD", "CRYSTALLINE", "QUERY")).toBe(false);
        expect(isLegalRoute("TKD", "CRYSTALLINE", "KG_MUTATION_PROPOSAL")).toBe(false);
      });

      test("TKD → ALIGNMENT is illegal", () => {
        expect(isLegalRoute("TKD", "ALIGNMENT", "ALIGNMENT_REVIEW")).toBe(false);
      });

      test("TKD → PROJECTIONS is illegal", () => {
        expect(isLegalRoute("TKD", "PROJECTIONS", "PROJECTION_GENERATION")).toBe(false);
      });
    });

    describe("Subsystem-to-subsystem routes (bypassing MCP)", () => {
      test("ALIGNMENT → CRYSTALLINE is illegal", () => {
        expect(isLegalRoute("ALIGNMENT", "CRYSTALLINE", "QUERY")).toBe(false);
        expect(isLegalRoute("ALIGNMENT", "CRYSTALLINE", "KG_MUTATION_PROPOSAL")).toBe(false);
      });

      test("ALIGNMENT → AGENTS is illegal", () => {
        expect(isLegalRoute("ALIGNMENT", "AGENTS", "AGENT_EXECUTION")).toBe(false);
      });

      test("ALIGNMENT → PROJECTIONS is illegal", () => {
        expect(isLegalRoute("ALIGNMENT", "PROJECTIONS", "PROJECTION_GENERATION")).toBe(false);
      });

      test("ALIGNMENT → LDS is illegal", () => {
        expect(isLegalRoute("ALIGNMENT", "LDS", "DATA_INGEST")).toBe(false);
      });

      test("ALIGNMENT → TKD is illegal", () => {
        expect(isLegalRoute("ALIGNMENT", "TKD", "DATA_INGEST")).toBe(false);
      });

      test("AGENTS → CRYSTALLINE is illegal", () => {
        expect(isLegalRoute("AGENTS", "CRYSTALLINE", "QUERY")).toBe(false);
        expect(isLegalRoute("AGENTS", "CRYSTALLINE", "KG_MUTATION_PROPOSAL")).toBe(false);
      });

      test("AGENTS → ALIGNMENT is illegal", () => {
        expect(isLegalRoute("AGENTS", "ALIGNMENT", "ALIGNMENT_REVIEW")).toBe(false);
      });

      test("AGENTS → PROJECTIONS is illegal", () => {
        expect(isLegalRoute("AGENTS", "PROJECTIONS", "PROJECTION_GENERATION")).toBe(false);
      });

      test("AGENTS → LDS is illegal", () => {
        expect(isLegalRoute("AGENTS", "LDS", "DATA_INGEST")).toBe(false);
      });

      test("AGENTS → TKD is illegal", () => {
        expect(isLegalRoute("AGENTS", "TKD", "DATA_INGEST")).toBe(false);
      });

      test("CRYSTALLINE → ALIGNMENT is illegal", () => {
        expect(isLegalRoute("CRYSTALLINE", "ALIGNMENT", "ALIGNMENT_REVIEW")).toBe(false);
      });

      test("CRYSTALLINE → AGENTS is illegal", () => {
        expect(isLegalRoute("CRYSTALLINE", "AGENTS", "AGENT_EXECUTION")).toBe(false);
      });

      test("CRYSTALLINE → PROJECTIONS is illegal", () => {
        expect(isLegalRoute("CRYSTALLINE", "PROJECTIONS", "PROJECTION_GENERATION")).toBe(false);
      });

      test("CRYSTALLINE → LDS is illegal", () => {
        expect(isLegalRoute("CRYSTALLINE", "LDS", "DATA_INGEST")).toBe(false);
      });

      test("CRYSTALLINE → TKD is illegal", () => {
        expect(isLegalRoute("CRYSTALLINE", "TKD", "DATA_INGEST")).toBe(false);
      });

      test("PROJECTIONS → CRYSTALLINE is illegal", () => {
        expect(isLegalRoute("PROJECTIONS", "CRYSTALLINE", "QUERY")).toBe(false);
      });

      test("PROJECTIONS → ALIGNMENT is illegal", () => {
        expect(isLegalRoute("PROJECTIONS", "ALIGNMENT", "ALIGNMENT_REVIEW")).toBe(false);
      });

      test("PROJECTIONS → AGENTS is illegal", () => {
        expect(isLegalRoute("PROJECTIONS", "AGENTS", "AGENT_EXECUTION")).toBe(false);
      });

      test("PROJECTIONS → LDS is illegal", () => {
        expect(isLegalRoute("PROJECTIONS", "LDS", "DATA_INGEST")).toBe(false);
      });

      test("PROJECTIONS → TKD is illegal", () => {
        expect(isLegalRoute("PROJECTIONS", "TKD", "DATA_INGEST")).toBe(false);
      });
    });

    describe("MCP routing restrictions", () => {
      test("MCP → LDS is illegal", () => {
        expect(isLegalRoute("MCP", "LDS", "DATA_INGEST")).toBe(false);
      });

      test("MCP → TKD is illegal", () => {
        expect(isLegalRoute("MCP", "TKD", "DATA_INGEST")).toBe(false);
        expect(isLegalRoute("MCP", "TKD", "PATTERN_EXTRACTION")).toBe(false);
      });

      test("MCP → KG is illegal (KG is not a valid subsystem target)", () => {
        expect(isLegalRoute("MCP", "KG", "QUERY")).toBe(false);
        expect(isLegalRoute("MCP", "KG", "UPDATE")).toBe(false);
      });
    });

    describe("Self-referential routes", () => {
      test("LDS → LDS is illegal", () => {
        expect(isLegalRoute("LDS", "LDS", "DATA_INGEST")).toBe(false);
      });

      test("TKD → TKD is illegal", () => {
        expect(isLegalRoute("TKD", "TKD", "DATA_INGEST")).toBe(false);
      });

      test("MCP → MCP is illegal", () => {
        expect(isLegalRoute("MCP", "MCP", "QUERY")).toBe(false);
      });

      test("CRYSTALLINE → CRYSTALLINE is illegal", () => {
        expect(isLegalRoute("CRYSTALLINE", "CRYSTALLINE", "QUERY")).toBe(false);
      });

      test("ALIGNMENT → ALIGNMENT is illegal", () => {
        expect(isLegalRoute("ALIGNMENT", "ALIGNMENT", "ALIGNMENT_REVIEW")).toBe(false);
      });

      test("AGENTS → AGENTS is illegal", () => {
        expect(isLegalRoute("AGENTS", "AGENTS", "AGENT_EXECUTION")).toBe(false);
      });

      test("PROJECTIONS → PROJECTIONS is illegal", () => {
        expect(isLegalRoute("PROJECTIONS", "PROJECTIONS", "PROJECTION_GENERATION")).toBe(false);
      });
    });

    describe("Invalid intent for legal route", () => {
      test("LDS → TKD with wrong intent is illegal", () => {
        expect(isLegalRoute("LDS", "TKD", "QUERY")).toBe(false);
        expect(isLegalRoute("LDS", "TKD", "AGENT_EXECUTION")).toBe(false);
      });

      test("MCP → CRYSTALLINE with wrong intent is illegal", () => {
        expect(isLegalRoute("MCP", "CRYSTALLINE", "DATA_INGEST")).toBe(false);
        expect(isLegalRoute("MCP", "CRYSTALLINE", "AGENT_EXECUTION")).toBe(false);
      });

      test("MCP → AGENTS with wrong intent is illegal", () => {
        expect(isLegalRoute("MCP", "AGENTS", "QUERY")).toBe(false);
        expect(isLegalRoute("MCP", "AGENTS", "KG_MUTATION_PROPOSAL")).toBe(false);
      });
    });
  });

  describe("3. Round-Trip Legality Checks", () => {
    describe("Symmetrical routes (bidirectional)", () => {
      test("MCP ↔ CRYSTALLINE is symmetrical for QUERY", () => {
        const forward = isLegalRoute("MCP", "CRYSTALLINE", "QUERY");
        const reverse = isLegalRoute("CRYSTALLINE", "MCP", "QUERY");
        expect(forward).toBe(true);
        expect(reverse).toBe(true);
        expect(forward).toBe(reverse);
      });

      test("MCP ↔ CRYSTALLINE is symmetrical for KG_MUTATION_PROPOSAL", () => {
        const forward = isLegalRoute("MCP", "CRYSTALLINE", "KG_MUTATION_PROPOSAL");
        const reverse = isLegalRoute("CRYSTALLINE", "MCP", "KG_MUTATION_PROPOSAL");
        expect(forward).toBe(true);
        expect(reverse).toBe(true);
        expect(forward).toBe(reverse);
      });

      test("MCP ↔ ALIGNMENT is symmetrical for ALIGNMENT_REVIEW", () => {
        const forward = isLegalRoute("MCP", "ALIGNMENT", "ALIGNMENT_REVIEW");
        const reverse = isLegalRoute("ALIGNMENT", "MCP", "ALIGNMENT_REVIEW");
        expect(forward).toBe(true);
        expect(reverse).toBe(true);
        expect(forward).toBe(reverse);
      });

      test("MCP ↔ AGENTS is symmetrical for AGENT_EXECUTION", () => {
        const forward = isLegalRoute("MCP", "AGENTS", "AGENT_EXECUTION");
        const reverse = isLegalRoute("AGENTS", "MCP", "AGENT_EXECUTION");
        expect(forward).toBe(true);
        expect(reverse).toBe(true);
        expect(forward).toBe(reverse);
      });

      test("MCP ↔ PROJECTIONS is symmetrical for PROJECTION_GENERATION", () => {
        const forward = isLegalRoute("MCP", "PROJECTIONS", "PROJECTION_GENERATION");
        const reverse = isLegalRoute("PROJECTIONS", "MCP", "PROJECTION_GENERATION");
        expect(forward).toBe(true);
        expect(reverse).toBe(true);
        expect(forward).toBe(reverse);
      });
    });

    describe("Directional routes (one-way only)", () => {
      test("LDS → TKD is one-way only", () => {
        const forward = isLegalRoute("LDS", "TKD", "DATA_INGEST");
        const reverse = isLegalRoute("TKD", "LDS", "DATA_INGEST");
        expect(forward).toBe(true);
        expect(reverse).toBe(false); // TKD cannot route back to LDS
      });

      test("TKD → MCP is one-way only", () => {
        const forward = isLegalRoute("TKD", "MCP", "DATA_INGEST");
        const reverse = isLegalRoute("MCP", "TKD", "DATA_INGEST");
        expect(forward).toBe(true);
        expect(reverse).toBe(false); // MCP cannot route back to TKD
      });

      test("MCP → ALIGNMENT with ANALYSIS is one-way only", () => {
        const forward = isLegalRoute("MCP", "ALIGNMENT", "ANALYSIS");
        const reverse = isLegalRoute("ALIGNMENT", "MCP", "ANALYSIS");
        expect(forward).toBe(true);
        expect(reverse).toBe(false); // ANALYSIS is only MCP → ALIGNMENT
      });
    });

    describe("Round-trip validation for all legal routes", () => {
      test("verifies symmetry where routes exist in both directions", () => {
        const symmetricalRoutes: Array<{
          from: Subsystem;
          to: Subsystem;
          intent: Intent;
        }> = [
          { from: "MCP", to: "CRYSTALLINE", intent: "QUERY" },
          { from: "MCP", to: "CRYSTALLINE", intent: "KG_MUTATION_PROPOSAL" },
          { from: "MCP", to: "ALIGNMENT", intent: "ALIGNMENT_REVIEW" },
          { from: "MCP", to: "AGENTS", intent: "AGENT_EXECUTION" },
          { from: "MCP", to: "PROJECTIONS", intent: "PROJECTION_GENERATION" },
        ];

        for (const route of symmetricalRoutes) {
          const forward = isLegalRoute(route.from, route.to, route.intent);
          const reverse = isLegalRoute(route.to, route.from, route.intent);
          expect(forward).toBe(true);
          expect(reverse).toBe(true);
        }
      });

      test("verifies one-way nature of directional routes", () => {
        const directionalRoutes: Array<{
          from: Subsystem;
          to: Subsystem;
          intent: Intent;
        }> = [
          { from: "LDS", to: "TKD", intent: "DATA_INGEST" },
          { from: "TKD", to: "MCP", intent: "DATA_INGEST" },
          { from: "TKD", to: "MCP", intent: "PATTERN_EXTRACTION" },
          { from: "MCP", to: "ALIGNMENT", intent: "ANALYSIS" },
        ];

        for (const route of directionalRoutes) {
          const forward = isLegalRoute(route.from, route.to, route.intent);
          const reverse = isLegalRoute(route.to, route.from, route.intent);
          expect(forward).toBe(true);
          expect(reverse).toBe(false);
        }
      });
    });
  });

  describe("Comprehensive Route Matrix Validation", () => {
    const allSubsystems: Subsystem[] = [
      "LDS",
      "TKD",
      "MCP",
      "CRYSTALLINE",
      "ALIGNMENT",
      "AGENTS",
      "PROJECTIONS",
      "KG",
    ];

    const allIntents: Intent[] = [
      "ANALYSIS",
      "PATTERN_EXTRACTION",
      "KG_MUTATION_PROPOSAL",
      "ALIGNMENT_REVIEW",
      "AGENT_EXECUTION",
      "FEDERATION_HANDSHAKE",
      "PROJECTION_GENERATION",
      "DATA_INGEST",
      "QUERY",
      "UPDATE",
    ];

    test("only routes in LEGAL_ROUTES are accepted", () => {
      const legalRouteSet = new Set<string>();
      for (const route of LEGAL_ROUTES) {
        for (const intent of route.intent) {
          legalRouteSet.add(`${route.from}:${route.to}:${intent}`);
        }
      }

      // Check a sample of all possible combinations
      let legalCount = 0;
      let illegalCount = 0;

      for (const from of allSubsystems) {
        for (const to of allSubsystems) {
          for (const intent of allIntents) {
            const routeKey = `${from}:${to}:${intent}`;
            const isLegal = isLegalRoute(from, to, intent);
            const inLegalSet = legalRouteSet.has(routeKey);

            if (isLegal) {
              legalCount++;
              expect(inLegalSet).toBe(true);
            } else {
              illegalCount++;
              // If it's illegal, it should not be in the legal set
              expect(inLegalSet).toBe(false);
            }
          }
        }
      }

      // Verify we found some legal routes
      expect(legalCount).toBeGreaterThan(0);
      // Verify most routes are illegal (as expected)
      expect(illegalCount).toBeGreaterThan(legalCount);
    });
  });
});
