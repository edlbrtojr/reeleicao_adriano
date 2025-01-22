import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatNumber } from '@/utils/formatNumber';
import { UserCheck, Building2, PercentCircle, Wallet } from 'lucide-react';

interface Props {
    candidateId: bigint;
    year: number;
    municipio?: number;
    cargo?: number;
}

interface Stats {
    totalVotes: number;
    topCity: {
        name: string;
        votes: number;
    };
    votePercentage: number;
    totalExpenses: number;
}

const CandidateStats: React.FC<Props> = ({ candidateId, year, municipio, cargo }) => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClientComponentClient();

    useEffect(() => {
        const fetchStats = async () => {
            if (!candidateId || !year) return;

            setLoading(true);
            try {
                // Get total votes
                const { data: votesData } = await supabase
                    .rpc('get_candidate_total_votes', {
                        p_sq_candidato: candidateId,
                        p_ano_eleicao: year,
                        p_cd_municipio: municipio || null
                    });

                // Get top city
                const { data: cityData } = await supabase
                    .rpc('get_candidate_top_city', {
                        p_sq_candidato: candidateId,
                        p_ano_eleicao: year
                    });

                // Get vote percentage
                const { data: percentageData } = await supabase
                    .rpc('get_candidate_vote_percentage', {
                        p_sq_candidato: candidateId,
                        p_ano_eleicao: year,
                        p_cd_cargo: cargo || null
                    });

                // Get total expenses
                const { data: expensesData } = await supabase
                    .rpc('get_candidate_total_expenses', {
                        p_sq_candidato: candidateId,
                        p_ano_eleicao: year
                    });

                setStats({
                    totalVotes: votesData?.[0]?.total_votos || 0,
                    topCity: {
                        name: cityData?.[0]?.nm_municipio || '',
                        votes: cityData?.[0]?.total_votos || 0
                    },
                    votePercentage: percentageData?.[0]?.percentage || 0,
                    totalExpenses: expensesData?.[0]?.total_expenses || 0
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [candidateId, year, municipio, cargo]);

    if (loading) {
        return <div>Carregando estatísticas...</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 ">
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Votos</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold text-primary">{formatNumber(stats?.totalVotes || 0, 'K')}</p>
                    <p className="text-xs text-muted-foreground">votos computados</p>
                </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cidade com Mais Votos</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold text-primary">{stats?.topCity.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {formatNumber(stats?.topCity.votes || 0, 'K')} votos
                    </p>
                </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Porcentagem dos Votos</CardTitle>
                    <PercentCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold text-primary">{stats?.votePercentage.toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground">do total de votos válidos</p>
                </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Despesa Total</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold text-primary">
                        {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                        }).format(stats?.totalExpenses || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">em gastos declarados</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default CandidateStats;
