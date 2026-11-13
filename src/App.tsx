import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ProjectProvider } from './context/ProjectContext'
import { AuthProvider } from './features/auth/AuthContext'
import { RequireAdmin, RequireAuth } from './features/auth/RequireAuth'
import { MarketingLayout } from './components/layout/MarketingLayout'
import { TalkToCocel } from './components/assistant/TalkToCocel'
import { HomePage } from './pages/HomePage'
import { DesignsPage } from './pages/DesignsPage'
import { BusinessTypesPage } from './pages/BusinessTypesPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { SignInPage } from './pages/auth/SignInPage'
import { SignUpPage } from './pages/auth/SignUpPage'
import { PrivacyPage } from './pages/legal/PrivacyPage'
import { TermsPage } from './pages/legal/TermsPage'
import { AppLayout } from './pages/app/AppLayout'
import { DashboardPage } from './pages/app/DashboardPage'
import { ToolsPage } from './pages/app/ToolsPage'
import { ToolShellPage } from './pages/app/ToolShellPage'
import { FilesPage } from './pages/app/FilesPage'
import { AccountPage } from './pages/app/AccountPage'

const WizardPage = lazy(() =>
  import('./pages/WizardPage').then((module) => ({ default: module.WizardPage })),
)
const AdminPage = lazy(() =>
  import('./pages/app/AdminPage').then((module) => ({ default: module.AdminPage })),
)

function PageLoader() {
  return (
    <div className="grid min-h-[60vh] place-items-center bg-bone text-[12px] text-ink/40" role="status">
      Loading…
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ProjectProvider>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route element={<MarketingLayout />}>
              <Route index element={<HomePage />} />
              <Route path="designs" element={<DesignsPage />} />
              <Route path="business-types" element={<BusinessTypesPage />} />
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="terms" element={<TermsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            <Route path="start" element={<WizardPage />} />
            <Route path="sign-in" element={<SignInPage />} />
            <Route path="sign-up" element={<SignUpPage />} />
            <Route element={<RequireAuth />}>
              <Route path="app" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="tools" element={<ToolsPage />} />
                <Route path="tools/:slug" element={<ToolShellPage />} />
                <Route path="files" element={<FilesPage />} />
                <Route path="account" element={<AccountPage />} />
                <Route element={<RequireAdmin />}>
                  <Route path="admin" element={<AdminPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
          </Suspense>
          <TalkToCocel />
        </AuthProvider>
      </ProjectProvider>
    </BrowserRouter>
  )
}
