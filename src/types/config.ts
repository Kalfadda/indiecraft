export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  schemaInitialized: boolean;
}

export interface ExportedConfig {
  app: "IndieCraft";
  version: number;
  supabaseUrl: string;
  supabaseAnonKey: string;
}
