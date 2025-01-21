import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';  // Use shared client
import { Card, CardContent } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { formatNumber } from '@/utils/formatNumber';

// Tipos para os dados de votos e candidatos
interface Voto {
    sq_candidato: number;
    qt_votos: number;
    ano_eleicao: string;
    cd_municipio: string;
}

interface Candidato {
    sq_candidato: number;
    sg_partido: string;
    cd_cargo: string;
}

interface Filters {
    selectedYear: number | null;
    selectedView: string;
    selectedCargo: string | null;
    selectedMunicipio?: string | null;
}

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

interface MetricData {
    votosTotais: number;
    votosEmBranco: number;
    votosNulos: number;
    aptosVotar: number;
    abstencoes: number;
}

interface PartidoData {
    partido: string;
    total_votos: number;
}

// Add error interface
interface SupabaseError {
    message?: string;
    details?: string;
    hint?: string;
    code?: string;
}

const DashboardVisaoGeralEleicoes = ({ filters }: { filters: Filters }) => {
    const [data, setData] = useState<{ partido: string; votos: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalVotes, setTotalVotes] = useState<string>('');
    const [topMunicipio, setTopMunicipio] = useState<string>('');
    const [percentByCargo, setPercentByCargo] = useState<{ ds_cargo: string; percentual: number }[]>([]);
    const [totalExpenses, setTotalExpenses] = useState<string>('');
    const [metrics, setMetrics] = useState<MetricData>({
        votosTotais: 0,
        votosEmBranco: 0,
        votosNulos: 0,
        aptosVotar: 0,
        abstencoes: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (!filters.selectedYear) {
                    setMetrics({
                        votosTotais: 0,
                        votosEmBranco: 0,
                        votosNulos: 0,
                        aptosVotar: 0,
                        abstencoes: 0
                    });
                    setData([]);
                    return;
                }

                // Convert to integer for the RPC call
                const yearInt = parseInt(filters.selectedYear.toString(), 10);

                // Get metrics and partidos data concurrently
                const [metricsResponse, partidosResponse] = await Promise.all([
                    supabase.rpc('get_eleicao_metrics', { ano_param: yearInt }),
                    supabase.rpc('get_top_partidos_by_year', { ano_param: yearInt })
                ]);

                if (metricsResponse.error) throw metricsResponse.error;
                if (partidosResponse.error) throw partidosResponse.error;

                // Update metrics state
                if (metricsResponse.data?.[0]) {
                    setMetrics({
                        votosTotais: metricsResponse.data[0].votos_totais ?? 0,
                        votosEmBranco: metricsResponse.data[0].votos_brancos ?? 0,
                        votosNulos: metricsResponse.data[0].votos_nulos ?? 0,
                        aptosVotar: metricsResponse.data[0].aptos_votar ?? 0,
                        abstencoes: metricsResponse.data[0].abstencoes ?? 0
                    });
                }

                // Update chart data
                if (partidosResponse.data) {
                    setData(partidosResponse.data.map((item: PartidoData) => ({
                        partido: item.partido,
                        votos: Number(item.total_votos)
                    })));
                }

            } catch (error: unknown) {
                console.error('Error fetching data:', error);
                const supabaseError = error as SupabaseError;
                console.error('Detailed error:', {
                    message: supabaseError.message || 'Unknown error',
                    details: supabaseError.details || 'No details available',
                    hint: supabaseError.hint || 'No hint available',
                    code: supabaseError.code || 'No error code'
                });
                
                setMetrics({
                    votosTotais: 0,
                    votosEmBranco: 0,
                    votosNulos: 0,
                    aptosVotar: 0,
                    abstencoes: 0
                });
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filters]);

    // Renderização enquanto os dados estão carregando
    if (loading) {
        return <p>Carregando...</p>;
    }

    // Renderiza o gráfico e as métricas
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                <MetricCard title="VOTOS TOTAIS" value={metrics.votosTotais.toString()} />
                <MetricCard title="VOTOS EM BRANCO" value={metrics.votosEmBranco.toString()} />
                <MetricCard title="VOTOS NULOS" value={metrics.votosNulos.toString()} />
                <MetricCard title="APTOS A VOTAR" value={metrics.aptosVotar.toString()} />
                <MetricCard title="ABSTENÇÕES" value={metrics.abstencoes.toString()} />
            </div>
            <Card>
                <CardContent className="pt-6">
                    <h3 className="text-xl font-semibold mb-4">Votos por Partido</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{
                                top: 5,
                                right: 30,
                                left: 80,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} />
                            <XAxis
                                type="number"
                                tickFormatter={(value) => value.toLocaleString('pt-BR')}
                            />
                            <YAxis
                                dataKey="partido"
                                type="category"
                                width={70}
                                style={{ fontSize: '0.8rem' }}
                            />
                            <Tooltip
                                formatter={(value) => [
                                    value.toLocaleString('pt-BR'),
                                    'Votos'
                                ]}
                                labelStyle={{ color: 'black' }}
                            />
                            <Bar
                                dataKey="votos"
                                fill="#8884d8"
                                label={{
                                    position: 'right',
                                    formatter: (value: number) => value.toLocaleString('pt-BR'),
                                    fill: '#666',
                                    fontSize: 12
                                }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

export default DashboardVisaoGeralEleicoes;
