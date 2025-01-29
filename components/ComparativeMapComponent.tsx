import React, { useState, useEffect } from 'react';
import { Map, Source, Layer, Popup } from 'react-map-gl';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { CircleLayer, SymbolLayer } from 'react-map-gl';
import type { CandidatoData } from '@/types/candidate';

interface SelectedCandidatoData {
    sq_candidato: bigint;
    nm_candidato: string;
    nm_urna_candidato: string;
    nr_candidato: number;
    sg_partido: string;
    img_candidato?: string;
    ano_eleicao?: number;
    cd_cargo?: number;
    ds_cargo?: string;
    nr_partido?: number;
    total_votos?: number;
    ds_sit_tot_turno?: string;
    ds_grau_instrucao?: string;
    cd_cor_raca?: number;
    ds_cor_raca?: string;
    cd_ocupacao?: number;
    ds_ocupacao?: string;
    color?: string;
}

interface ComparativeMapComponentProps {
    selectedYear: number;
    candidate1: SelectedCandidatoData | null;
    candidate2: SelectedCandidatoData | null;
}

interface VotingSecaoData {
    nr_secao: number;
    nr_local_votacao: number;
    nm_local_votacao: string;
    latitude: number;
    longitude: number;
    total_votos: number;
    percentual_votos: number;
    total_count: number;
}

const ComparativeMapComponent: React.FC<ComparativeMapComponentProps> = ({ selectedYear, candidate1, candidate2 }) => {
    // State for voting data
    const [secaoData1, setSecaoData1] = useState<VotingSecaoData[]>([]);
    const [secaoData2, setSecaoData2] = useState<VotingSecaoData[]>([]);
    
    // Display filter state
    const [displayFilter, setDisplayFilter] = useState<'votos' | 'percentual'>('percentual');
        
    const [viewState, setViewState] = useState({
        latitude: -8.77,
        longitude: -67.81,
        zoom: 7
    });
    
    const [popupInfo, setPopupInfo] = useState<{
        longitude: number;
        latitude: number;
        candidate: string;
        votes: number;
        percentage: number;
    } | null>(null);
    
    const [error, setError] = useState<string | null>(null);
    const { theme } = useTheme();

    useEffect(() => {
        const fetchSecaoData = async (candidateId: number, setData: React.Dispatch<React.SetStateAction<VotingSecaoData[]>>) => {
            try {
                const response = await fetch(`/api/votes/cities?candidateId=${candidateId}&year=${selectedYear}&limit=1000`);
                const result = await response.json();
                if (!response.ok) throw new Error(result.error);
                setData(result.data);
                
                // Center map on first result if available
                if (result.data?.[0]) {
                    setViewState(prev => ({
                        ...prev,
                        latitude: result.data[0].latitude,
                        longitude: result.data[0].longitude,
                        zoom: 12
                    }));
                }
            } catch (err) {
                console.error('Error fetching voting section data:', err);
                setError('Failed to load voting section data');
            }
        };

        if (candidate1?.sq_candidato) {
            fetchSecaoData(Number(candidate1.sq_candidato), setSecaoData1);
        }
        if (candidate2?.sq_candidato) {
            fetchSecaoData(Number(candidate2.sq_candidato), setSecaoData2);
        }
    }, [selectedYear, candidate1?.sq_candidato, candidate2?.sq_candidato]);

    const createGeoJson = (data: VotingSecaoData[], candidateName: string) => ({
        type: 'FeatureCollection',
        features: data.map((item) => ({
            type: 'Feature',
            properties: {
                votes: item.total_votos,
                percentage: item.percentual_votos,
                candidate: candidateName,
                location: item.nm_local_votacao
            },
            geometry: {
                type: 'Point',
                coordinates: [item.longitude, item.latitude]
            }
        }))
    });

    const createCircleLayer = (id: string, color: string): CircleLayer => ({
        id: `secao-point-${id}`,
        type: 'circle',
        source: `secao-points-${id}`,
        paint: {
            'circle-color': color,
            'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', displayFilter === 'votos' ? 'votes' : 'percentage'],
                0, 10,
                displayFilter === 'votos' ? 5000 : 50,
                displayFilter === 'votos' ? 200 : 30
            ],
            'circle-opacity': 0.8,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
            'circle-translate': id === '1' ? [10, 0] : [-10, 0] // Adjust the offset as needed
        }
    });

    const handleClick = (e: any) => {
        const feature = e.features?.[0];
        if (feature?.properties && feature.geometry.type === 'Point') {
            setPopupInfo({
                longitude: feature.geometry.coordinates[0],
                latitude: feature.geometry.coordinates[1],
                candidate: feature.properties.candidate,
                votes: feature.properties.votes,
                percentage: feature.properties.percentage,
            });
        }
    };

    return (
        <Card className="w-full h-full">
            <CardHeader>
                <div className="text-xl font-semibold">Mapa Comparativo</div>
                <div className="flex justify-end">
                    <div className="flex gap-2">

                        <Badge
                            variant={displayFilter === 'percentual' ? 'default' : 'outline'}
                            className="cursor-pointer rounded-sm"
                            onClick={() => setDisplayFilter('percentual')}
                        >
                            Votos & Percentual
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="relative w-full h-[400px]">
                    <Map
                        {...viewState}
                        onMove={evt => setViewState(evt.viewState)}
                        style={{ width: '100%', height: '100%' }}
                        mapStyle={theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v10'}
                        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
                        onClick={handleClick}
                        interactiveLayerIds={['secao-point-1', 'secao-point-2']}
                    >
                        {candidate1 && secaoData1.length > 0 && (
                            <Source
                                id="secao-points-1"
                                type="geojson"
                                data={createGeoJson(secaoData1, candidate1.nm_urna_candidato)}
                            >
                                <Layer {...createCircleLayer('1', candidate1.color || '#3B82F6')} />
                            </Source>
                        )}
                        {candidate2 && secaoData2.length > 0 && (
                            <Source
                                id="secao-points-2"
                                type="geojson"
                                data={createGeoJson(secaoData2, candidate2.nm_urna_candidato)}
                            >
                                <Layer {...createCircleLayer('2', candidate2.color || '#EF4444')} />
                            </Source>
                        )}
                        {popupInfo && (
                            <Popup
                                longitude={popupInfo.longitude}
                                latitude={popupInfo.latitude}
                                anchor="bottom"
                                closeButton={true}
                                closeOnClick={false}
                                onClose={() => setPopupInfo(null)}
                            >
                                <div className="p-2">
                                    <div className="font-bold">{popupInfo.candidate}</div>
                                    <p>Votos: {popupInfo.votes}</p>
                                    <p>Percentual: {popupInfo.percentage}%</p>
                                </div>
                            </Popup>
                        )}
                    </Map>
                    {error && (
                        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-2 rounded shadow text-red-500">
                            {error}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default ComparativeMapComponent;