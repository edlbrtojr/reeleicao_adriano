declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NEXT_PUBLIC_SUPABASE_URL: string
            NEXT_PUBLIC_SUPABASE_ANON_KEY: string
            SUPABASE_SERVICE_KEY: string
            NEXT_PUBLIC_MAPBOX_TOKEN: string
        }
    }
}

export {}
