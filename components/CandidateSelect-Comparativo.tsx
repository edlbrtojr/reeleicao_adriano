import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
    const [error, setError] = useState<string | null>(null);

    // Debounced search function
    const debouncedSearch = useMemo(
        () =>
            debounce(async (query: string) => {
                if (!year) return;

                try {
                    setLoading(true);
                    setError(null);

                    const { data, error: supabaseError } = await supabase.rpc('search_candidates', {
                        p_ano_eleicao: year,
                        p_nome_candidato: query,
                        p_limit: 10,
                    });

                    if (supabaseError) {
                        setError('Erro ao buscar candidatos. Tente novamente.');
                        console.error('RPC error:', supabaseError);
                        return;
                    }

                    setCandidates(data || []);
                } catch (err) {
                    setError('Erro inesperado. Tente novamente.');
                    console.error('Search error:', err);
                } finally {
                    setLoading(false);
                }
            }, 300),
        [year]
    );

    // Handle input change
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);
        debouncedSearch(value);
    };

    // Initial search on mount
    useEffect(() => {
        if (year) debouncedSearch('');
    }, [year, debouncedSearch]);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => debouncedSearch.cancel();
    }, [debouncedSearch]);

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
                {error && (
                    <div className="text-sm text-red-500 dark:text-red-400">
                        {error}
                    </div>
                )}
                <ul className="mt-2 max-h-60 overflow-y-auto rounded border border-gray-300 dark:border-gray-600 divide-y divide-gray-200 dark:divide-gray-600">
                    {candidates.map(candidate => (
                        <CandidateListItem
                            key={candidate.sq_candidato}
                            candidate={candidate}
                            onSelect={onSelect}
                        />
                    ))}
                    {!loading && candidates.length === 0 && searchTerm && (
                        <li className="p-2 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800">
                            Nenhum candidato encontrado
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};

// Subcomponent for candidate list item
const CandidateListItem: React.FC<{
    candidate: CandidatoData;
    onSelect: (candidate: CandidatoData) => void;
}> = ({ candidate, onSelect }) => {
    return (
        <li
            onClick={() => onSelect(candidate)}
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
    );
};