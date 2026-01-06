'use client';

export default function Card({ children, title, headerAction, className = '' }) {
    return (
        <div className={`card-premium p-6 ${className}`}>
            {(title || headerAction) && (
                <div className="flex justify-between items-center mb-6">
                    {title && <h2 className="text-2xl font-bold text-gray-800">{title}</h2>}
                    {headerAction}
                </div>
            )}
            {children}
        </div>
    );
}
