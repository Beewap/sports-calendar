import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function SessionModal({ isOpen, onClose, onSave, date, timeSlot, teachers, students, initialData, targetStudentId }) {
    const { getStudentClassesCount } = useData();
    if (!isOpen) return null;

    // Data normalization
    const existingStudents = initialData?.students
        ? initialData.students
        : (initialData?.studentIds?.map(id => ({ id, status: initialData.status || 'proposed' })) || []);

    const [teacherId, setTeacherId] = useState(initialData?.teacherId || '');
    const [selectedStudents, setSelectedStudents] = useState(existingStudents); // For "Add Mode"
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // If targetStudentId is present, we are in "Edit Single Student" mode
    const isSingleEdit = !!targetStudentId;
    const targetStudent = isSingleEdit ? existingStudents.find(s => s.id === targetStudentId) : null;
    const targetStudentInfo = isSingleEdit ? students.find(s => s.id === targetStudentId) : null;

    const [singleStatus, setSingleStatus] = useState(targetStudent?.status || 'proposed');

    const handleSave = (e) => {
        e.preventDefault();

        if (isSingleEdit) {
            // Update only the target student in the list
            const updatedStudents = existingStudents.map(s =>
                s.id === targetStudentId ? { ...s, status: singleStatus } : s
            );
            onSave({ teacherId, students: updatedStudents });
        } else {
            // Add mode
            onSave({ teacherId, students: selectedStudents });
        }
        onClose();
    };

    const handleDeleteStudent = () => {
        if (isSingleEdit) {
            const updatedStudents = existingStudents.filter(s => s.id !== targetStudentId);
            onSave({ teacherId, students: updatedStudents });
            onClose();
        }
    };

    // Filter for Add Mode
    const filteredStudents = students.filter(s =>
        !selectedStudents.find(sel => sel.id === s.id) &&
        (s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const addStudent = (s) => {
        setErrorMsg('');
        // Check Limit
        const count = getStudentClassesCount(s.id);
        let limit = 9999;
        if (s.packageType === 'discovery') limit = 1;
        else if (s.packageType === 'pack5') limit = 5;

        // Note: We are adding a NEW session here (presumably). 
        // If they are already matched to limit (e.g. 5/5), they cannot add a 6th.
        // If this session is ALREADY one of their sessions (updating), we shouldn't block, 
        // but addStudent is only used for *adding new* selection.

        if (s.packageType !== 'member' && count >= limit) {
            alert(`Impossible d'ajouter ${s.firstName} : Forfait atteint (${count}/${limit}). Veuillez passer en Membre.`);
            return;
        }

        setSelectedStudents([...selectedStudents, { id: s.id, status: 'proposed' }]);
        setSearchTerm('');
    };

    const removeStudentSelection = (id) => {
        setSelectedStudents(selectedStudents.filter(s => s.id !== id));
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">
                        {isSingleEdit
                            ? `Modifier ${targetStudentInfo?.firstName || 'l\'élève'}`
                            : (initialData ? 'Ajouter des élèves' : 'Nouveau Cours')
                        }
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-4 text-sm text-gray-500 font-medium bg-gray-50 p-2 rounded">
                    {date} @ {timeSlot}
                </div>

                <form onSubmit={handleSave} className="flex flex-col gap-4">

                    {/* Teacher Selection (Shared) */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Professeur</label>
                        <div className="flex flex-wrap gap-2">
                            {teachers.map(t => (
                                <div
                                    key={t.id}
                                    onClick={() => setTeacherId(t.id)}
                                    className={`teacher-select-card ${teacherId === t.id ? 'selected' : ''}`}
                                >
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }}></div>
                                    <span className="text-sm font-medium">{t.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* MODE: EDIT SINGLE STUDENT */}
                    {isSingleEdit && targetStudent && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Statut</label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSingleStatus('proposed')}
                                    className={`status-btn proposed ${singleStatus === 'proposed' ? 'active' : ''}`}
                                >
                                    Proposé
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSingleStatus('confirmed')}
                                    className={`status-btn confirmed ${singleStatus === 'confirmed' ? 'active' : ''}`}
                                >
                                    Confirmé
                                </button>
                            </div>
                        </div>
                    )}

                    {/* MODE: ADD STUDENTS */}
                    {!isSingleEdit && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Ajouter des élèves</label>

                            {/* Current Selection (Add Mode) */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                {selectedStudents.map(stu => {
                                    const s = students.find(ref => ref.id === stu.id);
                                    if (!s) return null;
                                    return (
                                        <span key={stu.id} className="student-tag">
                                            {s.firstName}
                                            <button type="button" onClick={() => removeStudentSelection(stu.id)} className="hover:text-indigo-900">
                                                <X size={12} />
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Chercher pour ajouter..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && filteredStudents.length > 0 && (
                                    <div className="search-dropdown">
                                        {filteredStudents.map(s => (
                                            <div
                                                key={s.id}
                                                className="search-item"
                                                onClick={() => addStudent(s)}
                                            >
                                                {s.firstName} {s.lastName}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between mt-4 pt-4 border-t">
                        {isSingleEdit && (
                            <button
                                type="button"
                                onClick={handleDeleteStudent}
                                className="btn bg-red-50 text-red-600 hover:bg-red-100 border-none"
                            >
                                Retirer l'élève
                            </button>
                        )}
                        {!isSingleEdit && <div></div>} {/* Spacer */}

                        <div className="flex gap-2">
                            <button type="button" onClick={onClose} className="btn btn-secondary">Annuler</button>
                            <button type="submit" className="btn btn-primary">{isSingleEdit ? 'Mettre à jour' : 'Enregistrer le cours'}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
