import React from 'react';
import { useData } from '../contexts/DataContext';

export default function PlanningSidebar() {
    const { students, sessions, teachers } = useData();

    // Helper to get future sessions (from today)
    const todayStr = new Date().toISOString().split('T')[0];
    const sortedSessions = sessions
        .filter(s => s.dateStr >= todayStr)
        .sort((a, b) => new Date(a.dateStr) - new Date(b.dateStr));

    // 1. Students needing proposal
    const studentsNeedingProposal = students.filter(s => s.needsProposal);

    // Helper to extract session-student items with deduplication support
    const getUniqueItems = (filterFn, existingIds = new Set()) => {
        const items = [];
        const addedIds = new Set(); // Track IDs added in THIS list

        sortedSessions.forEach(session => {
            if (session.students) {
                session.students.forEach(sLink => {
                    if (filterFn(sLink, session)) {
                        const student = students.find(s => s.id === sLink.id);
                        if (student) {
                            // Only add if not already in this specific list
                            if (!addedIds.has(student.id)) {
                                items.push({
                                    session, // We keep the first found session for metadata if needed (e.g. date)
                                    student,
                                    sLink,
                                    count: 1 // Init count
                                });
                                addedIds.add(student.id);
                            } else {
                                // Increment count if already added? 
                                // User said: "affiche le 2x". 
                                // "Si un a 2 ou plusieurs leçons dont une entièrement confirmé... là affiche le 2x" -> implies we should show counts?
                                // "Si un élève a 2 ou plusieurs leçons de prévues et qui est entièrement confirmé... ne l'écrit qu'une seul fois." 
                                // Wait, the user said: "ne l'écrit qu'une seul fois".
                                // And: "Si un a 2 ou plusieurs leçons dont une entièrement confirmé ( vert) et une en attente (jaune), là affiche le 2x." - This implies showing in BOTH lists.
                                // My `getUniqueItems` is separate per list. So "showing in both lists" happens naturally if I don't share exclusion across lists.
                                // The user said: "Lélève apparait 1x par statu de couleur même si plusieurs leçons sont prévues." 
                                // So strictly 1x per list. No "2x" badge needed?
                                // "affiche le 2x" -> This might mean "show it twice" (once in green, once in yellow).
                                // OR it might mean "Show a badge saying '2x'".
                                // "Si un a 2... dont une vert et une jaune, là affiche le 2x."
                                // Context: "Quand un même élève apparait plusieurs fois dans la liste de planification et dans la même couleur, indique seulement une fois."
                                // This implies: Green List -> Student A (once, even if 2 green sessions).
                                // Yellow List -> Student A (once, even if 1 yellow session).
                                // Result: Student A appears in Green AND Yellow. (Total 2x in the sidebar).
                                // OK, so my deduplication logic per list `addedIds` is correct.
                            }
                        }
                    }
                });
            }
        });
        return items;
    };

    // 2. Pending Confirmation (status = 'proposed')
    const pendingConfirmation = getUniqueItems((sLink) => sLink.status === 'proposed');

    // 3. Needs Coach (status = 'confirmed' AND !teacherId)
    const needsCoach = getUniqueItems((sLink) => sLink.status === 'confirmed' && !sLink.teacherId);

    // 4. Confirmed with Coach (status = 'confirmed' AND teacherId)
    const confirmedWithCoach = getUniqueItems((sLink) => sLink.status === 'confirmed' && sLink.teacherId);

    const formatName = (s) => `${s.firstName} ${s.lastName?.charAt(0) || ''}.`;

    return (
        <div className="planning-sidebar bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto h-full flex-none" style={{ width: '16rem', minWidth: '16rem', maxWidth: '16rem' }}>
            <h2 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">Planification</h2>

            <div className="flex flex-col gap-6">

                {/* 1. Need Proposal - RED (studentsNeedingProposal) */}
                {studentsNeedingProposal.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {studentsNeedingProposal.map(s => (
                            <div
                                key={`np-${s.id}`}
                                className="badge-student needs-proposal"
                                title="En attente de date"
                            >
                                {formatName(s)}
                            </div>
                        ))}
                    </div>
                )}

                {/* 2. Pending Confirmation - YELLOW (pendingConfirmation) */}
                {pendingConfirmation.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {pendingConfirmation.map((item, idx) => (
                            <div
                                key={`pc-${item.student.id}`}
                                className="badge-student proposed"
                                title="En attente de confirmation"
                            >
                                {formatName(item.student)}
                            </div>
                        ))}
                    </div>
                )}

                {/* 3. Needs Coach - PURPLE (needsCoach) */}
                {needsCoach.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {needsCoach.map((item, idx) => (
                            <div
                                key={`nc-${item.student.id}`}
                                className="badge-student confirmed-no-coach"
                                title="En attente de coach"
                            >
                                {formatName(item.student)}
                            </div>
                        ))}
                    </div>
                )}

                {/* 4. Confirmed - GREEN (confirmedWithCoach) */}
                {confirmedWithCoach.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {confirmedWithCoach.map((item, idx) => (
                            <div
                                key={`cc-${item.student.id}`}
                                className="badge-student confirmed"
                                title="Confirmé"
                            >
                                {formatName(item.student)}
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {studentsNeedingProposal.length === 0 &&
                    pendingConfirmation.length === 0 &&
                    needsCoach.length === 0 &&
                    confirmedWithCoach.length === 0 && (
                        <span className="text-xs text-gray-400 italic w-full text-center mt-4">
                            Aucune planification en cours
                        </span>
                    )}
            </div>
        </div>
    );
}
