import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const temporaryRoot = await mkdtemp(join(tmpdir(), "laviya-mcp-package-smoke-"));
const installRoot = join(temporaryRoot, "install");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

try {
  const packResult = await execFileAsync(
    npmCommand,
    ["pack", "--json", "--pack-destination", temporaryRoot],
    { cwd: root, maxBuffer: 10 * 1024 * 1024 }
  );
  const packOutput = JSON.parse(packResult.stdout);
  const filename = packOutput[0]?.filename;
  if (!filename) {
    throw new Error("npm pack did not return a tarball filename.");
  }

  const tarballPath = join(temporaryRoot, filename);
  await execFileAsync(
    npmCommand,
    [
      "install",
      "--prefix",
      installRoot,
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      tarballPath
    ],
    { cwd: root, maxBuffer: 10 * 1024 * 1024 }
  );

  const entryPath = join(
    installRoot,
    "node_modules",
    "laviya-mcp-server",
    "dist",
    "index.js"
  );
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [entryPath],
    env: {
      ...process.env,
      LAVIYA_API_KEY: "package-smoke-test-key",
      LAVIYA_LOG_LEVEL: "error",
      LAVIYA_GLOBAL_CONFIG_PATH: join(temporaryRoot, "missing-global.json")
    }
  });
  const client = new Client(
    { name: "package-smoke-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);
  try {
    const tools = await client.listTools();
    if (!tools.tools.some((tool) => tool.name === "laviya_diagnostics")) {
      throw new Error("Packed MCP binary did not expose laviya_diagnostics.");
    }
  } finally {
    await client.close();
  }

  console.log(`Packed MCP binary smoke test passed: ${filename}`);
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
