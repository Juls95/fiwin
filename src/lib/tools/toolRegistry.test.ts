import { describe, it, expect } from "vitest";
import { toolRegistry, isAllowedTool, listToolSchemas } from "@/lib/tools/toolRegistry";
import { ALLOWED_TOOLS } from "@/lib/agent/prompts";

describe("toolRegistry", () => {
  it("exposes exactly the 6 approved tools — and nothing else", () => {
    const names = Object.keys(toolRegistry).sort();
    expect(names).toEqual([...ALLOWED_TOOLS].sort());
    expect(names).toHaveLength(6);
    expect(names).toEqual(
      [
        "createClient",
        "getClient",
        "listClients",
        "recallConversation",
        "summarizeClient",
        "updateClient"
      ].sort()
    );
  });

  it("rejects any non-allowlisted tool name", () => {
    expect(isAllowedTool("deleteClient")).toBe(false);
    expect(isAllowedTool("rawStorage")).toBe(false);
    expect(isAllowedTool("getKey")).toBe(false);
    expect(isAllowedTool("listClients")).toBe(true);
  });

  it("listToolSchemas returns one entry per allowed tool", () => {
    expect(listToolSchemas()).toHaveLength(6);
  });
});
