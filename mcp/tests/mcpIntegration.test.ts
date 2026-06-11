import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createRuntimeServer } from "../src/server.js";

test("MCP runtime initializes and exposes tools, prompts, resources, and diagnostics", async (t) => {
  const cwd = await mkdtemp(join(tmpdir(), "laviya-mcp-integration-"));
  t.after(async () => {
    await rm(cwd, { recursive: true, force: true });
  });

  const previousApiKey = process.env.LAVIYA_API_KEY;
  process.env.LAVIYA_API_KEY = "integration-test-key";
  t.after(() => {
    if (previousApiKey === undefined) {
      delete process.env.LAVIYA_API_KEY;
    } else {
      process.env.LAVIYA_API_KEY = previousApiKey;
    }
  });

  const runtime = await createRuntimeServer({
    cwd,
    globalConfigPath: join(cwd, "missing-global.json")
  });
  const client = new Client(
    { name: "laviya-test-client", version: "1.0.0" },
    { capabilities: {} }
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await runtime.server.connect(serverTransport);
  await client.connect(clientTransport);

  try {
    const tools = await client.listTools();
    assert.ok(tools.tools.some((tool) => tool.name === "laviya_help"));
    assert.ok(tools.tools.some((tool) => tool.name === "laviya_diagnostics"));
    assert.ok(tools.tools.some((tool) => tool.name === "laviya_complete_execution"));

    const prompts = await client.listPrompts();
    assert.ok(prompts.prompts.some((prompt) => prompt.name === "laviya_orchestrator_system_prompt"));

    const resources = await client.listResources();
    assert.ok(
      resources.resources.some(
        (resource) => resource.uri === "laviya://prompts/orchestrator.system.md"
      )
    );

    const diagnostics = await client.callTool({
      name: "laviya_diagnostics",
      arguments: {}
    });
    assert.equal(diagnostics.isError, undefined);
    const structuredContent = diagnostics.structuredContent as
      | Record<string, unknown>
      | undefined;
    const result = structuredContent?.result as Record<string, unknown>;
    assert.equal(result.authMode, "query");
    assert.equal(result.activeLeaseCount, 0);
    assert.equal(JSON.stringify(result).includes("integration-test-key"), false);

    const help = await client.callTool({
      name: "laviya_help",
      arguments: {}
    });
    assert.equal(help.isError, undefined);
    const helpResult = (help.structuredContent as Record<string, unknown>)
      .result as Record<string, unknown>;
    const helpTools = helpResult.tools as Array<Record<string, unknown>>;
    assert.equal(helpResult.toolCount, tools.tools.length);
    assert.ok(
      helpTools.some(
        (tool) =>
          tool.name === "laviya_complete_execution" &&
          JSON.stringify(tool).includes("Token usage is optional")
      )
    );

    const filteredHelp = await client.callTool({
      name: "laviya_help",
      arguments: { toolName: "laviya_get_my_work" }
    });
    const filteredResult = (filteredHelp.structuredContent as Record<string, unknown>)
      .result as Record<string, unknown>;
    assert.equal(filteredResult.toolCount, 1);

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          HasFailed: true,
          Messages: [{ Code: "E_TEST", Description: "Backend rejected test call." }]
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    try {
      const failedTool = await client.callTool({
        name: "laviya_get_local_work_status",
        arguments: { runId: 10 }
      });
      assert.equal(failedTool.isError, true);
      const failedContent = failedTool.content as Array<{
        type: string;
        text?: string;
      }>;
      assert.match(
        failedContent[0]?.type === "text" ? failedContent[0].text ?? "" : "",
        /Backend rejected test call/
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  } finally {
    await client.close();
    await Promise.all([runtime.shutdown(), runtime.shutdown()]);
  }
});
