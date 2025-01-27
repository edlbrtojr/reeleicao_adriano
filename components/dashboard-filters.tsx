import React, { useEffect, useState } from 'react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button'; // Import Button component
import { Filters } from '@/app/dashboards/page'; // Import Filters type
import { RemoveFormattingIcon, X, ChevronsUpDown, Check } from 'lucide-react';
import { Tooltip } from 'react-tooltip'; // Import Tooltip component
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import debounce from 'lodash.debounce';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { cn } from '@/lib/utils';

interface DashboardFiltersProps {
    onChange: (filters: Filters) => void;
    selectedDashboard: string; // Add this line
}

// Update the interface to match your database schema
interface Candidate {
    sq_candidato: number;
    nm_candidato: string;
    nm_urna_candidato: string;
    sg_partido: string;
    nr_candidato: number;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({ onChange, selectedDashboard }) => {
    const supabase = createClientComponentClient();
    const [candidateSearch, setCandidateSearch] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<number>(2022); // Default to 2022
    const [selectedCargo, setSelectedCargo] = useState<number | null>(null); // Initialize to null
    const [selectedMunicipio, setSelectedMunicipio] = useState<number | null>(null); // Initialize to null
    const [cargos, setCargos] = useState<{ cd_cargo: number, ds_cargo: string }[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]); // Initialize as empty array
    const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [open, setOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    const [candidateSelected, setCandidateSelected] = useState<boolean>(false);

    const municipios = [
        { cd_municipio: 1120, name: 'ACRELÂNDIA' },
        { cd_municipio: 1570, name: 'ASSIS BRASIL' },
        { cd_municipio: 1058, name: 'BRASILÉIA' },
        { cd_municipio: 1007, name: 'BUJARI' },
        { cd_municipio: 1015, name: 'CAPIXABA' },
        { cd_municipio: 1074, name: 'CRUZEIRO DO SUL' },
        { cd_municipio: 1112, name: 'EPITACIOLÂNDIA' },
        { cd_municipio: 1139, name: 'FEIJÓ' },
        { cd_municipio: 1104, name: 'JORDÃO' },
        { cd_municipio: 1090, name: 'MÂNCIO LIMA' },
        { cd_municipio: 1554, name: 'MANOEL URBANO' },
        { cd_municipio: 1040, name: 'MARECHAL THAUMATURGO' },
        { cd_municipio: 1511, name: 'PLÁCIDO DE CASTRO' },
        { cd_municipio: 1023, name: 'PORTO ACRE' },
        { cd_municipio: 1066, name: 'PORTO WALTER' },
        { cd_municipio: 1392, name: 'RIO BRANCO' },
        { cd_municipio: 1082, name: 'RODRIGUES ALVES' },
        { cd_municipio: 1031, name: 'SANTA ROSA DO PURUS' },
        { cd_municipio: 1457, name: 'SENA MADUREIRA' },
        { cd_municipio: 1538, name: 'SENADOR GUIOMARD' },
        { cd_municipio: 1473, name: 'TARAUACÁ' },
        { cd_municipio: 1490, name: 'XAPURI' },
    ];

    const availableYears = [2018, 2022, 2026]; // Define available years

    useEffect(() => {
        // Apply initial filters
        onChange({ selectedYear, selectedCargo, selectedMunicipio });
    }, [selectedMunicipio]); // Add selectedMunicipio as dependency

    useEffect(() => {
        const cachedCargos = localStorage.getItem('cargos');
        if (cachedCargos) {
            setCargos(JSON.parse(cachedCargos));
        } else {
            const fetchCargos = async () => {
                let availableCargos: { cd_cargo: number, ds_cargo: string }[] = [];
                if (selectedYear && [2018, 2022, 2026].includes(selectedYear)) {
                    availableCargos = [
                        { cd_cargo: 6, ds_cargo: 'DEPUTADO ESTADUAL' },
                        { cd_cargo: 7, ds_cargo: 'DEPUTADO FEDERAL' },
                        { cd_cargo: 5, ds_cargo: 'SENADOR' },
                        { cd_cargo: 3, ds_cargo: 'GOVERNADOR' },
                    ];
                }
                setCargos(availableCargos);
                localStorage.setItem('cargos', JSON.stringify(availableCargos));
            };

            fetchCargos();
        }
    }, [selectedYear]);

    // Update the fetchAllCandidates function to use Supabase directly
    useEffect(() => {
        const fetchAllCandidates = async () => {
            try {
                const { data, error } = await supabase
                    .from('candidatos')
                    .select('sq_candidato, nm_candidato, nm_urna_candidato, nr_candidato, sg_partido')
                    .eq('ano_eleicao', selectedYear);

                if (error) throw error;
                setCandidates(data || []);
            } catch (error) {
                console.error('Error fetching candidates:', error);
            }
        };

        if (selectedYear) {
            fetchAllCandidates();
        }
    }, [selectedYear]);

    // Add new debounced search function
    const debouncedSearch = debounce(async (searchTerm: string) => {
        if (!searchTerm) {
            setFilteredCandidates([]);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('candidatos')
                .select('sq_candidato, nm_candidato, nm_urna_candidato, nr_candidato, sg_partido')
                .eq('ano_eleicao', selectedYear)
                .ilike('nm_urna_candidato', `%${searchTerm}%`)
                .limit(10);

            if (error) throw error;
            setFilteredCandidates(data || []);
            setIsSearching(false);
        } catch (error) {
            console.error('Error searching candidates:', error);
            setIsSearching(false);
        }
    }, 500); // Wait at least half a second

    // Update the search effect
    useEffect(() => {
        if (!candidateSearch) {
            setFilteredCandidates([]);
            return;
        }

        setIsSearching(true);
        debouncedSearch(candidateSearch);

        return () => {
            debouncedSearch.cancel();
        };
    }, [candidateSearch]);

    useEffect(() => {
        // Clear all filters except year when selectedDashboard changes
        setSelectedCargo(null);
        setSelectedMunicipio(null);
        setCandidateSearch('');
        onChange({ 
            selectedYear, 
            selectedCargo: null, 
            selectedMunicipio: null, 
            candidateSearch: '' 
        });
    }, [selectedDashboard]);

    const handleYearChange = (year: number) => {
        setSelectedYear(year);
        onChange({ 
            selectedYear: year, 
            selectedCargo, 
            selectedMunicipio,
            candidateSearch // Add this to preserve candidate search
        });
    };

    const handleCargoChange = (cargo: string) => {
        const selectedCargoCode = cargos.find(c => c.ds_cargo === cargo)?.cd_cargo || null;
        setSelectedCargo(selectedCargoCode);
        onChange({ 
            selectedYear, 
            selectedCargo: selectedCargoCode, 
            selectedMunicipio,
            candidateSearch // Add this to preserve candidate search
        });
    };

    const handleMunicipioChange = (municipio: string) => {
        const selectedMunicipioCode = municipios.find(m => m.name === municipio)?.cd_municipio || null;
        setSelectedMunicipio(selectedMunicipioCode);
        onChange({ 
            selectedYear, 
            selectedCargo, 
            selectedMunicipio: selectedMunicipioCode,
            candidateSearch // Add this to preserve candidate search
        });
    };

    const clearCargoFilter = () => {
        setSelectedCargo(null);
        onChange({ 
            selectedYear, 
            selectedCargo: null, 
            selectedMunicipio,
            candidateSearch // Add this to preserve candidate search
        });
    };

    const clearMunicipioFilter = () => {
        setSelectedMunicipio(null);
        onChange({ 
            selectedYear, 
            selectedCargo, 
            selectedMunicipio: null,
            candidateSearch // Add this to preserve candidate search
        });
    };

    const removeFilter = (filterType: string) => {
        switch (filterType) {
            case 'year':
                setSelectedYear(2022);
                onChange({ 
                    selectedYear: 2022, 
                    selectedCargo, 
                    selectedMunicipio,
                    candidateSearch // Add this to preserve candidate search
                });
                break;
            case 'cargo':
                clearCargoFilter();
                break;
            case 'municipio':
                clearMunicipioFilter();
                break;
            case 'candidate':
                setCandidateSearch('');
                onChange({ 
                    selectedYear, 
                    selectedCargo, 
                    selectedMunicipio,
                    candidateSearch: '' // Clear the candidate search
                });
                break;
        }
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCandidateSearch(event.target.value);
        setSelectedIndex(-1);
        setCandidateSelected(false);
    };

    const handleCandidateSelect = (candidate: Candidate) => {
        setCandidateSearch(candidate.nm_urna_candidato);
        setFilteredCandidates([]);
        setIsSearching(false);
        setCandidateSelected(true);
        onChange({
            selectedYear,
            selectedCargo,
            selectedMunicipio,
            candidateSearch: candidate.nm_urna_candidato
        });
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            setSelectedIndex((prevIndex) => (prevIndex + 1) % filteredCandidates.length);
        } else if (event.key === 'ArrowUp') {
            setSelectedIndex((prevIndex) => (prevIndex - 1 + filteredCandidates.length) % filteredCandidates.length);
        } else if (event.key === 'Enter' && selectedIndex >= 0) {
            handleCandidateSelect(filteredCandidates[selectedIndex]);
            setFilteredCandidates([]);
        }
    };

    return (
        <div className='w-full flex flex-col space-y-4'>
            <div className='flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-between w-full align-baseline'>
                {selectedDashboard === "visaoGeralIndividual" && (
                    <div className='flex flex-col space-y-4'>
                        <h3>Buscar Candidato</h3>
                        <input
                            type="text"
                            value={candidateSearch}
                            onChange={handleSearchChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Digite o nome do candidato..."
                            className="w-full sm:w-[280px] p-2 border rounded"
                        />
                        {isSearching && <p>Buscando candidatos...</p>}
                        {!isSearching && filteredCandidates.length === 0 && candidateSearch && candidateSearch !== '' && !candidateSelected && (
                            <p>Nenhum candidato encontrado.</p>
                        )}
                        <ul>
                            {filteredCandidates.map((candidate, index) => (
                                <li
                                    key={candidate.sq_candidato}
                                    onClick={() => {
                                        handleCandidateSelect(candidate);
                                        setFilteredCandidates([]);
                                    }}
                                    className={`cursor-pointer hover:bg-gray-200 p-2 rounded ${selectedIndex === index ? 'bg-gray-300' : ''}`}
                                >
                                    {candidate.nm_urna_candidato} ({candidate.nr_candidato} - {candidate.sg_partido})
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                <div className='flex flex-col space-y-4'>
                    <h3>Filtrar por Ano</h3>
                    <div className="flex flex-row space-x-1">
                        {[2018, 2020, 2022, 2024].map((year) => (
                            <Button
                                key={year}
                                className={`rounded border ${selectedYear === year ? 'bg-blue-500 text-white dark:bg-blue-700' : 'bg-white text-black dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600'} ${availableYears.includes(year) ? 'hover:border-blue-500 dark:hover:border-blue-700' : 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400 cursor-not-allowed'}`}
                                onClick={() => availableYears.includes(year) && handleYearChange(year)}
                                {...(!availableYears.includes(year)
                                    ? { 'data-tooltip-id': `tooltip-${year}` }
                                    : {}
                                )}
                            >
                                {year}
                                {!availableYears.includes(year) && (
                                    <Tooltip id={`tooltip-${year}`} place="top" content="Em breve" />
                                )}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className='flex flex-col space-y-4'>
                    <h3>Filtrar por Município</h3>
                    <div className="flex items-center custom-scrollbar">
                        <Select value={selectedMunicipio?.toString() || ''} onValueChange={(value) => handleMunicipioChange(municipios.find(m => m.cd_municipio.toString() === value)?.name || '')}>
                            <SelectTrigger className="w-full sm:w-[280px]">
                                <SelectValue placeholder="Selecione um Município" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Municípios</SelectLabel>
                                    {municipios.map((municipio) => (
                                        <SelectItem key={municipio.cd_municipio} value={municipio.cd_municipio.toString()}>{municipio.name}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <Button onClick={clearMunicipioFilter} className="ml-2">Limpar</Button>
                    </div>
                </div>

                <div className='flex flex-col space-y-4'>
                    <h3>Filtrar por Cargo</h3>
                    <div className="flex items-center">
                        <Select value={selectedCargo?.toString() || ''} onValueChange={(value) => handleCargoChange(cargos.find(c => c.cd_cargo.toString() === value)?.ds_cargo || '')}>
                            <SelectTrigger className="w-full sm:w-[280px]">
                                <SelectValue placeholder="Selecione um Cargo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Cargos</SelectLabel>
                                    {cargos.map((cargo) => (
                                        <SelectItem key={cargo.cd_cargo} value={cargo.cd_cargo.toString()}>{cargo.ds_cargo}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <Button onClick={clearCargoFilter} className="ml-2">Limpar</Button>
                    </div>
                </div>
            </div>

            <div className='mt-0 bg-gray-100 dark:bg-gray-800 p-4 rounded-l h-[68px]'>
                <h3>Filtros aplicados:</h3>
                <div className='flex flex-wrap space-x-2'>
                    {selectedYear && (
                        <Button className='flex items-center h-5'>
                            
                            Ano: {selectedYear} <span className='ml-2'></span>
                            <Tooltip id='tooltip-SelectedYear' place='top' content="Você não pode remover o filtro de nao, mas pode alterá-lo"/>
                        </Button>
                    )}
                    {selectedMunicipio && (
                        <Button className='flex items-center h-5' onClick={() => removeFilter('municipio')}>
                            Município: {municipios.find(m => m.cd_municipio === selectedMunicipio)?.name} <span className='ml-2'><X className='w-4 h-4'/></span>
                        </Button>
                    )}
                    {selectedCargo && (
                        <Button className='flex items-center h-5' onClick={() => removeFilter('cargo')}>
                            Cargo: {cargos.find(c => c.cd_cargo === selectedCargo)?.ds_cargo} <span className='ml-2'><X className='w-4 h-4'/></span>
                        </Button>
                    )}
                    {candidateSearch && (
                        <Button className='flex items-center h-5' onClick={() => setCandidateSearch('')}>
                            Candidato: {candidateSearch} <span className='ml-2'><X className='w-4 h-4'/></span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Add custom scrollbar styles
const styles = `
.custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #888;
    border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #555;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background-color: #f1f1f1;
    border-radius: 4px;
}

@media (prefers-color-scheme: dark) {
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: #555;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background-color: #888;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
        background-color: #333;
    }
}
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default DashboardFilters;