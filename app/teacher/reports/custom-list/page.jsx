'use client';

import { useState, useEffect } from 'react';
import CustomStudentList from '../../../components/CustomStudentList';
import Navbar from '../../../components/Navbar';
import { useRouter } from 'next/navigation';

export default function TeacherCustomListReport() {
    const router = useRouter();
    const [user, setUser] = useState(null);

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
        <CustomStudentList userRole="TEACHER" initialTeacherId={user.id} />
    );
}
