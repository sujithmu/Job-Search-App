'use client';

import { useEffect, useState } from 'react';

/**
 * ClientOnly – renders children only after the component mounts on the client.
 * Use this to prevent hydration mismatches caused by browser extensions that
 * inject attributes (e.g. bis_skin_checked, bis_register) into DOM elements
 * before React hydrates.
 */
export default function ClientOnly({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return <>{children}</>;
}
