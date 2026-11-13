import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardSidebar } from '@/components/DashboardSidebar';

export const DashboardLayout: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
            {/* Sidebar */}
            <DashboardSidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(c => !c)}
            />

            {/* Main content */}
            <main
                style={{
                    flex: 1,
                    minWidth: 0,
                    overflowX: 'hidden',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <Outlet />
            </main>
        </div>
    );
};
