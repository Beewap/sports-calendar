import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Calendar, UserPlus, Star, Award, TrendingUp } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function Statistics() {
    const { students, sessions } = useData();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(null);

    const allStats = useMemo(() => {
        const statsByMonth = {};

        // Helper to get Year-Month key "YYYY-MM"
        const getMonthKey = (dateStr) => {
            if (!dateStr) return 'Inconnu';
            return dateStr.substring(0, 7); // "2024-12"
        };

        // 1. Identify "New People" (Initiations/Discoveries) via First Session ever
        const studentFirstSession = {};

        sessions.forEach(s => {
            if (s.students) {
                s.students.forEach(stu => {
                    if (!studentFirstSession[stu.id] || s.dateStr < studentFirstSession[stu.id]) {
                        studentFirstSession[stu.id] = s.dateStr;
                    }
                });
            }
        });

        // 2. Aggregate New Students by Month of their First Session
        Object.keys(studentFirstSession).forEach(studentId => {
            const date = studentFirstSession[studentId];
            const key = getMonthKey(date);

            if (!statsByMonth[key]) statsByMonth[key] = {
                sessions: 0,
                lessonParticipations: 0,
                newStudents: 0,
                newPacks: 0,
                newMembers: 0,
                revenue: 0,
                studentDetails: { discoveries: [], pack5: [], members: [] }
            };
            statsByMonth[key].newStudents++;

            // Add student to discoveries list
            const student = students.find(s => s.id === parseInt(studentId));
            if (student) {
                statsByMonth[key].studentDetails.discoveries.push({
                    id: student.id,
                    firstName: student.firstName,
                    lastName: student.lastName
                });
            }
        });

        // 3. Aggregate New Subscriptions (Pack 5 and Members)
        students.forEach(s => {
            // Helper to initialize month if missing
            const ensureMonth = (dateStr) => {
                if (!dateStr) return null;
                const key = getMonthKey(dateStr);
                if (!statsByMonth[key]) {
                    statsByMonth[key] = {
                        sessions: 0,
                        lessonParticipations: 0,
                        newStudents: 0,
                        newPacks: 0,
                        newMembers: 0,
                        revenue: 0,
                        studentDetails: { discoveries: [], pack5: [], members: [] }
                    };
                }
                return key;
            };

            // 3a. Handle Pack 5 (either current type or previous state of a member)
            if (s.packageStartDate) {
                // If they are pack5 OR if they are member but have a memberTransitionDate 
                // (implies they were pack5 before)
                if (s.packageType === 'pack5' || (s.packageType === 'member' && s.memberTransitionDate)) {
                    const key = ensureMonth(s.packageStartDate);
                    if (key) {
                        statsByMonth[key].newPacks++;
                        statsByMonth[key].studentDetails.pack5.push({
                            id: s.id,
                            firstName: s.firstName,
                            lastName: s.lastName
                        });
                    }
                }
            }

            // 3b. Handle Member Transition
            if (s.packageType === 'member') {
                // Use memberTransitionDate if available, otherwise fallback to packageStartDate
                const transitionDate = s.memberTransitionDate || s.packageStartDate;
                if (transitionDate) {
                    const key = ensureMonth(transitionDate);
                    if (key) {
                        statsByMonth[key].newMembers++;
                        statsByMonth[key].studentDetails.members.push({
                            id: s.id,
                            firstName: s.firstName,
                            lastName: s.lastName
                        });
                    }
                }
            }
        });

        // 4. Count sessions and lesson participations
        sessions.forEach(s => {
            const key = getMonthKey(s.dateStr);
            if (!statsByMonth[key]) statsByMonth[key] = {
                sessions: 0,
                lessonParticipations: 0,
                newStudents: 0,
                newPacks: 0,
                newMembers: 0,
                revenue: 0,
                studentDetails: { discoveries: [], pack5: [], members: [] }
            };
            statsByMonth[key].sessions++;

            // Count student participations (1 élève = 1 leçon)
            if (s.students) {
                statsByMonth[key].lessonParticipations += s.students.length;
            }
        });

        // 5. Calculate Revenue for each month
        Object.keys(statsByMonth).forEach(key => {
            const data = statsByMonth[key];
            data.revenue = (data.newStudents * 10) + (data.newPacks * 50) + (data.newMembers * 140);
        });

        // 6. Calculate Yearly Stats
        const statsByYear = {};

        Object.entries(statsByMonth).forEach(([key, data]) => {
            const year = key.split('-')[0];
            if (!statsByYear[year]) statsByYear[year] = {
                sessions: 0,
                lessonParticipations: 0,
                newStudents: 0,
                newPacks: 0,
                newMembers: 0,
                revenue: 0
            };

            statsByYear[year].sessions += data.sessions;
            statsByYear[year].lessonParticipations += data.lessonParticipations;
            statsByYear[year].newStudents += data.newStudents;
            statsByYear[year].newPacks += data.newPacks;
            statsByYear[year].newMembers += data.newMembers;
            statsByYear[year].revenue += data.revenue;
        });

        // Sort months descending (newest first)
        const monthly = Object.entries(statsByMonth)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([key, data]) => {
                const [year, month] = key.split('-');
                const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('fr-FR', { month: 'short' });
                return {
                    key,
                    year: parseInt(year),
                    month: parseInt(month),
                    monthName: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                    label: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                    ...data
                };
            });

        // Sort years descending
        const yearly = Object.entries(statsByYear)
            .sort((a, b) => b[0].localeCompare(a[0]))
            .map(([year, data]) => ({
                key: year,
                year: parseInt(year),
                label: `Année ${year}`,
                ...data
            }));

        return { monthly, yearly };

    }, [students, sessions]);

    const { monthly: allMonthly, yearly: yearStats } = allStats;

    // Filter monthly stats by selected year
    const monthlyStats = allMonthly.filter(m => m.year === selectedYear);

    // Get available years
    const availableYears = [...new Set(allMonthly.map(m => m.year))].sort((a, b) => b - a);

    // Get current year stats for KPI cards
    const currentYearStats = yearStats.find(y => y.year === selectedYear) || {
        sessions: 0, lessonParticipations: 0, newStudents: 0, newPacks: 0, newMembers: 0, revenue: 0
    };

    // Prepare chart data (fill missing months with 0)
    const chartData = useMemo(() => {
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
        return months.map((monthName, index) => {
            const monthNum = index + 1;
            const existing = monthlyStats.find(m => m.month === monthNum);
            return {
                month: monthName,
                monthNum,
                lessonParticipations: existing?.lessonParticipations || 0,
                newStudents: existing?.newStudents || 0,
                newPacks: existing?.newPacks || 0,
                newMembers: existing?.newMembers || 0,
                revenue: existing?.revenue || 0,
                discoveryRevenue: existing ? existing.newStudents * 10 : 0,
                pack5Revenue: existing ? existing.newPacks * 50 : 0,
                memberRevenue: existing ? existing.newMembers * 140 : 0,
                studentDetails: existing?.studentDetails || { discoveries: [], pack5: [], members: [] }
            };
        });
    }, [monthlyStats]);

    const handleMonthClick = (data) => {
        // Recharts passes the data differently depending on where you click
        // data could be the payload directly or wrapped in an object
        const monthNum = data?.monthNum || data?.payload?.monthNum;
        if (monthNum) {
            setSelectedMonth(monthNum === selectedMonth ? null : monthNum);
        }
    };

    const selectedMonthData = chartData.find(d => d.monthNum === selectedMonth);

    return (
        <div className="flex flex-col gap-6 h-full p-6 overflow-auto bg-gray-50">
            {/* Header with Year Selector */}
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-gray-800">Statistiques</h2>
                <div className="flex gap-2">
                    {availableYears.map(year => (
                        <button
                            key={year}
                            onClick={() => setSelectedYear(year)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedYear === year
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {year}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    icon={<Calendar size={24} />}
                    label="Leçons totales"
                    value={currentYearStats.lessonParticipations}
                    color="bg-blue-50 text-blue-600"
                />
                <StatCard
                    icon={<UserPlus size={24} />}
                    label="Nouvelles Têtes"
                    value={currentYearStats.newStudents}
                    color="bg-green-50 text-green-600"
                />
                <StatCard
                    icon={<Star size={24} />}
                    label="Forfaits 5"
                    value={currentYearStats.newPacks}
                    color="bg-orange-50 text-orange-600"
                />
                <StatCard
                    icon={<Award size={24} />}
                    label="Nouveaux Membres"
                    value={currentYearStats.newMembers}
                    color="bg-purple-50 text-purple-600"
                />
                <StatCard
                    icon={<TrendingUp size={24} />}
                    label="Revenus totaux"
                    value={`${currentYearStats.revenue} €`}
                    color="bg-indigo-50 text-indigo-600"
                />
            </div>

            {/* Monthly Overview Chart with Student Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Vue mensuelle {selectedYear}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                            />
                            <Legend />
                            <Bar dataKey="lessonParticipations" fill="#3b82f6" name="Leçons" radius={[4, 4, 0, 0]} cursor="pointer" onClick={handleMonthClick} />
                            <Bar dataKey="newStudents" fill="#10b981" name="Initiations" radius={[4, 4, 0, 0]} cursor="pointer" onClick={handleMonthClick} />
                            <Bar dataKey="newPacks" fill="#f59e0b" name="Forfaits 5" radius={[4, 4, 0, 0]} cursor="pointer" onClick={handleMonthClick} />
                            <Bar dataKey="newMembers" fill="#a855f7" name="Membres" radius={[4, 4, 0, 0]} cursor="pointer" onClick={handleMonthClick} />
                        </BarChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-gray-400 mt-2 text-center">Cliquez sur un mois pour voir les détails</p>
                </div>

                <StudentDetailPanel
                    monthData={selectedMonthData}
                    monthName={selectedMonthData?.month}
                />
            </div>

            {/* Revenue Breakdown Chart with Student Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Répartition des revenus par type {selectedYear}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                formatter={(value) => `${value} €`}
                            />
                            <Legend />
                            <Bar dataKey="discoveryRevenue" stackId="a" fill="#10b981" name="Découvertes (10€)" cursor="pointer" onClick={handleMonthClick} />
                            <Bar dataKey="pack5Revenue" stackId="a" fill="#f59e0b" name="Forfaits 5 (50€)" cursor="pointer" onClick={handleMonthClick} />
                            <Bar dataKey="memberRevenue" stackId="a" fill="#a855f7" name="Membres (140€)" radius={[4, 4, 0, 0]} cursor="pointer" onClick={handleMonthClick} />
                        </BarChart>
                    </ResponsiveContainer>
                    <p className="text-xs text-gray-400 mt-2 text-center">Cliquez sur un mois pour voir les détails</p>
                </div>

                <StudentDetailPanel
                    monthData={selectedMonthData}
                    monthName={selectedMonthData?.month}
                />
            </div>

            {/* Yearly Summary Table (Collapsible) */}
            <details className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <summary className="p-4 cursor-pointer font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                    📊 Récapitulatif annuel (toutes les années)
                </summary>
                <table className="w-full text-left">
                    <thead className="bg-indigo-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 font-semibold text-indigo-800">Année</th>
                            <th className="p-4 font-semibold text-indigo-800 text-center">Total Leçons</th>
                            <th className="p-4 font-semibold text-indigo-800 text-center">Total Nouveaux Élèves</th>
                            <th className="p-4 font-semibold text-indigo-800 text-center">Total Forfaits 5</th>
                            <th className="p-4 font-semibold text-indigo-800 text-center">Total Nouveaux Membres</th>
                            <th className="p-4 font-semibold text-indigo-800 text-center">Total Revenus</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {yearStats.map((row) => (
                            <tr key={row.key} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-bold text-indigo-900">{row.label}</td>
                                <td className="p-4 text-center font-bold text-gray-800 text-lg">{row.lessonParticipations}</td>
                                <td className="p-4 text-center font-medium text-green-700">{row.newStudents}</td>
                                <td className="p-4 text-center font-medium text-orange-700">{row.newPacks}</td>
                                <td className="p-4 text-center font-medium text-purple-700">{row.newMembers}</td>
                                <td className="p-4 text-center font-bold text-indigo-800 text-lg">{row.revenue} €</td>
                            </tr>
                        ))}
                        {yearStats.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                                    Aucune donnée annuelle.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </details>

            <div className="text-xs text-gray-400 pb-4">
                * Les leçons comptent le nombre de participations d'élèves (1 élève = 1 leçon).<br />
                * Les initiations sont comptabilisées lors de la première séance jamais réalisée par un élève.<br />
                * Les forfaits et membres sont comptabilisés à la date de début de leur forfait actuel.
            </div>
        </div>
    );
}

function StudentDetailPanel({ monthData, monthName }) {
    if (!monthData || !monthName) {
        return (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 flex items-center justify-center">
                <p className="text-gray-400 text-sm text-center">
                    Cliquez sur un mois<br />pour voir les détails
                </p>
            </div>
        );
    }

    const { studentDetails } = monthData;
    const hasData = studentDetails.discoveries.length > 0 ||
        studentDetails.pack5.length > 0 ||
        studentDetails.members.length > 0;

    if (!hasData) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h4 className="font-bold text-gray-800 mb-4">{monthName} - Détails</h4>
                <p className="text-gray-400 text-sm text-center">Aucune donnée pour ce mois</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-auto max-h-[400px]">
            <h4 className="font-bold text-gray-800 mb-4 sticky top-0 bg-white pb-2">{monthName} - Détails</h4>

            {studentDetails.discoveries.length > 0 && (
                <div className="mb-4">
                    <h5 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        Découvertes ({studentDetails.discoveries.length})
                    </h5>
                    <ul className="space-y-1">
                        {studentDetails.discoveries.map(student => (
                            <li key={student.id} className="text-sm text-gray-700 pl-5">
                                • {student.firstName} {student.lastName}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {studentDetails.pack5.length > 0 && (
                <div className="mb-4">
                    <h5 className="text-sm font-semibold text-orange-700 mb-2 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                        Forfaits 5 ({studentDetails.pack5.length})
                    </h5>
                    <ul className="space-y-1">
                        {studentDetails.pack5.map(student => (
                            <li key={student.id} className="text-sm text-gray-700 pl-5">
                                • {student.firstName} {student.lastName}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {studentDetails.members.length > 0 && (
                <div className="mb-4">
                    <h5 className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                        Membres ({studentDetails.members.length})
                    </h5>
                    <ul className="space-y-1">
                        {studentDetails.members.map(student => (
                            <li key={student.id} className="text-sm text-gray-700 pl-5">
                                • {student.firstName} {student.lastName}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, color }) {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-lg ${color}`}>
                {icon}
            </div>
            <div>
                <div className="text-sm text-gray-500 font-medium">{label}</div>
                <div className="text-2xl font-bold text-gray-800">{value}</div>
            </div>
        </div>
    );
}
