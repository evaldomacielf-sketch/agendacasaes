import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const Breadcrumbs: React.FC = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter(x => x);

    if (pathnames.length === 0) return null;

    return (
        <nav aria-label="breadcrumb" className="text-sm text-slate-500 mb-4 animate-fade-in-up">
            <ol className="list-reset flex items-center">
                <li>
                    <Link to="/dashboard" className="hover:text-primary transition-colors hover:underline">
                        Home
                    </Link>
                </li>
                {pathnames.map((value, index) => {
                    // Skip "dashboard" since it's the home in this context or handle it
                    if (value === 'dashboard' && index === 0) return null;

                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;

                    // Simple capitalization or mapping could go here
                    const displayName = value.charAt(0).toUpperCase() + value.slice(1);

                    return (
                        <React.Fragment key={to}>
                            <li className="mx-2 text-slate-400 select-none">/</li>
                            <li className={`${isLast ? 'text-slate-800 dark:text-gray-200 font-medium' : ''}`}>
                                {isLast ? (
                                    displayName
                                ) : (
                                    <Link to={to} className="hover:text-primary transition-colors hover:underline">
                                        {displayName}
                                    </Link>
                                )}
                            </li>
                        </React.Fragment>
                    );
                })}
            </ol>
        </nav>
    );
};

export default Breadcrumbs;
