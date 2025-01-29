import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { supabase } from '@/utils/supabase/client';
import { CandidateSelect } from '../CandidateSelect-Comparativo';
import { ComparisonCharts } from '../ComparisonCharts-Comparativo';
import { CandidateCard } from '@/components/CandidateCard-Comparativo';
import { CandidatoData } from '@/types/candidate';
import debounce from 'lodash.debounce';
import { CandidateStatsComparativo } from '@/components/CandidateStats-Comparativo';
import ComparativeMapComponent from '../ComparativeMapComponent';

const colorOptions = ['DeepSkyBlue', 'green', 'yellow', 'orange', 'red', 'purple', 'pink', 'teal', 'brown', 'gray'];

interface Props {
    filters?: {
        selectedYear?: number;
        selectedCargo?: number | null;
        selectedMunicipio?: number | null;
        candidateSearch?: string;
    };
}

interface ComparisonData {
    candidate1?: CandidatoData;
    candidate2?: CandidatoData;
    votingComparison?: {
        commonMunicipios: any[];
        totalVotesCandidate1: number;
        totalVotesCandidate2: number;
        votingPercentageDiff: number;
    };
}

const DashboardComparativoCandidatos: React.FC<Props> = ({ filters = {} }) => {
    const [selectedCandidates, setSelectedCandidates] = useState<ComparisonData>({});
    const [candidateColors, setCandidateColors] = useState({
        candidate1: 'DeepSkyBlue', // Default blue
        candidate2: 'red'  // Default red
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [candidateSearch1, setCandidateSearch1] = useState<string>('');
    const [candidateSearch2, setCandidateSearch2] = useState<string>('');
    const [filteredCandidates1, setFilteredCandidates1] = useState<CandidatoData[]>([]);
    const [filteredCandidates2, setFilteredCandidates2] = useState<CandidatoData[]>([]);
    const [isSearching1, setIsSearching1] = useState(false);
    const [isSearching2, setIsSearching2] = useState(false);
    const [candidate1Selected, setCandidate1Selected] = useState(false);
    const [candidate2Selected, setCandidate2Selected] = useState(false);

    const fetchComparisonData = async (candidate1Id: bigint, candidate2Id: bigint, year: number) => {
        try {
            setLoading(true);
            setError(null); // Clear any previous errors
            
            const response = await fetch(
                `/api/comparative?candidate1Id=${candidate1Id.toString()}&candidate2Id=${candidate2Id.toString()}&year=${year}`
            );

            const result = await response.json();
            
            if (!response.ok) {
                console.error('API Error:', result);
                throw new Error(result.details || result.error || 'Failed to fetch comparison data');
            }

            if (!result.votingComparison) {
                return {
                    commonMunicipios: [],
                    totalVotesCandidate1: 0,
                    totalVotesCandidate2: 0,
                    votingPercentageDiff: 0
                };
            }

            return result.votingComparison;
        } catch (error) {
            console.error('Error in comparison:', error);
            setError(error instanceof Error ? error.message : 'Error processing comparison data');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleCandidateSelect = async (candidate: CandidatoData, position: 'candidate1' | 'candidate2') => {
        console.log('Selected candidate data:', candidate); // Add this line
        try {
            if (position === 'candidate1') {
                setCandidateSearch1(candidate.nm_urna_candidato);
                setFilteredCandidates1([]);
                setIsSearching1(false);
                setCandidate1Selected(true);
                setSelectedCandidates(prev => ({
                    ...prev,
                    candidate1: candidate
                }));
            } else {
                setCandidateSearch2(candidate.nm_urna_candidato);
                setFilteredCandidates2([]);
                setIsSearching2(false);
                setCandidate2Selected(true);
                
                // Only fetch comparison when second candidate is selected
                const otherCandidate = selectedCandidates.candidate1;
                if (otherCandidate) {
                    setLoading(true);
                    const comparisonData = await fetchComparisonData(
                        otherCandidate.sq_candidato,
                        candidate.sq_candidato,
                        filters.selectedYear || 2022
                    );
                    
                    setSelectedCandidates(prev => ({
                        ...prev,
                        candidate2: candidate,
                        votingComparison: comparisonData || undefined
                    }));
                } else {
                    setSelectedCandidates(prev => ({
                        ...prev,
                        candidate2: candidate
                    }));
                }
            }
        } catch (error) {
            console.error('Error selecting candidate:', error);
            setError('Erro ao selecionar candidato');
        } finally {
            setLoading(false);
        }
    };

    const handleColorSelect = (color: string, position: 'candidate1' | 'candidate2') => {
        if (candidateColors.candidate1 === color || candidateColors.candidate2 === color) return;
        setCandidateColors(prev => ({
            ...prev,
            [position]: color
        }));
    };

    const debouncedSearch1 = useCallback(
        debounce(async (searchTerm: string) => {
            if (!searchTerm || !filters.selectedYear) {
                setFilteredCandidates1([]);
                setIsSearching1(false);
                return;
            }

            try {
                setIsSearching1(true);
                console.log('Searching candidates 1:', { searchTerm, year: filters.selectedYear });

                const { data, error } = await supabase
                    .from('candidatos')
                    .select(`
                        sq_candidato,
                        nm_candidato,
                        nm_urna_candidato,
                        nr_candidato,
                        sg_partido,
                        ds_cargo,
                        img_candidato
                    `)
                    .eq('ano_eleicao', filters.selectedYear)
                    .ilike('nm_urna_candidato', `%${searchTerm}%`)
                    .limit(10);

                if (error) throw error;

                console.log('Search 1 results:', data);
                setFilteredCandidates1(data || []);
            } catch (error) {
                console.error('Search 1 error:', error);
                setFilteredCandidates1([]);
            } finally {
                setIsSearching1(false);
            }
        }, 300),
        [filters.selectedYear]
    );

    const debouncedSearch2 = useCallback(
        debounce(async (searchTerm: string) => {
            if (!searchTerm || !filters.selectedYear) {
                setFilteredCandidates2([]);
                setIsSearching2(false);
                return;
            }

            try {
                setIsSearching2(true);
                console.log('Searching candidates 2:', { searchTerm, year: filters.selectedYear });

                const { data, error } = await supabase
                    .from('candidatos')
                    .select(`
                        sq_candidato,
                        nm_candidato,
                        nm_urna_candidato,
                        nr_candidato,
                        sg_partido,
                        ds_cargo,
                        img_candidato
                    `)
                    .eq('ano_eleicao', filters.selectedYear)
                    .ilike('nm_urna_candidato', `%${searchTerm}%`)
                    .limit(10);

                if (error) throw error;

                console.log('Search 2 results:', data);
                setFilteredCandidates2(data || []);
            } catch (error) {
                console.error('Search 2 error:', error);
                setFilteredCandidates2([]);
            } finally {
                setIsSearching2(false);
            }
        }, 300),
        [filters.selectedYear]
    );

    const handleSearch1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        console.log('Search 1 input:', value);
        setCandidateSearch1(value);
        if (!candidate1Selected) {
            setIsSearching1(true);
            debouncedSearch1(value);
        }
    };

    const handleSearch2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        console.log('Search 2 input:', value);
        setCandidateSearch2(value);
        if (!candidate2Selected) {
            setIsSearching2(true);
            debouncedSearch2(value);
        }
    };

    const handleClearCandidate = (position: 'candidate1' | 'candidate2') => {
        if (position === 'candidate1') {
            setCandidateSearch1('');
            setFilteredCandidates1([]);
            setCandidate1Selected(false);
            setSelectedCandidates(prev => ({
                ...prev,
                candidate1: undefined,
                votingComparison: undefined // Clear comparison data
            }));
        } else {
            setCandidateSearch2('');
            setFilteredCandidates2([]);
            setCandidate2Selected(false);
            setSelectedCandidates(prev => ({
                ...prev,
                candidate2: undefined,
                votingComparison: undefined // Clear comparison data
            }));
        }
    };

    useEffect(() => {
        return () => {
            debouncedSearch1.cancel();
            debouncedSearch2.cancel();
        };
    }, []);

    if (loading) return <div>Carregando comparação...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            {/* Candidate Selection Section */}
            <div className="justify-self-center w-[95%] grid grid-cols-1 sm:grid-cols-2 gap-6 m-1 bg-gray-100 dark:bg-gray-800 p-4 rounded-md justify-items-center">
                <div className='flex flex-row gap-4 align-middle'>
                    <div className='flex flex-col gap-2'>
                    <h3>Candidato 1</h3>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={candidateSearch1}
                            onChange={handleSearch1Change}
                            placeholder="Digite o nome do candidato..."
                            className="w-full sm:w-[280px] p-2 border rounded"
                        />
                        {candidate1Selected && (
                            <button
                                onClick={() => handleClearCandidate('candidate1')}
                                className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Limpar
                            </button>
                        )}
                    </div>
                    {isSearching1 && <p>Buscando candidatos...</p>}
                    {!isSearching1 && filteredCandidates1.length === 0 && candidateSearch1 && candidateSearch1 !== '' && (
                        <p>Nenhum candidato encontrado.</p>
                    )}
                    <ul className="mt-2">
                        {filteredCandidates1.map((candidate) => (
                            <li
                                key={candidate.sq_candidato}
                                onClick={() => handleCandidateSelect(candidate, 'candidate1')}
                                className="cursor-pointer hover:bg-gray-200 p-2 rounded"
                            >
                                {candidate.nm_urna_candidato} ({candidate.nr_candidato} - {candidate.sg_partido})
                            </li>
                        ))}
                    </ul>
                    <div className="flex gap-2 mt-0">
                        {colorOptions.map(color => (
                            <div
                                key={color}
                                className={`w-5 h-7 rounded-sm cursor-pointer ${color === candidateColors.candidate1 ? 'border-2' : ''} ${color === candidateColors.candidate1 ? 'border-black dark:border-white' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => handleColorSelect(color, 'candidate1')}
                            />
                        ))}
                    </div>
                    </div>
                </div>
                <div className='flex flex-row gap-4'>
                <div className='flex flex-col gap-2'>
                    <h3>Candidato 2</h3>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={candidateSearch2}
                            onChange={handleSearch2Change}
                            placeholder="Digite o nome do candidato..."
                            className="w-full sm:w-[280px] p-2 border rounded"
                        />
                        {candidate2Selected && (
                            <button
                                onClick={() => handleClearCandidate('candidate2')}
                                className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Limpar
                            </button>
                        )}
                    </div>
                    {isSearching2 && <p>Buscando candidatos...</p>}
                    {!isSearching2 && filteredCandidates2.length === 0 && candidateSearch2 && candidateSearch2 !== '' && (
                        <p>Nenhum candidato encontrado.</p>
                    )}
                    <ul className="mt-2">
                        {filteredCandidates2.map((candidate) => (
                            <li
                                key={candidate.sq_candidato}
                                onClick={() => handleCandidateSelect(candidate, 'candidate2')}
                                className="cursor-pointer hover:bg-gray-200 p-2 rounded"
                            >
                                {candidate.nm_urna_candidato} ({candidate.nr_candidato} - {candidate.sg_partido})
                            </li>
                        ))}
                    </ul>
                    <div className="flex gap-2 mt-0">
                        {colorOptions.map(color => (
                            <div
                                key={color}
                                className={`w-5 h-7 rounded-sm cursor-pointer ${color === candidateColors.candidate2 ? 'border-2 border-gray' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => handleColorSelect(color, 'candidate2')}
                            />
                        ))}
                    </div>
                    </div>
                </div>
            </div>

            {/* Candidate Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedCandidates.candidate1 && (
                    <CandidateCard
                        candidate={selectedCandidates.candidate1}
                        color={`${candidateColors.candidate1}70`} // Apply 70% transparency
                    />
                )}
                {selectedCandidates.candidate2 && (
                    <CandidateCard
                        candidate={selectedCandidates.candidate2}
                        color={`${candidateColors.candidate2}70`} // Apply 70% transparency
                    />
                )}
            </div>

            {/* Comparison Charts */}
            {selectedCandidates.candidate1 && selectedCandidates.candidate2 && (
                <ComparisonCharts
                    candidate1={{
                        ...selectedCandidates.candidate1,
                        color: candidateColors.candidate1
                    }}
                    candidate2={{
                        ...selectedCandidates.candidate2,
                        color: candidateColors.candidate2
                    }}
                    comparison={selectedCandidates.votingComparison}
                    filters={filters}
                />
            )}

            {/* Candidate Stats Comparison */}
            {selectedCandidates.candidate1 && selectedCandidates.candidate2 && (
                <CandidateStatsComparativo
                    candidate1={selectedCandidates.candidate1}
                    candidate2={selectedCandidates.candidate2}
                />
            )}

            {/* Candidate Map Comparison */}
            <div className='w-full h-50%'>
            {selectedCandidates.candidate1 && selectedCandidates.candidate2 && (
                
                <ComparativeMapComponent
                    selectedYear={filters.selectedYear || 2022}
                    candidate1={{
                        sq_candidato: BigInt(selectedCandidates.candidate1.sq_candidato),
                        nm_candidato: selectedCandidates.candidate1.nm_candidato,
                        nr_candidato: selectedCandidates.candidate1.nr_candidato,
                        sg_partido: selectedCandidates.candidate1.sg_partido,
                        nm_urna_candidato: selectedCandidates.candidate1.nm_urna_candidato,
                        color: candidateColors.candidate1
                    }}
                    candidate2={{
                        sq_candidato: BigInt(selectedCandidates.candidate2.sq_candidato),
                        nm_candidato: selectedCandidates.candidate2.nm_candidato,
                        nr_candidato: selectedCandidates.candidate2.nr_candidato,
                        sg_partido: selectedCandidates.candidate2.sg_partido,
                        nm_urna_candidato: selectedCandidates.candidate2.nm_urna_candidato,
                        color: candidateColors.candidate2
                    }}
                />

            )}
            </div>
        </div>
    );
};

export default DashboardComparativoCandidatos;
