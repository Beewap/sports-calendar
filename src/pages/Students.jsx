import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Mail, Settings, Search } from 'lucide-react';
import { toIsoDate } from '../utils/dateUtils';
import StudentModal from '../components/StudentModal';
import TeacherManagerModal from '../components/TeacherManagerModal';

export default function Students() {
    const { students, teachers, getStudentClassesCount, getStudentSessionsDetail, addStudent, updateStudent, deleteStudent, updateTeacher } = useData();
    const [modalOpen, setModalOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState(null);
    const [teacherModalOpen, setTeacherModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- Student Handlers ---
    const handleAddClick = () => {
        setStudentToEdit(null);
        setModalOpen(true);
    };

    const handleRowClick = (student) => {
        setStudentToEdit(student);
        setModalOpen(true);
    };

    const handleSave = (data) => {
        if (!data) {
            if (studentToEdit) deleteStudent(studentToEdit.id);
            return;
        }

        const now = new Date();
        const today = toIsoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));

        const updates = { ...data };

        // Logic to auto-set packageStartDate if not provided manually
        const isTrackedPackage = ['pack5', 'member'].includes(updates.packageType);

        if (isTrackedPackage && !updates.packageStartDate) {
            if (!studentToEdit || studentToEdit.packageType !== updates.packageType) {
                updates.packageStartDate = today;
            }
        }

        if (studentToEdit) {
            updateStudent(studentToEdit.id, updates);
        } else {
            addStudent(updates);
        }
    };

    // --- Teacher Helper ---
    const getTeacherName = (id) => {
        const t = teachers.find(t => t.id === id);
        return t ? t.name : '-';
    };

    // --- Date & Status Helpers ---

    const getPastClassesCount = (studentId) => {
        const details = getStudentSessionsDetail(studentId);
        const today = toIsoDate(new Date());
        return details.countedSessions.filter(s => s.date < today).length;
    };

    const getEffectiveStartDate = (student) => {
        if (student.packageStartDate) return student.packageStartDate;

        const details = getStudentSessionsDetail(student.id);
        const sorted = [...details.countedSessions].sort((a, b) => a.date.localeCompare(b.date));

        if (sorted.length >= 2) {
            return sorted[1].date; // 2nd lesson
        }
        if (sorted.length === 1) {
            return sorted[0].date; // 1st lesson fallback
        }
        return null;
    };

    const isDateOlderThan = (dateStr, months) => {
        if (!dateStr) return false;
        const start = new Date(dateStr);
        const deadline = new Date();
        deadline.setMonth(deadline.getMonth() - months);
        // Start < Deadline means Start is OLDER than X months ago
        return start < deadline;
    };

    const getDiscoveryStatus = (student) => {
        const details = getStudentSessionsDetail(student.id);
        if (details.countedSessions.length === 0) return 'future';

        const today = toIsoDate(new Date());
        const pastSessions = details.countedSessions.filter(s => s.date < today);

        if (pastSessions.length > 0) {
            const lastSessionDate = pastSessions[0].date;
            if (isDateOlderThan(lastSessionDate, 3)) return 'inactive';
            return 'finished';
        }
        return 'future';
    };

    const getPackageBadge = (student) => {
        const pkg = student.packageType;
        const baseClass = "badge";
        const pastCount = getPastClassesCount(student.id);

        if (pkg === 'member') return <span className={`${baseClass} badge-member`}>Membre (140€)</span>;
        if (pkg === 'member_inactive') return <span className={`${baseClass} badge-member-inactive`}>Membre (Non-actif)</span>;
        if (pkg === 'contact') return <span className={`${baseClass} badge-contact`}>Prise de contact</span>;

        if (pkg === 'pack5') {
            const startDate = getEffectiveStartDate(student);

            // 2. Finished
            if (pastCount >= 5) {
                if (isDateOlderThan(startDate, 5)) {
                    // 8. Finished but Old (more than 5 months)
                    return <span className={`${baseClass} badge-pack5-expired`}>Forfait Dépassé (plus de 5 mois)</span>;
                }
                // 2. Finished Standard
                return <span className={`${baseClass} badge-pack5-finished`}>Forfait (50€) (Terminé)</span>;
            }

            // Unfinished
            if (isDateOlderThan(startDate, 3)) {
                // 8. Unfinished but Expired (more than 3 months)
                return <span className={`${baseClass} badge-pack5-expired`}>Forfait Dépassé (plus de 3 mois)</span>;
            }

            // 3. Active
            return <span className={`${baseClass} badge-pack5-active`}>Forfait (50€)</span>;
        }

        if (pkg === 'discovery') {
            const status = getDiscoveryStatus(student);
            if (status === 'inactive') return <span className={`${baseClass} badge-discovery-inactive`}>Découverte (Inactif)</span>;
            if (status === 'finished') return <span className={`${baseClass} badge-discovery-finished`}>Découverte (10€) (Terminé)</span>;
            return <span className={`${baseClass} badge-discovery-active`}>Découverte (10€)</span>;
        }

        return null;
    };

    const getProgress = (student) => {
        if (student.packageType === 'member') return 'Illimité';
        if (student.packageType === 'member_inactive') return '-';
        if (student.packageType === 'contact') return '-';
        const limit = student.packageType === 'discovery' ? 1 : 5;
        const count = getStudentClassesCount(student.id);
        const pastCount = getPastClassesCount(student.id);

        if (student.packageType === 'pack5' && pastCount >= 5) {
            return <span className="text-green-600 font-bold">{pastCount} / {limit} (Terminé)</span>;
        }

        return `${count} / ${limit}`;
    };

    const getSortPriority = (student) => {
        const pkg = student.packageType;
        const pastCount = getPastClassesCount(student.id);

        if (pkg === 'member') return 1;

        if (pkg === 'pack5') {
            const startDate = getEffectiveStartDate(student);
            if (!startDate) return 3;

            const isStartOld3 = isDateOlderThan(startDate, 3);
            const isStartOld5 = isDateOlderThan(startDate, 5);

            if (pastCount >= 5) {
                if (isStartOld5) return 8;
                return 2;
            } else {
                if (isStartOld3) return 8;
                return 3;
            }
        }

        const discStatus = getDiscoveryStatus(student);

        if (pkg === 'discovery' && discStatus === 'finished') return 4;
        if (pkg === 'discovery' && discStatus === 'future') return 5;
        if (pkg === 'contact') return 6;
        if (pkg === 'member_inactive') return 7;
        if (pkg === 'discovery' && discStatus === 'inactive') return 9;

        return 99;
    };

    const sortedStudents = [...students].sort((a, b) => {
        const rankA = getSortPriority(a);
        const rankB = getSortPriority(b);
        if (rankA !== rankB) return rankA - rankB;
        return a.firstName.localeCompare(b.firstName);
    }).filter(s =>
        s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleAvailability = (teacher, day) => {
        const current = teacher.availability || {};
        const updated = { ...current, [day]: !current[day] };
        updateTeacher(teacher.id, { availability: updated });
    };

    const handleAbsenceChange = (teacher, value) => {
        updateTeacher(teacher.id, { absences: value });
    };

    return (
        <div className="flex flex-col gap-6 h-full">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Planning</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 flex-1 overflow-hidden h-full">
                <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden h-full">
                    <div className="flex justify-between items-center gap-4">
                        <h3 className="text-xl font-bold">Élèves</h3>
                        <div className="flex-1 max-w-sm relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Rechercher un élève..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button onClick={handleAddClick} className="btn btn-primary shrink-0">Ajouter un élève</button>
                    </div>

                    <div className="card h-full overflow-hidden flex flex-col">
                        <div className="overflow-auto flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="p-4 font-semibold text-sm text-muted">Élève</th>
                                        <th className="p-4 font-semibold text-sm text-muted">Coach</th>
                                        <th className="p-4 font-semibold text-sm text-muted">Progression</th>
                                        <th className="p-4 font-semibold text-sm text-muted">Forfait</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedStudents.map(student => (
                                        <tr
                                            key={student.id}
                                            className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => handleRowClick(student)}
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                                                        {student.firstName[0]}{student.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm">{student.firstName} {student.lastName}</div>
                                                        <div className="text-xs text-muted flex items-center gap-1"><Mail size={10} /> {student.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-xs px-2 py-1 rounded bg-gray-100 font-medium text-gray-700 border border-gray-200">
                                                    {getTeacherName(student.mainTeacherId)}
                                                </span>
                                            </td>
                                            <td className="p-4 font-medium text-sm">
                                                {getProgress(student)}
                                            </td>
                                            <td className="p-4">
                                                {getPackageBadge(student)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden h-full">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold">Professeurs</h3>
                        <button onClick={() => setTeacherModalOpen(true)} className="btn btn-secondary text-sm px-2 py-1">
                            <Settings size={14} /> Gérer
                        </button>
                    </div>

                    <div className="card h-full overflow-hidden flex flex-col bg-white">
                        <div className="overflow-auto flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white z-10 border-b border-gray-100">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase">Nom</th>
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase text-center">Disponibilités</th>
                                        <th className="p-4 text-xs font-bold text-gray-400 uppercase">Absences</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teachers.map(t => (
                                        <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }}></div>
                                                    <span className="font-medium text-sm text-gray-800">{t.name}</span>
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {[
                                                        { id: 'Mon', label: 'Lundi' },
                                                        { id: 'Thu', label: 'Jeudi' },
                                                        { id: 'Sat', label: 'Samedi' }
                                                    ].map(day => {
                                                        const isAvail = t.availability?.[day.id];
                                                        return (
                                                            <button
                                                                key={day.id}
                                                                onClick={() => toggleAvailability(t, day.id)}
                                                                className={`day-toggle-btn ${isAvail ? 'active' : ''}`}
                                                                title={`Gérer ${day.label}`}
                                                            >
                                                                {day.label}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </td>

                                            <td className="p-4">
                                                <input
                                                    type="text"
                                                    className="w-full text-xs p-2 border rounded bg-gray-50 focus:bg-white transition-colors"
                                                    placeholder="..."
                                                    value={t.absences || ''}
                                                    onChange={(e) => handleAbsenceChange(t, e.target.value)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                    {teachers.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="text-center text-gray-400 italic text-sm p-4">
                                                Aucun professeur. Cliquez sur "Gérer" pour ajouter.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>

            <StudentModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
                studentToEdit={studentToEdit}
                teachers={teachers}
            />

            <TeacherManagerModal
                isOpen={teacherModalOpen}
                onClose={() => setTeacherModalOpen(false)}
            />

            <style>{`
        .badge { padding: 4px 8px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; }
        
        .badge-member { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
        .badge-member-inactive { background: #ecfdf5; color: #047857; border: 1px solid #10b981; }

        .badge-pack5-finished { background: #fed7aa; color: #9a3412; border: 1px solid #fb923c; }
        .badge-pack5-active { background: #ffedd5; color: #c2410c; border: 1px solid #fdba74; }
        
        /* Orange Clair (Pale) for Expired/Inactif */
        .badge-pack5-expired { background: #fff7ed; color: #ea580c; border: 1px solid #fdba74; }

        .badge-discovery-finished { background: #fce7f3; color: #9f1239; border: 1px solid #f9a8d4; }
        .badge-discovery-active { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
        
        /* Bleu Clair (Pale) for Inactive Discovery */
        .badge-discovery-inactive { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
        
        .badge-contact { background: #f3e8ff; color: #6b21a8; border: 1px solid #d8b4fe; }
        
        .accent-indigo-600 { accent-color: #4f46e5; }
      `}</style>
        </div>
    );
}
