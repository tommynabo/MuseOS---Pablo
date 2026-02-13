// Fix for @types/node conflict
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly NODE_ENV: 'development' | 'production' | 'test';
      readonly SUPABASE_URL?: string;
      readonly SUPABASE_SERVICE_ROLE_KEY?: string;
      readonly DB_TABLE_PROFILES?: string;
      readonly DB_TABLE_POSTS?: string;
      readonly DB_TABLE_CREATORS?: string;
      readonly DB_TABLE_SCHEDULES?: string;
      readonly DB_TABLE_EXECUTIONS?: string;
    }
  }
}

export {};
