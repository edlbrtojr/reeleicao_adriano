import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const candidate1Id = searchParams.get('candidate1Id');
    const candidate2Id = searchParams.get('candidate2Id');
    const year = searchParams.get('year');

    if (!candidate1Id || !candidate2Id || !year) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    try {
        const supabase = await createClient();

        // Fetch candidate data
        const { data: candidate1Data, error: candidate1Error } = await supabase
            .from('candidatos')
            .select(`
                sq_candidato,
                nm_candidato,
                nm_urna_candidato,
                nr_candidato,
                sg_partido,
                img_candidato,
                cd_cargo,
                cd_situacao_candidatura,
                ds_situacao_candidatura,
                cd_sit_tot_turno,
                ds_sit_tot_turno
            `)
            .eq('sq_candidato', candidate1Id)
            .eq('ano_eleicao', year)
            .single();

        if (candidate1Error) throw candidate1Error;

        const { data: candidate2Data, error: candidate2Error } = await supabase
            .from('candidatos')
            .select(`
                sq_candidato,
                nm_candidato,
                nm_urna_candidato,
                nr_candidato,
                sg_partido,
                img_candidato,
                cd_cargo,
                cd_situacao_candidatura,
                ds_situacao_candidatura,
                cd_sit_tot_turno,
                ds_sit_tot_turno
            `)
            .eq('sq_candidato', candidate2Id)
            .eq('ano_eleicao', year)
            .single();

        if (candidate2Error) throw candidate2Error;

        // Get votes by municipality for both candidates
        const [municipiosData1, municipiosData2] = await Promise.all([
            supabase.rpc('get_candidate_votes_by_municipality', {
                p_sq_candidato: candidate1Id,
                p_ano_eleicao: parseInt(year)
            }),
            supabase.rpc('get_candidate_votes_by_municipality', {
                p_sq_candidato: candidate2Id,
                p_ano_eleicao: parseInt(year)
            })
        ]);

        // Process comparison data
        const commonMunicipios = processMunicipalityData(
            municipiosData1.data || [],
            municipiosData2.data || []
        );

        const totalVotesCandidate1 = calculateTotalVotes(municipiosData1.data || []);
        const totalVotesCandidate2 = calculateTotalVotes(municipiosData2.data || []);
        
        const totalVotes = totalVotesCandidate1 + totalVotesCandidate2;
        const votingPercentageDiff = totalVotes > 0 
            ? ((totalVotesCandidate1 - totalVotesCandidate2) / totalVotes) * 100 
            : 0;

        return NextResponse.json({
            candidate1: candidate1Data,
            candidate2: candidate2Data,
            votingComparison: {
                commonMunicipios,
                totalVotesCandidate1,
                totalVotesCandidate2,
                votingPercentageDiff
            }
        });

    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Internal server error' 
        }, { status: 500 });
    }
}

function processMunicipalityData(data1: any[], data2: any[]) {
    const municipalityMap = new Map();
    
    data1.forEach(m1 => {
        municipalityMap.set(m1.nm_municipio, {
            nm_municipio: m1.nm_municipio,
            votes1: m1.total_votos || 0,
            votes2: 0
        });
    });

    data2.forEach(m2 => {
        const existing = municipalityMap.get(m2.nm_municipio);
        if (existing) {
            existing.votes2 = m2.total_votos || 0;
        } else {
            municipalityMap.set(m2.nm_municipio, {
                nm_municipio: m2.nm_municipio,
                votes1: 0,
                votes2: m2.total_votos || 0
            });
        }
    });

    return Array.from(municipalityMap.values());
}

function calculateTotalVotes(data: any[]): number {
    return data.reduce((acc, curr) => acc + (curr.total_votos || 0), 0);
}
