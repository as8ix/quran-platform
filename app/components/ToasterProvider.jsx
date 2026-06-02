'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

export default function ToasterProvider() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <Toaster
            position="top-center"
            reverseOrder={false}
            pauseOnHover={false}
            containerStyle={{
                zIndex: 1000000,
                visibility: 'visible',
            }}
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#334155',
                    color: '#fff',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                },
                success: {
                    style: {
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0'
                    },
                },
                error: {
                    style: {
                        background: '#fff1f2',
                        color: '#be123c',
                        border: '1px solid #fecdd3'
                    },
                },
            }}
        />
    );
}
