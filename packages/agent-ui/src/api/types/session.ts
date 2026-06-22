export interface OpenCodeSession {
  id: string;
  slug: string;
  projectID: string;
  workspaceID?: string;
  directory: string;
  path?: string;
  parentID?: string;
  title: string;
  agent?: string;
  model?: { id: string; providerID: string; variant?: string };
  version: string;
  time: { created: number; updated: number; compacting?: number; archived?: number };
}

export interface CreateSessionInput {
  parentID?: string;
  title?: string;
  agent?: string;
  model?: { id: string; providerID: string; variant?: string };
  metadata?: Record<string, unknown>;
  workspaceID?: string;
}
