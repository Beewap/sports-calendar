import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const DataContext = createContext();

// DataContext v2.0 - Fix applied
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
                    teacherId: session.teacher_id, // Keep for backward compatibility
                    students: session.students.map(link => ({
                        id: link.student_id,
                        status: link.status,
                        teacherId: link.teacher_id // Individual teacher per student
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
            package_start_date: studentData.packageStartDate || null,
            manual_classes_adjustment: studentData.manualClassesAdjustment || 0
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
        if (updates.manualClassesAdjustment !== undefined) dbUpdates.manual_classes_adjustment = updates.manualClassesAdjustment;

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

        if (error) {
            console.error("Error adding session", error);
            return;
        }

        const newSession = data[0];
        let sessionStudents = [];

        // Insert students if any
        if (sessionData.students && sessionData.students.length > 0) {
            const studentInserts = sessionData.students.map(s => ({
                session_id: newSession.id,
                student_id: s.id,
                status: s.status || 'proposed'
            }));

            const { error: stuError } = await supabase.from('session_students').insert(studentInserts);
            if (stuError) console.error("Error adding session students", stuError);
            else sessionStudents = sessionData.students;
        }

        setSessions(prev => [...prev, {
            ...newSession,
            dateStr: newSession.date_str,
            students: sessionStudents
        }]);
    };

    const deleteSession = async (id) => {
        const { error } = await supabase.from('sessions').delete().eq('id', id);
        if (error) console.error("Error deleting session", error);
        else setSessions(prev => prev.filter(s => s.id !== id));
    };

    const updateSession = async (id, updates) => {
        // 1. Update Session Details
        const { data, error } = await supabase.from('sessions').update({
            teacher_id: updates.teacherId
        }).eq('id', id).select();

        if (error) {
            console.error("Error updating session", error);
            return;
        }

        // 2. Sync Students (Full Replace Strategy)
        if (updates.students) {
            // Delete existing
            await supabase.from('session_students').delete().eq('session_id', id);

            // Insert new
            if (updates.students.length > 0) {
                const studentInserts = updates.students.map(s => ({
                    session_id: id,
                    student_id: s.id,
                    status: s.status || 'proposed'
                }));
                await supabase.from('session_students').insert(studentInserts);
            }
        }

        // 3. Update Local State
        setSessions(prev => prev.map(s => s.id === id ? {
            ...s,
            teacherId: updates.teacherId, // Update teacher
            students: updates.students || s.students // Update students if provided
        } : s));
    };

    const assignStudentToSession = async (sessionId, studentId) => {
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

    const getStudentClassesCount = (studentId) => {
        const student = students.find(s => s.id === studentId);
        if (!student) return 0;

        const startDate = student?.package_start_date; // snake_case from DB
        const manualAdjustment = student?.manual_classes_adjustment || 0;

        const calculated = sessions.filter(s => {
            // s.dateStr is normalized in useEffect
            if (startDate && s.dateStr < startDate) return false;

            if (s.students) {
                return s.students.some(stu => stu.id === studentId && stu.status === 'confirmed');
            }
            return false;
        }).length;

        return calculated + manualAdjustment;
    };

    return (
        <DataContext.Provider value={{
            students: students.map(s => ({
                ...s,
                firstName: s.first_name,
                lastName: s.last_name,
                mainTeacherId: s.main_teacher_id,
                packageType: s.package_type,
                packageStartDate: s.package_start_date,
                manualClassesAdjustment: s.manual_classes_adjustment
            })),
            teachers,
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
