import React, { useState, useEffect } from 'react';
import Map, { Source, Layer, Popup } from 'react-map-gl';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Feature, Point } from 'geojson';
import type { CircleLayer, SymbolLayer } from 'react-map-gl';
import { supabase } from '@/utils/supabase/client';

interface MapComponentProps {
    selectedYear?: number;
    candidateSearch?: string;
    sq_candidato?: bigint;
}

interface CityVoteData {
    nm_municipio: string;
    latitude: number;
    longitude: number;
    total_votos: number;
    percentual_votos: number;
}

type ViewFilter = 'cidade' | 'bairro' | 'sessao';

const MapComponent: React.FC<MapComponentProps> = ({ 
    selectedYear = 2022, // Provide default value
    candidateSearch = '', // Provide default value
    sq_candidato 
}) => {
    const [viewState, setViewState] = useState({
        latitude: -8.77,
        longitude: -67.81,
        zoom: 7
    });

    const [activeFilter, setActiveFilter] = useState<ViewFilter>('cidade');
    const [cityData, setCityData] = useState<CityVoteData[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [popupInfo, setPopupInfo] = useState<{
        longitude: number;
        latitude: number;
        city: string;
        votes: number;
        percentage: number;
    } | null>(null);

    const currentPopupRef = React.useRef<any>(null);

    const handleFilterChange = (filter: ViewFilter) => {
        setActiveFilter(filter);
        // Adjust zoom level based on filter
        setViewState(prev => ({
            ...prev,
            zoom: filter === 'sessao' ? 12 : 7
        }));
    };

    useEffect(() => {
        const fetchCityData = async () => {
            if (!selectedYear || !sq_candidato || activeFilter !== 'cidade') {
                setCityData([]);
                return;
            }

            try {
                const { data, error } = await supabase.rpc('get_votes_by_city', {
                    p_ano_eleicao: selectedYear,
                    p_sq_candidato: sq_candidato
                });

                if (error) throw error;
                
                // Filter out any cities with null coordinates
                interface CityDataFromDB {
                    latitude: number | null;
                    longitude: number | null;
                    nm_municipio: string;
                    total_votos: number;
                    percentual_votos: number;
                }

                const validData: CityVoteData[] = (data as CityDataFromDB[] || []).filter(
                    (city: CityDataFromDB): city is CityVoteData => 
                        city.latitude != null && city.longitude != null
                );
                
                console.log('Valid city data:', validData);
                setCityData(validData);
                setError(null);

                // Center map on Acre state if no valid cities
                if (validData.length === 0) {
                    setViewState({
                        latitude: -8.77,
                        longitude: -67.81,
                        zoom: 7
                    });
                }
            } catch (err: any) {
                console.error('Error fetching city data:', err);
                setError('Failed to load city data');
                setCityData([]);
            }
        };

        fetchCityData();
    }, [selectedYear, sq_candidato, activeFilter]);

    // Debug log for GeoJSON conversion
    useEffect(() => {
        console.log('Current cityData:', cityData);
        console.log('Converted GeoJSON:', cityGeoJson);
    }, [cityData]);

    const cityGeoJson = {
        type: 'FeatureCollection',
        features: cityData.map((item) => ({
            type: 'Feature',
            properties: {
                votes: item.total_votos,
                percentage: item.percentual_votos,
                city: item.nm_municipio
            },
            geometry: {
                type: 'Point',
                coordinates: [item.longitude, item.latitude]
            }
        }))
    };

    // Layers for clusters (blue circles) and label with vote count
    const clusterCircleLayer: CircleLayer = {
        id: 'city-cluster-circle',
        type: 'circle',
        source: 'city-points',
        filter: ['has', 'point_count'],
        paint: {
            'circle-color': '#3498db',
            'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'point_count'],
                2, 30,    // min points, min size
                5, 35,
                10, 40,
                20, 45,
                50, 50    // max points, max size
            ],
            'circle-opacity': 0.8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
        }
    };

    const clusterLabelLayer: SymbolLayer = {
        id: 'city-cluster-label',
        type: 'symbol',
        source: 'city-points',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}',
            'text-size': 12
        },
        paint: {
            'text-color': '#ffffff'
        }
    };

    // Updated unclusteredCircleLayer with more visible settings
    const unclusteredCircleLayer: CircleLayer = {
        id: 'city-unclustered-point',
        type: 'circle',
        source: 'city-points',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': '#3498db',
            'circle-radius': [
                'interpolate',
                ['linear'],
                ['get', 'votes'],
                0, 20,     // smaller starting size
                500, 25,  // medium size
                1000, 30  // max size for individual points
            ],
            'circle-opacity': 0.8,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
        }
    };

    // Updated unclusteredLabelLayer with more visible settings
    const unclusteredLabelLayer: SymbolLayer = {
        id: 'city-unclustered-label',
        type: 'symbol',
        source: 'city-points',
        filter: ['!', ['has', 'point_count']],
        layout: {
            'text-field': [
                'concat',
                ['to-string', ['get', 'votes']],
                '\n',
                ['to-string', ['get', 'percentage']],
                '%'
            ],
            'text-size': 14,
            'text-anchor': 'center',
            'text-allow-overlap': true  // Allow text to overlap
        },
        paint: {
            'text-color': '#ffffff',

        }
    };

    // Add debug logs for render conditions
    useEffect(() => {
        console.log('Render conditions:', {
            activeFilter,
            hasError: !!error,
            dataLength: cityData.length,
            geoJsonFeatures: cityGeoJson.features.length
        });
    }, [cityData, error, activeFilter]);

    // Update the map center based on data
    useEffect(() => {
        if (cityData.length > 0) {
            // Center map on first city
            setViewState(prev => ({
                ...prev,
                latitude: cityData[0].latitude,
                longitude: cityData[0].longitude,
                zoom: 7
            }));
        }
    }, [cityData]);

    const handleClick = (e: any) => {
        const feature = e.features?.[0] as Feature<Point> | undefined;
        
        // Always close the current popup before showing a new one
        setPopupInfo(null);
        
        // Short delay to ensure the previous popup is fully closed
        setTimeout(() => {
            if (feature?.properties && feature.geometry.type === 'Point') {
                const newPopupInfo = {
                    longitude: feature.geometry.coordinates[0],
                    latitude: feature.geometry.coordinates[1],
                    city: feature.properties.city,
                    votes: feature.properties.cluster ? feature.properties.point_count : feature.properties.votes,
                    percentage: feature.properties.percentage || 0
                };
                setPopupInfo(newPopupInfo);
                currentPopupRef.current = newPopupInfo;
            }
        }, 10);
    };

    return (
        <Card className="w-full h-full">
            <CardHeader>
                <div className="text-xl font-semibold">Mapa</div>
                <div className="flex gap-2">
                    <Badge
                        variant={activeFilter === 'cidade' ? 'default' : 'outline'}
                        className="cursor-pointer rounded-sm"
                        onClick={() => handleFilterChange('cidade')}
                    >
                        Cidade
                    </Badge>
                    <Badge
                        variant={activeFilter === 'bairro' ? 'default' : 'outline'}
                        className="cursor-pointer rounded-sm"
                        onClick={() => handleFilterChange('bairro')}
                    >
                        Bairro
                    </Badge>
                    <Badge
                        variant={activeFilter === 'sessao' ? 'default' : 'outline'}
                        className="cursor-pointer rounded-sm"
                        onClick={() => handleFilterChange('sessao')}
                    >
                        Seção
                    </Badge>
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
                        interactiveLayerIds={['city-cluster-circle', 'city-unclustered-point']}
                        onClick={handleClick}
                    >
                        {activeFilter === 'cidade' && cityData.length > 0 && (
                            <Source
                                id="city-points"
                                type="geojson"
                                data={cityGeoJson}
                                cluster={true}
                                clusterMaxZoom={14}
                                clusterRadius={50}
                                clusterProperties={{
                                    sum_votes: ["+", ["get", "votes"]]
                                }}
                            >
                                <Layer {...clusterCircleLayer} />
                                <Layer
                                    {...clusterLabelLayer}
                                    layout={{
                                        ...clusterLabelLayer.layout,
                                        'text-field': '{sum_votes}' // Show sum of votes instead of point count
                                    }}
                                />
                                <Layer {...unclusteredCircleLayer} />
                                <Layer {...unclusteredLabelLayer} />
                            </Source>
                        )}
                        {popupInfo && (
                            <Popup className='text-black'
                                longitude={popupInfo.longitude}
                                latitude={popupInfo.latitude}
                                anchor="bottom"
                                closeButton={true}
                                closeOnClick={false}
                                onClose={() => {
                                    setPopupInfo(null);
                                    currentPopupRef.current = null;
                                }}
                            >
                                <div className="p-2">
                                    <h3 className="font-bold">{popupInfo.city}</h3>
                                    <p>Votos: {popupInfo.votes}</p>
                                    {popupInfo.percentage > 0 && (
                                        <p>Percentual: {popupInfo.percentage}%</p>
                                    )}
                                </div>
                            </Popup>
                        )}
                    </Map>
                    {error && <div className="text-red-500 absolute bottom-4 left-4 bg-white p-2 rounded">{error}</div>}
                </div>
            </CardContent>
        </Card>
    );
};

export default MapComponent;