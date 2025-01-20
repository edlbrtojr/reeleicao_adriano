import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Filters {
    selectedYear: string | null;
    selectedView: string;
    selectedCargo: string | null;
    selectedMunicipio?: string | null; // Add selectedMunicipio to the Filters interface
}

interface DashboardFiltersProps {
    onChange: (filters: Filters) => void;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({ onChange }) => {
    const [selectedYear, setSelectedYear] = useState<string | null>('2022');
    const [selectedView, setSelectedView] = useState('Votos totais');
    const [selectedCargo, setSelectedCargo] = useState<string | null>('DEPUTADO FEDERAL');
    const [selectedMunicipio, setSelectedMunicipio] = useState<string | null>('RIO BRANCO');
    const [cargos, setCargos] = useState<{ cd_cargo: number, ds_cargo: string }[]>([]);

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

    useEffect(() => {
        // Apply initial filters
        onChange({ selectedYear, selectedView, selectedCargo, selectedMunicipio });
    }, []);

    useEffect(() => {
        const cachedCargos = localStorage.getItem('cargos');
        if (cachedCargos) {
            setCargos(JSON.parse(cachedCargos));
        } else {
            const fetchCargos = async () => {
                let availableCargos: { cd_cargo: number, ds_cargo: string }[] = [];
                if (selectedYear && ['2018', '2022', '2026'].includes(selectedYear)) {
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

    const handleYearChange = (year: string) => {
        setSelectedYear(year);
        onChange({ selectedYear: year, selectedView, selectedCargo });
    };

    const handleViewChange = (view: string) => {
        setSelectedView(view);
        onChange({ selectedYear, selectedView: view, selectedCargo });
    };

    const handleCargoChange = (cargo: string) => {
        setSelectedCargo(cargo);
        onChange({ selectedYear, selectedView, selectedCargo: cargo });
    };

    const handleMunicipioChange = (municipio: string) => {
        setSelectedMunicipio(municipio);
        onChange({ selectedYear, selectedView, selectedCargo, selectedMunicipio: municipio });
    };

    return (
        <div className='w-full flex '>
            <div className='flex flex-row space-y-4 justify-between w-full align-baseline'>
                <div className='flex flex-col space-y-4'>
                    <h3>Filtrar por Ano</h3>
                    <div className="flex flex-row space-x-1">
                        {['2018', '2020', '2022', '2024'].map((year) => (
                            <Badge
                                key={year}
                                className={`rounded cursor-pointer ${selectedYear === year ? 'bg-blue-500 text-white' : ''}`}
                                onClick={() => handleYearChange(year)}
                            >
                                {year}
                            </Badge>
                        ))}
                    </div>
                </div>

                <div>
                    <h3>Filtrar por Município</h3>
                    <Select onValueChange={(value) => handleMunicipioChange(value)}>
                    <SelectTrigger className="w-[280px]">
                        <SelectValue placeholder="Selecione um Município" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Municípios</SelectLabel>
                            {municipios.map((municipio) => (
                                <SelectItem key={municipio.cd_municipio} value={municipio.name}>{municipio.name}</SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                    </Select>
                </div>

                <div>
                    <h3>Filtrar por Cargo</h3>
                    <Select onValueChange={(value) => handleCargoChange(value)}>
                        <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="Selecione um Cargo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Cargos</SelectLabel>
                                {cargos.map((cargo) => (
                                    <SelectItem key={cargo.cd_cargo} value={cargo.ds_cargo}>{cargo.ds_cargo}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
};

export default DashboardFilters;