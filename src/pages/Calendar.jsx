import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { getMonthDays, isClassDay, toIsoDate, formatMonthYear } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import PlanningSidebar from '../components/PlanningSidebar';
import SessionModal from '../components/SessionModal';

export default function Calendar() {
    const { sessions, teachers, students, addSession, updateSession, deleteSession } = useData();
    const [currentDate, setCurrentDate] = useState(new Date());

    const [modalOpen, setModalOpen] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);

    const days = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());
    const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    const slots = ['18:00', '19:00'];

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const getSession = (dateStr, slot) => {
        return sessions.find(s => s.dateStr === dateStr && s.slot === slot);
    };

    const handleDayClick = (dateStr, hasClassCapa) => {
        // Just opening the first empty slot or asking user? 
        // For simplicity, let's just do nothing generic yet, relying on specific slot clicks
        // But user complained "nothing is clickable". 
        // Let's make the specific slots clickable.
    };

    const handleSlotClick = (e, dateStr, slot, targetStudentId = null) => {
        e.stopPropagation();
        const existing = getSession(dateStr, slot);
        setEditingSlot({ dateStr, slot, existingSession: existing, targetStudentId });
        setModalOpen(true);
    };

    const handleSaveSession = (data) => {
        if (!data) {
            // Handle delete entire session if needed, for legacy, or if empty?
            // Since we handle delete in modal via specialized filtering, data should be { students: ... }
            // But if we return null, it might be a request to delete. 
            // Logic in Modal logic: remove `targetStudent`, save result.
            // If result students is empty, should we delete session? Yes.
            if (editingSlot.existingSession) deleteSession(editingSlot.existingSession.id);
            return;
        }

        const { teacherId, students: sessionStudents } = data;

        if (sessionStudents.length === 0 && editingSlot.existingSession) {
            deleteSession(editingSlot.existingSession.id);
        } else if (editingSlot.existingSession) {
            updateSession(editingSlot.existingSession.id, {
                teacherId,
                students: sessionStudents
            });
        } else {
            addSession({
                dateStr: editingSlot.dateStr,
                slot: editingSlot.slot,
                teacherId,
                students: sessionStudents
            });
        }
    };

    return (
        <div className="flex h-full overflow-hidden">
            <div className="flex flex-col flex-1 h-full overflow-hidden">
                <div className="flex justify-between items-center mb-6 px-4 pt-4">
                    <h2 className="text-2xl font-bold capitalize">{formatMonthYear(currentDate)}</h2>
                    <div className="flex gap-2">
                        <button onClick={prevMonth} className="btn btn-secondary p-2"><ChevronLeft size={20} /></button>
                        <button onClick={nextMonth} className="btn btn-secondary p-2"><ChevronRight size={20} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-gray-50 border-t border-gray-200">
                    <div className="calendar-grid h-full">
                        {/* Headers */}
                        {weekDays.map(d => (
                            <div key={d} className="bg-gray-50 p-2 text-center text-sm font-semibold text-gray-500 uppercase tracking-wide sticky top-0 z-10 border-b border-gray-200">
                                {d}
                            </div>
                        ))}

                        {/* Days */}
                        {days.map((d, i) => {
                            const dateStr = toIsoDate(d.date);
                            const isToday = dateStr === toIsoDate(new Date());
                            const isCourseDay = isClassDay(d.date);

                            return (
                                <div
                                    key={i}
                                    className={`
                                    calendar-day
                                    ${!d.isCurrentMonth ? 'other-month' : ''}
                                    ${isCourseDay && d.isCurrentMonth ? 'course-day' : ''}
                                `}
                                >
                                    <div className={`
                                    text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1
                                    ${isToday ? 'bg-indigo-600 text-white' : ''}
                                `}>
                                        {d.date.getDate()}
                                    </div>

                                    {isCourseDay && d.isCurrentMonth && (
                                        <div className="flex flex-col gap-1 flex-1">
                                            {slots.map(slot => {
                                                const session = getSession(dateStr, slot);
                                                const teacher = session ? teachers.find(t => t.id === session.teacherId) : null;

                                                // Normalize students list
                                                let sessionStudents = [];
                                                if (session) {
                                                    if (session.students) {
                                                        sessionStudents = session.students.map(stu => {
                                                            const s = students.find(ref => ref.id === stu.id);
                                                            return s ? { ...s, status: stu.status, teacherId: stu.teacherId } : null;
                                                        }).filter(Boolean);
                                                    } else if (session.studentIds) {
                                                        sessionStudents = session.studentIds.map(id => {
                                                            const s = students.find(ref => ref.id === id);
                                                            return s ? { ...s, status: session.status || 'proposed' } : null;
                                                        }).filter(Boolean);
                                                    }
                                                }

                                                return (
                                                    <div
                                                        key={slot}
                                                        className={`
                                                        slot-card relative
                                                        ${session ? 'bg-white border-gray-200' : 'slot-empty'}
                                                    `}
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-xs font-bold mt-0.5">{slot}</span>

                                                            {/* Add Button */}
                                                            <button
                                                                onClick={(e) => handleSlotClick(e, dateStr, slot, null)} // Null target = Add Mode
                                                                className="hover:bg-indigo-50 p-0.5 rounded text-indigo-500 transition-colors"
                                                                title="Ajouter un élève"
                                                            >
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>

                                                        {session && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {sessionStudents.map(s => {
                                                                    // Determine badge class based on status and individual teacher assignment
                                                                    let badgeClass = 'badge-student';
                                                                    if (s.status === 'confirmed') {
                                                                        badgeClass += s.teacherId ? ' confirmed' : ' confirmed-no-coach';
                                                                    } else if (s.status === 'cancelled') {
                                                                        badgeClass += ' cancelled line-through opacity-50 bg-gray-100 text-gray-500 border-gray-300';
                                                                    } else {
                                                                        badgeClass += ' proposed';
                                                                    }

                                                                    return (
                                                                        <button
                                                                            key={s.id}
                                                                            onClick={(e) => handleSlotClick(e, dateStr, slot, s.id)}
                                                                            className={badgeClass}
                                                                        >
                                                                            {s.firstName} {s.lastName?.charAt(0)}.
                                                                        </button>
                                                                    );
                                                                })}
                                                                {sessionStudents.length === 0 && (
                                                                    <span className="text-[10px] text-gray-300 italic">Vide</span>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Teacher Dot (Indicator) */}
                                                        {session && teacher && (
                                                            <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full opacity-50" style={{ backgroundColor: teacher.color }}></div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {modalOpen && (
                    <SessionModal
                        isOpen={modalOpen}
                        onClose={() => setModalOpen(false)}
                        onSave={handleSaveSession}
                        date={editingSlot ? editingSlot.dateStr : ''}
                        timeSlot={editingSlot?.slot}
                        teachers={teachers}
                        students={students}
                        initialData={editingSlot?.existingSession}
                        targetStudentId={editingSlot?.targetStudentId}
                    />
                )}
            </div>



            <PlanningSidebar />
        </div >
    );
}
