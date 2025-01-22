import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');
    const year = searchParams.get('year');
    const municipioId = searchParams.get('municipioId');

    if (!candidateId || !year) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase.rpc('get_candidate_votes_by_neighborhood', {
            p_sq_candidato: candidateId,
            p_ano_eleicao: parseInt(year),
            p_cd_municipio: municipioId ? parseInt(municipioId) : null
        });

        if (error) throw error;

        const formattedData = data.map((item: any) => ({
            name: item.nm_bairro,
            votes: Number(item.total_votos),
            percentage: Number(item.percentual_votos)
        }));

        return NextResponse.json({ data: formattedData });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
