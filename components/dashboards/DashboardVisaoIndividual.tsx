import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client'; // Updated import path
import { Card, CardHeader, CardContent, CardFooter } from '../ui/card'; // Import additional ShadCN UI components
import Image from 'next/image';
// Import or define localFormatNumber utility if not already present
import { formatNumber } from '@/utils/formatNumber';
import { Badge } from '../ui/badge';
import CandidateStats from '@/components/CandidateStats'; // Import CandidateStats component
import { MunicipiosTable, BairrosTable } from '../dashboardTables'; // Add import for tables
import MapComponent from '../MapComponent';

// Update Props interface with default values
interface Props {
    filters?: {
        selectedYear?: number;
        selectedCargo?: number | null;
        selectedMunicipio?: number | null;
        candidateSearch?: string;
    };
}

// Update interface to match database schema
interface CandidatoWithVotes {
    sq_candidato: bigint;
    ano_eleicao: number;
    cd_cargo: number;
    ds_cargo: string;
    nr_candidato: number;
    nm_candidato: string;
    nm_urna_candidato: string;
    ds_sit_tot_turno: string;
    sg_partido: string;
    nr_partido: number;
    img_candidato: string;
    total_votos: number;
    ds_grau_instrucao: string;
    cd_cor_raca: number;
    ds_cor_raca: string;
    cd_ocupacao: number;
    ds_ocupacao: string;
}

const DashboardVisaoIndividual: React.FC<Props> = ({ filters = {} }) => {
    const [candidato, setCandidato] = useState<CandidatoWithVotes | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCandidato = async () => {
            setLoading(true);
            setError(null);

            try {
                console.log('DashboardVisaoIndividual - Current filters:', filters);
                console.log('DashboardVisaoIndividual - Candidate search:', filters.candidateSearch);
                
                if (!filters.selectedYear || !filters.candidateSearch) {
                    console.log('Missing required filters - clearing candidate');
                    setCandidato(null);
                    setLoading(false);
                    return;
                }

                const { data, error } = await supabase.rpc('get_candidate_with_votes', {
                    p_ano_eleicao: filters.selectedYear,
                    p_nome_candidato: filters.candidateSearch
                });

                if (error) throw error;

                console.log('Query result:', data);

                if (data && data[0]) {
                    const candidatoData: CandidatoWithVotes = {
                        ...data[0],
                        total_votos: Number(data[0].total_votos)
                    };
                    console.log('Setting candidato data:', candidatoData);
                    setCandidato(candidatoData);
                } else {
                    console.log('No candidate data found');
                    setCandidato(null);
                }
            } catch (err) {
                console.error('Error fetching candidato:', err);
                setError('Erro ao carregar dados do candidato');
            } finally {
                setLoading(false);
            }
        };

        fetchCandidato();
    }, [filters]);

    if (loading) {
        return <p>Carregando dados do candidato...</p>;
    }

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    if (!candidato) {
        return (
            <div className="text-center p-4">
                <p>Selecione um candidato para visualizar seus dados.</p>
            </div>
        );
    }

    return (
        <div className='mt-4 w-full'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4'>
                {/* First card */}
                <Card 
                    key={candidato.nr_candidato.toString()} 
                    className="bg-white dark:bg-gray-800 shadow rounded-lg min-w-[700px] p-2 justify-items-center justify-self-center"
                >
                    <div className="flex flex-row gap-4">
                        <div className="relative w-[200px] h-[266px]">
                            <img 
                                src={candidato.img_candidato} 
                                alt={candidato.nm_urna_candidato} 
                                className="absolute inset-0 w-full h-full object-cover rounded-lg" 
                                onError={(e) => {
                                    console.log('Image failed to load:', candidato.img_candidato);
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/placeholder-image.jpg';
                                    target.onerror = null; // Prevent infinite loop
                                }}
                            />
                        </div>
                    
                        <div className="flex flex-col flex-1 p-4 justify-between">
                            <div className="space-y-2">
                                <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {candidato.nm_urna_candidato} ( {candidato.nr_candidato} )
                                </h4>

                                <div className="space-y-1">
                                    <p className="text-md text-gray-600 dark:text-gray-400">
                                        <b>Partido:</b> {candidato.sg_partido}
                                    </p>
                                    <p className="text-md text-gray-600 dark:text-gray-400">
                                        <b>Escolaridade:</b> {candidato.ds_grau_instrucao}
                                    </p>
                                    <p className="text-md text-gray-600 dark:text-gray-400">
                                        <b>Cor/Raça:</b> {candidato.ds_cor_raca}
                                    </p>
                                    <p className="text-md text-gray-600 dark:text-gray-400">
                                        <b>Ocupação:</b> {candidato.ds_ocupacao}
                                    </p>
                                    <p className="text-md text-gray-600 dark:text-gray-400">
                                        <b>Cargo concorrido:</b> {candidato.ds_cargo}
                                    </p>
                                </div>
                            </div>
                            <Badge className="self-start px-4 py-1 text-sm rounded-md bg-green-500 text-white dark:bg-green-700 dark:text-gray-200">
                                {candidato.ds_sit_tot_turno}
                            </Badge>
                        </div>
                    </div>
                </Card>

                {/* Stats component */}
                {candidato && (
                    <CandidateStats
                        candidateId={candidato.sq_candidato}
                        year={candidato.ano_eleicao}
                        municipio={filters.selectedMunicipio || undefined}
                        cargo={candidato.cd_cargo}
                    />
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="grid grid-cols-2">
                    {candidato && (
                        <>
                            <MunicipiosTable 
                                candidateId={candidato.sq_candidato} 
                                year={candidato.ano_eleicao} 
                            />
                            <BairrosTable 
                                candidateId={candidato.sq_candidato} 
                                year={candidato.ano_eleicao}
                                municipioId={filters?.selectedMunicipio || undefined}
                            />
                        </>
                    )}
                </div>
                
                <div className='bg-black'>

                <MapComponent 
                selectedYear={filters.selectedYear || 2022}
                candidateSearch={filters.candidateSearch || ''}
                sq_candidato={candidato?.sq_candidato}  // Make sure this is being passed
                />

                </div>
            </div>
        </div>
    );
};

export default DashboardVisaoIndividual;