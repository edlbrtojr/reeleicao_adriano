// Import necessary dependencies for React, Mapbox GL, and UI components
import React, { useState, useEffect } from 'react';
import Map, { Source, Layer, Popup } from 'react-map-gl';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Feature, Point } from 'geojson';
import type { CircleLayer, SymbolLayer } from 'react-map-gl';
import { supabase } from '@/utils/supabase/client';

// Define component props interface
interface MapComponentProps {
    selectedYear?: number;      // Year of election
    candidateSearch?: string;   // Search term for candidate
    sq_candidato?: bigint;     // Unique candidate identifier
}

// Define interface for city voting data structure
interface CityVoteData {
    nm_municipio: string;       // City name
    latitude: number;          // Geographical latitude
    longitude: number;         // Geographical longitude
    total_votos: number;      // Total votes in the city
    percentual_votos: number; // Percentage of votes in the city
}

// Define view filter types for different geographical levels
type ViewFilter = 'cidade' | 'bairro' | 'sessao';
// Define display filter types for vote visualization
type DisplayFilter = 'votos' | 'percentual';

const MapComponent: React.FC<MapComponentProps> = ({ 
    selectedYear = 2022, // Provide default value
    candidateSearch = '', // Provide default value
    sq_candidato 
}) => {
    // State for map viewport control
    const [viewState, setViewState] = useState({
        latitude: -8.77,        // Initial center latitude (Acre state)
        longitude: -67.81,      // Initial center longitude (Acre state)
        zoom: 7                 // Initial zoom level
    });

    // State management for various component features
    const [activeFilter, setActiveFilter] = useState<ViewFilter>('cidade');
    const [displayFilter, setDisplayFilter] = useState<DisplayFilter>('votos');
    const [cityData, setCityData] = useState<CityVoteData[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    // State for popup information display
    const [popupInfo, setPopupInfo] = useState<{
        longitude: number;
        latitude: number;
        city: string;
        votes: number;
        percentage: number;
    } | null>(null);

    // Reference to track current popup
    const currentPopupRef = React.useRef<any>(null);

    // Handler for changing view filter (cidade/bairro/sessao)
    const handleFilterChange = (filter: ViewFilter) => {
        setActiveFilter(filter);
        // Adjust zoom based on selected filter
        setViewState(prev => ({
            ...prev,
            zoom: filter === 'sessao' ? 12 : 7
        }));
    };

    // Effect hook to fetch city voting data
    useEffect(() => {
        const fetchCityData = async () => {
            if (!selectedYear || !sq_candidato || activeFilter !== 'cidade') {
                setCityData([]);
                return;
            }

            try {
                const response = await fetch(`/api/votes/cities?candidateId=${sq_candidato}&year=${selectedYear}`);
                const result = await response.json();
                
                if (!response.ok) throw new Error(result.error);
                
                setCityData(result.data);
                setError(null);

                if (result.data.length === 0) {
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

    // Update the cityGeoJson definition to include eleitores
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

    const getDisplayValue = (feature: any) => {
        if (displayFilter === 'votos') {
            return feature.properties.cluster ? feature.properties.sum_votes : feature.properties.votes;
        } else {
            return feature.properties.cluster ? 
                Math.round(feature.properties.sum_percentage * 10) / 10 : 
                Math.round(feature.properties.percentage * 10) / 10;
        }
    };

    // Update the unclusteredLabelLayer configuration
    const unclusteredLabelLayer: SymbolLayer = {
        id: 'city-unclustered-label',
        type: 'symbol',
        source: 'city-points',
        filter: ['!', ['has', 'point_count']],
        layout: {
            'text-field': displayFilter === 'votos' ?
                ['to-string', ['get', 'votes']] :
                ['concat', ['to-string', ['get', 'percentage']], '%'],
            'text-size': 14,
            'text-anchor': 'center',
            'text-allow-overlap': true
        },
        paint: {
            'text-color': '#ffffff',
        }
    };

    // Update cluster label layer with weighted average percentage calculation
    const clusterLabelLayer: SymbolLayer = {
        id: 'city-cluster-label',
        type: 'symbol',
        source: 'city-points',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': displayFilter === 'votos' ?
                ['get', 'sum_votes'] :
                ['concat',
                    ['number-format', ['get', 'sum_percentage'], { 'maximumFractionDigits': 2 }],
                    '%'
                ],
            'text-size': 14,
            'text-anchor': 'center',
            'text-allow-overlap': true
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

    // Handler for map click events
    const handleClick = (e: any) => {
        const feature = e.features?.[0] as Feature<Point> | undefined;
        
        // Close current popup and create new one with delay
        setPopupInfo(null);
        
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

    // JSX rendering of the map component
    return (
        <Card className="w-full h-full">
            <CardHeader>
                <div className="text-xl font-semibold">Mapa</div>
                <div className="flex justify-between">
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
                    <div className="flex gap-2">
                        <Badge
                            variant={displayFilter === 'votos' ? 'default' : 'outline'}
                            className="cursor-pointer rounded-sm"
                            onClick={() => setDisplayFilter('votos')}
                        >
                            Votos
                        </Badge>
                        <Badge
                            variant={displayFilter === 'percentual' ? 'default' : 'outline'}
                            className="cursor-pointer rounded-sm"
                            onClick={() => setDisplayFilter('percentual')}
                        >
                            Percentual
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
                                    sum_votes: ["+", ["get", "votes"]],
                                    sum_percentage: ["+", ["get", "percentage"]]  // Sum up the city percentages
                                }}
                            >
                                <Layer {...clusterCircleLayer} />
                                <Layer {...clusterLabelLayer} />
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
                                    {popupInfo.votes && typeof popupInfo.votes === 'number' ? (
                                        <>
                                            <h3 className="font-bold">{popupInfo.city}</h3>
                                            <p>Votos: {popupInfo.votes}</p>
                                            {popupInfo.percentage > 0 && (
                                                <p>Percentual: {popupInfo.percentage}%</p>
                                            )}
                                        </>
                                    ) : (
                                        <div>
                                            <h3 className="font-bold">Cidades no grupo:</h3>
                                            <p className="max-h-[200px] overflow-y-auto">
                                                {cityData
                                                    .filter(city => 
                                                        Math.abs(city.longitude - popupInfo.longitude) < 0.1 &&
                                                        Math.abs(city.latitude - popupInfo.latitude) < 0.1
                                                    )
                                                    .map(city => city.nm_municipio)
                                                    .join(', ')}
                                            </p>
                                        </div>
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