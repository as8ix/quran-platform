'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export function useTeacherDashboard() {
    const router = useRouter();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [juzFilter, setJuzFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    
    // Initial user from localStorage to avoid delay
    const [user, setUser] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        }
        return null;
    });
    const [teacherHalaqas, setTeacherHalaqas] = useState([]);
    const [pointsEnabled, setPointsEnabled] = useState(false);

    const getFirstName = (fullName) => {
        if (!fullName) return '';
        return fullName.trim().split(/\s+/)[0];
    };

    const teacherName = user ? `أهلًا ${getFirstName(user.name)} 👋` : 'أهلًا 👋';

    const fetchTeacherData = useCallback(async () => {
        if (!user) return;
        try {
            const halaqasRes = await fetch(`/api/halaqas?teacherId=${user.id}`);
            if (halaqasRes.ok) {
                const myHalaqas = await halaqasRes.json();
                setTeacherHalaqas(myHalaqas);
                setPointsEnabled(myHalaqas.some(h => h.pointsEnabled));
            }
        } catch (error) {
            console.error("Error fetching teacher data:", error);
        }
    }, [user?.id]);

    const fetchStudents = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            let url = '/api/students';
            const params = new URLSearchParams();
            if (juzFilter !== 'all') params.append('juzFilter', juzFilter);
            params.append('teacherId', user.id);
            if (params.toString()) url += `?${params.toString()}`;

            const response = await fetch(url);
            const data = await response.json();
            setStudents(data);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    }, [user?.id, juzFilter]);

    useEffect(() => {
        if (user) {
            // Parallel execution for maximum speed
            Promise.all([fetchTeacherData(), fetchStudents()]);
        }
    }, [user?.id, juzFilter, fetchTeacherData, fetchStudents]);

    const normalizeText = (text) => {
        if (!text) return '';
        let normalized = text.toLowerCase();
        normalized = normalized.replace(/[أإآ]/g, 'ا');
        normalized = normalized.normalize("NFD").replace(/[\u064B-\u065F]/g, "");
        return normalized;
    };

    const filteredStudents = students.filter(student =>
        normalizeText(student.name).includes(normalizeText(searchTerm))
    );

    return {
        router,
        showAddModal,
        setShowAddModal,
        showReportModal,
        setShowReportModal,
        searchTerm,
        setSearchTerm,
        juzFilter,
        setJuzFilter,
        loading,
        students,
        user,
        teacherHalaqas,
        pointsEnabled,
        getFirstName,
        teacherName,
        filteredStudents,
        fetchStudents
    };
}
