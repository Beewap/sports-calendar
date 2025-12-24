import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

import { useData } from '../contexts/DataContext';

export default function StudentModal({ isOpen, onClose, onSave, studentToEdit, teachers }) {
    const { getStudentSessionsDetail } = useData();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        language: 'fr',
        mainTeacherId: '',
        packageType: 'contact',
        packageStartDate: '',
        memberTransitionDate: '',
        manualClassesAdjustment: 0,
        needsProposal: false
    });

    useEffect(() => {
        if (studentToEdit) {
            setFormData({
                firstName: studentToEdit.firstName || '',
                lastName: studentToEdit.lastName || '',
                email: studentToEdit.email || '',
                language: studentToEdit.language || 'fr',
                mainTeacherId: studentToEdit.mainTeacherId || '',
                packageType: studentToEdit.packageType || 'contact',
                packageStartDate: studentToEdit.packageStartDate || '',
                memberTransitionDate: studentToEdit.memberTransitionDate || '',
                manualClassesAdjustment: studentToEdit.manualClassesAdjustment || 0,
                needsProposal: studentToEdit.needsProposal || false
            });
        } else {
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                language: 'fr',
                mainTeacherId: '',
                packageType: 'contact',
                packageStartDate: '',
                memberTransitionDate: '',
                manualClassesAdjustment: 0,
                needsProposal: false
            });
        }
    }, [studentToEdit, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    const handleDelete = () => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élève ?')) {
            onSave(null);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">
                        {studentToEdit ? 'Modifier l\'élève' : 'Nouvel élève'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* First Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Prénom</label>
                        <input
                            type="text"
                            required
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                    </div>

                    {/* Last Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Nom</label>
                        <input
                            type="text"
                            required
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    {/* Language */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Langue</label>
                        <select
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={formData.language}
                            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        >
                            <option value="fr">Français</option>
                            <option value="en">English</option>
                            <option value="nl">Nederlands</option>
                        </select>
                    </div>

                    {/* Main Teacher */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Coach principal</label>
                        <select
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={formData.mainTeacherId}
                            onChange={(e) => setFormData({ ...formData, mainTeacherId: e.target.value })}
                        >
                            <option value="">Aucun</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Package Type */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Forfait</label>
                        <select
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={formData.packageType}
                            onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                        >
                            <option value="contact">Prise de contact</option>
                            <option value="discovery">Découverte (10€)</option>
                            <option value="pack5">Forfait 5 leçons (50€)</option>
                            <option value="member">Membre (140€)</option>
                            <option value="member_inactive">Membre non-actif</option>
                        </select>
                    </div>

                    {/* Package Start Date (Manual Override) */}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-indigo-700">
                            Date début forfait (Pack 5)
                            <span className="text-xs text-gray-500 ml-2">(Pour correction stats)</span>
                        </label>
                        <input
                            type="date"
                            className="w-full p-2 border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-indigo-50"
                            value={formData.packageStartDate}
                            onChange={(e) => setFormData({ ...formData, packageStartDate: e.target.value })}
                        />
                    </div>

                    {/* Member Transition Date */}
                    {(formData.packageType === 'member' || formData.packageType === 'member_inactive') && (
                        <div>
                            <label className="block text-sm font-medium mb-1 text-purple-700">
                                Date de transition membre
                                <span className="text-xs text-gray-500 ml-2">(Quand il est devenu membre)</span>
                            </label>
                            <input
                                type="date"
                                className="w-full p-2 border border-purple-200 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-purple-50"
                                value={formData.memberTransitionDate}
                                onChange={(e) => setFormData({ ...formData, memberTransitionDate: e.target.value })}
                            />
                            <p className="text-[10px] text-purple-600 mt-1">
                                Avant cette date, l'élève compte comme "Forfait 5" dans les stats. Après, il compte comme "Membre".
                            </p>
                        </div>
                    )}

                    {/* Manual Classes Adjustment */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Ajustement manuel des cours
                            <span className="text-xs text-gray-500 ml-2">(peut être négatif)</span>
                        </label>
                        <input
                            type="number"
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={formData.manualClassesAdjustment}
                            onChange={(e) => setFormData({ ...formData, manualClassesAdjustment: parseInt(e.target.value) || 0 })}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Utilisez ce champ pour ajuster manuellement le nombre de cours complétés (ex: +2 ou -1)
                        </p>
                    </div>

                    {/* Needs Proposal Checkbox */}
                    <div className="flex items-center gap-2 mt-2 p-2 bg-red-50 rounded border border-red-100">
                        <input
                            type="checkbox"
                            id="needsProposal"
                            checked={formData.needsProposal || false}
                            onChange={(e) => setFormData({ ...formData, needsProposal: e.target.checked })}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label htmlFor="needsProposal" className="text-sm font-medium text-red-700">
                            À proposer des dates (Indicateur rouge)
                        </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between gap-2 mt-4">
                        {studentToEdit && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="btn bg-red-500 text-white hover:bg-red-600"
                            >
                                Supprimer
                            </button>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn btn-secondary"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                            >
                                {studentToEdit ? 'Mettre à jour' : 'Créer'}
                            </button>
                        </div>
                    </div>
                </form>

                {/* DEBUG INFO PANEL */}
                {studentToEdit && (
                    <div className="mt-6 p-3 bg-gray-100 rounded border border-gray-200 text-xs text-gray-600">
                        <details>
                            <summary className="cursor-pointer font-bold mb-2">Détails du calcul (Debug)</summary>
                            {(() => {
                                const details = getStudentSessionsDetail(studentToEdit.id);
                                return (
                                    <div className="flex flex-col gap-1">
                                        <div><strong>Total calculé :</strong> {details.total}</div>
                                        <div><strong>Ajustement manuel :</strong> {details.adjustment}</div>
                                        <div><strong>Date début forfait :</strong> {details.startDate || 'Aucune'}</div>
                                        {details.excludedCount > 0 && (
                                            <div className="text-red-600 font-bold mt-1 bg-red-50 p-1 rounded border border-red-200">
                                                ⚠️ {details.excludedCount} session(s) ignorée(s) car avant la date de début du forfait ({details.startDate}).
                                            </div>
                                        )}
                                        <div className="mt-2 text-gray-500 font-semibold border-b pb-1">Sessions comptabilisées :</div>
                                        {details.countedSessions.length === 0 ? (
                                            <div className="italic">Aucune session trouvée</div>
                                        ) : (
                                            <ul className="list-disc pl-4 max-h-32 overflow-auto">
                                                {details.countedSessions.map((s, idx) => (
                                                    <li key={idx}>
                                                        {s.date.split('-').reverse().join('/')} à {s.slot} {teachers.find(t => t.id === s.teacherId)?.name ? `(${teachers.find(t => t.id === s.teacherId)?.name})` : ''}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })()}
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
}
