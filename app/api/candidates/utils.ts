import { createClient } from '@/utils/supabase/server';

export async function fetchCandidates(query?: string, year?: string, cargo?: string) {
    const supabase = await createClient();

    let dbQuery = supabase
        .from('candidatos')
        .select('sq_candidato, nm_candidato, nm_urna_candidato, sg_partido, nr_candidato');

    if (query) {
        dbQuery = dbQuery.ilike('nm_candidato', `%${query}%`).limit(10);
    }

    if (year) {
        dbQuery = dbQuery.eq('ano_eleicao', parseInt(year));
    }

    if (cargo) {
        dbQuery = dbQuery.eq('cd_cargo', parseInt(cargo));
    }

    const { data, error } = await dbQuery;

    if (error) {
        console.error('Supabase error:', error);
        return [];
    }

    return data || [];
}
