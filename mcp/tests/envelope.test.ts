import assert from "node:assert/strict";
import test from "node:test";
import { parseLaviyaEnvelope } from "../src/client/envelope.js";
import { LaviyaBusinessError, LaviyaProtocolError } from "../src/client/errors.js";

test("parses a successful Laviya envelope", () => {
  const result = parseLaviyaEnvelope(
    { HasFailed: false, Data: { id: 10 } },
    "/api/ai/Test"
  );

  assert.equal(result.HasFailed, false);
  assert.deepEqual(result.Data, { id: 10 });
});

test("normalizes backend business failure messages", () => {
  assert.throws(
    () =>
      parseLaviyaEnvelope(
        {
          HasFailed: true,
          Messages: [
            { Code: "E_ONE", Description: "First failure" },
            { code: "E_TWO", message: "Second failure" }
          ]
        },
        "/api/ai/Test"
      ),
    (error: unknown) => {
      assert.ok(error instanceof LaviyaBusinessError);
      assert.equal(error.message, "First failure; Second failure");
      assert.deepEqual(error.codes, ["E_ONE", "E_TWO"]);
      return true;
    }
  );
});

test("rejects invalid response envelopes", () => {
  assert.throws(
    () => parseLaviyaEnvelope({ Data: {} }, "/api/ai/Test"),
    LaviyaProtocolError
  );
  assert.throws(
    () => parseLaviyaEnvelope([], "/api/ai/Test"),
    LaviyaProtocolError
  );
});
