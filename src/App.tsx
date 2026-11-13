import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ProjectProvider } from './context/ProjectContext'
import { MarketingLayout } from './components/layout/MarketingLayout'
import { TalkToCocel } from './components/assistant/TalkToCocel'
import { HomePage } from './pages/HomePage'
import { DesignsPage } from './pages/DesignsPage'
import { BusinessTypesPage } from './pages/BusinessTypesPage'
import { WizardPage } from './pages/WizardPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <ProjectProvider>
        <Routes>
          <Route element={<MarketingLayout />}>
            <Route index element={<HomePage />} />
            <Route path="designs" element={<DesignsPage />} />
            <Route path="business-types" element={<BusinessTypesPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="start" element={<WizardPage />} />
        </Routes>
        <TalkToCocel />
      </ProjectProvider>
    </BrowserRouter>
  )
}
