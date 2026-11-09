import { NextRequest, NextResponse } from 'next/server';

const EURES_URL =
    'https://europa.eu/eures/api/jv-searchengine/public/jv-search/search';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // EURES API uses 'BEST_MATCH' for relevance sorting; 'RELEVANCE' returns a 500
        if (body.sortSearch === 'RELEVANCE') {
            body.sortSearch = 'BEST_MATCH';
        }

        const euresRes = await fetch(EURES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                // Some instances of the EURES API require a realistic User-Agent
                'User-Agent':
                    'Mozilla/5.0 (compatible; JobSearchApp/1.0)',
            },
            body: JSON.stringify(body),
        });

        if (!euresRes.ok) {
            const text = await euresRes.text();
            return NextResponse.json(
                { error: `EURES API error: ${euresRes.status}`, detail: text },
                { status: euresRes.status }
            );
        }

        const data = await euresRes.json();
        return NextResponse.json(data);
    } catch (err: unknown) {
        console.error('API route error:', err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
