import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Image from 'next/image';
import { CandidatoData } from '@/types/candidate';

interface CandidateCardProps {
    candidate: CandidatoData;
    color?: string;
}

export function CandidateCard({ candidate, color = 'blue' }: CandidateCardProps) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center space-x-4">
                    <div className="relative w-16 h-16">
                        {candidate.img_candidato ? (
                            <Image
                                src={candidate.img_candidato}
                                alt={candidate.nm_urna_candidato}
                                fill
                                className="rounded-full"
                                sizes="(max-width: 64px) 100vw"
                                style={{ objectFit: 'cover' }}
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-gray-500">Sem foto</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold">{candidate.nm_urna_candidato}</h3>
                        <p className="text-sm text-gray-500">
                            {candidate.nr_candidato} - {candidate.sg_partido}
                        </p>
                    </div>
                </div>
            </CardHeader>
            {/* Additional candidate information can be added here */}
        </Card>
    );
}
