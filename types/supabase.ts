export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
    // Add your database types here if needed
    // This is a minimal implementation
    public: {
        Tables: {
            [key: string]: any
        }
        Functions: {
            [key: string]: any
        }
        Enums: {
            [key: string]: any
        }
    }
}
