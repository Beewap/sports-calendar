import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Mail, Settings } from 'lucide-react';
import StudentModal from '../components/StudentModal';
import TeacherManagerModal from '../components/TeacherManagerModal';

export default function Students() {
    const { students, teachers, getStudentClassesCount, addStudent, updateStudent, deleteStudent, updateTeacher } = useData();
    const [modalOpen, setModalOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState(null);
    const [teacherModalOpen, setTeacherModalOpen] = useState(false);

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

        const today = new Date().toISOString().split('T')[0];
        const updates = { ...data };

        if (studentToEdit) {
            // Check if switching TO pack5 from something else
            // OR if already pack5 but we want to force reset? 
            // The requirement says "prend un forfait de 5 leçons".
            // Typically implies a state change. 
            if (updates.packageType === 'pack5' && studentToEdit.packageType !== 'pack5') {
                updates.packageStartDate = today;
            }
            updateStudent(studentToEdit.id, updates);
        } else {
            if (updates.packageType === 'pack5') {
                updates.packageStartDate = today;
            }
            addStudent(updates);
        }
    };

    // --- Teacher Helper ---
    const getTeacherName = (id) => {
        const t = teachers.find(t => t.id === id);
        return t ? t.name : '-';
    };

    const getPackageBadge = (student) => {
        const count = getStudentClassesCount(student.id);
        const pkg = student.packageType;
        const baseClass = "badge";

        // Handle each package type with proper finished/active states
        switch (pkg) {
            case 'contact':
                return <span className={`${baseClass} badge-contact`}>Prise de contact</span>;

            case 'discovery':
                if (count >= 1) {
                    return <span className={`${baseClass} badge-discovery-finished`}>Découverte (10€) (Terminé)</span>;
                }
                return <span className={`${baseClass} badge-discovery-active`}>Découverte (10€)</span>;

            case 'pack5':
                if (count >= 5) {
                    return <span className={`${baseClass} badge-pack5-finished`}>Forfait (50€) (Terminé)</span>;
                }
                return <span className={`${baseClass} badge-pack5-active`}>Forfait (50€)</span>;

            case 'member':
                return <span className={`${baseClass} badge-member`}>Membre (140€)</span>;

            default:
                return null;
        }
    };

    const getProgress = (student) => {
        if (student.packageType === 'member') return 'Illimité';
        if (student.packageType === 'contact') return '-';
        const limit = student.packageType === 'discovery' ? 1 : 5;
        const count = getStudentClassesCount(student.id);
        return `${count} / ${limit}`;
    };

    const getSortPriority = (student) => {
        const pkg = student.packageType;
        const count = getStudentClassesCount(student.id);

        // 1. Members
        if (pkg === 'member') return 1;

        // 2. Forfait 5 leçons Terminé
        if (pkg === 'pack5' && count >= 5) return 2;

        // 3. Forfait 5 leçons (en cours)
        if (pkg === 'pack5' && count < 5) return 3;

        // 4. Découverte Terminée
        if (pkg === 'discovery' && count >= 1) return 4;

        // 5. Découverte (pas encore effectuée)
        if (pkg === 'discovery' && count < 1) return 5;

        // 6. Prise de contact
        if (pkg === 'contact') return 6;

        return 7; // Fallback
    };

    const sortedStudents = [...students].sort((a, b) => {
        const rankA = getSortPriority(a);
        const rankB = getSortPriority(b);
        if (rankA !== rankB) return rankA - rankB;

        // Alphabetical Sort (First Name)
        return a.firstName.localeCompare(b.firstName);
    });

    // --- Teacher Dashboard Logic ---
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

                {/* LEFT: Student List (3/5) */}
                <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden h-full">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold">Élèves</h3>
                        <button onClick={handleAddClick} className="btn btn-primary">Ajouter un élève</button>
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

                {/* RIGHT: Teacher Panel (2/5) */}
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
                                            {/* Name */}
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }}></div>
                                                    <span className="font-medium text-sm text-gray-800">{t.name}</span>
                                                </div>
                                            </td>

                                            {/* Availability (Mon, Thu, Sat) */}
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

                                            {/* Absences */}
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
        
        /* Membre - Vert */
        .badge-member { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
        
        /* Forfait 5 leçons terminé - Orange */
        .badge-pack5-finished { background: #fed7aa; color: #9a3412; border: 1px solid #fb923c; }
        
        /* Forfait 5 leçons en cours - Orange clair */
        .badge-pack5-active { background: #ffedd5; color: #c2410c; border: 1px solid #fdba74; }
        
        /* Découverte terminée - Rose */
        .badge-discovery-finished { background: #fce7f3; color: #9f1239; border: 1px solid #f9a8d4; }
        
        /* Découverte pas encore effectuée - Bleu clair */
        .badge-discovery-active { background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; }
        
        /* Prise de contact - Violet */
        .badge-contact { background: #f3e8ff; color: #6b21a8; border: 1px solid #d8b4fe; }
        
        .accent-indigo-600 { accent-color: #4f46e5; }
      `}</style>
        </div>
    );
}
