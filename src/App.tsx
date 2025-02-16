import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'

function Home() {
  return (
    <div className="prose">
      <h1>Welcome to Your App</h1>
      <p>This is a starter template using React, TypeScript, and Tailwind CSS.</p>
    </div>
  )
}

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </MainLayout>
    </Router>
  )
}

export default App
