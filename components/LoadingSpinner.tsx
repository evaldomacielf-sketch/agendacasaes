import React from 'react';

const LoadingSpinner: React.FC = () => {
    return (
        <div className="flex items-center justify-center p-8 w-full h-full min-h-[50vh]">
            <div className="flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-4xl text-primary animate-spin">
                    progress_activity
                </span>
                <p className="text-gray-500 text-sm font-medium animate-pulse">Carregando...</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;
