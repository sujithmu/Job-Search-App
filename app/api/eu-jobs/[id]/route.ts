import { NextRequest, NextResponse } from 'next/server';

const EURES_DETAIL_BASE =
    'https://europa.eu/eures/api/jv-searchengine/public/jv/id';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const url = `${EURES_DETAIL_BASE}/${encodeURIComponent(id)}?requestLang=en&preferredLang=null`;

        const euresRes = await fetch(url, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; JobSearchApp/1.0)',
                requestLang: 'en',
                preferredLang: 'null',
            },
            cache: 'no-store',
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
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
