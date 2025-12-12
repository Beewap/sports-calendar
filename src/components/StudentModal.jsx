import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function StudentModal({ isOpen, onClose, onSave, studentToEdit, teachers }) {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        language: 'French',
        mainTeacherId: '',
        packageType: 'discovery'
    });

    useEffect(() => {
        if (studentToEdit) {
            setFormData(studentToEdit);
        } else {
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                language: 'French',
                mainTeacherId: '',
                packageType: 'discovery'
            });
        }
    }, [studentToEdit, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">
                        {studentToEdit ? 'Modifier l\'élève' : 'Nouvel Élève'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Prénom</label>
                            <input
                                required
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Nom</label>
                            <input
                                required
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Langue</label>
                        <select
                            value={formData.language}
                            onChange={e => setFormData({ ...formData, language: e.target.value })}
                        >
                            <option value="French">Français</option>
                            <option value="English">Anglais</option>
                            <option value="German">Allemand</option>
                            <option value="Spanish">Espagnol</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Coach Principal</label>
                        <select
                            value={formData.mainTeacherId}
                            onChange={e => setFormData({ ...formData, mainTeacherId: e.target.value })}
                        >
                            <option value="">Sélectionner un coach</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Forfait</label>
                        <select
                            value={formData.packageType}
                            onChange={e => setFormData({ ...formData, packageType: e.target.value })}
                        >
                            <option value="contact">Prise de contact</option>
                            <option value="discovery">Découverte (10€)</option>
                            <option value="pack5">Forfait (50€)</option>
                            <option value="member">Membre (140€)</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        {studentToEdit && (
                            <button
                                type="button"
                                onClick={() => { onSave(null); onClose(); }} // Null sends delete signal
                                className="btn bg-red-50 text-red-600 hover:bg-red-100 border-none mr-auto"
                            >
                                Supprimer
                            </button>
                        )}
                        <button type="button" onClick={onClose} className="btn btn-secondary">Annuler</button>
                        <button type="submit" className="btn btn-primary">Enregistrer</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
