import { PropsWithChildren } from 'react'

export function MainLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container py-4">
          <h1 className="text-xl font-semibold text-gray-900">Your App Name</h1>
        </div>
      </header>
      
      <main>
        <div className="container py-6">
          {children}
        </div>
      </main>
      
      <footer className="bg-white border-t">
        <div className="container py-4">
          <p className="text-sm text-gray-500">© 2024 Your Company. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
} 