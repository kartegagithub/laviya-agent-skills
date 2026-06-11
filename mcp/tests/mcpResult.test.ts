import assert from "node:assert/strict";
import test from "node:test";
import { LaviyaBusinessError } from "../src/client/errors.js";
import { executeTool } from "../src/mcp/result.js";
import { createLogger } from "../src/utils/logger.js";

test("successful tool results include text and structured content", async () => {
  const result = await executeTool(
    "test_tool",
    createLogger("error"),
    async () => ({ HasFailed: false, Data: { id: 10 } })
  );

  assert.equal(result.isError, undefined);
  assert.deepEqual(result.structuredContent, {
    result: { HasFailed: false, Data: { id: 10 } }
  });
  assert.match(result.content[0]?.type === "text" ? result.content[0].text : "", /"id": 10/);
});

test("business errors become MCP tool errors", async () => {
  const result = await executeTool(
    "test_tool",
    createLogger("error"),
    async () => {
      throw new LaviyaBusinessError("Backend rejected the operation.", ["E_REJECTED"]);
    }
  );

  assert.equal(result.isError, true);
  assert.deepEqual(result.structuredContent, {
    error: {
      type: "business",
      message: "Backend rejected the operation.",
      codes: ["E_REJECTED"]
    }
  });
});
