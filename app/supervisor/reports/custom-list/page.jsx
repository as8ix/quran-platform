'use client';

import { useState, useEffect } from 'react';
import CustomStudentList from '../../../components/CustomStudentList';
import Navbar from '../../../components/Navbar';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SupervisorCustomListReport() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState(null);
    
    const teacherIdParam = searchParams.get('teacherId');
    const halaqaIdParam = searchParams.get('halaqaId');

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            router.push('/login');
        }
    }, [router]);

    if (!user) return null;

    return (
        <CustomStudentList 
            userRole="SUPERVISOR" 
            initialTeacherId={teacherIdParam} 
            initialHalaqaId={halaqaIdParam} 
        />
    );
}
