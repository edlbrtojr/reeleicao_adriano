import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';  // Use shared client
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Label } from 'recharts';
import { formatNumber } from '@/utils/formatNumber';
import { Filters } from '@/app/dashboards/page'; // Import Filters type
import { Tooltip as ReactTooltip } from 'react-tooltip'; // Import Tooltip component
import { InfoIcon } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

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

interface MetricCardProps {
    title: string;
    value: string;
}

const localFormatNumber = (value: number): string => {
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + ' milhões';
    } else if (value >= 1000) {
        return (value / 1000).toFixed(1) + ' mil';
    } else {
        return value.toString();
    }
};

const formatWithLatin1 = (value: string): string => {
    return new TextDecoder('iso-8859-1').decode(new TextEncoder().encode(value));
};

const MetricCard: React.FC<MetricCardProps> = ({ title, value }) => (
    <Card className="bg-white dark:bg-gray-800 shadow rounded-lg p-4" data-tooltip-id={title} data-tooltip-content={`${formatWithLatin1(Number(value).toLocaleString('pt-BR'))} ${title}`}>
        <h3 className="text-amber-600 dark:text-amber-400">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{localFormatNumber(Number(value))}</p>
        <ReactTooltip id={title} place="top" />
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

interface CargoData {
    cargo: string;
    total_votos: number;
}

// Update the Candidate interface to match database types
interface Candidate {
    img_candidato: string;        // text in db
    nm_urna_candidato: string;         // text in db
    nr_candidato: number;         // integer in db
    qt_votos: number;            // integer in db
    cd_cargo: number;            // integer in db
    ds_sit_tot_turno: string;    // text in db
    sg_partido: string;    // Add this line
}

// Add new component for displaying elected candidates
const ElectedCandidates: React.FC<{ filters: Filters }> = ({ filters }) => {
    const [candidates, setCandidates] = useState<{ [key: string]: Candidate[] }>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCandidates = async () => {
            // Don't fetch if no year is selected
            if (!filters.selectedYear) {
                setCandidates({});
                return;
            }

            setLoading(true);
            try {
                const { data, error } = await supabase.rpc('get_elected_candidates', {
                    ano_param: filters.selectedYear 
                });

                if (error) {
                    console.error('Supabase Error:', error);
                    throw error;
                }

                // Group candidates by cargo
                const groupedCandidates = data.reduce((acc: { [key: string]: Candidate[] }, candidate: Candidate) => {
                    const cargo = getCargo(candidate.cd_cargo);
                    if (!acc[cargo]) {
                        acc[cargo] = [];
                    }
                    acc[cargo].push(candidate);
                    return acc;
                }, {});

                setCandidates(groupedCandidates);
            } catch (error) {
                console.error('Error fetching candidates:', error);
                setCandidates({});
            } finally {
                setLoading(false);
            }
        };

        fetchCandidates();
    }, [filters]); // Add filters as dependency

    // Add helper function to map cd_cargo to display names
    const getCargo = (cdCargo: number): string => {
        const cargoMap: { [key: number]: string } = {
            3: 'Governador',
            5: 'Senador',
            6: 'Deputados Federais',
            7: 'Deputados Estaduais',
        };
        return cargoMap[cdCargo] || cdCargo.toString();
    };

    if (loading) {
        return <p>Carregando...</p>;
    }

    // Group executives (Governador/Senador) and legislative (Deputados) separately
    return (
        <div className="space-y-6 w-full mx-auto justify-items-start ">
            <h2 className="text-2xl font-bold mb-4">CANDIDATOS ELEITOS</h2>
            
            {/* Executive positions - Governador and Senador in the same row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto w-full">
                {/* Governador Section */}
                <div className="w-full">
                    <h3 className="text-xl font-semibold mb-2">Governador</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {candidates['Governador']?.map((candidate) => (
                            <Card 
                                key={candidate.nr_candidato.toString()} 
                                className="bg-white dark:bg-gray-800 shadow rounded-lg p-2 w-full"
                            >
                                <CardHeader className="space-y-2 p-2">
                                    <div className="relative w-full" style={{ paddingBottom: '133.33%' }}> {/* 3:4 aspect ratio */}
                                        <img 
                                            src={candidate.img_candidato} 
                                            alt={candidate.nm_urna_candidato} 
                                            className="absolute inset-0 w-full h-full object-cover rounded-lg" 
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/placeholder-image.jpg';
                                            }}
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">{candidate.nm_urna_candidato}</h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Número: {candidate.nr_candidato}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Partido: {candidate.sg_partido}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Votos: {localFormatNumber(candidate.qt_votos)}</p>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Senador Section */}
                <div className="w-full">
                    <h3 className="text-xl font-semibold mb-2">Senador</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {candidates['Senador']?.map((candidate) => (
                            <Card 
                                key={candidate.nr_candidato.toString()} 
                                className="bg-white dark:bg-gray-800 shadow rounded-lg p-2 w-full"
                            >
                                <CardHeader className="space-y-2 p-2">
                                    <div className="relative w-full" style={{ paddingBottom: '133.33%' }}> {/* 3:4 aspect ratio */}
                                        <img 
                                            src={candidate.img_candidato} 
                                            alt={candidate.nm_urna_candidato} 
                                            className="absolute inset-0 w-full h-full object-cover rounded-lg" 
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/placeholder-image.jpg';
                                            }}
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">{candidate.nm_urna_candidato}</h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Número: {candidate.nr_candidato}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Partido: {candidate.sg_partido}</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Votos: {localFormatNumber(candidate.qt_votos)}</p>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Legislative positions - single column for each */}
            {['Deputados Federais', 'Deputados Estaduais'].map((cargo) => (
                <div key={cargo} className="mt-6">
                    <h3 className="text-xl font-semibold mb-2">{cargo}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-8 gap-4">
                        {candidates[cargo]?.map((candidate) => (
                            <Card 
                                key={candidate.nr_candidato.toString()} 
                                className="bg-white dark:bg-gray-800 shadow rounded-lg p-2 w-full max-w-[300px] justify-self-center"
                            >
                                <CardHeader className="space-y-2 p-2">
                                    <div className="relative w-full" style={{ paddingBottom: '133.33%' }}> {/* 3:4 aspect ratio */}
                                        <img 
                                            src={candidate.img_candidato} 
                                            alt={candidate.nm_urna_candidato} 
                                            className="absolute inset-0 w-full h-full object-cover rounded-lg" 
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/placeholder-image.jpg';
                                            }}
                                        />
                                    </div>
                                    
                                </CardHeader>
                                <CardContent className="p-2">
                                    <div className="w-full">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate max-w-full">
                                            {candidate.nm_urna_candidato}
                                        </h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Número: {candidate.nr_candidato}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Partido: {candidate.sg_partido}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Votos: {localFormatNumber(candidate.qt_votos)}
                                        </p>
                                    </div>
                                </CardContent>
                               <CardFooter className="w-full align-middle justify-center">
                                    <Badge className="rounded-sm w-full h-full align-middle justify-center bg-green-500 text-white text-[9px] dark:bg-green-700 dark:text-gray-200">
                                        {candidate.ds_sit_tot_turno}
                                    </Badge>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// Add new interface for municipality votes
interface MunicipioVotes {
    nm_municipio: string;
    total_votos: number;
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
    const [cargoData, setCargoData] = useState<{ cargo: string; votos: number }[]>([]);
    const [municipioVotes, setMunicipioVotes] = useState<MunicipioVotes[]>([]);

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
                    setCargoData([]);
                    return;
                }

                // Convert to integer for the RPC call
                const yearInt = parseInt(filters.selectedYear.toString(), 10);
                const municipioInt = filters.selectedMunicipio ? parseInt(filters.selectedMunicipio.toString(), 10) : null;
                const cargoInt = filters.selectedCargo ? parseInt(filters.selectedCargo.toString(), 10) : null;

                // Get metrics, partidos, and cargos data concurrently
                const [metricsResponse, partidosResponse, cargosResponse] = await Promise.all([
                    supabase.rpc('get_eleicao_metrics', { 
                        ano_param: yearInt,
                        municipio_param: municipioInt
                    }),
                    supabase.rpc('get_top_partidos_by_year', {
                        ano_param: yearInt,
                        cargo_param: cargoInt,
                        municipio_param: municipioInt
                    }),
                    supabase.rpc('get_votos_by_cargo', {
                        ano_param: yearInt,
                        municipio_param: municipioInt
                    })
                ]);

                if (metricsResponse.error) throw metricsResponse.error;
                if (partidosResponse.error) throw partidosResponse.error;
                if (cargosResponse.error) throw cargosResponse.error;

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

                // Update cargo data
                if (cargosResponse.data) {
                    setCargoData(cargosResponse.data.map((item: CargoData) => ({
                        cargo: item.cargo,
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
                setCargoData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filters.selectedYear, filters.selectedMunicipio, filters.selectedCargo]); // Add filters.selectedMunicipio as dependency

    useEffect(() => {
        // Add new fetch for municipality votes
        const fetchMunicipioVotes = async () => {
            if (!filters.selectedYear) return;

            const yearInt = parseInt(filters.selectedYear.toString(), 10);
            const cargoInt = filters.selectedCargo ? parseInt(filters.selectedCargo.toString(), 10) : null;

            const { data, error } = await supabase.rpc('get_votos_by_municipio', {
                ano_param: yearInt,
                cargo_param: cargoInt
            });

            if (error) {
                console.error('Error fetching municipality votes:', error);
                return;
            }

            setMunicipioVotes(data);
        };

        fetchMunicipioVotes();
    }, [filters]);

    const getLabelColor = (): string => {
        return '#ffffff'; // Use white color for readability in both light and dark modes
    };

    // Renderização enquanto os dados estão carregando
    if (loading) {
        return <p>Carregando...</p>;
    }

    // Renderiza o gráfico e as métricas
    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4 mt-4">
                <MetricCard title="VOTOS TOTAIS" value={metrics.votosTotais.toString()} />
                <MetricCard title="VOTOS EM BRANCO" value={metrics.votosEmBranco.toString()} />
                <MetricCard title="VOTOS NULOS" value={metrics.votosNulos.toString()} />
                <MetricCard title="APTOS A VOTAR" value={metrics.aptosVotar.toString()} />
                <MetricCard title="ABSTENÇÕES" value={metrics.abstencoes.toString()} />
            </div>
        <div className="flex flex-row mb-4 space-x-4 justify-evenly w-full">    
            <Card className="flex-1 bg-white dark:bg-gray-800">
            <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Votos por Partido</h3>
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
                    tickFormatter={(value) => formatWithLatin1(value.toLocaleString('pt-BR'))}
                    />
                    <YAxis
                    dataKey="partido"
                    type="category"
                    width={70}
                    style={{ fontSize: '0.8rem' }}
                    />
                    <Tooltip
                    formatter={(value) => [
                        formatWithLatin1(value.toLocaleString('pt-BR')),
                        'Votos'
                    ]}
                    labelStyle={{ color: 'var(--tooltip-title-color)' }}
                    contentStyle={{ backgroundColor: 'var(--tooltip-background)', color: 'var(--tooltip-foreground)' }}
                    />
                    <Bar
                    dataKey="votos"
                    fill="#8884d8"
                    label={({ x, y, width, height, value }) => {
                        return (
                            <text
                                x={x + width / 2}
                                y={y + height / 2}
                                fill={getLabelColor()}
                                fontSize={12}
                                textAnchor="insideLeft"
                                dy="0.35em"
                            >
                                {formatWithLatin1(value.toLocaleString('pt-BR'))}
                            </text>
                        );
                    }}
                    />
                </BarChart>
                </ResponsiveContainer>
            </CardContent>
            </Card>
            <Card className="flex-1 bg-white dark:bg-gray-800">
            <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Votos por Cargo</h3>
                <ResponsiveContainer width="100%" height={400}>
                <BarChart
                    data={cargoData}
                    layout="horizontal"
                    margin={{
                    top: 10,
                    right: 30,
                    left: 80,
                    bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={true} />
                    <YAxis
                    type="number"
                    tickFormatter={(value) => formatWithLatin1(value.toLocaleString('pt-BR'))}
                    />
                    <XAxis
                    dataKey="cargo"
                    type="category"
                    width={70}
                    style={{ fontSize: '0.8rem' }}
                    />
                    <Tooltip
                    formatter={(value) => [
                        formatWithLatin1(value.toLocaleString('pt-BR')),
                        'Votos'
                    ]}
                    labelStyle={{ color: 'var(--tooltip-title-color)' }}
                    contentStyle={{ backgroundColor: 'var(--tooltip-background)', color: 'var(--tooltip-foreground)' }}
                    />
                    <Bar
                    dataKey="votos"
                    fill="#82ca9d"
                    label={({ x, y, width, height, value }) => {
                        return (
                            <text
                                x={x + width / 2}
                                y={y + height / 2}
                                fill={getLabelColor()}
                                fontSize={12}
                                textAnchor="middle"
                                dy="0.35em"
                            >
                                {formatWithLatin1(value.toLocaleString('pt-BR'))}
                            </text>
                        );
                    }}
                    />
                </BarChart>
                </ResponsiveContainer>
                {(filters.selectedYear === 2018 || filters.selectedYear === 2026) && (
                    <CardFooter className='flex items-center justify-center mt-4'>
                        <InfoIcon className='w-6 h-6 text-gray-500 dark:text-gray-400 mr-4' /> 
                        <span className='text-sm text-gray-500 dark:text-gray-400'>Neste ano tivemos 2 vagas para o cargo de Senador</span>
                    </CardFooter>
                )}
            </CardContent>
            </Card>

            <Card className="flex-1 bg-white dark:bg-gray-800">
                <CardHeader>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Votos por Município
                    </h3>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border max-h-[400px] overflow-y-auto">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                                <TableRow>
                                    <TableHead className="w-[200px]">Município</TableHead>
                                    <TableHead className="text-right">Total de Votos</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {municipioVotes.map((item) => (
                                    <TableRow key={item.nm_municipio}>
                                        <TableCell>{item.nm_municipio}</TableCell>
                                        <TableCell className="text-right">
                                            {formatWithLatin1(item.total_votos.toLocaleString('pt-BR'))}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
        <ElectedCandidates filters={filters} /> {/* Pass filters prop */}
        </div>
    );
};

export default DashboardVisaoGeralEleicoes;
