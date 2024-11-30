'use client'

import React, {useState} from 'react';
import {usePathname} from 'next/navigation';
import {
    Home,
    ShieldCheck,
    BarChart,
    Settings,
    Menu,
    X
} from 'lucide-react';
import Link from 'next/link';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const currentPath = usePathname();

    const SidebarItem = ({
                             icon: Icon,
                             label,
                             href,
                             isActive,
                             isSidebarOpen
                         }: {
        icon: React.ElementType,
        label: string,
        href: string,
        isActive?: boolean,
        isSidebarOpen: boolean
    }) => (
        <Link
            href={href}
            className={`
            flex items-center p-3 hover:bg-gray-100 rounded-lg
            ${isActive ? 'bg-gray-200 font-semibold' : ''}
        `}
        >
            <Icon className="mr-3 h-5 w-5"/>
            {isSidebarOpen && <span>{label}</span>}
        </Link>
    );

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div
                className={`
                    bg-white border-r transition-all duration-300 
                    ${isSidebarOpen ? 'w-64' : 'w-16'}
                    overflow-hidden
                `}
            >
                <div className="p-4 flex justify-between items-center border-b">
                    {isSidebarOpen && (
                        <h2 className="text-xl font-bold">Fraud Analytics</h2>
                    )}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="ml-auto"
                    >
                        {isSidebarOpen ? <X/> : <Menu/>}
                    </button>
                </div>

                <nav className="p-4 space-y-2">
                    <SidebarItem
                        icon={Home}
                        label="Dashboard"
                        href="/"
                        isActive={currentPath === '/'}
                        isSidebarOpen={isSidebarOpen}
                    />
                    <SidebarItem
                        icon={ShieldCheck}
                        label="Manual check"
                        href="/manual-check"
                        isActive={currentPath === '/manual-check'}
                        isSidebarOpen={isSidebarOpen}

                    />
                    <SidebarItem
                        icon={Settings}
                        label="Settings"
                        href="#"
                        isActive={currentPath === '/settings'}
                        isSidebarOpen={isSidebarOpen}

                    />
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto">
                {/* Top Navigation Bar */}
                <nav className="bg-white border-b p-4 flex justify-end items-center">
                    <div className="flex items-center space-x-4">
                        <button className="hover:bg-gray-300 p-2 rounded-full">
                            <BarChart/>
                        </button>
                        <button className="hover:bg-gray-100 p-2 rounded-full">
                            <Settings/>
                        </button>
                        <img src="https://thispersondoesnotexist.com/" alt="Profile"
                             className="w-10 h-10 rounded-full"/></div>
                </nav>

                {/* Page Content */}
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;