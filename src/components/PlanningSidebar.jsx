import React from 'react';
import { useData } from '../contexts/DataContext';

export default function PlanningSidebar() {
    const { students, sessions, teachers } = useData();

    // Helper to get future sessions (from today)
    // We can show all for now or filter. Let's show all valid sessions for context.
    const sortedSessions = [...sessions].sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr));

    // 1. Students needing proposal
    const studentsNeedingProposal = students.filter(s => s.needsProposal);

    // Helper to extract session-student items
    const getSessionItems = (filterFn) => {
        const items = [];
        sortedSessions.forEach(session => {
            if (session.students) {
                session.students.forEach(sLink => {
                    if (filterFn(sLink, session)) {
                        const student = students.find(s => s.id === sLink.id);
                        if (student) {
                            items.push({
                                session,
                                student,
                                sLink
                            });
                        }
                    }
                });
            }
        });
        return items;
    };

    // 2. Pending Confirmation (status = 'proposed')
    const pendingConfirmation = getSessionItems((sLink) => sLink.status === 'proposed');

    // 3. Needs Coach (status = 'confirmed' AND !teacherId)
    const needsCoach = getSessionItems((sLink) => sLink.status === 'confirmed' && !sLink.teacherId);

    // 4. Confirmed with Coach (status = 'confirmed' AND teacherId)
    const confirmedWithCoach = getSessionItems((sLink) => sLink.status === 'confirmed' && sLink.teacherId);

    const Section = ({ title, count, colorClass, items, type = 'session' }) => (
        <div className="mb-6">
            <h3 className={`font-bold text-sm uppercase tracking-wide mb-2 flex justify-between items-center ${colorClass}`}>
                {title}
                <span className="bg-white px-2 py-0.5 rounded text-xs border">{count}</span>
            </h3>
            <div className="flex flex-col gap-2">
                {items.length === 0 && <span className="text-xs text-gray-400 italic">Aucun élève</span>}

                {type === 'student' && items.map(s => (
                    <div key={s.id} className="bg-white p-2 rounded shadow-sm border-l-4 border-red-500 text-sm">
                        <span className="font-medium">{s.firstName} {s.lastName}</span>
                        <div className="text-xs text-gray-500">{s.packageType}</div>
                    </div>
                ))}

                {type === 'session' && items.map((item, idx) => (
                    <div key={`${item.session.id}-${item.student.id}-${idx}`} className="bg-white p-2 rounded shadow-sm text-sm border border-gray-100">
                        <div className="flex justify-between">
                            <span className="font-bold">{item.student.firstName}</span>
                            <span className="text-xs text-gray-500">{item.session.dateStr}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-600">{item.session.slot}</span>
                            {/* Show assigned teacher if confirmed */}
                            {item.sLink.teacherId && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                                    {teachers.find(t => t.id === item.sLink.teacherId)?.name || 'Inconnu'}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="planning-sidebar bg-gray-50 border-l border-gray-200 w-80 min-w-[320px] p-4 overflow-y-auto h-full hidden md:block">
            <h2 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">Planification</h2>

            {/* 1. Need Proposal - RED */}
            <Section
                title="À Proposer"
                count={studentsNeedingProposal.length}
                colorClass="text-red-600"
                items={studentsNeedingProposal}
                type="student"
            />

            {/* 2. Pending Confirmation - YELLOW */}
            <Section
                title="Attente Confirmation"
                count={pendingConfirmation.length}
                colorClass="text-yellow-600"
                items={pendingConfirmation}
            />

            {/* 3. Needs Coach - PURPLE */}
            <Section
                title="Attente Coach"
                count={needsCoach.length}
                colorClass="text-purple-600"
                items={needsCoach}
            />

            {/* 4. Confirmed - GREEN */}
            <Section
                title="Confirmé"
                count={confirmedWithCoach.length}
                colorClass="text-green-600"
                items={confirmedWithCoach}
            />
        </div>
    );
}
