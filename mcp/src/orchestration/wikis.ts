import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import { generateCanonicalRequestKey } from "../utils/canonicalJson.js";
import type { Logger } from "../utils/logger.js";
import { readData } from "./createTasks.js";
import { resolveProjectID } from "./listTasks.js";

export const MAX_WIKI_RELATED_TASKS = 50;
export const MAX_WIKI_CONTENT_LENGTH = 200_000;

const wikiNameSchema = z.string().trim().min(1).max(255);
const wikiContentSchema = z.string().max(MAX_WIKI_CONTENT_LENGTH)
  .describe("Markdown (headings, lists, tables, code, links); line breaks are kept. Raw HTML is shown as text; only http, https, mailto and relative links are kept.");

const projectIDSchema = z.number().int().positive().optional()
  .describe("Laviya project (see laviya_list_projects). Pass projectID or project.");
const projectNameSchema = z.string().trim().min(1).max(100).optional()
  .describe("Project name, part of it, or task prefix (e.g. LVY) instead of projectID. It must match exactly one of your projects.");

export const listWikisInputSchema = z.object({
  projectID: projectIDSchema,
  project: projectNameSchema,
  search: z.string().trim().min(1).max(100).optional().describe("Part of the wiki name."),
  parentWikiID: z.number().int().nonnegative().optional()
    .describe("0 lists only the top-level wikis of the project, a wiki id only its direct sub wikis. Default: all wikis.")
}).strict();

export const getWikiInputSchema = z.object({
  wikiID: z.number().int().positive().describe("Wiki id from laviya_list_wikis.")
}).strict();

export const createWikiPayloadSchema = z.object({
  approvedByUser: z.literal(true),
  projectID: projectIDSchema,
  project: projectNameSchema,
  parentWikiID: z.number().int().positive().optional()
    .describe("Wiki of the same project to create a sub wiki under (see laviya_list_wikis). Default: a top-level wiki of the project."),
  name: wikiNameSchema
    .describe("Wiki title. An active wiki with the same name (case and spaces ignored) under the same parent is returned unchanged instead of creating another one."),
  content: wikiContentSchema.optional(),
  relatedTaskIDs: z.array(z.number().int().positive()).max(MAX_WIKI_RELATED_TASKS).optional()
    .describe("Tasks of the same project, mentioned at the end of the wiki (at most 50)."),
  requestKey: z.string().trim().min(1).max(120).optional()
    .describe("Idempotency key, echoed back. Defaults to a hash of the request.")
}).strict();

export const updateWikiPayloadSchema = z.object({
  approvedByUser: z.literal(true),
  wikiID: z.number().int().positive().describe("Wiki id from laviya_list_wikis or laviya_create_wiki."),
  name: wikiNameSchema.optional().describe("New title. Default: unchanged."),
  content: wikiContentSchema.optional().describe("New content (Markdown). Default: unchanged."),
  mode: z.enum(["replace", "append"]).optional()
    .describe("replace (default) overwrites the content (and its task mentions); append adds content at the end.")
}).strict();

export type ListWikisInput = z.infer<typeof listWikisInputSchema>;
export type GetWikiInput = z.infer<typeof getWikiInputSchema>;
export type CreateWikiPayload = z.infer<typeof createWikiPayloadSchema>;
export type UpdateWikiPayload = z.infer<typeof updateWikiPayloadSchema>;

export async function listWikis(client: LaviyaApiClient, logger: Logger, input: ListWikisInput): Promise<unknown> {
  const projectID = await resolveWikiProjectID(client, input);
  logger.info("Listing Laviya wikis", { projectID, hasSearch: Boolean(input.search), parentWikiID: input.parentWikiID });
  return readData(await client.getWikis({ projectID, search: input.search, parentWikiID: input.parentWikiID }));
}

export async function getWiki(client: LaviyaApiClient, logger: Logger, input: GetWikiInput): Promise<unknown> {
  logger.info("Reading a Laviya wiki", { wikiID: input.wikiID });
  return readData(await client.getWiki(input.wikiID));
}

export async function createWiki(client: LaviyaApiClient, logger: Logger, payload: CreateWikiPayload): Promise<unknown> {
  const projectID = await resolveWikiProjectID(client, payload);
  const body = {
    projectID,
    parentWikiID: payload.parentWikiID,
    name: payload.name,
    content: payload.content,
    relatedTaskIDs: payload.relatedTaskIDs
  };
  const requestKey = payload.requestKey ?? generateCanonicalRequestKey("CreateWiki", body);

  logger.info("Creating a Laviya wiki", { projectID, parentWikiID: payload.parentWikiID });
  // Idempotent by project, parent and name on the backend, so a retry returns the same wiki.
  return readData(await client.createWiki({ ...body, requestKey }));
}

export async function updateWiki(client: LaviyaApiClient, logger: Logger, payload: UpdateWikiPayload): Promise<unknown> {
  if (payload.name === undefined && payload.content === undefined) {
    throw new Error("name or content is required.");
  }

  const mode = payload.mode ?? "replace";
  logger.info("Updating a Laviya wiki", { wikiID: payload.wikiID, mode, hasName: payload.name !== undefined, hasContent: payload.content !== undefined });
  return readData(await client.updateWiki({
    wikiID: payload.wikiID,
    name: payload.name,
    content: payload.content,
    mode
  }));
}

async function resolveWikiProjectID(client: LaviyaApiClient, input: { projectID?: number; project?: string }): Promise<number> {
  if (input.projectID && input.project) {
    throw new Error("Pass either projectID or project, not both.");
  }
  if (input.projectID) {
    return input.projectID;
  }
  if (!input.project) {
    throw new Error("projectID or project is required.");
  }
  return resolveProjectID(client, input.project);
}
