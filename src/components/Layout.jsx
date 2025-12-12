import React from 'react';
import { Calendar, Users, Activity } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Layout({ currentTab, onTabChange, children }) {
    const { user, logout } = useAuth();
    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                        <Activity size={20} />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800">GPE</h1>
                </div>

                <nav className="flex-1 p-4 flex flex-col gap-2">
                    <button
                        onClick={() => onTabChange('calendar')}
                        className={`btn justify-start w-full ${currentTab === 'calendar' ? 'btn-primary' : 'text-gray-500 hover:bg-gray-50 bg-white border-transparent'}`}
                    >
                        <Calendar size={20} />
                        Calendrier
                    </button>

                    <button
                        onClick={() => onTabChange('students')}
                        className={`btn justify-start w-full ${currentTab === 'students' ? 'btn-primary' : 'text-gray-500 hover:bg-gray-50 bg-white border-transparent'}`}
                    >
                        <Users size={20} />
                        Élèves
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-100">
                    {user && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                    {user.email[0].toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                    <div className="text-sm font-medium truncate">{user.email}</div>
                                    <div className="text-xs text-gray-500">Admin</div>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 text-left"
                            >
                                Déconnexion
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <main className="container mx-auto p-6 h-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
