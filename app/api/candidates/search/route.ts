import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('candidateName');
    const year = searchParams.get('year');

    if (!year) {
        return NextResponse.json({ error: 'Year is required' }, { status: 400 });
    }

    try {
        const supabase = await createClient();
        
        console.log('Searching candidates:', { query, year });

        const { data, error } = await supabase
            .from('candidatos')
            .select('sq_candidato, nm_candidato, nm_urna_candidato, nr_candidato, sg_partido, cd_cargo, ds_cargo')
            .eq('ano_eleicao', parseInt(year))
            .ilike('nm_urna_candidato', `%${query || ''}%`)
            .order('nm_urna_candidato')
            .limit(10);

        if (error) {
            console.error('Database error:', error);
            throw error;
        }

        console.log('Found candidates:', data?.length);
        return NextResponse.json({ data });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Failed to search candidates' }, { status: 500 });
    }
}
