import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

const MOCK_TEACHERS = [
    { id: 't1', name: 'Alice', color: '#fca5a5', availability: { Mon: true, Thu: true }, absences: '' }, // Red-ish
    { id: 't2', name: 'Bob', color: '#93c5fd', availability: { Tue: true, Fri: true }, absences: 'Vacation in July' },   // Blue-ish
    { id: 't3', name: 'Charlie', color: '#86efac', availability: { Wed: true, Sat: true }, absences: '' } // Green-ish
];

const MOCK_STUDENTS = [
    { id: 's1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', language: 'English', mainTeacherId: 't1', packageType: 'pack5', classesTaken: 2 },
    { id: 's2', firstName: 'Marie', lastName: 'Curie', email: 'marie@example.com', language: 'French', mainTeacherId: 't2', packageType: 'member', classesTaken: 15 },
    { id: 's3', firstName: 'Albert', lastName: 'Einstein', email: 'albert@example.com', language: 'German', mainTeacherId: 't1', packageType: 'discovery', classesTaken: 0 },
];

const MOCK_SESSIONS = [
    // Session structure: { id, dateStr: '2023-10-23', slot: '18:00', status: 'confirmed' | 'proposed', teacherId, studentIds: [] }
];

export const DataProvider = ({ children }) => {
    const [students, setStudents] = useState(() => {
        const saved = localStorage.getItem('app_students');
        return saved ? JSON.parse(saved) : MOCK_STUDENTS;
    });

    const [teachers, setTeachers] = useState(() => {
        const saved = localStorage.getItem('app_teachers');
        return saved ? JSON.parse(saved) : MOCK_TEACHERS;
    });

    const [sessions, setSessions] = useState(() => {
        const saved = localStorage.getItem('app_sessions');
        return saved ? JSON.parse(saved) : MOCK_SESSIONS;
    });

    useEffect(() => {
        localStorage.setItem('app_students', JSON.stringify(students));
    }, [students]);

    useEffect(() => {
        localStorage.setItem('app_teachers', JSON.stringify(teachers));
    }, [teachers]);

    useEffect(() => {
        localStorage.setItem('app_sessions', JSON.stringify(sessions));
    }, [sessions]);

    // Utils
    const generateId = () => Math.random().toString(36).substr(2, 9);

    // Actions
    const addStudent = (student) => {
        setStudents(prev => [...prev, { ...student, id: generateId(), classesTaken: 0 }]);
    };

    const updateStudent = (id, updates) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const deleteStudent = (id) => {
        setStudents(prev => prev.filter(s => s.id !== id));
    };

    const addSession = (session) => {
        setSessions(prev => [...prev, { ...session, id: generateId() }]);
    };

    const updateSession = (id, updates) => {
        setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const deleteSession = (id) => {
        setSessions(prev => prev.filter(s => s.id !== id));
    };

    const assignStudentToSession = (sessionId, studentId) => {
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                // Check if already exists (handle both legacy array and new object structure if needed, 
                // but assuming migration/fresh start for simplicity or backward compat check)
                const exists = s.students ? s.students.find(stu => stu.id === studentId) : s.studentIds?.includes(studentId);

                if (exists) return s;

                // New structure uses 'students' array of objects
                const newStudent = { id: studentId, status: 'proposed' };
                const currentStudents = s.students || (s.studentIds ? s.studentIds.map(id => ({ id, status: s.status || 'proposed' })) : []);

                return { ...s, students: [...currentStudents, newStudent] };
            }
            return s;
        }));
    };

    const getStudentClassesCount = (studentId) => {
        const student = students.find(s => s.id === studentId);
        const startDate = student?.packageStartDate;

        return sessions.filter(s => {
            // Check date if startDate exists and package is pack5 (though logic implies we strictly respect the date if present)
            // User asked: "son compteur ... doit retomber à zéro ... et être incrémenté uniquement lorsqu'une séance est confirmée"
            // We'll apply the date filter strictly if it exists.
            if (startDate && s.dateStr < startDate) return false;

            if (s.students) {
                return s.students.some(stu => stu.id === studentId && stu.status === 'confirmed');
            }
            // Fallback for legacy data
            return s.studentIds?.includes(studentId) && s.status === 'confirmed';
        }).length;
    };

    const addTeacher = (teacher) => {
        setTeachers(prev => [...prev, { availability: {}, absences: '', ...teacher, id: generateId() }]);
    };

    const updateTeacher = (id, updates) => {
        setTeachers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const deleteTeacher = (id) => {
        setTeachers(prev => prev.filter(t => t.id !== id));
    };

    return (
        <DataContext.Provider value={{
            students, teachers, sessions,
            addStudent, updateStudent, deleteStudent,
            addTeacher, updateTeacher, deleteTeacher,
            addSession, updateSession, deleteSession, assignStudentToSession,
            getStudentClassesCount
        }}>
            {children}
        </DataContext.Provider>
    );
};
