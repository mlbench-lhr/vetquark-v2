'use client';

import React, { useMemo, useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { translateUrinalysisParameterLabel } from '@/lib/urinalysisParameters';

type GlossaryItem = {
  id: string;
  name: string;
  value: string;
  sections: {
    title: string;
    body: string;
  }[];
};

export default function Page() {
  const { t } = useTranslation();
  const items: GlossaryItem[] = useMemo(
    () => [
      {
        id: 'nitrite',
        name: 'Nitrite',
        value: 'Negative',
        sections: [
          { title: 'What is it?', body: 'Nitrite can indicate certain bacterial infections in the urinary tract.' },
          { title: 'Reference Ranges', body: 'Dogs and Cats: Negative is expected.' },
          { title: 'What can influence it?', body: 'Diet, sample handling time, and infections can affect results.' },
          { title: 'When to talk to the veterinarian?', body: 'If positive, discuss possible infection and next steps.' },
        ],
      },
      {
        id: 'blood',
        name: 'Blood',
        value: 'Positive',
        sections: [
          { title: 'What is it?', body: 'Blood in urine may be due to inflammation, infection, stones, or trauma.' },
          { title: 'Reference Ranges', body: 'Dogs and Cats: Negative is expected.' },
          { title: 'What can influence it?', body: 'Exercise, heat cycle, sample contamination, and illness can affect results.' },
          { title: 'When to talk to the veterinarian?', body: 'If positive or persistent, discuss evaluation and confirmatory tests.' },
        ],
      },
      {
        id: 'ketones',
        name: 'Ketones',
        value: 'Negative',
        sections: [
          { title: 'What is it?', body: 'Ketones can appear with fasting, diabetes, or metabolic stress.' },
          { title: 'Reference Ranges', body: 'Dogs and Cats: Negative is expected.' },
          { title: 'What can influence it?', body: 'Fasting, low-carbohydrate intake, vomiting, and uncontrolled diabetes can alter levels.' },
          { title: 'When to talk to the veterinarian?', body: 'If positive, discuss diet, hydration, and metabolic assessment.' },
        ],
      },
      {
        id: 'bilirubin',
        name: 'Bilirubin',
        value: 'Positive',
        sections: [
          { title: 'What is it?', body: 'Bilirubin may indicate liver issues or increased red blood cell breakdown.' },
          { title: 'Reference Ranges', body: 'Dogs: Trace may occur; Cats: Negative is expected.' },
          { title: 'What can influence it?', body: 'Liver disease, hemolysis, and some medications can affect results.' },
          { title: 'When to talk to the veterinarian?', body: 'If positive, discuss liver evaluation and follow-up testing.' },
        ],
      },
      {
        id: 'glucose',
        name: 'Glucose',
        value: 'Negative',
        sections: [
          { title: 'What is it?', body: 'Glucose in urine may suggest elevated blood glucose or kidney tubular changes.' },
          { title: 'Reference Ranges', body: 'Dogs and Cats: Negative is expected.' },
          { title: 'What can influence it?', body: 'Stress, diabetes, and some medications can alter levels.' },
          { title: 'When to talk to the veterinarian?', body: 'If positive, discuss diabetes screening or kidney assessment.' },
        ],
      },
      {
        id: 'leukocytes',
        name: 'Leukocytes',
        value: 'Positive',
        sections: [
          { title: 'What is it?', body: 'Leukocytes can suggest inflammation or infection in the urinary tract.' },
          { title: 'Reference Ranges', body: 'Dogs and Cats: Negative is expected.' },
          { title: 'What can influence it?', body: 'Infections, inflammation, and sample contamination can affect results.' },
          { title: 'When to talk to the veterinarian?', body: 'If positive, discuss symptoms and whether culture is needed.' },
        ],
      },
      {
        id: 'urobilinogen',
        name: 'Urobilinogen',
        value: '3.2',
        sections: [
          {
            title: 'What is it?',
            body: 'It is a pigment formed in the intestine from bilirubin. Altered levels may suggest liver problems or destruction of red blood cells.',
          },
          { title: 'Reference Ranges', body: 'Dogs and Cats: Low values are normal.' },
          { title: 'What can influence it?', body: 'Prolonged fasting, diet, and certain medications can alter levels.' },
          {
            title: 'When to talk to the veterinarian?',
            body: 'If the value is significantly elevated or absent, it is important to discuss it with the veterinarian.',
          },
        ],
      },
      {
        id: 'magnesium',
        name: 'Magnesium',
        value: '2.3',
        sections: [
          { title: 'What is it?', body: 'Magnesium can reflect diet and kidney handling; abnormalities may relate to stones or renal issues.' },
          { title: 'Reference Ranges', body: 'Dogs and Cats: Interpret with the full urinalysis and clinical context.' },
          { title: 'What can influence it?', body: 'Diet, supplements, hydration, and kidney function can affect levels.' },
          { title: 'When to talk to the veterinarian?', body: 'If abnormal or associated with symptoms, discuss follow-up tests.' },
        ],
      },
      {
        id: 'density',
        name: 'Density',
        value: '1.02-3.34',
        sections: [
          { title: 'What is it?', body: 'Urine density (specific gravity) reflects hydration and kidney concentrating ability.' },
          { title: 'Reference Ranges', body: 'Dogs and Cats: Ranges vary; interpretation depends on hydration and health status.' },
          { title: 'What can influence it?', body: 'Water intake, diet, kidney disease, and endocrine conditions can influence results.' },
          { title: 'When to talk to the veterinarian?', body: 'If persistently low/high or paired with other abnormalities, discuss evaluation.' },
        ],
      },
      {
        id: 'ascorbic-acid',
        name: 'Ascorbic Acid',
        value: 'Positive',
        sections: [
          { title: 'What is it?', body: 'Ascorbic acid (vitamin C) can interfere with some urine test strip reactions.' },
          { title: 'Reference Ranges', body: 'Dogs and Cats: Depends on diet/supplementation; typically low.' },
          { title: 'What can influence it?', body: 'Vitamin C supplements and certain diets can increase levels.' },
          { title: 'When to talk to the veterinarian?', body: 'If results seem inconsistent, discuss possible interference.' },
        ],
      },
      {
        id: 'ph',
        name: 'pH',
        value: '5/5-7/0',
        sections: [
          { title: 'What is it?', body: 'Urine pH indicates how acidic or alkaline urine is.' },
          { title: 'Reference Ranges', body: 'Dogs and Cats: Varies with diet; interpretation is contextual.' },
          { title: 'What can influence it?', body: 'Diet, infection, medications, and sampling time can shift pH.' },
          { title: 'When to talk to the veterinarian?', body: 'If out of range with crystals or symptoms, discuss management.' },
        ],
      },
      {
        id: 'microalbumin',
        name: 'Microalbumin',
        value: '< 0.03 g/L',
        sections: [
          { title: 'What is it?', body: 'Microalbumin can indicate early protein leakage in urine.' },
          { title: 'Reference Ranges', body: 'Dogs and Cats: Low/negative values are expected.' },
          { title: 'What can influence it?', body: 'Inflammation, fever, exercise, and kidney disease can influence levels.' },
          { title: 'When to talk to the veterinarian?', body: 'If elevated, discuss repeat testing and kidney evaluation.' },
        ],
      },
    ],
    []
  );
  const translatedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        name: translateUrinalysisParameterLabel(t, item.id, item.name),
      })),
    [items, t]
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeItem = useMemo(() => translatedItems.find((i) => i.id === activeId) ?? null, [activeId, translatedItems]);

  return (
    <div className=" bg-[#F4F6FB">
      <div className="mx-auto w-full px4 -[calc(env(safe-area-inset-top)+20px)]">
        <div>
          <h1 className="text-[22px] font-semibold text-gray-900">Glossary of Parameters</h1>
          <p className="mt-1 text-[15px] text-gray-400">Understand what each urine test result means.</p>
        </div>

        <div className="mt-5 space-y-3">
          {translatedItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveId(item.id)}
              className="w-full rounded-2xl bg-white px- py-3 shadow-[0_1px_0_0_rgba(0,0,0,0.03)]"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 text-left">
                  <div className="truncate text-[16px] font-medium text-gray-900">{item.name}</div>
                  <div className="truncate text-[13px] text-gray-400">{item.value}</div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {activeItem ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4"
          onClick={() => setActiveId(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-[520px] rounded-[24px] bg-white px-5 py-5 shadow-theme-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-[22px] font-semibold text-gray-900">{activeItem.name}</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setActiveId(null)}
                className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-transparent text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-5">
              {activeItem.sections.map((s) => (
                <div key={s.title}>
                  <div className="text-[14px] font-medium text-gray-900">{s.title}</div>
                  <div className="mt-1 text-[14px] leading-6 text-gray-400">{s.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
