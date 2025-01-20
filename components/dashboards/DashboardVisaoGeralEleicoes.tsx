import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
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
    selectedYear: string | null;
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

const DashboardVisaoGeralEleicoes = ({ filters }: { filters: Filters }) => {
    const [data, setData] = useState<{ partido: string; votos: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalVotes, setTotalVotes] = useState<string>('');
    const [topMunicipio, setTopMunicipio] = useState<string>('');
    const [percentByCargo, setPercentByCargo] = useState<{ ds_cargo: string; percentual: number }[]>([]);
    const [totalExpenses, setTotalExpenses] = useState<string>('');
    const supabase = createClient();

    // Re-introduce a function to apply filters
    const applyFilters = (votos: Voto[], candidatos: Candidato[], filters: Filters) => {
        let filteredVotos = votos;
        let filteredCandidatos = candidatos;

        if (filters.selectedYear) {
            filteredVotos = filteredVotos.filter(v => v.ano_eleicao === filters.selectedYear);
        }
        if (filters.selectedCargo) {
            filteredCandidatos = filteredCandidatos.filter(c => c.cd_cargo === filters.selectedCargo);
        }
        if (filters.selectedMunicipio) {
            filteredVotos = filteredVotos.filter(v => v.cd_municipio === filters.selectedMunicipio);
        }

        const candidatoMap = filteredCandidatos.reduce((acc, candidato) => {
            acc[candidato.sq_candidato] = candidato;
            return acc;
        }, {} as Record<number, Candidato>);

        const aggregated = filteredVotos.reduce((acc, voto) => {
            const candidato = candidatoMap[voto.sq_candidato];
            if (candidato) {
                const existing = acc.find(item => item.partido === candidato.sg_partido);
                if (existing) {
                    existing.votos += voto.qt_votos;
                } else {
                    acc.push({ partido: candidato.sg_partido, votos: voto.qt_votos });
                }
            }
            return acc;
        }, [] as { partido: string; votos: number }[])
        .sort((a, b) => b.votos - a.votos)
        .slice(0, 10);

        return aggregated;
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Check cache
                const cachedVotos = localStorage.getItem('allVotos');
                const cachedCandidatos = localStorage.getItem('allCandidatos');

                let allVotos: Voto[] = [];
                let allCandidatos: Candidato[] = [];

                if (cachedVotos && cachedCandidatos) {
                    allVotos = JSON.parse(cachedVotos);
                    allCandidatos = JSON.parse(cachedCandidatos);
                } else {
                    const { data: votosData } = await supabase
                        .from('votos')
                        .select('sq_candidato, qt_votos, ano_eleicao, cd_municipio');
                    const { data: candidatosData } = await supabase
                        .from('candidatos')
                        .select('sq_candidato, sg_partido, cd_cargo');

                    allVotos = votosData || [];
                    allCandidatos = candidatosData || [];

                    // Store data
                    localStorage.setItem('allVotos', JSON.stringify(allVotos));
                    localStorage.setItem('allCandidatos', JSON.stringify(allCandidatos));
                }

                const filteredData = applyFilters(allVotos, allCandidatos, filters);
                setData(filteredData);

                // Fetch metrics
                const { data: totalVotesData } = await supabase.rpc('total_votes');
                const { data: topMunicipioData } = await supabase.rpc('top_municipio');
                const { data: percentByCargoData } = await supabase.rpc('percent_by_cargo');
                const { data: totalExpensesData } = await supabase.rpc('total_expenses');

                if (totalVotesData && totalVotesData.length > 0) {
                    setTotalVotes(formatNumber(totalVotesData[0].sum, 'K'));
                }
                if (topMunicipioData && topMunicipioData.length > 0) {
                    setTopMunicipio(topMunicipioData[0].nm_municipio);
                }
                if (percentByCargoData) {
                    setPercentByCargo(percentByCargoData);
                }
                if (totalExpensesData && totalExpensesData.length > 0) {
                    setTotalExpenses(formatNumber(totalExpensesData[0].sum, 'M'));
                }
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filters]); // Run whenever filters change

    // Renderização enquanto os dados estão carregando
    if (loading) {
        return <p>Carregando...</p>;
    }

    // Renderiza o gráfico e as métricas
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <MetricCard title="VOTOS TOTAIS" value={totalVotes} />
                <MetricCard title="TEVE MAIS VOTOS EM" value={topMunicipio} />
                <MetricCard title="% DE VOTOS POR CARGO" value={percentByCargo.map(cargo => `${cargo.ds_cargo}: ${cargo.percentual.toFixed(2)}%`).join(', ')} />
                <MetricCard title="DESPESAS/GASTOS" value={totalExpenses} />
            </div>
            <Card>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{
                                top: 20, right: 30, left: 20, bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 4" />
                            <XAxis type="number" dataKey="votos" />
                            <YAxis dataKey="partido" type="category" />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="votos" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};

export default DashboardVisaoGeralEleicoes;
