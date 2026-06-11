import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { loadGlobalConfig } from "../src/config/loadGlobalConfig.js";
import { loadProjectConfig } from "../src/config/loadProjectConfig.js";
import { resolvePromptOverridePath } from "../src/config/mergeConfig.js";
import { loadRuntimeEnv } from "../src/utils/env.js";

test("global config accepts HTTPS and loopback HTTP base URLs", async (t) => {
  const root = await createTempRoot(t);

  const validBaseUrls: Array<[string, string]> = [
    ["https.json", "https://api.laviya.app"],
    ["localhost.json", "http://localhost:5050"],
    ["ipv4.json", "http://127.0.0.1:5050"],
    ["ipv6.json", "http://[::1]:5050"]
  ];

  for (const [name, baseUrl] of validBaseUrls) {
    const path = join(root, name);
    await writeFile(path, JSON.stringify({ baseUrl }), "utf8");
    const loaded = await loadGlobalConfig(path);
    assert.equal(loaded.config.baseUrl, baseUrl);
  }
});

test("global config rejects unsafe URLs and tolerates deprecated auth settings", async (t) => {
  const root = await createTempRoot(t);
  const insecurePath = join(root, "insecure.json");
  const legacyAuthPath = join(root, "legacy-auth.json");

  await writeFile(insecurePath, JSON.stringify({ baseUrl: "http://api.example.test" }), "utf8");
  await writeFile(
    legacyAuthPath,
    JSON.stringify({ auth: { mode: "apiKeyAndBearer" } }),
    "utf8"
  );

  await assert.rejects(loadGlobalConfig(insecurePath), /baseUrl must use HTTPS/);
  const legacyConfig = await loadGlobalConfig(legacyAuthPath);
  assert.match(legacyConfig.warning ?? "", /deprecated and ignored/);
  assert.throws(
    () =>
      loadRuntimeEnv({
        LAVIYA_API_KEY: "key",
        LAVIYA_BASE_URL: "http://api.example.test"
      }),
    /LAVIYA_BASE_URL must use HTTPS/
  );
});

test("prompt override must be a Markdown file inside the project root", async (t) => {
  const workspace = await createTempRoot(t);
  const projectRoot = join(workspace, "project");
  const outsideRoot = join(workspace, "outside");
  await mkdir(projectRoot);
  await mkdir(outsideRoot);

  const validPath = join(projectRoot, "override.md");
  const invalidExtensionPath = join(projectRoot, "override.txt");
  const outsidePath = join(outsideRoot, "outside.md");
  await writeFile(validPath, "# Valid", "utf8");
  await writeFile(invalidExtensionPath, "invalid", "utf8");
  await writeFile(outsidePath, "# Outside", "utf8");

  assert.equal(await resolvePromptOverridePath(projectRoot, "override.md"), validPath);
  await assert.rejects(
    resolvePromptOverridePath(projectRoot, invalidExtensionPath),
    /must point to a \.md or \.markdown file/
  );
  await assert.rejects(
    resolvePromptOverridePath(projectRoot, outsidePath),
    /must resolve inside the project root/
  );
});

test("prompt override enforces a file size limit", async (t) => {
  const projectRoot = await createTempRoot(t);
  const oversizedPath = join(projectRoot, "oversized.md");
  await writeFile(oversizedPath, "x".repeat(256 * 1024 + 1), "utf8");

  await assert.rejects(
    resolvePromptOverridePath(projectRoot, oversizedPath),
    /exceeds the 262144 byte limit/
  );
});

test("project config is strict and requires a pinned run id", async (t) => {
  const projectRoot = await createTempRoot(t);
  const configDir = join(projectRoot, ".laviya");
  const configPath = join(configDir, "project.json");
  await mkdir(configDir);

  await writeFile(
    configPath,
    JSON.stringify({
      projectId: 1,
      agentProfile: "test",
      runPinning: { enabled: true }
    }),
    "utf8"
  );
  await assert.rejects(loadProjectConfig(projectRoot), /runId is required/);

  await writeFile(
    configPath,
    JSON.stringify({
      projectId: 1,
      agentProfile: "test",
      misspelledSetting: true
    }),
    "utf8"
  );
  await assert.rejects(loadProjectConfig(projectRoot), /Unrecognized key/);
});

async function createTempRoot(t: test.TestContext): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "laviya-mcp-test-"));
  t.after(async () => {
    await rm(root, { recursive: true, force: true });
  });
  return root;
}
