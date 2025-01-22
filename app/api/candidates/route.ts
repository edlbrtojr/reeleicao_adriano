import { NextResponse } from 'next/server';
import { fetchCandidates } from './utils';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const year = searchParams.get('year');
    const cargo = searchParams.get('cargo');

    if (query && query.length < 3) {
        return NextResponse.json({ data: [] });
    }

    try {
        const data = await fetchCandidates(query || undefined, year || undefined, cargo || undefined);
        return NextResponse.json({ data });
    } catch (error) {
        console.error('Server error:', error);
        return NextResponse.json({ data: [] });
    }
}
