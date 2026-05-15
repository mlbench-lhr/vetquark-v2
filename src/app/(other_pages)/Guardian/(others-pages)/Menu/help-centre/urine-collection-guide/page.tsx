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
import { pdf, Document, Page as PDFPage, Text, View, StyleSheet } from "@react-pdf/renderer";
import Header from "@/components/common/header";
import { useTranslation } from "react-i18next";

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
        <div className="h-9 w-9 flex items-center justify-center rounded-full bg-primary text-white text-[14px] font-semibold">
          {index}
        </div>
        <div className="w-[calc(100%-36px)]">
          <div className="text-[15px] font-semibold leading-[20px] text-black/70">{title}</div>
          <div className="mt-1 text-[13px] leading-[18px] text-[#9AA4AF]">{body}</div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const { t } = useTranslation();
  const guideStyles = StyleSheet.create({
    page: { padding: 24, fontSize: 12, color: "#111827" },
    title: { fontSize: 18, fontWeight: 700 },
    subtitle: { marginTop: 6, fontSize: 12, color: "#9AA4AF" },
    divider: { marginVertical: 12, height: 1, backgroundColor: "#E5E7EB" },
    sectionTitle: { fontSize: 14, fontWeight: 700, marginTop: 10 },
    stepBox: { padding: 10, borderRadius: 8, backgroundColor: "#F5F6F6", marginTop: 8 },
    stepHeader: { display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 8 },
    stepIndex: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "#3F78D8",
      color: "#ffffff",
      fontSize: 12,
      fontWeight: 700,
      textAlign: "center",
      paddingTop: 4,
    },
    stepTitle: { fontSize: 12, fontWeight: 700 },
    stepBody: { marginTop: 3, fontSize: 11, color: "#9AA4AF" },
    cardBlue: { padding: 10, borderRadius: 8, backgroundColor: "#EBF2FF", marginTop: 12 },
    cardYellow: { padding: 10, borderRadius: 8, backgroundColor: "#FFFBEB", marginTop: 12 },
    bold: { fontWeight: 700, color: "#111827" },
    listItem: { display: "flex", flexDirection: "row", gap: 6, marginTop: 4, alignItems: "flex-start" },
  });

  const steps = [
    {
      index: 1,
      title: t("helpCentre.urineGuide.steps.prepareMaterials.title"),
      body: t("helpCentre.urineGuide.steps.prepareMaterials.body"),
    },
    {
      index: 2,
      title: t("helpCentre.urineGuide.steps.waitRightMoment.title"),
      body: t("helpCentre.urineGuide.steps.waitRightMoment.body"),
    },
    {
      index: 3,
      title: t("helpCentre.urineGuide.steps.positionPet.title"),
      body: t("helpCentre.urineGuide.steps.positionPet.body"),
    },
    {
      index: 4,
      title: t("helpCentre.urineGuide.steps.collectSample.title"),
      body: t("helpCentre.urineGuide.steps.collectSample.body"),
    },
    {
      index: 5,
      title: t("helpCentre.urineGuide.steps.transferLabel.title"),
      body: t("helpCentre.urineGuide.steps.transferLabel.body"),
    },
  ];

  const tips = [
    t("helpCentre.urineGuide.tips.readyBeforeStarting"),
    t("helpCentre.urineGuide.tips.avoidContamination"),
    t("helpCentre.urineGuide.tips.catsHydrophobicLitter"),
    t("helpCentre.urineGuide.tips.confineCatsIfNeeded"),
    t("helpCentre.urineGuide.tips.contactVeterinarianIfFails"),
  ];

  const buildGuideDocument = () => (
    <Document>
      <PDFPage size="A4" style={guideStyles.page}>
        <Text style={guideStyles.title}>{t("helpCentre.urineGuideTitle")}</Text>
        <Text style={guideStyles.subtitle}>{t("helpCentre.urineGuideHowToTitle")}</Text>
        <View style={guideStyles.divider} />

        <Text style={guideStyles.sectionTitle}>{t("helpCentre.stepByStepTitle")}</Text>
        {steps.map((s) => (
          <View key={s.index} style={guideStyles.stepBox}>
            <View style={guideStyles.stepHeader}>
              <Text style={guideStyles.stepIndex}>{String(s.index)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={guideStyles.stepTitle}>{s.title}</Text>
                <Text style={guideStyles.stepBody}>{s.body}</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={guideStyles.cardBlue}>
          <Text style={guideStyles.sectionTitle}>{t("helpCentre.storageInstructionsTitle")}</Text>
          <Text style={guideStyles.stepBody}>{t("helpCentre.storageInstructionsBody")}</Text>
        </View>

        <View style={guideStyles.cardBlue}>
          <Text style={guideStyles.sectionTitle}>{t("helpCentre.usefulTipsTitle")}</Text>
          {tips.map((t, i) => (
            <View key={`${i}-${t}`} style={guideStyles.listItem}>
              <Text>•</Text>
              <Text style={{ flex: 1 }}>{t}</Text>
            </View>
          ))}
        </View>

        <View style={guideStyles.cardYellow}>
          <Text style={guideStyles.sectionTitle}>{t("helpCentre.importantTitle")}</Text>
          <Text style={{ marginTop: 4, fontSize: 11 }}>{t("helpCentre.importantBody")}</Text>
          <Text style={{ marginTop: 2, fontSize: 11, color: "#9AA4AF" }}>{t("helpCentre.importantContact")}</Text>
        </View>
      </PDFPage>
    </Document>
  );

  const handleDownloadPdf = async () => {
    const blob = await pdf(buildGuideDocument()).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "urine-collection-guide.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header title={t("helpCentre.urineGuideTitle")} />

      <div className="mx-auto w-full px-4 pt-4 pb-[calc(env(safe-area-inset-bottom)+18px)]">
        <div>
          <div className="text-[22px] font-semibold leading-[26px] text-black/70">
            {t("helpCentre.urineGuideHowToTitle")}
          </div>
          <div className="mt-2 text-[14px] leading-[18px] text-[#9AA4AF]">
            {t("helpCentre.urineGuideLead")}
          </div>
        </div>

        <div className="mt-4 h-[1px] w-full bg-[#E5E7EB]" />

        <div className="pt-5">
          <div className="text-[16px] font-semibold leading-[20px] text-black/70">{t("helpCentre.stepByStepTitle")}</div>
          <div className="mt-3 space-y-3">
            <Step
              index={1}
              title={t("helpCentre.urineGuide.steps.prepareMaterials.title")}
              body={t("helpCentre.urineGuide.steps.prepareMaterials.body")}
            />
            <Step
              index={2}
              title={t("helpCentre.urineGuide.steps.waitRightMoment.title")}
              body={t("helpCentre.urineGuide.steps.waitRightMoment.body")}
            />
            <Step
              index={3}
              title={t("helpCentre.urineGuide.steps.positionPet.title")}
              body={t("helpCentre.urineGuide.steps.positionPet.body")}
            />
            <Step
              index={4}
              title={t("helpCentre.urineGuide.steps.collectSample.title")}
              body={t("helpCentre.urineGuide.steps.collectSample.body")}
            />
            <Step
              index={5}
              title={t("helpCentre.urineGuide.steps.transferLabel.title")}
              body={t("helpCentre.urineGuide.steps.transferLabel.body")}
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
              <div className="text-[15px] font-semibold leading-[20px] text-black/70">Storage Instructions</div>
              <div className="mt-1 text-[13px] leading-[18px] text-[#9AA4AF]">
                The sample should be taken to the clinic within <span className="font-semibold text-black/70">2 hours</span>. If this is not possible, refrigerate it in the fridge for a maximum of 12 hours.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-[#EBF2FF] px-4 py-4">
          <div className="text-[15px] font-semibold leading-[20px] text-black/70">Useful Tips</div>
          <div className="mt-3 space-y-2">
            {[
              "Have everything ready before starting",
              "Avoid contamination with water, feces, soil, or cleaning products",
              "For cats: use hydrophobic litter or an empty clean litter box",
              "Confine cats in a bathroom if needed",
              "If collection fails, contact your veterinarian for alternatives",
            ].map((tip) => (
              <div key={tip} className="flex items-start gap-2">
                <Check className="mt-[2px] h-4 w-4 text-primary" />
                <div className="text-[13px] leading-[18px] text-black/70">{tip}</div>
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
              <div className="text-[15px] font-semibold leading-[20px] text-black/70">Important</div>
              <div className="mt-1 text-[13px] leading-[18px] text-black/70">
                This guide is for informational purposes only. Always follow your veterinarian’s instructions.
              </div>
              <div className="mt-1 text-[13px] leading-[18px] text-[#9AA4AF]">If unsure, contact your clinic.</div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            type="button"
            className="h-[44px] w-full rounded-full bg-primary text-[14px] font-medium text-white flex items-center justify-center gap-2"
            onClick={handleDownloadPdf}
          >
            <Download className="h-5 w-5" />
            Download Guide (PDF)
          </button>
        </div>

      </div>
    </div>
  );
}
