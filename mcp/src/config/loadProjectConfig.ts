import { access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { constants } from "node:fs";
import { z } from "zod";
import { readJsonFileIfExists } from "../utils/json.js";

const pollModeSchema = z.enum(["pull", "long-poll"]);

const projectConfigSchema = z.object({
  projectId: z.number().int().positive(),
  projectName: z.string().min(1).optional(),
  agentProfile: z.string().min(1),
  pollMode: pollModeSchema.default("pull"),
  runPinning: z
    .object({
      enabled: z.boolean().default(false),
      runId: z.number().int().positive().optional()
    })
    .optional(),
  promptOverridePath: z.string().min(1).optional(),
  completion: z
    .object({
      requireExecutionSummary: z.boolean().default(true),
      autoFailOnMissingSummary: z.boolean().default(true),
      includeLogs: z.boolean().default(true),
      includeTokenUsage: z.boolean().default(false)
    })
    .optional(),
  codingRules: z
    .object({
      cursorRulePath: z.string().min(1).optional(),
      vscodeSettingsPath: z.string().min(1).optional(),
      codingConventionsPath: z.string().min(1).optional()
    })
    .optional()
});

export type PollMode = z.infer<typeof pollModeSchema>;
export type ProjectConfig = z.infer<typeof projectConfigSchema>;

export interface LoadedProjectConfig {
  config?: ProjectConfig;
  projectRoot: string;
  path?: string;
}

const CANDIDATE_PATHS = [join(".laviya", "project.json"), ".laviya.json"];

export async function loadProjectConfig(startCwd = process.cwd()): Promise<LoadedProjectConfig> {
  const absoluteStart = resolve(startCwd);
  let current = absoluteStart;

  while (true) {
    for (const candidate of CANDIDATE_PATHS) {
      const candidatePath = join(current, candidate);
      if (await exists(candidatePath)) {
        const raw = await readJsonFileIfExists<unknown>(candidatePath);
        if (!raw) {
          continue;
        }

        const parsed = projectConfigSchema.safeParse(raw);
        if (!parsed.success) {
          const reasons = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
          throw new Error(`Invalid project config at ${candidatePath}: ${reasons}`);
        }

        return {
          config: parsed.data,
          projectRoot: current,
          path: candidatePath
        };
      }
    }

    const parent = dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return { projectRoot: absoluteStart, config: undefined, path: undefined };
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
