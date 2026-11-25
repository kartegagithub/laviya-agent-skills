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
}, "strict", z.ZodTypeAny, {
    search?: string | undefined;
    projectID?: number | undefined;
    project?: string | undefined;
    parentWikiID?: number | undefined;
}, {
    search?: string | undefined;
    projectID?: number | undefined;
    project?: string | undefined;
    parentWikiID?: number | undefined;
}>;
export declare const getWikiInputSchema: z.ZodObject<{
    wikiID: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    wikiID: number;
}, {
    wikiID: number;
}>;
export declare const createWikiPayloadSchema: z.ZodObject<{
    approvedByUser: z.ZodLiteral<true>;
    projectID: z.ZodOptional<z.ZodNumber>;
    project: z.ZodOptional<z.ZodString>;
    parentWikiID: z.ZodOptional<z.ZodNumber>;
    name: z.ZodString;
    content: z.ZodOptional<z.ZodString>;
    relatedTaskIDs: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    requestKey: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    name: string;
    approvedByUser: true;
    content?: string | undefined;
    projectID?: number | undefined;
    requestKey?: string | undefined;
    project?: string | undefined;
    parentWikiID?: number | undefined;
    relatedTaskIDs?: number[] | undefined;
}, {
    name: string;
    approvedByUser: true;
    content?: string | undefined;
    projectID?: number | undefined;
    requestKey?: string | undefined;
    project?: string | undefined;
    parentWikiID?: number | undefined;
    relatedTaskIDs?: number[] | undefined;
}>;
export declare const updateWikiPayloadSchema: z.ZodObject<{
    approvedByUser: z.ZodLiteral<true>;
    wikiID: z.ZodNumber;
    name: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    mode: z.ZodOptional<z.ZodEnum<["replace", "append"]>>;
}, "strict", z.ZodTypeAny, {
    approvedByUser: true;
    wikiID: number;
    mode?: "replace" | "append" | undefined;
    content?: string | undefined;
    name?: string | undefined;
}, {
    approvedByUser: true;
    wikiID: number;
    mode?: "replace" | "append" | undefined;
    content?: string | undefined;
    name?: string | undefined;
}>;
export type ListWikisInput = z.infer<typeof listWikisInputSchema>;
export type GetWikiInput = z.infer<typeof getWikiInputSchema>;
export type CreateWikiPayload = z.infer<typeof createWikiPayloadSchema>;
export type UpdateWikiPayload = z.infer<typeof updateWikiPayloadSchema>;
export declare function listWikis(client: LaviyaApiClient, logger: Logger, input: ListWikisInput): Promise<unknown>;
export declare function getWiki(client: LaviyaApiClient, logger: Logger, input: GetWikiInput): Promise<unknown>;
export declare function createWiki(client: LaviyaApiClient, logger: Logger, payload: CreateWikiPayload): Promise<unknown>;
export declare function updateWiki(client: LaviyaApiClient, logger: Logger, payload: UpdateWikiPayload): Promise<unknown>;
//# sourceMappingURL=wikis.d.ts.map