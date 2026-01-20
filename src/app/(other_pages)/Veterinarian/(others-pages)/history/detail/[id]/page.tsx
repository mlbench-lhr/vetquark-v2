'use client'
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type ReportStatus = "signed" | "pending";

type ReportHistoryItem = {
  id: string;
  color: string;
  patientName: string;
  guardianName: string;
  dateLabel: string;
  status: ReportStatus;
  avatarSrc: string;
  line: any,
  percentage: number
};

function ReportCard({ item }: { item: ReportHistoryItem }) {
  return (
    <div className="bg-white px- py-4 border-t px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 justify-between w-full">
          <div className="flex min-w-0 items-center gap-2 justify-start">
            <div className="h-2 w-2  rounded-full" style={{ backgroundColor: item.color }}> </div>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium text-gray-900">
                {item.patientName}
              </p>
              <p className="truncate text-[12px] text-gray-400">
                {item.guardianName}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-4">
            {item.line}
            <div className="min-w-0 text-end">
              <div className="flex justify-start items-center gap-1">
                <p className="truncate text-[14px] font-medium " style={{ color: item.color }}>
                  Abnormal              </p>
              </div>
              <p className="truncate text-[12px] text-gray-500">
                3.5 %
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function Page() {
  const router = useRouter()
  const physicalItems: ReportHistoryItem[] = [
    {
      id: "1",
      color: "#F59E0B",
      patientName: "Color",
      guardianName: "Normal: Pale Yellow",
      dateLabel: "22/05/2024",
      percentage: 0,
      status: "signed",
      line: <svg xmlns="http://www.w3.org/2000/svg" width="62" height="26" viewBox="0 0 62 26" fill="none">
        <path d="M1 24.9949L15.9968 16.9966L30.9936 8.99829L45.9904 4.19932L60.9872 1" stroke="#F59E0B" stroke-width="1.99957" stroke-linecap="round" stroke-linejoin="round" />
      </svg>,
      avatarSrc: "/images/product/product-01.jpg",
    },
    {
      id: "2",
      color: "#10B981",
      patientName: "Clarity",
      guardianName: "Normal: Clear",
      dateLabel: "22/05/2024",
      percentage: 0,
      status: "signed",
      line: <svg xmlns="http://www.w3.org/2000/svg" width="62" height="25" viewBox="0 0 62 25" fill="none">
        <path d="M1 23.9951H15.9968H30.9936H45.9904H60.9872" stroke="#10B981" stroke-width="1.99957" stroke-linecap="round" stroke-linejoin="round" />
      </svg>,
      avatarSrc: "/images/product/product-01.jpg",
    },
    {
      id: "1",
      color: "#F59E0B",
      patientName: "Color",
      guardianName: "Normal: Pale Yellow",
      dateLabel: "22/05/2024",
      percentage: 0,
      status: "signed",
      line: <svg xmlns="http://www.w3.org/2000/svg" width="62" height="26" viewBox="0 0 62 26" fill="none">
        <path d="M1 24.9949L15.9968 16.9966L30.9936 8.99829L45.9904 4.19932L60.9872 1" stroke="#F59E0B" stroke-width="1.99957" stroke-linecap="round" stroke-linejoin="round" />
      </svg>,
      avatarSrc: "/images/product/product-01.jpg",
    },
    {
      id: "2",
      color: "#10B981",
      patientName: "Clarity",
      guardianName: "Normal: Clear",
      dateLabel: "22/05/2024",
      percentage: 0,
      status: "signed",
      line: <svg xmlns="http://www.w3.org/2000/svg" width="62" height="25" viewBox="0 0 62 25" fill="none">
        <path d="M1 23.9951H15.9968H30.9936H45.9904H60.9872" stroke="#10B981" stroke-width="1.99957" stroke-linecap="round" stroke-linejoin="round" />
      </svg>,
      avatarSrc: "/images/product/product-01.jpg",
    },
  ];
  const items: ReportHistoryItem[] = [
    {
      id: "1",
      color: "#F59E0B",
      patientName: "Color",
      guardianName: "Normal: Pale Yellow",
      dateLabel: "22/05/2024",
      percentage: 0,
      status: "signed",
      line: <svg xmlns="http://www.w3.org/2000/svg" width="62" height="26" viewBox="0 0 62 26" fill="none">
        <path d="M1 24.9949L15.9968 16.9966L30.9936 8.99829L45.9904 4.19932L60.9872 1" stroke="#F59E0B" stroke-width="1.99957" stroke-linecap="round" stroke-linejoin="round" />
      </svg>,
      avatarSrc: "/images/product/product-01.jpg",
    },
    {
      id: "2",
      color: "#10B981",
      patientName: "Clarity",
      guardianName: "Normal: Clear",
      dateLabel: "22/05/2024",
      percentage: 0,
      status: "signed",
      line: <svg xmlns="http://www.w3.org/2000/svg" width="62" height="25" viewBox="0 0 62 25" fill="none">
        <path d="M1 23.9951H15.9968H30.9936H45.9904H60.9872" stroke="#10B981" stroke-width="1.99957" stroke-linecap="round" stroke-linejoin="round" />
      </svg>,
      avatarSrc: "/images/product/product-01.jpg",
    },
    {
      id: "1",
      color: "#F59E0B",
      patientName: "Color",
      guardianName: "Normal: Pale Yellow",
      dateLabel: "22/05/2024",
      percentage: 0,
      status: "signed",
      line: <svg xmlns="http://www.w3.org/2000/svg" width="62" height="26" viewBox="0 0 62 26" fill="none">
        <path d="M1 24.9949L15.9968 16.9966L30.9936 8.99829L45.9904 4.19932L60.9872 1" stroke="#F59E0B" stroke-width="1.99957" stroke-linecap="round" stroke-linejoin="round" />
      </svg>,
      avatarSrc: "/images/product/product-01.jpg",
    },
    {
      id: "2",
      color: "#10B981",
      patientName: "Clarity",
      guardianName: "Normal: Clear",
      dateLabel: "22/05/2024",
      percentage: 0,
      status: "signed",
      line: <svg xmlns="http://www.w3.org/2000/svg" width="62" height="25" viewBox="0 0 62 25" fill="none">
        <path d="M1 23.9951H15.9968H30.9936H45.9904H60.9872" stroke="#10B981" stroke-width="1.99957" stroke-linecap="round" stroke-linejoin="round" />
      </svg>,
      avatarSrc: "/images/product/product-01.jpg",
    },
  ];

  return (
    <div className="min-h-[100dvh] w-full bg-white">
      <div className="mx-auto w-full pb-6 pt-[calc(env(safe-area-inset-top)+20px)]">
        <div className="flex items-center justify-between">
          <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => router.back()}>
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-base font-medium text-gray-900">Report Details</h1>
          <button className="w-12 h-0  bg-gray-100 rounded-full flex items-center justify-center">

          </button>
        </div>


        <div className="mt-5 rounded-[16px] bg-[#F5F6F6">
          <h1 className="px-4 text-base font-medium text-gray-900 mb-4">Physical Parameters</h1>
          {physicalItems.map((item) => (
            <ReportCard key={item.id} item={item} />
          ))}
        </div>
        <div className="mt-2 rounded-[16px] bg-[#F5F6F6">
          <h1 className="px-4 text-base font-medium text-gray-900 mb-4">Chemical Parameters</h1>
          {items.map((item) => (
            <ReportCard key={item.id} item={item} />
          ))}
        </div>
        <div className="mt-2 rounded-[16px] bg-[#F5F6F6">
          <h1 className="px-4 text-base font-medium text-gray-900 mb-4">Microscopic Parameters</h1>
          {items.map((item) => (
            <ReportCard key={item.id} item={item} />
          ))}
        </div>
        <div className="w-full bg-red-30 flex justify-start items-start flex-col gap-0 px-4">
          <h1 className="text-[18px] font-medium">Veterinary Report</h1>
          <h2 className="text-[14px] font-normal">Summary and Interpretation</h2>
          <p className="text-[14px] font-normal text-black/60">The patient shows changes suggestive of proteinuria and hematuria. Correlation with physical examination is recommended and, if necessary, complementary tests such as abdominal ultrasound and sedimentation analysis for better investigation of the causes.</p>
          <p className="text-[14px] font-normal">The interpretation of the report is a support tool and does not replace the clinical assessment of the responsible veterinarian.</p>
          <span className="text-[14px] font-normal mt-3">Other Information</span>
          <div className="w-full text-[16px] font-normal bg-[#F5F6F6] rounded-[12px] p-4 mt-1">Other Information</div>
          <span className="text-[14px] font-normal mt-3">Veterinarian&apos;s Notes</span>
          <div className="w-full text-[16px] font-normal bg-[#F5F6F6] rounded-[12px] p-4 mt-1">need checkup next month</div>

        </div>
        <div className="bg-[#F5F6F6] w-full h-4 mt-4"></div>
        <div className="w-full bg-red-30 flex justify-start items-center flex-col gap-0 px-4">
          <h1 className="text-[18px] font-medium">Dr. Vet</h1>
          <h2 className="text-[14px] font-normal">CRMV-SP 12345</h2>
          <p className="text-[14px] font-normal text-black/60">Report generated on 05/12/2025, 11:12:47</p>
        </div>
      </div>
    </div>
  );
}
