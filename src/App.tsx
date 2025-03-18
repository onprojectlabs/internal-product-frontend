import { BrowserRouter } from 'react-router-dom'
import { Router } from './Router'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { MeetingsProvider } from './context/MeetingsContext'
import { ClipsProvider } from './context/ClipsContext'
import { ActivityProvider } from './context/ActivityContext'
import { DocumentsProvider } from './context/DocumentsContext'
import { DocumentWebSocketProvider } from './context/DocumentWebSocketContext'
import './App.css'

function App() {
  return (
    <div className="w-full min-h-screen overflow-hidden">
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <MeetingsProvider>
              <DocumentsProvider>
                <DocumentWebSocketProvider>
                  <ClipsProvider>
                    <ActivityProvider>
                      <Router />
                    </ActivityProvider>
                  </ClipsProvider>
                </DocumentWebSocketProvider>
              </DocumentsProvider>
            </MeetingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  )
}

export default App
