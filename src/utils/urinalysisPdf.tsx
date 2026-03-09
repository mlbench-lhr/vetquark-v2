'use client'

import { Document, Image as PdfImage, Page as PDFPage, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

type ReadingResultStatus = "Normal" | "Abnormal";

type ReadingResult = {
  key: string;
  label: string;
  unit: string;
  status: ReadingResultStatus;
  selectedIndex?: number;
  valueLabel: string;
  numericValue?: number;
};

type ReadingDetail = {
  id: string;
  productCode?: string;
  unlockedProductCodes?: string[];
  panelVersion?: number;
  signedAt: string | null;
  createdAt: string | null;
  signatureImageUrl: string | null;
  identification?: {
    collectionMethod?: string | null;
    collectionAt?: string | null;
    stripLot?: string | null;
    stripExpiry?: string | null;
  } | null;
  results: ReadingResult[];
  report: {
    summaryAndInterpretation: string;
    otherInformation: string;
    veterinarianNotes: string;
  } | null;
  timer: {
    analysis?: { summary?: string; confidence?: number; flags?: string[] };
  } | null;
  patient: { id: string; name: string; photo: string | null };
  guardian: { id: string; fullName: string };
  veterinarian: {
    id: string;
    fullName: string;
    crmv: string | null;
    crmvState: string | null;
    tradeName?: string | null;
    clinicLogoUrl?: string | null;
    reportHeaderAddress?: string | null;
    reportFooter?: string | null;
  };
};

function visibleKeysForProductCode(productCode?: string | null): string[] | null {
  const code = (productCode || "").trim() || "VETQ_MASTER_360";
  if (code === "VETQ_MASTER_360") return null;
  if (code === "VETQ_U_START") return ["leukocytes", "nitrite", "blood", "ph", "specific-gravity"];
  if (code === "VETQ_METABOLIC_CHECK") return ["glucose", "ketone-bodies", "ph", "specific-gravity"];
  if (code === "VETQ_RENAL_EXPRESS") return ["glucose", "ketone-bodies", "protein", "microalbumin", "ph", "specific-gravity"];
  if (code === "VETQ_RENAL_ADVANCED") {
    return ["glucose", "ketone-bodies", "protein", "microalbumin", "creatine", "calcium", "magnesium", "ph", "specific-gravity"];
  }
  if (code === "VETQ_HEPATOSCREEN") return ["bilirubin", "urobilinogen", "ph", "specific-gravity"];
  if (code === "VETQ_GERIATRIC_CARE") {
    return [
      "glucose",
      "ketone-bodies",
      "protein",
      "microalbumin",
      "creatine",
      "calcium",
      "magnesium",
      "bilirubin",
      "urobilinogen",
      "leukocytes",
      "nitrite",
      "blood",
      "ph",
      "specific-gravity",
    ];
  }
  return null;
}

function panelTitleForProductCode(productCode?: string | null) {
  const code = (productCode || "").trim() || "VETQ_MASTER_360";
  if (code === "VETQ_U_START") return "U-Start";
  if (code === "VETQ_METABOLIC_CHECK") return "Metabolic Check";
  if (code === "VETQ_RENAL_EXPRESS") return "Renal Express";
  if (code === "VETQ_RENAL_ADVANCED") return "Renal Advanced";
  if (code === "VETQ_HEPATOSCREEN") return "HepatoScreen";
  if (code === "VETQ_GERIATRIC_CARE") return "Geriatric Care";
  return "Master 360";
}

function visibleKeysForAccess(productCode?: string | null, unlockedProductCodes?: unknown): string[] | null {
  const unlocked = Array.isArray(unlockedProductCodes)
    ? unlockedProductCodes.map((c) => String(c || "").trim()).filter(Boolean)
    : [];
  const codes = [(productCode || "").trim() || "VETQ_MASTER_360", ...unlocked];
  for (const c of codes) {
    if (visibleKeysForProductCode(c) === null) return null;
  }
  const set = new Set<string>();
  for (const c of codes) {
    const keys = visibleKeysForProductCode(c);
    if (Array.isArray(keys)) keys.forEach((k) => set.add(k));
  }
  return [...set];
}

const REFERENCE_RANGES_BY_KEY: Record<string, string> = {
  "specific-gravity": "1.015-1.030",
  ph: "5.5-7.0",
  protein: "0-15",
  glucose: "Negative",
  "ketone-bodies": "Negative",
  bilirubin: "Negative",
  urobilinogen: "0-1",
  nitrite: "Negative",
  "ascorbic-acid": "0",
  leukocytes: "Negative",
  blood: "Negative",
  microalbumin: "< 0.03",
  creatine: "0.9-26.5",
  calcium: "0-2.5",
  magnesium: "0-1.5",
  "ammonium-chloride": "0",
};

function formatDateTimeLabel(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const date = d.toLocaleDateString("en-GB");
  const time = d.toLocaleTimeString("en-GB", { hour12: false });
  return `${date}, ${time}`;
}

function formatCollectionMethod(value: string | null | undefined) {
  const v = (value || "").trim().toLowerCase();
  if (!v) return "";
  if (v === "free_catch") return "Free catch";
  if (v === "cystocentesis") return "Cystocentesis";
  if (v === "catheter") return "Catheter";
  return value || "";
}

function asReportText(value: string | null | undefined) {
  const s = typeof value === "string" ? value.trim() : "";
  return s ? s : "N/A";
}

async function fetchReadingDetail(readingId: string) {
  const res = await fetch(`/api/reading/get_reading/${encodeURIComponent(readingId)}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = typeof (data as any)?.error === "string" ? (data as any).error : "Failed to download report";
    throw new Error(msg);
  }
  return ((data as any)?.reading ?? null) as ReadingDetail | null;
}

async function createUrinalysisPdfObjectUrl({ readingId, reading }: { readingId: string; reading?: ReadingDetail | null }) {
  const r = (reading || (await fetchReadingDetail(readingId))) as ReadingDetail | null;
  if (!r) throw new Error("Report not found");

  const reportStyles = StyleSheet.create({
    page: { padding: 14, paddingBottom: 86, fontSize: 10, color: "#111827" },
    header: { marginBottom: 6 },
    headerRow: { display: "flex", flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
    appLogo: { width: 78, height: 16 },
    clinicBlock: { display: "flex", alignItems: "flex-end" },
    title: { fontSize: 13, fontWeight: 700, textAlign: "right" },
    subtitle: { marginTop: 1, fontSize: 8, color: "#6B7280" },
    divider: { marginTop: 6, height: 1, backgroundColor: "#E5E7EB" },
    sectionTitle: { marginTop: 6, marginBottom: 3, fontSize: 10, fontWeight: 700 },
    metaGrid: { display: "flex", flexDirection: "row", gap: 12 },
    metaCol: { flex: 1 },
    metaRow: { display: "flex", flexDirection: "row", marginTop: 2 },
    metaKey: { width: 92, fontSize: 8, color: "#6B7280" },
    metaValue: { flex: 1, fontSize: 8, color: "#111827" },
    blockText: { marginTop: 0, fontSize: 8, color: "#111827", lineHeight: 1.25 },
    footer: { marginTop: 18, fontSize: 9, color: "#6B7280" },
    resultsTable: { marginTop: 4, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8 },
    tableHeaderRow: {
      display: "flex",
      flexDirection: "row",
      paddingVertical: 6,
      paddingHorizontal: 8,
      backgroundColor: "#F9FAFB",
      borderBottomWidth: 1,
      borderBottomColor: "#E5E7EB",
    },
    tableRow: {
      display: "flex",
      flexDirection: "row",
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#E5E7EB",
    },
    tableRowLast: { borderBottomWidth: 0 },
    colName: { flex: 1.5, paddingRight: 8 },
    colValue: { flex: 1.0, paddingRight: 8 },
    colRange: { flex: 1.1, paddingRight: 8 },
    colStatus: { flex: 0.6 },
    tableHeaderText: { fontSize: 8, fontWeight: 700, color: "#374151" },
    tableCellLabel: { fontSize: 8, fontWeight: 700, color: "#111827" },
    tableCellValue: { fontSize: 8, color: "#111827" },
    tableCellRange: { fontSize: 8, color: "#4B5563" },
    tableCellStatus: { fontSize: 8, fontWeight: 700, textAlign: "right" },
    tableCellStatusNormal: { color: "#6B7280" },
    tableCellStatusAbnormal: { color: "#111827" },
    signatureArea: {
      position: "absolute",
      left: 14,
      right: 14,
      bottom: 14,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
    },
    signatureRow: { display: "flex", flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
    signatureLabel: { fontSize: 8, color: "#6B7280" },
    signatureName: { fontSize: 10, fontWeight: 700, color: "#111827" },
    signatureCrmv: { marginTop: 2, fontSize: 8, color: "#6B7280" },
    signatureImage: { width: 160, height: 48, objectFit: "contain" },
  });

  const resultsAll = Array.isArray(r.results) ? r.results : [];
  const keys = visibleKeysForAccess(r.productCode, (r as any).unlockedProductCodes);
  const results = keys ? resultsAll.filter((it) => keys.includes(it.key)) : resultsAll;
  const physicalKeys = new Set(["ph", "specific-gravity"]);
  const physical = results.filter((it) => physicalKeys.has(it.key));
  const chemical = results.filter((it) => !physicalKeys.has(it.key));
  const microscopic: ReadingResult[] = [];

  const clinicName = (r.veterinarian.tradeName || "").trim() || r.veterinarian.fullName;
  const crmvLabel =
    r.veterinarian.crmvState && r.veterinarian.crmv ? `CRMV-${r.veterinarian.crmvState} ${r.veterinarian.crmv}` : "";
  const generatedAt = formatDateTimeLabel(r.signedAt || r.createdAt || null);
  const appLogoUrl = `${window.location.origin}/blueLogo.png`;
  const signatureUrl = String(r.signatureImageUrl || "").trim();

  const valueWithUnit = (it: ReadingResult) => {
    const v = (it.valueLabel || "").trim();
    const u = (it.unit || "").trim();
    if (v && u) return `${v} ${u}`;
    return v || u || "";
  };

  const rangeLabelForKey = (key: string) => {
    const v = String(REFERENCE_RANGES_BY_KEY[key] ?? "").trim();
    return v ? v : "—";
  };

  const buildDocument = () => (
    <Document>
      <PDFPage size="A4" style={reportStyles.page}>
        <View style={reportStyles.header}>
          <View style={reportStyles.headerRow}>
            <PdfImage src={{ uri: appLogoUrl }} style={reportStyles.appLogo} />
            <View style={reportStyles.clinicBlock}>
              <Text style={reportStyles.title}>{clinicName}</Text>
              {crmvLabel ? <Text style={reportStyles.subtitle}>{crmvLabel}</Text> : null}
              {(r.veterinarian.reportHeaderAddress || "").trim() ? (
                <Text style={reportStyles.subtitle}>{String(r.veterinarian.reportHeaderAddress || "").trim()}</Text>
              ) : null}
            </View>
          </View>
          <View style={reportStyles.divider} />
        </View>

        <Text style={reportStyles.sectionTitle}>{`${panelTitleForProductCode(r.productCode)} Report`}</Text>
        <View style={reportStyles.metaGrid}>
          <View style={reportStyles.metaCol}>
            <View style={reportStyles.metaRow}>
              <Text style={reportStyles.metaKey}>Report ID</Text>
              <Text style={reportStyles.metaValue}>{asReportText(r.id)}</Text>
            </View>
            <View style={reportStyles.metaRow}>
              <Text style={reportStyles.metaKey}>Generated</Text>
              <Text style={reportStyles.metaValue}>{asReportText(generatedAt)}</Text>
            </View>
            <View style={reportStyles.metaRow}>
              <Text style={reportStyles.metaKey}>Patient</Text>
              <Text style={reportStyles.metaValue}>{asReportText(r.patient?.name)}</Text>
            </View>
            <View style={reportStyles.metaRow}>
              <Text style={reportStyles.metaKey}>Guardian</Text>
              <Text style={reportStyles.metaValue}>{asReportText(r.guardian?.fullName)}</Text>
            </View>
          </View>
          <View style={reportStyles.metaCol}>
            <View style={reportStyles.metaRow}>
              <Text style={reportStyles.metaKey}>Collection</Text>
              <Text style={reportStyles.metaValue}>
                {asReportText(formatCollectionMethod(r.identification?.collectionMethod))}
              </Text>
            </View>
            <View style={reportStyles.metaRow}>
              <Text style={reportStyles.metaKey}>Collected At</Text>
              <Text style={reportStyles.metaValue}>{asReportText(r.identification?.collectionAt || "")}</Text>
            </View>
            <View style={reportStyles.metaRow}>
              <Text style={reportStyles.metaKey}>Strip Lot</Text>
              <Text style={reportStyles.metaValue}>{asReportText(r.identification?.stripLot || "")}</Text>
            </View>
            <View style={reportStyles.metaRow}>
              <Text style={reportStyles.metaKey}>Strip Expiry</Text>
              <Text style={reportStyles.metaValue}>{asReportText(r.identification?.stripExpiry || "")}</Text>
            </View>
          </View>
        </View>

        <Text style={reportStyles.sectionTitle}>Results</Text>
        <View style={reportStyles.resultsTable}>
          <View style={reportStyles.tableHeaderRow}>
            <View style={reportStyles.colName}>
              <Text style={reportStyles.tableHeaderText}>Test</Text>
            </View>
            <View style={reportStyles.colValue}>
              <Text style={reportStyles.tableHeaderText}>Result</Text>
            </View>
            <View style={reportStyles.colRange}>
              <Text style={reportStyles.tableHeaderText}>Reference</Text>
            </View>
            <View style={reportStyles.colStatus}>
              <Text style={[reportStyles.tableHeaderText, { textAlign: "right" }]}>Status</Text>
            </View>
          </View>
          {[...physical, ...chemical, ...microscopic].map((it, idx, arr) => (
            <View key={it.key} style={idx === arr.length - 1 ? [reportStyles.tableRow, reportStyles.tableRowLast] : reportStyles.tableRow}>
              <View style={reportStyles.colName}>
                <Text style={reportStyles.tableCellLabel}>{asReportText(it.label)}</Text>
              </View>
              <View style={reportStyles.colValue}>
                <Text style={reportStyles.tableCellValue}>{asReportText(valueWithUnit(it))}</Text>
              </View>
              <View style={reportStyles.colRange}>
                <Text style={reportStyles.tableCellRange}>{rangeLabelForKey(it.key)}</Text>
              </View>
              <View style={reportStyles.colStatus}>
                <Text
                  style={[
                    reportStyles.tableCellStatus,
                    it.status === "Normal" ? reportStyles.tableCellStatusNormal : reportStyles.tableCellStatusAbnormal,
                  ]}
                >
                  {it.status === "Normal" ? "Normal" : "Abnormal"}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={reportStyles.sectionTitle}>Remarks</Text>
        <View>
          <Text style={reportStyles.blockText}>{asReportText(r.report?.summaryAndInterpretation || r.timer?.analysis?.summary || "")}</Text>
        </View>

        <Text style={reportStyles.sectionTitle}>Additional Information</Text>
        <View>
          <Text style={reportStyles.blockText}>{asReportText(r.report?.otherInformation || "")}</Text>
        </View>

        <Text style={reportStyles.sectionTitle}>Veterinarian Notes</Text>
        <View>
          <Text style={reportStyles.blockText}>{asReportText(r.report?.veterinarianNotes || "")}</Text>
        </View>

        <View fixed style={reportStyles.signatureArea}>
          <View style={reportStyles.signatureRow}>
            <View>
              <Text style={reportStyles.signatureLabel}>Veterinarian</Text>
              <Text style={reportStyles.signatureName}>{asReportText(r.veterinarian.fullName)}</Text>
              {crmvLabel ? <Text style={reportStyles.signatureCrmv}>{crmvLabel}</Text> : null}
              {generatedAt ? <Text style={reportStyles.signatureCrmv}>Signed at {generatedAt}</Text> : null}
            </View>
            <View>
              <Text style={[reportStyles.signatureLabel, { textAlign: "right" }]}>Signature</Text>
              {signatureUrl ? (
                <PdfImage src={{ uri: signatureUrl }} style={reportStyles.signatureImage} />
              ) : (
                <Text style={[reportStyles.signatureCrmv, { textAlign: "right" }]}>N/A</Text>
              )}
            </View>
          </View>
        </View>
      </PDFPage>
    </Document>
  );

  const blob = await pdf(buildDocument()).toBlob();
  const url = URL.createObjectURL(blob);
  const fileName = `urinalysis-report-${r.id}.pdf`;
  return { url, fileName };
}

export async function downloadUrinalysisPdf({ readingId, reading }: { readingId: string; reading?: ReadingDetail | null }) {
  const { url, fileName } = await createUrinalysisPdfObjectUrl({ readingId, reading });
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function openUrinalysisPdf({ readingId, reading }: { readingId: string; reading?: ReadingDetail | null }) {
  const { url } = await createUrinalysisPdfObjectUrl({ readingId, reading });
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.assign(url);
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
