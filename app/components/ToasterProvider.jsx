'use client';

import { Toaster } from 'react-hot-toast';

export default function ToasterProvider() {
    return (
        <Toaster
            position="top-center"
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#334155',
                    color: '#fff',
                    fontFamily: 'inherit',
                    borderRadius: '12px',
                    padding: '16px',
                },
                success: {
                    style: {
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0'
                    },
                    iconTheme: {
                        primary: '#10b981',
                        secondary: '#ecfdf5',
                    },
                },
                error: {
                    style: {
                        background: '#fff1f2',
                        color: '#be123c',
                        border: '1px solid #fecdd3'
                    },
                    iconTheme: {
                        primary: '#f43f5e',
                        secondary: '#fff1f2',
                    },
                },
            }}
        />
    );
}
