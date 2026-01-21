'use client';

import Header from '@/components/common/header';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { PatientInfoCard } from '@/components/Veterinarian/home/details/Information';
import Progress from '@/components/Veterinarian/home/details/Progress';

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex gap-3 px-4 mb-4">
      <button
        onClick={() => onTabChange('information')}
        className={`flex-1 py-1 px-6 rounded-full flex justify-center items-center gap-2 font-medium transition-colors ${activeTab === 'information' ? 'bg-[#EBF2FF] text-primary' : 'text-gray-600 bg-[#F5F6F6]'
          }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M9.1665 14.1667H10.8332V9.16675H9.1665V14.1667ZM9.99984 7.50008C10.2359 7.50008 10.434 7.42008 10.594 7.26008C10.754 7.10008 10.8337 6.9023 10.8332 6.66675C10.8326 6.43119 10.7526 6.23342 10.5932 6.07341C10.4337 5.91341 10.2359 5.83342 9.99984 5.83342C9.76373 5.83342 9.56595 5.91341 9.4065 6.07341C9.24706 6.23342 9.16706 6.43119 9.1665 6.66675C9.16595 6.9023 9.24595 7.10036 9.4065 7.26092C9.56706 7.42147 9.76484 7.50119 9.99984 7.50008ZM9.99984 18.3334C8.84706 18.3334 7.76373 18.1145 6.74984 17.6767C5.73595 17.239 4.854 16.6454 4.10401 15.8959C3.354 15.1465 2.76039 14.2645 2.32317 13.2501C1.88595 12.2356 1.66706 11.1523 1.6665 10.0001C1.66595 8.84786 1.88484 7.76453 2.32317 6.75008C2.76151 5.73564 3.35512 4.85369 4.10401 4.10425C4.85289 3.3548 5.73484 2.76119 6.74984 2.32341C7.76484 1.88564 8.84817 1.66675 9.99984 1.66675C11.1515 1.66675 12.2348 1.88564 13.2498 2.32341C14.2648 2.76119 15.1468 3.3548 15.8957 4.10425C16.6446 4.85369 17.2384 5.73564 17.6773 6.75008C18.1162 7.76453 18.3348 8.84786 18.3332 10.0001C18.3315 11.1523 18.1126 12.2356 17.6765 13.2501C17.2404 14.2645 16.6468 15.1465 15.8957 15.8959C15.1446 16.6454 14.2626 17.2392 13.2498 17.6776C12.2371 18.1159 11.1537 18.3345 9.99984 18.3334ZM9.99984 16.6667C11.8609 16.6667 13.4373 16.0209 14.729 14.7292C16.0207 13.4376 16.6665 11.8612 16.6665 10.0001C16.6665 8.13897 16.0207 6.56258 14.729 5.27091C13.4373 3.97925 11.8609 3.33341 9.99984 3.33341C8.13873 3.33341 6.56234 3.97925 5.27067 5.27091C3.979 6.56258 3.33317 8.13897 3.33317 10.0001C3.33317 11.8612 3.979 13.4376 5.27067 14.7292C6.56234 16.0209 8.13873 16.6667 9.99984 16.6667Z"
            fill={activeTab !== 'progress' ? '#3F78D8' : 'black'}
          />
        </svg>
        Information
      </button>
      <button
        onClick={() => onTabChange('progress')}
        className={`flex-1 h-10 px-6 rounded-full flex justify-center items-center gap-2 font-medium transition-colors ${activeTab === 'progress' ? 'bg-[#EBF2FF] text-primary' : 'text-gray-600 bg-[#F5F6F6]'
          }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10.8335 1.69165V3.37498C14.4918 3.82498 17.0835 7.14998 16.6335 10.8083C16.2502 13.8417 13.8668 16.25 10.8335 16.6083V18.275C15.4168 17.8167 18.7502 13.75 18.2918 9.16665C17.9168 5.20832 14.7752 2.08332 10.8335 1.69165ZM9.16683 1.71665C7.54183 1.87498 5.99183 2.49998 4.72516 3.54998L5.91683 4.78332C6.85016 4.03332 7.97516 3.54998 9.16683 3.38332V1.71665ZM3.55016 4.72498C2.50887 5.98983 1.86774 7.53607 1.7085 9.16665H3.37516C3.5335 7.98332 4.00016 6.85832 4.74183 5.91665L3.55016 4.72498ZM12.9168 7.08332L8.85016 11.15L7.0835 9.38332L6.20016 10.2667L8.85016 12.9167L13.8002 7.96665L12.9168 7.08332ZM1.71683 10.8333C1.8835 12.4667 2.52516 14.0083 3.5585 15.275L4.74183 14.0833C4.00587 13.1414 3.53671 12.0188 3.3835 10.8333H1.71683ZM5.91683 15.3083L4.72516 16.45C5.98764 17.502 7.53296 18.1572 9.16683 18.3333V16.6667C7.98131 16.5134 6.85879 16.0443 5.91683 15.3083Z"
            fill={activeTab === 'progress' ? '#3F78D8' : 'black'}
          />
        </svg>
        Progress
      </button>
    </div>
  );
};

export default function Page() {
  const [activeTab, setActiveTab] = useState('information');
  const params = useParams<{ pet_id: string }>();
  const petId = params?.pet_id;

  const [pet, setPet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!petId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/pet/get_pet_details?petId=${encodeURIComponent(petId)}`);
        const data = await res.json();
        if (res.ok) {
          setPet(data.item);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [petId]);

  const petData = useMemo(() => {
    const dob = pet?.dateOfBirth ? new Date(pet.dateOfBirth) : null;
    const now = new Date();
    const ageYears =
      dob && !Number.isNaN(dob.getTime())
        ? Math.max(
          0,
          now.getFullYear() -
          dob.getFullYear() -
          (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0)
        )
        : null;

    return {
      name: pet?.animalName ?? '',
      type: pet?.species ?? '',
      breed: pet?.breed ?? '',
      image: pet?.photo,
      sex: pet?.sex ?? '',
      age: ageYears === null ? '' : `${ageYears} years`,
      gender: pet?.sex ?? '',
    };
  }, [pet]);

  return (
    <div className="pb-5">
      <Header title="Pet Profile" />
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      {loading ? (
        <div className="px-4 text-tertiary text-sm">Loading...</div>
      ) : activeTab === 'information' ? (
        <PatientInfoCard {...petData} />
      ) : (
        <Progress />
      )}
    </div>
  );
}

