import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initial Fetch
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [sRes, tRes, sesRes] = await Promise.all([
                    supabase.from('students').select('*'),
                    supabase.from('teachers').select('*'),
                    supabase.from('sessions').select('*, students:session_students(*)')
                ]);

                if (sRes.error) throw sRes.error;
                if (tRes.error) throw tRes.error;
                if (sesRes.error) throw sesRes.error;

                setStudents(sRes.data);
                setTeachers(tRes.data);

                // Format sessions to match expected structure
                const formattedSessions = sesRes.data.map(session => ({
                    ...session,
                    dateStr: session.date_str, // Map snake_case to camelCase
                    students: session.students.map(link => ({
                        id: link.student_id,
                        status: link.status
                    }))
                }));
                setSessions(formattedSessions);

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // --- Actions ---

    // STUDENTS
    const addStudent = async (studentData) => {
        // Map camelCase to snake_case
        const dbData = {
            first_name: studentData.firstName,
            last_name: studentData.lastName,
            email: studentData.email,
            language: studentData.language,
            main_teacher_id: studentData.mainTeacherId || null,
            package_type: studentData.packageType,
            package_start_date: studentData.packageStartDate || null
        };
        const { data, error } = await supabase.from('students').insert([dbData]).select();
        if (error) console.error("Error adding student", error);
        else setStudents(prev => [...prev, data[0]]);
    };

    const updateStudent = async (id, updates) => {
        const dbUpdates = {};
        if (updates.firstName) dbUpdates.first_name = updates.firstName;
        if (updates.lastName) dbUpdates.last_name = updates.lastName;
        if (updates.email) dbUpdates.email = updates.email;
        if (updates.language) dbUpdates.language = updates.language;
        if (updates.mainTeacherId) dbUpdates.main_teacher_id = updates.mainTeacherId;
        if (updates.packageType) dbUpdates.package_type = updates.packageType;
        if (updates.packageStartDate) dbUpdates.package_start_date = updates.packageStartDate;

        const { data, error } = await supabase.from('students').update(dbUpdates).eq('id', id).select();
        if (error) console.error("Error updating student", error);
        else setStudents(prev => prev.map(s => s.id === id ? data[0] : s));
    };

    const deleteStudent = async (id) => {
        const { error } = await supabase.from('students').delete().eq('id', id);
        if (error) console.error("Error deleting student", error);
        else setStudents(prev => prev.filter(s => s.id !== id));
    };

    // TEACHERS
    const addTeacher = async (teacherData) => {
        const { data, error } = await supabase.from('teachers').insert([teacherData]).select();
        if (error) console.error("Error adding teacher", error);
        else setTeachers(prev => [...prev, data[0]]);
    };

    const updateTeacher = async (id, updates) => {
        const { data, error } = await supabase.from('teachers').update(updates).eq('id', id).select();
        if (error) console.error("Error updating teacher", error);
        else setTeachers(prev => prev.map(t => t.id === id ? data[0] : t));
    };

    const deleteTeacher = async (id) => {
        const { error } = await supabase.from('teachers').delete().eq('id', id);
        if (error) console.error("Error deleting teacher", error);
        else setTeachers(prev => prev.filter(t => t.id !== id));
    };

    // SESSIONS
    const addSession = async (sessionData) => {
        const dbData = {
            date_str: sessionData.dateStr,
            slot: sessionData.slot,
            teacher_id: sessionData.teacherId
        };
        const { data, error } = await supabase.from('sessions').insert([dbData]).select();
        if (error) console.error("Error adding session", error);
        else setSessions(prev => [...prev, { ...data[0], dateStr: data[0].date_str, students: [] }]);
    };

    const deleteSession = async (id) => {
        const { error } = await supabase.from('sessions').delete().eq('id', id);
        if (error) console.error("Error deleting session", error);
        else setSessions(prev => prev.filter(s => s.id !== id));
    };

    // Update session generally not used directly for simple properties, mainly for students
    const updateSession = async (id, updates) => {
        // Implement if needed for slot/date changes
    };

    const assignStudentToSession = async (sessionId, studentId) => {
        // Optimistic UI update or wait for DB? Let's do DB first for safety.
        // Check if link exists? Supabase insert might error or duplicate.
        // Schema constraints or logic check needed.

        // Structure: session_students table
        const { data, error } = await supabase.from('session_students').insert([{
            session_id: sessionId,
            student_id: studentId,
            status: 'proposed'
        }]).select();

        if (error) {
            console.error("Error assigning student", error);
            return;
        }

        // Update local state
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                return { ...s, students: [...(s.students || []), { id: studentId, status: 'proposed' }] };
            }
            return s;
        }));
    };

    // Helper functions need to adapt to new snake_case data if accessed directly
    // But we are storing students in state as they come from DB (snake_case properties!)
    // NOTE: This breaks existing components expecting camelCase (firstName, lastName).
    // We MUST normalize data on fetch OR update components. 
    // Plan: Normalize on fetch to keep components happy.

    // RE-IMPLEMENTING FETCH TO NORMALIZE
    // See useEffect above.

    const getStudentClassesCount = (studentId) => {
        const student = students.find(s => s.id === studentId);
        // data coming from Supabase is formatted? 
        // In useEffect, I just setStudents(sRes.data). 
        // Supabase returns keys as in DB (snake_case).
        // Components expect firstName. 
        // FIX: I will add a normalization step in useEffect.

        // For this function logic:
        const startDate = student?.package_start_date; // snake_case from DB

        return sessions.filter(s => {
            // s.dateStr is normalized in useEffect
            if (startDate && s.dateStr < startDate) return false;

            if (s.students) {
                return s.students.some(stu => stu.id === studentId && stu.status === 'confirmed');
            }
            return false;
        }).length;
    };

    return (
        <DataContext.Provider value={{
            students: students.map(s => ({ ...s, firstName: s.first_name, lastName: s.last_name, mainTeacherId: s.main_teacher_id, packageType: s.package_type, packageStartDate: s.package_start_date })), // Auto-mapping for context consumers
            teachers, // Teachers might need mapping if they have snake_case cols? name/color/absences are simple. availability is jsonb.
            sessions,
            loading,
            addStudent, updateStudent, deleteStudent,
            addTeacher, updateTeacher, deleteTeacher,
            addSession, updateSession, deleteSession, assignStudentToSession,
            getStudentClassesCount
        }}>
            {children}
        </DataContext.Provider>
    );
};
