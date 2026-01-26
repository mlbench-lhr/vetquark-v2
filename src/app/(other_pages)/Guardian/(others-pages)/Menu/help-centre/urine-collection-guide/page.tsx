'use client'

import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronLeft,
  Check,
  Download,
  Info,
  Thermometer,
} from "lucide-react";
import Header from "@/components/common/header";

function Step({
  index,
  title,
  body,
}: {
  index: number;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl bg-[#F5F6F6] px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 flex items-center justify-center rounded-full bg-[#3F78D8] text-white text-[14px] font-semibold">
          {index}
        </div>
        <div className="w-[calc(100%-36px)]">
          <div className="text-[15px] font-semibold leading-[20px] text-[#111827]">{title}</div>
          <div className="mt-1 text-[13px] leading-[18px] text-[#9AA4AF]">{body}</div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <Header title="Urine Collection Guide" />

      <div className="mx-auto w-full px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+18px)]">
        <div>
          <div className="text-[22px] font-semibold leading-[26px] text-[#111827]">
            How to Collect Urine at Home
          </div>
          <div className="mt-2 text-[14px] leading-[18px] text-[#9AA4AF]">
            Simple step-by-step guide for pet owners
          </div>
        </div>

        <div className="mt-4 h-[1px] w-full bg-[#E5E7EB]" />

        <div className="pt-5">
          <div className="text-[16px] font-semibold leading-[20px] text-[#111827]">Step-by-Step</div>
          <div className="mt-3 space-y-3">
            <Step
              index={1}
              title="Prepare the Materials"
              body="Use a clean, wide-mouthed container (saucer or scoop) and a sterile collection bottle from a pharmacy or clinic."
            />
            <Step
              index={2}
              title="Wait for the Right Moment"
              body="Collect the first urine of the morning, as it is more concentrated and ideal for testing."
            />
            <Step
              index={3}
              title="Position Your Pet"
              body="Take your pet to the place where they usually urinate to reduce stress."
            />
            <Step
              index={4}
              title="Collect the Sample"
              body="Place the container under your pet and collect the midstream urine & discard the beginning and end of urination to avoid contamination."
            />
            <Step
              index={5}
              title="Transfer & Label"
              body="Transfer the urine into the collection bottle and seal it tightly & label with pet’s name and date/ time of collection."
            />
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-[#EBF2FF] px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-[12px] bg-white flex items-center justify-center relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <g clipPath="url(#clip0_1027_4567)">
                  <path d="M9.99566 18.3253C14.596 18.3253 18.3253 14.596 18.3253 9.99566C18.3253 5.39532 14.596 1.66602 9.99566 1.66602C5.39532 1.66602 1.66602 5.39532 1.66602 9.99566C1.66602 14.596 5.39532 18.3253 9.99566 18.3253Z" stroke="#3F78D8" strokeWidth="1.66593" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9.99561 4.99805V9.99583L13.3275 11.6618" stroke="#3F78D8" strokeWidth="1.66593" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <defs>
                  <clipPath id="clip0_1027_4567">
                    <rect width="19.9911" height="19.9911" fill="white" />
                  </clipPath>
                </defs>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none" className="absolute bottom-1 right-1 bg-white rounded-full">
                <g clipPath="url(#clip0_1027_4571)">
                  <path d="M5.83236 11.6644L5.10319 10.2061L3.49902 10.4977" stroke="#3F78D8" strokeWidth="1.16638" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5.83236 2.33301L5.10319 3.79134L3.49902 3.49967" stroke="#3F78D8" strokeWidth="1.16638" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8.16455 11.6644L8.89372 10.2061L10.4979 10.4977" stroke="#3F78D8" strokeWidth="1.16638" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8.16455 2.33301L8.89372 3.79134L10.4979 3.49967" stroke="#3F78D8" strokeWidth="1.16638" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9.91436 12.2472L8.16479 8.74805H5.83203" stroke="#3F78D8" strokeWidth="1.16638" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9.91412 1.75L8.16455 5.24914L9.03934 6.99871" stroke="#3F78D8" strokeWidth="1.16638" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M1.1665 6.99859H4.95724L5.83202 5.24902" stroke="#3F78D8" strokeWidth="1.16638" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11.6641 5.83203L10.7891 6.9987L11.6641 8.16536" stroke="#3F78D8" strokeWidth="1.16638" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12.8301 6.99805H9.03934L8.16455 8.74762" stroke="#3F78D8" strokeWidth="1.16638" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2.33252 5.83203L3.20752 6.9987L2.33252 8.16536" stroke="#3F78D8" strokeWidth="1.16638" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4.08252 12.2468L5.83209 8.74762L4.9573 6.99805" stroke="#3F78D8" strokeWidth="1.16638" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4.08252 1.75L5.83209 5.24914H8.16485" stroke="#3F78D8" strokeWidth="1.16638" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <defs>
                  <clipPath id="clip0_1027_4571">
                    <rect width="13.9965" height="13.9965" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div className="w-[calc(100%-36px)]">
              <div className="text-[15px] font-semibold leading-[20px] text-[#111827]">Storage Instructions</div>
              <div className="mt-1 text-[13px] leading-[18px] text-[#9AA4AF]">
                The sample should be taken to the clinic within <span className="font-semibold text-[#111827]">2 hours</span>. If this is not possible, refrigerate it in the fridge for a maximum of 12 hours.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-[#EBF2FF] px-4 py-4">
          <div className="text-[15px] font-semibold leading-[20px] text-[#111827]">Useful Tips</div>
          <div className="mt-3 space-y-2">
            {[
              "Have everything ready before starting",
              "Avoid contamination with water, feces, soil, or cleaning products",
              "For cats: use hydrophobic litter or an empty clean litter box",
              "Confine cats in a bathroom if needed",
              "If collection fails, contact your veterinarian for alternatives",
            ].map((tip) => (
              <div key={tip} className="flex items-start gap-2">
                <Check className="mt-[2px] h-4 w-4 text-[#3F78D8]" />
                <div className="text-[13px] leading-[18px] text-[#111827]">{tip}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-[#FFFBEB] px-4 py-4">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <g clipPath="url(#clip0_1027_4627)">
                <path d="M9.99566 18.3253C14.596 18.3253 18.3253 14.596 18.3253 9.99566C18.3253 5.39532 14.596 1.66602 9.99566 1.66602C5.39532 1.66602 1.66602 5.39532 1.66602 9.99566C1.66602 14.596 5.39532 18.3253 9.99566 18.3253Z" stroke="#FE9A00" strokeWidth="1.66593" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.99561 13.327V9.99512" stroke="#FE9A00" strokeWidth="1.66593" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.99561 6.66406H10.0039" stroke="#FE9A00" strokeWidth="1.66593" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <defs>
                <clipPath id="clip0_1027_4627">
                  <rect width="19.9911" height="19.9911" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold leading-[20px] text-[#111827]">Important</div>
              <div className="mt-1 text-[13px] leading-[18px] text-[#111827]">
                This guide is for informational purposes only. Always follow your veterinarian’s instructions.
              </div>
              <div className="mt-1 text-[13px] leading-[18px] text-[#9AA4AF]">If unsure, contact your clinic.</div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            className="h-[44px] w-full rounded-full bg-[#3F78D8] text-[14px] font-medium text-white flex items-center justify-center gap-2"
          >
            <Download className="h-5 w-5" />
            Download Guide (PDF)
          </button>
        </div>

      </div>
    </div>
  );
}
