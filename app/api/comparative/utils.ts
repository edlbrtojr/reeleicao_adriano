import { createClient } from '@/utils/supabase/server';

export async function fetchCandidates(query?: string, year?: string, cargo?: string) {
    const supabase = await createClient();
    
    console.log('Fetching candidates with params:', { query, year, cargo });
    
    try {
        // Direct query instead of RPC
        const { data, error } = await supabase
            .from('candidatos')
            .select('*')
            .eq('ano_eleicao', year ? parseInt(year) : 2022)
            .or(`nm_urna_candidato.ilike.%${query || ''}%,nm_candidato.ilike.%${query || ''}%`)
            .limit(10);

        if (error) {
            console.error('Database error:', error);
            throw error;
        }

        console.log('Query results:', data);
        return data || [];
    } catch (error) {
        console.error('Error in fetchCandidates:', error);
        throw error;
    }
}
