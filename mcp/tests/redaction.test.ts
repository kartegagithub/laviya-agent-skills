import assert from "node:assert/strict";
import test from "node:test";
import {
  redactLogValue,
  redactSecretValue,
  redactSensitiveText
} from "../src/utils/redaction.js";

test("redacts API keys and summarizes agent identifiers", () => {
  const text =
    "request https://api.example.test/work?apiKey=secret-value&agentUID=agent-uid-1234567890";
  const redacted = redactSensitiveText(text);

  assert.equal(redacted.includes("secret-value"), false);
  assert.match(redacted, /apiKey=\*\*\*/);
  assert.match(redacted, /agentUID=agent-ui\.\.\.7890/);
});

test("redacts sensitive values recursively", () => {
  const value = redactLogValue({
    api_key: "secret",
    nested: {
      url: "https://api.example.test/work?api_key=secret",
      aiAgentUid: "agent-uid-1234567890"
    }
  });

  assert.deepEqual(value, {
    api_key: "***",
    nested: {
      url: "https://api.example.test/work?api_key=***",
      aiAgentUid: "agent-ui...7890"
    }
  });
});

test("removes a known secret from arbitrary response data", () => {
  const value = redactSecretValue(
    {
      raw: "backend echoed secret-value",
      apiKey: "secret-value"
    },
    "secret-value"
  );

  assert.deepEqual(value, {
    raw: "backend echoed ***",
    apiKey: "***"
  });
});
