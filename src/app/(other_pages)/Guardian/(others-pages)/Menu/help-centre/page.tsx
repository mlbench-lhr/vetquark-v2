'use client'

import { useMemo, useState } from "react";
import { Bell, ChevronDown, ChevronLeft, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";

function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="relative flex items-center justify-center px-4 pt-6">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="absolute left-4 top-6 flex h-10 w-10 items-center justify-center rounded-full"
      >
        <ChevronLeft className="h-6 w-6 text-[#111827]" />
      </button>
      <div className="text-[16px] font-medium leading-[20px] text-[#111827]">{title}</div>
      <button
        type="button"
        aria-label="Notifications"
        className="absolute right-4 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F6F6]"
      >
        <Bell className="h-5 w-5 text-[#111827]" />
      </button>
    </div>
  );
}

type FaqItem = {
  q: string;
  a: string;
};

export default function Page() {
  const router = useRouter();
  const faqs = useMemo<FaqItem[]>(
    () => [
      {
        q: "Where can I view the test report?",
        a: "You can view all reports on the History screen. The most recent report also appears on the home screen.",
      },
      { q: 'What does "Attention" mean in the result?', a: "" },
      { q: "How do I switch pets to view the results?", a: "" },
      { q: "I can't open the PDF of the report.", a: "" },
    ],
    [],
  );

  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [feedback, setFeedback] = useState("");

  return (
    <div className="min-h-screen bg-white">
      <PageHeader title="Help Centre" onBack={() => router.back()} />

      <div className="px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+18px)]">
        <div>
          <div className="text-[16px] font-semibold leading-[20px] text-[#111827]">
            Urine Collection Guide
          </div>
          <div className="mt-2 text-[14px] leading-[18px] text-[#9AA4AF]">
            See the step-by-step process for collecting the sample at home.
          </div>

          <button
            type="button"
            onClick={() => router.push("/Guardian/Menu/help-centre/urine-collection-guide")}
            className="mt-4 h-[44px] w-full rounded-full bg-[#3F78D8] text-[14px] font-medium text-white"
          >
            View Step By Step
          </button>
        </div>

        <div className="mt-5 h-[8px] w-full bg-[#F5F6F6]" />

        <div className="pt-5">
          <div className="text-[16px] font-semibold leading-[20px] text-[#111827]">Quick questions</div>

          <div className="mt-4 space-y-3">
            {faqs.map((item, idx) => {
              const open = openIndex === idx;
              const canExpand = item.a.trim().length > 0;
              return (
                <button
                  key={item.q}
                  type="button"
                  onClick={() => {
                    if (!canExpand) return;
                    setOpenIndex(open ? null : idx);
                  }}
                  className="w-full rounded-[12px] bg-[#F5F6F6] px-4 py-3 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[14px] font-medium leading-[18px] text-[#111827]">
                      {item.q}
                    </div>
                    {open ? (
                      <ChevronUp className="mt-[2px] h-5 w-5 flex-shrink-0 text-[#9AA4AF]" />
                    ) : (
                      <ChevronDown className="mt-[2px] h-5 w-5 flex-shrink-0 text-[#9AA4AF]" />
                    )}
                  </div>

                  {open ? (
                    <div className="mt-2 text-[12px] leading-[16px] text-[#9AA4AF]">{item.a}</div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-[16px] font-semibold leading-[20px] text-[#111827]">App Support</div>
          <div className="mt-2 text-[14px] leading-[18px] text-[#9AA4AF]">
            System status: All services online.
          </div>

          <button
            type="button"
            className="mt-4 h-[44px] w-full rounded-full bg-[#3F78D8] text-[14px] font-medium text-white"
          >
            Problemas comuns (Login, PDF)
          </button>
          <button
            type="button"
            className="mt-3 h-[44px] w-full rounded-full bg-[#3F78D8] text-[14px] font-medium text-white"
          >
            Privacidade e Conta
          </button>

          <div className="mt-3 text-[12px] leading-[16px] text-[#9AA4AF]">
            App version: 1.0.0 (Build 20240526)
          </div>
        </div>

        <div className="mt-6">
          <div className="text-[16px] font-semibold leading-[20px] text-[#111827]">Feedback</div>
          <div className="mt-2 text-[14px] leading-[18px] text-[#9AA4AF]">
            Your opinion is important to us!
          </div>

          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Leave your suggestion or report a problem..."
            className="mt-4 h-[120px] w-full resize-none rounded-[16px] bg-[#F5F6F6] px-4 py-4 text-[14px] leading-[18px] text-[#111827] placeholder:text-[#9AA4AF] outline-none"
          />

          <button
            type="button"
            className="mt-4 h-[52px] w-full rounded-full bg-[#3F78D8] text-[15px] font-medium text-white"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
