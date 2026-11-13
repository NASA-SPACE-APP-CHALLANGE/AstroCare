import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Rocket } from 'lucide-react';
import { AstroCareLogo } from './Logo';

const NAV_LINKS = [
    { label: 'Overview', to: '/' },
    { label: 'Live Monitoring', to: '/dashboard' },
    { label: 'AI Insights', to: '/ai-insights' },
    { label: 'Mission Data', to: '/mission-data' },
    { label: 'Spaceflight Research', to: '/research' },
    { label: 'About Project', to: '/about' },
];

export const Navbar: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => { setMobileOpen(false); }, [location]);

    return (
        <>
            <nav
                role="navigation"
                aria-label="Main navigation"
                style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
                    background: scrolled ? 'rgba(5,8,22,0.95)' : 'rgba(5,8,22,0.6)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: scrolled ? '1px solid rgba(145,160,190,0.15)' : '1px solid transparent',
                    transition: 'all 300ms ease',
                }}
            >
                <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
                    <Link to="/" aria-label="AstroCare Home">
                        <AstroCareLogo size={32} />
                    </Link>

                    {/* Desktop nav */}
                    <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        {NAV_LINKS.map(link => (
                            <Link
                                key={link.to}
                                to={link.to}
                                style={{
                                    fontSize: '0.88rem',
                                    fontWeight: 500,
                                    color: location.pathname === link.to ? 'var(--electric-cyan)' : 'var(--text-secondary)',
                                    textDecoration: 'none',
                                    transition: 'color 150ms',
                                    letterSpacing: '0.01em',
                                }}
                                onMouseEnter={e => { if (location.pathname !== link.to) (e.target as HTMLElement).style.color = 'var(--stellar-white)'; }}
                                onMouseLeave={e => { if (location.pathname !== link.to) (e.target as HTMLElement).style.color = 'var(--text-secondary)'; }}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                            className="btn btn-primary btn-sm hide-mobile"
                            onClick={() => navigate('/dashboard')}
                        >
                            <Rocket size={14} />
                            Launch Mission Console
                        </button>

                        {/* Mobile menu button */}
                        <button
                            className="btn btn-ghost btn-icon show-mobile-only"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                            style={{ display: 'none' }}
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile menu */}
            {mobileOpen && (
                <div
                    style={{
                        position: 'fixed', top: 64, left: 0, right: 0, zIndex: 999,
                        background: 'rgba(5,8,22,0.98)',
                        backdropFilter: 'blur(20px)',
                        borderBottom: '1px solid rgba(145,160,190,0.15)',
                        padding: '1rem',
                    }}
                >
                    {NAV_LINKS.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            style={{
                                display: 'block',
                                padding: '0.75rem 1rem',
                                color: location.pathname === link.to ? 'var(--electric-cyan)' : 'var(--text-secondary)',
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                borderRadius: 'var(--radius-md)',
                                textDecoration: 'none',
                            }}
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div style={{ padding: '0.5rem 1rem 1rem' }}>
                        <button
                            className="btn btn-primary w-full"
                            onClick={() => navigate('/dashboard')}
                        >
                            <Rocket size={15} />
                            Launch Mission Console
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
