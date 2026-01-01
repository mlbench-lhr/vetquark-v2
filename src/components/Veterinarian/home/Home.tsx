// app/page.tsx
import React from 'react';
import Header from './Header';
import SearchBar from './SearchBar';
import StatCard from './StatCard';
import PatientCard from './PatientCard';
import AttendanceChart from './AttendanceChart';
import { Patient } from './types';

const patients: Patient[] = [
    { id: '1', name: 'Cashew', owner: 'Gabriel Bulhões', image: '/logo.png' },
    { id: '2', name: 'Buddy', owner: 'John Silva', image: '/logo.png' },
    { id: '3', name: 'Buddy', owner: 'John Silva', image: '/logo.png' },
    { id: '4', name: 'Buddy', owner: 'John Silva', image: '/logo.png' },
];

export default function Home() {
    return (
        <div className="px-3 py-5">
            <Header userName="Jackson Miro" balance="$ 925,00" />
            <SearchBar />

            <div className="mt-2 grid grid-cols-2 gap-3">
                <StatCard number={3} label="Exams Today" sublabel="1 completed" variant="primary" />
                <StatCard number={6} label="Active Patients" sublabel="+2 new this month" variant="secondary" />
            </div>

            <div className="mt-2">
                <h2 className="text-base font-bold text-gray-800 mb-3">Recent Patients</h2>
                <div className="space-y-3">
                    {patients.map((patient, index) => (
                        <PatientCard key={patient.id} patient={patient} featured={index === 0} />
                    ))}
                </div>

                <button className="w-full mt-4 py-3 bg-primary text-white font-semibold rounded-2xl flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        <path d="M12 8v8m-4-4h8" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    New test
                </button>
            </div>

            <div className="">
                <AttendanceChart
                    months={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                    dogs={[80, 120, 90, 150, 110, 135, 125, 140, 95, 160, 145, 130]}
                    cats={[60, 70, 80, 65, 95, 85, 90, 75, 100, 80, 110, 95]}
                    interactive={true}
                />
            </div>
        </div>
    );
}