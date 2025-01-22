import React, { useEffect, useState } from 'react';
import Map, { Source, Layer, Popup } from 'react-map-gl';
import type { CircleLayer, SymbolLayer, HeatmapLayer } from 'react-map-gl';
import type { Feature, Point } from 'geojson';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/utils/supabase/client';
import type mapboxgl from 'mapbox-gl';

interface Props {
    selectedYear?: number;
    candidateSearch?: string;
}

interface VotingLocation {
    city: string;
    bairro?: string;
    latitude: number;
    longitude: number;
    votes: number;
    percentage?: number;
    section?: number;  // Add this line
    nr_secao?: number;
    nm_local_votacao?: string;
}

interface LocationFeature extends Feature {
    properties: {
        cluster: boolean;
        cluster_id?: number;
        point_count?: number;
        votes: number;
        city: string;
        nr_secao?: number;
        nm_local_votacao?: string;
    };
    geometry: Point;
}

const MapComponent: React.FC<Props> = ({ selectedYear, candidateSearch }) => {
    const [locations, setLocations] = useState<VotingLocation[]>([]);
    const [popupInfo, setPopupInfo] = useState<{
        longitude: number;
        latitude: number;
        name: string;
        votes: number;
    } | null>(null);
    
    const [viewState, setViewState] = useState({
        latitude: -8.77,
        longitude: -67.81,
        zoom: 7
    });

    const [activeGroupFilter, setActiveGroupFilter] = useState<'cidade' | 'bairro' | 'sessao'>('cidade');
    const [activeViewFilter, setActiveViewFilter] = useState<'total' | 'percentage' | 'heatmap' | 'ranking'>('total');

    useEffect(() => {
        const fetchVotingData = async () => {
            if (!selectedYear || !candidateSearch) {
                console.log('Missing required parameters:', { selectedYear, candidateSearch });
                return;
            }

            const rpcMethod = activeGroupFilter === 'cidade' 
                ? 'get_votes_by_city' 
                : activeGroupFilter === 'bairro' 
                    ? 'get_votes_by_neighborhood'
                    : 'get_votes_by_section';

            try {
                const { data, error } = await supabase
                    .rpc(rpcMethod, {
                        p_ano_eleicao: selectedYear,
                        p_nm_candidato: candidateSearch
                    });

                if (error) throw error;

                const processedLocations = data
                    .filter((loc: any) => loc.latitude && loc.longitude) // Only include locations with coordinates
                    .map((loc: any) => ({
                        city: loc.nm_municipio,
                        bairro: loc.nm_bairro,
                        latitude: Number(loc.latitude),
                        longitude: Number(loc.longitude),
                        votes: Number(loc.total_votos),
                        percentage: Number(loc.percentual_votos),
                        nr_secao: loc.nr_secao,
                        nm_local_votacao: loc.nm_local_votacao
                    }));

                if (processedLocations.length > 0) {
                    // Center map and zoom based on filter type
                    setViewState({
                        latitude: processedLocations[0].latitude,
                        longitude: processedLocations[0].longitude,
                        zoom: activeGroupFilter === 'sessao' ? 12 : 7
                    });
                }

                setLocations(processedLocations);
            } catch (err) {
                console.error('Error fetching voting data:', err);
            }
        };

        fetchVotingData();
    }, [selectedYear, candidateSearch, activeGroupFilter]);

    const geojsonData = {
        type: 'FeatureCollection',
        features: locations.map(loc => ({
            type: 'Feature',
            properties: {
                cluster: false,
                votes: loc.votes,
                city: loc.city,
                nr_secao: loc.nr_secao,
                nm_local_votacao: loc.nm_local_votacao
            },
            geometry: {
                type: 'Point',
                coordinates: [loc.longitude, loc.latitude]
            }
        }))
    };

    const getCircleColor = () => {
        if (activeViewFilter === 'ranking') {
            return [
                'step',
                ['get', 'votes'],
                '#FED976', // lowest
                 100,
                '#FEB24C',
                500,
                '#FD8D3C',
                1000,
                '#FC4E2A',
                5000,
                '#E31A1C' // highest
            ] as mapboxgl.Expression;
        }
        return '#3498db';
    };

    const getCircleRadius = () => {
        if (activeViewFilter === 'percentage') {
            return ['*', ['get', 'percentage'], 50] as mapboxgl.Expression;
        }
        return [
            'step',
            ['get', 'point_count'],
            20,
            10,
            30,
            50,
            40
        ] as mapboxgl.Expression;
    };

    const clusterLayer: CircleLayer = {
        id: 'clusters',
        type: 'circle',
        source: 'voting-points',
        filter: ['has', 'point_count'],
        paint: {
            'circle-color': getCircleColor(),
            'circle-opacity': 0.9,
            'circle-radius': getCircleRadius()
        }
    };

    const heatmapLayer: HeatmapLayer = {
        id: 'heatmap',
        type: 'heatmap',
        source: 'voting-points',
        maxzoom: 15,
        paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'votes'], 0, 0, 1000, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
            'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(33,102,172,0)',
                0.2, 'rgb(103,169,207)',
                0.4, 'rgb(209,229,240)',
                0.6, 'rgb(253,219,199)',
                0.8, 'rgb(239,138,98)',
                1, 'rgb(178,24,43)'
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
            'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0]
        }
    };

    const clusterCountLayer: SymbolLayer = {
        id: 'cluster-count',
        type: 'symbol',
        source: 'voting-points',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{sum_votes}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
        },
        paint: {
            'text-color': '#ffffff'
        }
    };

    const unclusteredPointLayer: CircleLayer = {
        id: 'unclustered-point',
        type: 'circle',
        source: 'voting-points',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': '#3498db',
            'circle-opacity': 0.9,
            'circle-radius': 10
        }
    };

    const sectionLayer: CircleLayer = {
        id: 'section-points-layer',
        type: 'circle',
        source: 'voting-points',
        paint: {
            'circle-color': '#FF4136',
            'circle-opacity': 0.9,
            'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'votes'],
                0, 5,
                1000, 20
            ]
        }
    };

    const sectionLabelLayer: SymbolLayer = {
        id: 'section-labels-layer',
        type: 'symbol',
        source: 'voting-points',
        layout: {
            'text-field': ['concat', ['get', 'nr_secao'], ' - ', ['get', 'votes'], ' votos'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-offset': [0, -1.5],
            'text-allow-overlap': false
        },
        paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#000000',
            'text-halo-width': 1
        }
    };

    const handleClick = (event: any) => {
        const feature = event.features?.[0] as LocationFeature | undefined;
        if (feature && feature.geometry.type === 'Point') {
            const [longitude, latitude] = feature.geometry.coordinates;
            
            if (feature.properties.cluster) {
                setPopupInfo({
                    longitude,
                    latitude,
                    name: `Grupo de ${feature.properties.point_count} locais`,
                    votes: feature.properties.votes
                });
            } else {
                const name = activeGroupFilter === 'sessao' 
                    ? `Seção ${feature.properties.nr_secao} - ${feature.properties.nm_local_votacao}`
                    : feature.properties.city;
                    
                setPopupInfo({
                    longitude,
                    latitude,
                    name,
                    votes: feature.properties.votes
                });
            }
        }
    };

    const getVisibleLayers = () => {
        if (activeViewFilter === 'heatmap') {
            return [heatmapLayer];
        }
        
        if (activeGroupFilter === 'sessao') {
            return [
                {
                    ...sectionLayer,
                    id: 'section-points-layer'
                },
                {
                    ...sectionLabelLayer,
                    id: 'section-labels-layer'
                }
            ];
        }
        
        return [
            {
                ...clusterLayer,
                id: 'cluster-points-layer'
            },
            {
                ...clusterCountLayer,
                id: 'cluster-count-layer'
            },
            {
                ...unclusteredPointLayer,
                id: 'unclustered-points-layer'
            }
        ];
    };

    return (
        <Card className="w-full h-full">
            <CardHeader>
                <div className="text-xl font-semibold">Mapa de Votos</div>
                <div className="flex flex-col space-y-2">
                    <div id='filterMapGrouping' className="flex flex-wrap gap-2">
                        <Badge
                            variant={activeGroupFilter === 'cidade' ? 'default' : 'outline'}
                            className="cursor-pointer rounded-sm"
                            onClick={() => setActiveGroupFilter('cidade')}
                        >
                            Cidade
                        </Badge>
                        
                        <Badge
                            variant={activeGroupFilter === 'bairro' ? 'default' : 'outline'}
                            className="cursor-pointer rounded-sm"
                            onClick={() => setActiveGroupFilter('bairro')}
                        >
                            Bairro
                        </Badge>

                        <Badge
                            variant={activeGroupFilter === 'sessao' ? 'default' : 'outline'}
                            className="cursor-pointer rounded-sm"
                            onClick={() => setActiveGroupFilter('sessao')}
                        >
                            Sessão
                        </Badge>
                    </div>
                    {/* ...existing badges... */}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="relative w-full h-[400px]">
                    <Map
                        {...viewState}
                        onMove={evt => setViewState(evt.viewState)}
                        style={{ width: '100%', height: '100%' }}
                        mapStyle="mapbox://styles/mapbox/dark-v11"
                        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
                        interactiveLayerIds={['section-points-layer', 'cluster-points-layer', 'unclustered-points-layer']}
                        onClick={handleClick}
                    >
                        <Source
                            id="voting-points"
                            type="geojson"
                            data={geojsonData}
                            cluster={activeGroupFilter !== 'sessao'}
                            clusterMaxZoom={14}
                            clusterRadius={50}
                            clusterProperties={{
                                sum_votes: ['+', ['get', 'votes']]
                            }}
                        >
                            {activeGroupFilter === 'sessao' ? (
                                <>
                                    <Layer {...sectionLayer} />
                                    <Layer {...sectionLabelLayer} />
                                </>
                            ) : (
                                getVisibleLayers().map((layer) => (
                                    <Layer key={layer.id} {...layer} />
                                ))
                            )}
                        </Source>

                        {popupInfo && (
                            <Popup
                                longitude={popupInfo.longitude}
                                latitude={popupInfo.latitude}
                                anchor="bottom"
                                onClose={() => setPopupInfo(null)}
                            >
                                <div>
                                    <h3>{popupInfo.name}</h3>
                                    <p>Total de votos: {popupInfo.votes}</p>
                                </div>
                            </Popup>
                        )}
                    </Map>
                </div>
            </CardContent>
        </Card>
    );
};

export default MapComponent;