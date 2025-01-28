import React, { useEffect, useState, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CandidatoData } from '@/types/candidate';
import { supabase } from '@/utils/supabase/client';
import debounce from 'lodash.debounce';

interface CandidateSelectProps {
    year?: number;
    onSelect: (candidate: CandidatoData) => void;
    label: string;
}

export const CandidateSelect: React.FC<CandidateSelectProps> = ({ year, onSelect, label }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [candidates, setCandidates] = useState<CandidatoData[]>([]);
    const [loading, setLoading] = useState(false);

    const searchCandidates = async (query: string) => {
        if (!year) {
            console.log('No year provided, skipping search');
            return;
        }
        
        console.log('Starting candidate search with:', {
            year,
            query,
            supabaseInitialized: !!supabase
        });
        
        try {
            setLoading(true);
            console.log('Calling RPC search_candidates with params:', {
                p_ano_eleicao: year,
                p_nome_candidato: query,
                p_limit: 10
            });

            const { data, error } = await supabase.rpc('search_candidates', {
                p_ano_eleicao: year,
                p_nome_candidato: query,
                p_limit: 10
            });

            console.log('RPC response:', { data, error });

            if (error) {
                console.error('RPC error:', error);
                return;
            }

            console.log('Setting candidates:', data);
            setCandidates(data || []);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    // Create memoized debounced search function
    const debouncedSearch = useCallback(
        debounce((value: string) => {
            console.log('Debounced search triggered with:', value);
            searchCandidates(value);
        }, 300),
        [year]
    );

    // Handle input change
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        console.log('Search input changed:', value);
        setSearchTerm(value);
        debouncedSearch(value);
    };

    useEffect(() => {
        console.log('Component mounted/updated with year:', year);
        
        // Initial search with empty string to get initial candidates
        if (year) {
            console.log('Performing initial search for year:', year);
            searchCandidates('');
        }
        
        // Cleanup
        return () => {
            console.log('Cleaning up search');
            debouncedSearch.cancel();
        };
    }, [year]);

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">{label}</label>
            <div className="space-y-2">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Digite o nome do candidato..."
                    className={`w-full p-2 rounded border transition-colors duration-200
                        ${loading ? 'bg-gray-50 text-gray-500' : 'bg-white text-black dark:bg-gray-700 dark:text-white'}
                        ${loading ? 'border-gray-200' : 'border-gray-300 dark:border-gray-600'}
                        hover:border-blue-500 dark:hover:border-blue-700
                        focus:border-blue-500 dark:focus:border-blue-700
                        focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                    disabled={loading}
                />
                {loading && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
                        Buscando candidatos...
                    </div>
                )}
                <ul className="mt-2 max-h-60 overflow-y-auto rounded border border-gray-300 dark:border-gray-600 divide-y divide-gray-200 dark:divide-gray-600">
                    {candidates.map(candidate => (
                        <li
                            key={candidate.sq_candidato}
                            onClick={() => {
                                console.log('Selected candidate:', candidate);
                                onSelect(candidate);
                            }}
                            className={`cursor-pointer p-2 transition-colors duration-200
                                bg-white text-black dark:bg-gray-700 dark:text-white
                                hover:bg-blue-500 hover:text-white
                                dark:hover:bg-blue-700 dark:hover:text-white`}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className="font-medium">{candidate.nm_urna_candidato}</span>
                                    <span className="ml-2 opacity-75">
                                        ({candidate.nr_candidato} - {candidate.sg_partido})
                                    </span>
                                </div>
                                {candidate.total_votos && candidate.total_votos > 0 && (
                                    <span className="text-sm opacity-75">
                                        {candidate.total_votos} votos
                                    </span>
                                )}
                            </div>
                        </li>
                    ))}
                    {!loading && candidates.length === 0 && searchTerm && (
                        <li className="p-2 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                            Nenhum candidato encontrado
                        </li>
                    )}
                </ul>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                {`Debug: Year=${year}, SearchTerm="${searchTerm}", Loading=${loading}, Candidates=${candidates.length}`}
            </div>
        </div>
    );
};
