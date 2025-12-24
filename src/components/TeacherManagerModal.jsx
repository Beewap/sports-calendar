import React, { useState } from 'react';
import { X, Edit2, Trash2, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export default function TeacherManagerModal({ isOpen, onClose }) {
    const { teachers, addTeacher, updateTeacher, deleteTeacher, fixPackageDates } = useData();
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', color: '#000000' });
    const [isAdding, setIsAdding] = useState(false);

    if (!isOpen) return null;

    const handleEditClick = (t) => {
        setEditingId(t.id);
        setEditForm({ name: t.name, color: t.color });
        setIsAdding(false);
    };

    const handleAddClick = () => {
        setEditingId(null);
        setEditForm({ name: '', color: '#3b82f6' });
        setIsAdding(true);
    };

    const handleSave = () => {
        if (isAdding) {
            addTeacher(editForm);
            setIsAdding(false);
        } else {
            updateTeacher(editingId, editForm);
            setEditingId(null);
        }
    };

    const handleDelete = (id) => {
        if (confirm('Supprimer ce professeur ?')) {
            deleteTeacher(id);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Gérer les Professeurs</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto mb-4">
                    {teachers.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3 border rounded bg-gray-50">
                            {editingId === t.id ? (
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        type="color"
                                        className="w-8 h-8 p-0 border-none rounded cursor-pointer"
                                        value={editForm.color}
                                        onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                                    />
                                    <input
                                        className="flex-1 p-1 text-sm border rounded"
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                    <button onClick={handleSave} className="text-green-600 font-bold text-sm">Enr.</button>
                                    <button onClick={() => setEditingId(null)} className="text-gray-500 text-sm">Annuler</button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: t.color }}></div>
                                        <span className="font-medium">{t.name}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditClick(t)} className="text-gray-500 hover:text-blue-600"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(t.id)} className="text-gray-500 hover:text-red-600"><Trash2 size={16} /></button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                {isAdding ? (
                    <div className="p-3 border rounded bg-blue-50 flex items-center gap-2 mb-4">
                        <input
                            type="color"
                            className="w-8 h-8 p-0 border-none rounded cursor-pointer"
                            value={editForm.color}
                            onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                        />
                        <input
                            className="flex-1 p-1 text-sm border rounded"
                            placeholder="Nom du professeur"
                            value={editForm.name}
                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        />
                        <button onClick={handleSave} className="btn-primary px-3 py-1 text-xs rounded">Ajouter</button>
                        <button onClick={() => setIsAdding(false)} className="text-gray-500 text-xs">Annuler</button>
                    </div>
                ) : (
                    <button onClick={handleAddClick} className="btn btn-secondary w-full border-dashed">
                        <Plus size={16} /> Ajouter un professeur
                    </button>
                )}

                <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Maintenance</h4>
                    <button
                        onClick={() => {
                            if (confirm("Cela va recalculer la date de début de forfait pour tous les élèves non-membres (Session 2 = Début). Continuer ?")) {
                                fixPackageDates();
                            }
                        }}
                        className="w-full text-xs bg-orange-50 text-orange-700 p-2 rounded border border-orange-200 hover:bg-orange-100"
                    >
                        Réparer Dates Forfaits
                    </button>
                    <p className="text-[10px] text-gray-400 mt-1">
                        Recalcule la date de début de forfait pour exclure la 1ère séance (découverte) des packs.
                    </p>
                </div>
            </div>
        </div>
    );
}
