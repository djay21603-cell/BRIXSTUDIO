import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ProjectProvider } from './context/ProjectContext'
import { AuthProvider } from './features/auth/AuthContext'
import { RequireAdmin, RequireAuth } from './features/auth/RequireAuth'
import { MarketingLayout } from './components/layout/MarketingLayout'
import { TalkToCocel } from './components/assistant/TalkToCocel'
import { HomePage } from './pages/HomePage'
import { DesignsPage } from './pages/DesignsPage'
import { BusinessTypesPage } from './pages/BusinessTypesPage'
import { WizardPage } from './pages/WizardPage'
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
import { AdminPage } from './pages/app/AdminPage'

export default function App() {
  return (
    <BrowserRouter>
      <ProjectProvider>
        <AuthProvider>
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
          <TalkToCocel />
        </AuthProvider>
      </ProjectProvider>
    </BrowserRouter>
  )
}
