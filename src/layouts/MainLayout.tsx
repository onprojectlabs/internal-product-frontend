import { useState } from 'react';
import { Sidebar, SidebarBody, SidebarLink } from '../components/layout/Sidebar';
import { 
    HomeIcon, 
    Puzzle as PuzzleIcon,
    ClockIcon,
    SunIcon,
    MoonIcon,
    Brain,
    FileText,
    LogOut,
    UserIcon
} from 'lucide-react';
import { FileVideo } from 'lucide-react';
import { FolderIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { ActivityLogModal } from '../components/activity/ActivityLogModal';
import { useThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Outlet, Link } from 'react-router-dom';
import { FloatingChat } from '../components/brain/FloatingChat';
import { cn } from '../lib/utils';

export function MainLayout() {
    const [open, setOpen] = useState(false);
    const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
    const { theme, toggleTheme } = useThemeContext();
    const { logout } = useAuth();

    const links = [
        {
            label: "Dashboard",
            href: "/",
            icon: <HomeIcon className="h-5 w-5 flex-shrink-0" />
        },
        {
            label: "Cerebro",
            href: "/brain",
            icon: <Brain className="h-5 w-5 flex-shrink-0" />
        },
        {
            label: "Carpetas",
            href: "/folders",
            icon: <FolderIcon className="h-5 w-5 flex-shrink-0" />
        },
        {
            label: "Reuniones",
            href: "/meetings",
            icon: <VideoCameraIcon className="h-5 w-5 flex-shrink-0" />
        },
        {
            label: "Clips",
            href: "/clips",
            icon: <FileVideo className="h-5 w-5 flex-shrink-0" />
        },
        {
            label: "Documentos",
            href: "/documents",
            icon: <FileText className="h-5 w-5 flex-shrink-0" />
        },
        {
            label: "Integraciones",
            href: "/integrations",
            icon: <PuzzleIcon className="h-5 w-5 flex-shrink-0" />
        }
    ];

    return (
        <div className="h-screen flex bg-background overflow-hidden">
            <div className="flex h-full">
                <Sidebar open={open} setOpen={setOpen}>
                    <SidebarBody className="justify-between gap-10">
                        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                            {/* Logo */}
                            <div className="mb-8">
                                <img src="/logo.svg" alt="Logo" className="h-8 w-auto" />
                            </div>

                            {/* Links */}
                            <div className="flex flex-col gap-2">
                                {links.map((link, idx) => (
                                    <SidebarLink 
                                        key={idx} 
                                        link={link}
                                        className={!open ? "justify-center" : ""}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="mt-auto pt-4 border-t border-border space-y-2 min-h-[100px]">
                            <button
                                onClick={toggleTheme}
                                className={cn(
                                    "p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors w-full",
                                    !open ? "flex justify-center" : "flex items-center gap-2"
                                )}
                            >
                                {theme === 'dark' ? (
                                    <>
                                        <SunIcon className="h-5 w-5 flex-shrink-0" />
                                        <motion.span
                                            animate={{
                                                display: open ? "inline-block" : "none",
                                                opacity: open ? 1 : 0,
                                            }}
                                            className="text-sm"
                                        >
                                            Modo claro
                                        </motion.span>
                                    </>
                                ) : (
                                    <>
                                        <MoonIcon className="h-5 w-5 flex-shrink-0" />
                                        <motion.span
                                            animate={{
                                                display: open ? "inline-block" : "none",
                                                opacity: open ? 1 : 0,
                                            }}
                                            className="text-sm"
                                        >
                                            Modo oscuro
                                        </motion.span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => setIsActivityLogOpen(true)}
                                className={cn(
                                    "p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors w-full",
                                    !open ? "flex justify-center" : "flex items-center gap-2"
                                )}
                            >
                                <ClockIcon className="h-5 w-5 flex-shrink-0" />
                                <motion.span
                                    animate={{
                                        display: open ? "inline-block" : "none",
                                        opacity: open ? 1 : 0,
                                    }}
                                    className="text-sm whitespace-nowrap"
                                >
                                    Registro de actividad
                                </motion.span>
                            </button>

                            <Link 
                                to="/profile"
                                className={cn(
                                    "p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors w-full",
                                    !open ? "flex justify-center" : "flex items-center gap-2"
                                )}
                            >
                                <UserIcon className="h-5 w-5 flex-shrink-0" />
                                <motion.span
                                    animate={{
                                        display: open ? "inline-block" : "none",
                                        opacity: open ? 1 : 0,
                                    }}
                                    className="text-sm whitespace-nowrap"
                                >
                                    Mi perfil
                                </motion.span>
                            </Link>

                            <button
                                onClick={logout}
                                className={cn(
                                    "p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors w-full text-red-600",
                                    !open ? "flex justify-center" : "flex items-center gap-2"
                                )}
                            >
                                <LogOut className="h-5 w-5 flex-shrink-0" />
                                <motion.span
                                    animate={{
                                        display: open ? "inline-block" : "none",
                                        opacity: open ? 1 : 0,
                                    }}
                                    className="text-sm whitespace-nowrap"
                                >
                                    Cerrar sesión
                                </motion.span>
                            </button>
                        </div>
                    </SidebarBody>
                </Sidebar>
            </div>

            <div className="flex-1 overflow-auto bg-background">
                <Outlet />
            </div>

            <ActivityLogModal 
                isOpen={isActivityLogOpen} 
                onClose={() => setIsActivityLogOpen(false)} 
            />

            <FloatingChat />
        </div>
    );
} 