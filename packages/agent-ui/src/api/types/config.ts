export interface ProviderConfig {
  id: string;
  name: string;
  source: "env" | "config" | "custom" | "api";
  models: Record<string, ModelConfig>;
}

export interface ModelConfig {
  id: string;
  name?: string;
}

export interface ProvidersResponse {
  providers: ProviderConfig[];
  default: Record<string, string>;
}
