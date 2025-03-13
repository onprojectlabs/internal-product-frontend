import { Link } from 'react-router-dom';
import { 
  VideoCameraIcon,
  FolderPlusIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

interface QuickAction {
  id: string;
  name: string;
  type: 'meeting' | 'folder' | 'upload';
  to: string;
}

const actions: QuickAction[] = [
  {
    id: '1',
    name: 'Subir reunión o clip',
    type: 'upload',
    to: '/upload'
  },
  {
    id: '2',
    name: 'Crear nueva carpeta',
    type: 'folder',
    to: '/new-folder'
  },
  {
    id: '3',
    name: 'Programar reunión',
    type: 'meeting',
    to: '/schedule'
  }
];

const getActionIcon = (type: QuickAction['type']) => {
  switch (type) {
    case 'upload':
      return <ArrowUpTrayIcon className="h-5 w-5" />;
    case 'folder':
      return <FolderPlusIcon className="h-5 w-5" />;
    case 'meeting':
      return <VideoCameraIcon className="h-5 w-5" />;
  }
};

export function QuickActions() {
  return (
    <div className="space-y-2">
      {actions.map(action => (
        <Link
          key={action.id}
          to={action.to}
          className="group w-full flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
        >
          <span className="text-muted-foreground group-hover:text-primary transition-colors">
            {getActionIcon(action.type)}
          </span>
          <span className="text-muted-foreground group-hover:text-primary transition-colors">
            {action.name}
          </span>
        </Link>
      ))}
    </div>
  );
} 