export type AssetKey =
  | "orchestratorSystemPrompt"
  | "executionSummarySchema"
  | "completeExecutionPayloadExample"
  | "claudeSkill"
  | "cursorRule"
  | "setupGuide"
  | "installationGuide"
  | "mcpPublishGuide";

export declare const packageRoot: string;

export declare const assetRelativePaths: Readonly<Record<AssetKey, string>>;

export declare const assets: Readonly<Record<AssetKey, string>>;

export declare function resolvePackagePath(relativePath: string): string;

export declare function resolveAssetPath(assetKey: AssetKey): string;

export declare function listAssetPaths(): Record<AssetKey, string>;
