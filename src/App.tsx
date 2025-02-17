import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SidebarLayout } from './layouts/SidebarLayout'
import { UploadPage } from './pages/UploadPage'
import { HomePage } from './pages/HomePage'
import { UploadProvider } from './context/UploadContext'
import { UploadProgressModal } from './components/UploadProgressModal'

function App() {
  return (
    <UploadProvider>
      <Router>
        <SidebarLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/clips" element={<UploadPage />} />
            {/* Add other routes as needed */}
          </Routes>
        </SidebarLayout>
        <UploadProgressModal />
      </Router>
    </UploadProvider>
  )
}

export default App
