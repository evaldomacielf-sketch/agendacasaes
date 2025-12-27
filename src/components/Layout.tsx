import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
    className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
    return (
        <div className={`relative flex flex-col w-full min-h-screen bg-background-light dark:bg-background-dark font-sans text-text-main ${className}`}>
            {children}
        </div>
    );
};

export default Layout;
