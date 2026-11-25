import { z } from "zod";
import type { LaviyaApiClient } from "../client/laviyaApiClient.js";
import type { Logger } from "../utils/logger.js";
export declare const MAX_WIKI_RELATED_TASKS = 50;
export declare const MAX_WIKI_CONTENT_LENGTH = 200000;
export declare const listWikisInputSchema: z.ZodObject<{
    projectID: z.ZodOptional<z.ZodNumber>;
    project: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    parentWikiID: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export declare const getWikiInputSchema: z.ZodObject<{
    wikiID: z.ZodNumber;
}, z.core.$strict>;
export declare const createWikiPayloadSchema: z.ZodObject<{
    approvedByUser: z.ZodLiteral<true>;
    projectID: z.ZodOptional<z.ZodNumber>;
    project: z.ZodOptional<z.ZodString>;
    parentWikiID: z.ZodOptional<z.ZodNumber>;
    name: z.ZodString;
    content: z.ZodOptional<z.ZodString>;
    relatedTaskIDs: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    requestKey: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const updateWikiPayloadSchema: z.ZodObject<{
    approvedByUser: z.ZodLiteral<true>;
    wikiID: z.ZodNumber;
    name: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    mode: z.ZodOptional<z.ZodEnum<{
        replace: "replace";
        append: "append";
    }>>;
}, z.core.$strict>;
export type ListWikisInput = z.infer<typeof listWikisInputSchema>;
export type GetWikiInput = z.infer<typeof getWikiInputSchema>;
export type CreateWikiPayload = z.infer<typeof createWikiPayloadSchema>;
export type UpdateWikiPayload = z.infer<typeof updateWikiPayloadSchema>;
export declare function listWikis(client: LaviyaApiClient, logger: Logger, input: ListWikisInput): Promise<unknown>;
export declare function getWiki(client: LaviyaApiClient, logger: Logger, input: GetWikiInput): Promise<unknown>;
export declare function createWiki(client: LaviyaApiClient, logger: Logger, payload: CreateWikiPayload): Promise<unknown>;
export declare function updateWiki(client: LaviyaApiClient, logger: Logger, payload: UpdateWikiPayload): Promise<unknown>;
//# sourceMappingURL=wikis.d.ts.map