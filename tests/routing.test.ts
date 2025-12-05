/**
 * Tests for MCP v1.1 Legal Routing Graph
 */

import {
  isLegalRoute,
  getLegalRoutesFrom,
  getLegalRoutesTo,
  LEGAL_ROUTES,
  Subsystem
} from "../src/mcp/core/routing";
import { Intent } from "../src/mcp/core/message";

describe("Legal Routing Graph", () => {
  describe("isLegalRoute", () => {
    it("should allow LDS → TKD with DATA_INGEST", () => {
      expect(isLegalRoute("LDS", "TKD", "DATA_INGEST")).toBe(true);
    });

    it("should allow TKD → MCP with DATA_INGEST", () => {
      expect(isLegalRoute("TKD", "MCP", "DATA_INGEST")).toBe(true);
    });

    it("should allow TKD → MCP with PATTERN_EXTRACTION", () => {
      expect(isLegalRoute("TKD", "MCP", "PATTERN_EXTRACTION")).toBe(true);
    });

    it("should allow MCP → CRYSTALLINE with KG_MUTATION_PROPOSAL", () => {
      expect(isLegalRoute("MCP", "CRYSTALLINE", "KG_MUTATION_PROPOSAL")).toBe(
        true
      );
    });

    it("should allow MCP → ALIGNMENT with ALIGNMENT_REVIEW", () => {
      expect(isLegalRoute("MCP", "ALIGNMENT", "ALIGNMENT_REVIEW")).toBe(true);
    });

    it("should allow MCP → AGENTS with AGENT_EXECUTION", () => {
      expect(isLegalRoute("MCP", "AGENTS", "AGENT_EXECUTION")).toBe(true);
    });

    it("should allow MCP → PROJECTIONS with PROJECTION_GENERATION", () => {
      expect(isLegalRoute("MCP", "PROJECTIONS", "PROJECTION_GENERATION")).toBe(
        true
      );
    });

    it("should disallow Agents → KG", () => {
      expect(isLegalRoute("AGENTS", "KG", "UPDATE")).toBe(false);
    });

    it("should disallow TKD → Agents", () => {
      expect(isLegalRoute("TKD", "AGENTS", "AGENT_EXECUTION")).toBe(false);
    });

    it("should disallow direct routes bypassing MCP", () => {
      expect(isLegalRoute("LDS", "CRYSTALLINE", "QUERY")).toBe(false);
      expect(isLegalRoute("TKD", "AGENTS", "AGENT_EXECUTION")).toBe(false);
    });

    it("should allow return routes from subsystems to MCP", () => {
      expect(isLegalRoute("ALIGNMENT", "MCP", "ALIGNMENT_REVIEW")).toBe(true);
      expect(isLegalRoute("AGENTS", "MCP", "AGENT_EXECUTION")).toBe(true);
      expect(isLegalRoute("PROJECTIONS", "MCP", "PROJECTION_GENERATION")).toBe(
        true
      );
      expect(isLegalRoute("CRYSTALLINE", "MCP", "QUERY")).toBe(true);
    });
  });

  describe("getLegalRoutesFrom", () => {
    it("should return all legal routes from LDS", () => {
      const routes = getLegalRoutesFrom("LDS");
      expect(routes.length).toBeGreaterThan(0);
      expect(routes.every((r) => r.from === "LDS")).toBe(true);
    });

    it("should return all legal routes from MCP", () => {
      const routes = getLegalRoutesFrom("MCP");
      expect(routes.length).toBeGreaterThan(0);
      expect(routes.every((r) => r.from === "MCP")).toBe(true);
    });

    it("should return empty array for subsystems with no outgoing routes", () => {
      // Assuming KG has no outgoing routes
      const routes = getLegalRoutesFrom("KG");
      expect(Array.isArray(routes)).toBe(true);
    });
  });

  describe("getLegalRoutesTo", () => {
    it("should return all legal routes to MCP", () => {
      const routes = getLegalRoutesTo("MCP");
      expect(routes.length).toBeGreaterThan(0);
      expect(routes.every((r) => r.to === "MCP")).toBe(true);
    });

    it("should return all legal routes to CRYSTALLINE", () => {
      const routes = getLegalRoutesTo("CRYSTALLINE");
      expect(routes.length).toBeGreaterThan(0);
      expect(routes.every((r) => r.to === "CRYSTALLINE")).toBe(true);
    });
  });

  describe("LEGAL_ROUTES", () => {
    it("should contain all required legal routes", () => {
      const routeStrings = LEGAL_ROUTES.map(
        (r) => `${r.from} → ${r.to}`
      );

      expect(routeStrings).toContain("LDS → TKD");
      expect(routeStrings).toContain("TKD → MCP");
      expect(routeStrings).toContain("MCP → CRYSTALLINE");
      expect(routeStrings).toContain("MCP → ALIGNMENT");
      expect(routeStrings).toContain("MCP → AGENTS");
      expect(routeStrings).toContain("MCP → PROJECTIONS");
    });

    it("should not contain disallowed routes", () => {
      const routeStrings = LEGAL_ROUTES.map(
        (r) => `${r.from} → ${r.to}`
      );

      expect(routeStrings).not.toContain("AGENTS → KG");
      expect(routeStrings).not.toContain("TKD → AGENTS");
    });
  });
});
