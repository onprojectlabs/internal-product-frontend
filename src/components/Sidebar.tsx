import { Link } from 'react-router-dom';
import { 
  HomeIcon,
  FolderIcon,
  VideoCameraIcon,
  Cog6ToothIcon as CogIcon,
  ClockIcon // Para el registro de actividad
} from '@heroicons/react/24/outline';
import { FileVideo } from 'lucide-react';

const sidebarLinks = [
  {
    name: 'Dashboard',
    to: '/',
    icon: HomeIcon
  },
  {
    name: 'Carpetas',
    to: '/folders',
    icon: FolderIcon
  },
  {
    name: 'Reuniones',
    to: '/meetings',
    icon: VideoCameraIcon
  },
  {
    name: 'Clips',
    to: '/clips',
    icon: FileVideo
  },
  {
    name: 'Integraciones',
    to: '/integrations',
    icon: CogIcon
  }
];

interface SidebarProps {
  onActivityLogClick: () => void;
}

export function Sidebar({ onActivityLogClick }: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4">
        <Link to="/" className="text-xl font-bold text-foreground">
          TL;DV
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2 space-y-1">
        {sidebarLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            className="block w-full p-2 hover:bg-card rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <link.icon className="h-5 w-5" />
              <span>{link.name}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 space-y-1">
        <button className="w-full p-2 hover:bg-card rounded-lg transition-colors">
          <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <CogIcon className="h-5 w-5" />
            <span>Modo oscuro</span>
          </div>
        </button>

        <button 
          onClick={onActivityLogClick}
          className="w-full p-2 hover:bg-card rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ClockIcon className="h-5 w-5" />
            <span>Registro de actividad</span>
          </div>
        </button>
      </div>
    </div>
  );
} 