import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent } from '@/components/ui/card';
import { formatNumber } from '@/utils/formatNumber';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface MetricCardProps {
  title: string;
  value: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value }) => (
  <Card className="bg-white shadow rounded-lg p-4">
    <h3 className="text-amber-600">{title}</h3>
    <p className="text-2xl font-bold">{value}</p>
  </Card>
);

const ElectionMetrics: React.FC = () => {
  const [totalVotes, setTotalVotes] = useState<string>('');
  const [topMunicipio, setTopMunicipio] = useState<string>('');
  const [percentByCargo, setPercentByCargo] = useState<{ ds_cargo: string; percentual: number }[]>([]);
  const [totalExpenses, setTotalExpenses] = useState<string>('');

  useEffect(() => {
    const fetchMetrics = async () => {
      const { data: totalVotesData } = await supabase.rpc('total_votes');
      const { data: topMunicipioData } = await supabase.rpc('top_municipio');
      const { data: percentByCargoData } = await supabase.rpc('percent_by_cargo');
      const { data: totalExpensesData } = await supabase.rpc('total_expenses');

      setTotalVotes(formatNumber(totalVotesData[0].sum, 'K'));
      setTopMunicipio(topMunicipioData[0].nm_municipio);
      setPercentByCargo(percentByCargoData);
      setTotalExpenses(formatNumber(totalExpensesData[0].sum, 'M'));
    };

    fetchMetrics();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard title="VOTOS TOTAIS" value={totalVotes} />
      <MetricCard title="TEVE MAIS VOTOS EM" value={topMunicipio} />
      <MetricCard title="% DE VOTOS POR CARGO" value={percentByCargo.map(cargo => `${cargo.ds_cargo}: ${cargo.percentual.toFixed(2)}%`).join(', ')} />
      <MetricCard title="DESPESAS/GASTOS" value={totalExpenses} />
    </div>
  );
};

export default ElectionMetrics;
