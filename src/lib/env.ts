function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env.local and fill it in.`);
  }
  return value;
}

export const ENV = {
  SUPABASE_URL: required('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  SUPABASE_ANON_KEY: required('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY),
} as const;
