import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatNumber } from '@/utils/formatNumber';
import { UserCheck, Building2, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CandidatoData } from '@/types/candidate';

interface CandidateStatsComparativoProps {
  candidate1: CandidatoData;
  candidate2: CandidatoData;
}

interface Stats {
  totalVotes: number;
  topCity: {
    name: string;
    votes: number;
  };
  totalExpenses: number;
}

export const CandidateStatsComparativo: React.FC<CandidateStatsComparativoProps> = ({
  candidate1,
  candidate2
}) => {
  const [stats1, setStats1] = useState<Stats | null>(null);
  const [stats2, setStats2] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchStats = async (candidateId: bigint, setStats: React.Dispatch<React.SetStateAction<Stats | null>>) => {
      if (!candidateId) return;

      setLoading(true);
      try {
        // Get total votes - add p_cd_municipio parameter
        const { data: votesData, error: votesError } = await supabase
          .rpc('get_candidate_total_votes', {
            p_sq_candidato: candidateId,
            p_ano_eleicao: 2022,
            p_cd_municipio: null  // Add this parameter
          });

        if (votesError) {
          console.error('Error fetching total votes:', votesError);
          throw votesError;
        }

        // Get top city
        const { data: cityData, error: cityError } = await supabase
          .rpc('get_candidate_top_city', {
            p_sq_candidato: candidateId,
            p_ano_eleicao: 2022
          });

        if (cityError) {
          console.error('Error fetching top city:', cityError);
          throw cityError;
        }

        // Get total expenses
        const { data: expensesData, error: expensesError } = await supabase
          .rpc('get_candidate_total_expenses', {
            p_sq_candidato: candidateId,
            p_ano_eleicao: 2022
          });

        if (expensesError) {
          console.error('Error fetching total expenses:', expensesError);
          throw expensesError;
        }

        setStats({
          totalVotes: votesData?.[0]?.total_votos || 0,
          topCity: {
            name: cityData?.[0]?.nm_municipio || '',
            votes: cityData?.[0]?.total_votos || 0
          },
          totalExpenses: expensesData?.[0]?.total_expenses || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats(candidate1.sq_candidato, setStats1);
    fetchStats(candidate2.sq_candidato, setStats2);
  }, [candidate1, candidate2]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="w-full h-[100px] rounded-lg" />
        <Skeleton className="w-full h-[100px] rounded-lg" />
        <Skeleton className="w-full h-[100px] rounded-lg" />
        <Skeleton className="w-full h-[100px] rounded-lg" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Candidate 1 stats */}
      <div className="space-y-4">
        <h2>{candidate1.nm_urna_candidato}</h2>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Votos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatNumber(stats1?.totalVotes || 0, 'K')}</p>
            <p className="text-xs text-muted-foreground">votos computados</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cidade com Mais Votos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{stats1?.topCity.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats1?.topCity.votes || 0, 'K')} votos
            </p>
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
              }).format(stats1?.totalExpenses || 0)}
            </p>
            <p className="text-xs text-muted-foreground">em gastos declarados</p>
          </CardContent>
        </Card>
      </div>

      {/* Candidate 2 stats */}
      <div className="space-y-4">
        <h2>{candidate2.nm_urna_candidato}</h2>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Votos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatNumber(stats2?.totalVotes || 0, 'K')}</p>
            <p className="text-xs text-muted-foreground">votos computados</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cidade com Mais Votos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{stats2?.topCity.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats2?.topCity.votes || 0, 'K')} votos
            </p>
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
              }).format(stats2?.totalExpenses || 0)}
            </p>
            <p className="text-xs text-muted-foreground">em gastos declarados</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};