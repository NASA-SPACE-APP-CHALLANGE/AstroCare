import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { StarfieldBackground } from '@/components/StarfieldBackground';
import { Navbar } from '@/components/Navbar';
import { DashboardLayout } from '@/layouts/DashboardLayout';

// Pages
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardOverview } from '@/pages/DashboardOverview';
import { HealthAnalyticsPage } from '@/pages/HealthAnalyticsPage';
import { AIInsightsPage } from '@/pages/AIInsightsPage';
import { AlertCenterPage } from '@/pages/AlertCenterPage';
import { AstronautProfilePage } from '@/pages/AstronautProfilePage';
import { MissionReportsPage } from '@/pages/MissionReportsPage';
import { DataSimulatorPage } from '@/pages/DataSimulatorPage';
import { MissionDataPage } from '@/pages/MissionDataPage';
import { DataImportPage } from '@/pages/DataImportPage';
import { DatasetInfoPage } from '@/pages/DatasetInfoPage';
import { MissionTimelinePage } from '@/pages/MissionTimelinePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AboutPage } from '@/pages/AboutPage';
import { ResearchHubPage } from '@/pages/ResearchHubPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { Footer } from '@/components/Footer';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div style={{ position: 'relative', minHeight: '100vh', background: 'var(--deep-space)' }}>
        {/* Animated starfield always present */}
        <StarfieldBackground />

        <Routes>
          {/* Landing page with top navbar */}
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <div style={{ position: 'relative', zIndex: 1, paddingTop: 0 }}>
                  <LandingPage />
                </div>
              </>
            }
          />

          {/* Login Page */}
          <Route
            path="/login"
            element={
              <>
                <Navbar />
                <div style={{ position: 'relative', zIndex: 1, paddingTop: 64 }}>
                  <LoginPage />
                </div>
              </>
            }
          />

          {/* About page with top navbar */}
          <Route
            path="/about"
            element={
              <>
                <Navbar />
                <div style={{ position: 'relative', zIndex: 1, paddingTop: 80, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                  <div className="container" style={{ paddingTop: '1rem', paddingBottom: '4rem', flex: 1 }}>
                    <AboutPage />
                  </div>
                  <Footer />
                </div>
              </>
            }
          />

          {/* Research Hub page with top navbar */}
          <Route
            path="/research"
            element={
              <>
                <Navbar />
                <div style={{ position: 'relative', zIndex: 1, paddingTop: 80, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1 }}>
                    <ResearchHubPage inDashboard={false} />
                  </div>
                  <Footer />
                </div>
              </>
            }
          />

          {/* AI Insights page with top navbar */}
          <Route
            path="/ai-insights"
            element={
              <>
                <Navbar />
                <div style={{ position: 'relative', zIndex: 1, paddingTop: 80, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                  <div className="container" style={{ paddingTop: '1rem', paddingBottom: '4rem', flex: 1 }}>
                    <AIInsightsPage />
                  </div>
                  <Footer />
                </div>
              </>
            }
          />

          {/* Mission Data page with top navbar */}
          <Route
            path="/mission-data"
            element={
              <>
                <Navbar />
                <div style={{ position: 'relative', zIndex: 1, paddingTop: 80, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                  <div className="container" style={{ paddingTop: '1rem', paddingBottom: '4rem', flex: 1 }}>
                    <MissionDataPage />
                  </div>
                  <Footer />
                </div>
              </>
            }
          />

          {/* Dashboard with sidebar layout */}
          <Route
            path="/dashboard"
            element={
              <div style={{ position: 'relative', zIndex: 1, paddingTop: 0 }}>
                <DashboardLayout />
              </div>
            }
          >
            <Route index element={<DashboardOverview />} />
            <Route path="analytics" element={<HealthAnalyticsPage />} />
            <Route path="alerts" element={<AlertCenterPage />} />
            <Route path="profile" element={<AstronautProfilePage />} />
            <Route path="reports" element={<MissionReportsPage />} />
            <Route path="simulator" element={<DataSimulatorPage />} />
            <Route path="telemetry" element={<MissionDataPage />} />
            <Route path="import" element={<DataImportPage />} />
            <Route path="dataset" element={<DatasetInfoPage />} />
            <Route path="timeline" element={<MissionTimelinePage />} />
            <Route path="research" element={<ResearchHubPage inDashboard={true} />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Legacy/alias routes */}
          <Route path="/dashboard/ai" element={<Navigate to="/ai-insights" replace />} />
          <Route path="/analytics" element={<Navigate to="/dashboard/analytics" replace />} />
          <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
          <Route path="/reports" element={<Navigate to="/dashboard/reports" replace />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </AuthProvider>
  );
};

export default App;
