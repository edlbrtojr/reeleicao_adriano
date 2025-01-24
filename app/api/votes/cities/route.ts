import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');
    const year = searchParams.get('year');

    if (!candidateId || !year) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase.rpc('get_votes_by_city', {
            p_ano_eleicao: parseInt(year),
            p_sq_candidato: candidateId
        });

        if (error) throw error;

        const validData = (data || []).filter(
            (city: any) => city.latitude != null && city.longitude != null
        );

        return NextResponse.json({ data: validData });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
