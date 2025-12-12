import React from 'react';
import { Calendar, Users, Activity } from 'lucide-react';

export function Layout({ currentTab, onTabChange, children }) {
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
                    <div className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                        <div>
                            <div className="text-sm font-medium">Admin User</div>
                            <div className="text-xs text-gray-500">admin@gpe.com</div>
                        </div>
                    </div>
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
