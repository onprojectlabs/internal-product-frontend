import { PropsWithChildren } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  FolderIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PuzzlePieceIcon,
  AcademicCapIcon,
  FilmIcon,
  UserGroupIcon,
  HomeIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', icon: HomeIcon, href: '/' },
  { name: 'Buscar', icon: MagnifyingGlassIcon, href: '/search' },
  { name: 'Reuniones/Carpetas', icon: FolderIcon, href: '/meetings' },
  { name: 'Meeting templates', icon: DocumentTextIcon, href: '/templates' },
  { name: 'Informes con IA', icon: ChartBarIcon, href: '/ai-reports' },
  { name: 'Integraciones', icon: PuzzlePieceIcon, href: '/integrations' },
  { name: 'Centro de formación', icon: AcademicCapIcon, href: '/training' },
  { name: 'Clips y Reels', icon: FilmIcon, href: '/clips' },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function SidebarLayout({ children }: PropsWithChildren) {
  const location = useLocation()

  return (
    <div className="min-h-screen w-screen bg-white overflow-x-hidden">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-30">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <Link to="/" className="flex h-16 items-center px-4 border-b border-gray-200 hover:bg-gray-50">
            <img src="/logo.svg" alt="TL;DV" className="h-8 w-auto" />
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={classNames(
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-50',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                  )}
                >
                  <item.icon
                    className={classNames(
                      isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 h-5 w-5'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Bottom section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <UserGroupIcon className="h-5 w-5 text-gray-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Invite colleagues</p>
                <button className="text-xs text-primary-600 hover:text-primary-700">
                  Invite now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64 w-full">
        <main className="min-h-screen bg-gray-50 w-full">
          <div className="h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 