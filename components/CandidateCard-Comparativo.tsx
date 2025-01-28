import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Image from 'next/image';
import { CandidatoData } from '@/types/candidate';

interface CandidateCardProps {
    candidate: CandidatoData;
    color?: string;
}

export function CandidateCard({ candidate, color = 'blue' }: CandidateCardProps) {
    const [imageError, setImageError] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        // Debug log to verify all candidate data
        console.log('CandidateCard received data:', {
            nm_urna_candidato: candidate.nm_urna_candidato,
            nr_candidato: candidate.nr_candidato,
            sg_partido: candidate.sg_partido,
            ds_cargo: candidate.ds_cargo,
            img_candidato: candidate.img_candidato
        });
    }, [candidate]);

    useEffect(() => {
        // Debug log
        console.log('Candidate image URL:', candidate.img_candidato);
        
        if (candidate.img_candidato) {
            try {
                // Validate URL
                new URL(candidate.img_candidato);
                setImageUrl(candidate.img_candidato);
            } catch (e) {
                console.error('Invalid image URL:', candidate.img_candidato);
                setImageError(true);
            }
        }
    }, [candidate.img_candidato]);

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center space-x-4">
                    <div className="relative w-16 h-16">
                        {imageUrl && !imageError ? (
                            <Image
                                src={imageUrl}
                                alt={candidate.nm_urna_candidato}
                                fill
                                className="rounded-full object-cover"
                                onError={(e) => {
                                    console.error('Image failed to load:', imageUrl);
                                    setImageError(true);
                                }}
                                unoptimized // since these are external images
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-xs text-gray-500 text-center">Sem foto</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold">{candidate.nm_urna_candidato}</h3>
                        <p className="text-sm text-gray-500">
                            {candidate.nr_candidato} - {candidate.sg_partido}
                        </p>
                        <p className="text-sm text-gray-500">
                            {candidate.ds_cargo} {/* Display cargo information */}
                        </p>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}
