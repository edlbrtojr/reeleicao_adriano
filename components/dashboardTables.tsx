import React from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TableData {
    name: string;
    votes: number;
    percentage: number;
}

interface TableProps {
    data: TableData[];
    loading: boolean;
    title: string;
}

const VotesTable: React.FC<TableProps> = ({ data, loading, title }) => {
    if (loading) {
        return <div>Carregando...</div>;
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="max-h-[400px] overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead className="text-right">Votos</TableHead>
                                <TableHead className="text-right">Percentual</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell className="text-right">{item.votes.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{item.percentage.toFixed(2)}%</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export const MunicipiosTable: React.FC<{ candidateId: bigint; year: number }> = ({ candidateId, year }) => {
    const [data, setData] = React.useState<TableData[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/votes/municipalities?candidateId=${candidateId}&year=${year}`);
                const result = await response.json();
                setData(result.data || []);
            } catch (error) {
                console.error('Error fetching municipality data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [candidateId, year]);

    return <VotesTable data={data} loading={loading} title="Votos por Município" />;
};

export const BairrosTable: React.FC<{ candidateId: bigint; year: number; municipioId?: number }> = ({ 
    candidateId, 
    year,
    municipioId 
}) => {
    const [data, setData] = React.useState<TableData[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const url = `/api/votes/neighborhoods?candidateId=${candidateId}&year=${year}${municipioId ? `&municipioId=${municipioId}` : ''}`;
                const response = await fetch(url);
                const result = await response.json();
                setData(result.data || []);
            } catch (error) {
                console.error('Error fetching neighborhood data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [candidateId, year, municipioId]);

    return <VotesTable data={data} loading={loading} title="Votos por Bairro" />;
};
