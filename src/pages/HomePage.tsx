import { Link } from 'react-router-dom'
import {
  FilmIcon,
  FolderIcon,
  DocumentTextIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

const quickActions = [
  {
    name: 'Clips y Reels',
    description: 'Sube y gestiona tus videos y audios',
    href: '/clips',
    icon: FilmIcon,
    color: 'bg-indigo-500',
  },
  {
    name: 'Reuniones',
    description: 'Accede a tus reuniones y carpetas',
    href: '/meetings',
    icon: FolderIcon,
    color: 'bg-green-500',
  },
  {
    name: 'Templates',
    description: 'Gestiona las plantillas de reuniones',
    href: '/templates',
    icon: DocumentTextIcon,
    color: 'bg-yellow-500',
  },
  {
    name: 'Informes',
    description: 'Visualiza informes con IA',
    href: '/ai-reports',
    icon: ChartBarIcon,
    color: 'bg-purple-500',
  },
]

export function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bienvenido a tu Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gestiona tus archivos multimedia y reuniones desde un solo lugar
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.name}
            to={action.href}
            className="relative group bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <div className={`${action.color} rounded-lg p-3 inline-flex`}>
              <action.icon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900">
                {action.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {action.description}
              </p>
            </div>
            <span
              className="absolute inset-0 rounded-lg ring-2 ring-offset-2 ring-transparent group-hover:ring-primary-500"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="mt-12">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Actividad reciente</h2>
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-center text-gray-500">
              <p>No hay actividad reciente para mostrar</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 