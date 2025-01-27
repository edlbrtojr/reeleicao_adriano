import React from 'react';
import { Card, CardContent } from './ui/card';
import { CandidatoData } from '@/types/candidate';
import { formatNumber } from '@/utils/formatNumber';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';

interface ComparisonChartsProps {
    candidate1: CandidatoData & { color: string };
    candidate2: CandidatoData & { color: string };
    comparison?: {
        commonMunicipios: any[];
        totalVotesCandidate1: number;
        totalVotesCandidate2: number;
        votingPercentageDiff: number;
    };
    filters: {
        selectedYear?: number;
        selectedCargo?: number | null;
        selectedMunicipio?: number | null;
    };
}

export const ComparisonCharts: React.FC<ComparisonChartsProps> = ({
    candidate1,
    candidate2,
    comparison,
    filters
}) => {
    if (!comparison) return null;

    console.log('Rendering charts with data:', comparison);

    const votesData = [
        {
            name: candidate1.nm_urna_candidato,
            votes: comparison.totalVotesCandidate1,
            color: candidate1.color
        },
        {
            name: candidate2.nm_urna_candidato,
            votes: comparison.totalVotesCandidate2,
            color: candidate2.color
        }
    ];

    // Sort municipalities by total votes (sum of both candidates)
    const municipiosData = comparison.commonMunicipios
        .map(mun => ({
            name: mun.nm_municipio,
            totalVotes: mun.votes1 + mun.votes2,
            [candidate1.nm_urna_candidato]: mun.votes1,
            [candidate2.nm_urna_candidato]: mun.votes2
        }))
        .sort((a, b) => b.totalVotes - a.totalVotes)
        .slice(0, 5); // Show only top 10 municipalities

    return (
        <div className="grid grid-cols-2 gap-4">
            <Card className="w-full">
            <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">
                Total de Votos - {filters.selectedYear}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                    data={votesData}
                    dataKey="votes"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name}: ${formatNumber(entry.votes, 'K')}`}
                    >
                    {votesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(value as number, 'K')} />
                    <Legend />
                </PieChart>
                </ResponsiveContainer>
            </CardContent>
            </Card>

            {municipiosData.length > 0 && (
            <Card className="w-full">
                <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">Top 5 Municípios</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={municipiosData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatNumber(value as number, 'K')} />
                    <Legend />
                    <Bar dataKey={candidate1.nm_urna_candidato} fill={candidate1.color} />
                    <Bar dataKey={candidate2.nm_urna_candidato} fill={candidate2.color} />
                    </BarChart>
                </ResponsiveContainer>
                </CardContent>
            </Card>
            )}
        </div>
    );
};
