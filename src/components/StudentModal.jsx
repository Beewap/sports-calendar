import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function StudentModal({ isOpen, onClose, onSave, studentToEdit, teachers }) {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        language: 'fr',
        mainTeacherId: '',
        packageType: 'contact',
        manualClassesAdjustment: 0
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
                manualClassesAdjustment: studentToEdit.manualClassesAdjustment || 0
            });
        } else {
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                language: 'fr',
                mainTeacherId: '',
                packageType: 'contact',
                manualClassesAdjustment: 0
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
                        </select>
                    </div>

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
            </div>
        </div>
    );
}
