'use client'

import { Document, Image as PdfImage, Page as PDFPage, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import i18n from "@/i18n/i18n";

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

type PanelReferenceRange = { key: string; label: string };
type PanelMeta = {
  code: string;
  title: string;
  visibleKeys: string[] | null;
  referenceRanges: PanelReferenceRange[];
};

function normalizePanelCode(value?: string | null) {
  return (value || "").trim() || "VETQ_MASTER_360";
}

function formatDateTimeLabel(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const date = d.toLocaleDateString("en-GB");
  const time = d.toLocaleTimeString("en-GB", { hour12: false });
  return `${date}, ${time}`;
}

function formatCollectionMethod(value: string | null | undefined, t?: (key: string) => string) {
  const translate = t || ((key: string) => i18n.t(key));
  const v = (value || "").trim().toLowerCase();
  if (!v) return "";
  if (v === "free_catch") return translate("reading.pdf.freeCatch");
  if (v === "cystocentesis") return translate("reading.pdf.cystocentesis");
  if (v === "catheter") return translate("reading.pdf.catheter");
  return value || "";
}

function asReportText(value: string | null | undefined, t?: (key: string) => string) {
  const translate = t || ((key: string) => i18n.t(key));
  const s = typeof value === "string" ? value.trim() : "";
  return s ? s : translate("reading.pdf.notAvailable");
}

async function fetchReadingDetail(readingId: string, t?: (key: string) => string) {
  const translate = t || ((key: string) => i18n.t(key));
  const res = await fetch(`/api/reading/get_reading/${encodeURIComponent(readingId)}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = typeof (data as any)?.error === "string" ? (data as any).error : translate("reading.pdf.failedToDownloadReport");
    throw new Error(msg);
  }
  return ((data as any)?.reading ?? null) as ReadingDetail | null;
}

async function fetchPanels() {
  const res = await fetch("/api/panels", { method: "GET" });
  const data = await res.json().catch(() => null);
  const raw = Array.isArray((data as any)?.panels) ? ((data as any).panels as any[]) : [];
  const out: PanelMeta[] = [];
  for (const p of raw) {
    const code = String(p?.code || "").trim();
    if (!code) continue;
    const title = String(p?.title || "").trim() || code;
    const keys = Array.isArray(p?.visibleKeys) ? (p.visibleKeys as any[]).map((k) => String(k || "").trim()).filter(Boolean) : null;
    const referenceRanges = Array.isArray(p?.referenceRanges)
      ? (p.referenceRanges as any[])
        .map((rr) => ({ key: String(rr?.key || "").trim(), label: String(rr?.label || "").trim() }))
        .filter((rr) => rr.key && rr.label)
      : [];
    out.push({ code, title, visibleKeys: keys && keys.length ? keys : null, referenceRanges });
  }
  return out;
}

export async function createUrinalysisPdfObjectUrl({ readingId, reading, t }: { readingId: string; reading?: ReadingDetail | null; t?: (key: string) => string }) {
  const translate = t || ((key: string) => i18n.t(key));
  const r = (reading || (await fetchReadingDetail(readingId))) as ReadingDetail | null;
  if (!r) throw new Error(translate("reading.pdf.reportNotFound"));
  const panels = await fetchPanels().catch(() => [] as PanelMeta[]);
  const panelByCode = new Map<string, PanelMeta>();
  for (const p of panels) panelByCode.set(normalizePanelCode(p.code), p);
  const codesForAccess = [
    normalizePanelCode(r.productCode),
    ...((Array.isArray((r as any).unlockedProductCodes) ? (r as any).unlockedProductCodes : [])
      .map((c: any) => normalizePanelCode(String(c || "")))
      .filter(Boolean)),
  ];
  const visibleKeysByCode = codesForAccess.map((c) => panelByCode.get(c)?.visibleKeys ?? null);
  const accessKeys = visibleKeysByCode.some((k) => k === null)
    ? null
    : (() => {
      const set = new Set<string>();
      for (const keys of visibleKeysByCode) {
        if (Array.isArray(keys)) keys.forEach((k) => set.add(k));
      }
      return [...set];
    })();
  const referenceLabelByKey = new Map<string, string>();
  for (const c of codesForAccess) {
    const ranges = panelByCode.get(c)?.referenceRanges ?? [];
    for (const rr of ranges) {
      if (!rr?.key || !rr?.label) continue;
      if (!referenceLabelByKey.has(rr.key)) referenceLabelByKey.set(rr.key, rr.label);
    }
  }
  const panelTitle = panelByCode.get(normalizePanelCode(r.productCode))?.title || normalizePanelCode(r.productCode);

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
  const results = accessKeys ? resultsAll.filter((it) => accessKeys.includes(it.key)) : resultsAll;
  const physicalKeys = new Set(["ph", "specific-gravity"]);
  const physical = results.filter((it) => physicalKeys.has(it.key));
  const chemical = results.filter((it) => !physicalKeys.has(it.key));
  const microscopic: ReadingResult[] = [];

  const clinicName = (r.veterinarian.tradeName || "").trim() || r.veterinarian.fullName;
  const crmvLabel =
    r.veterinarian.crmvState && r.veterinarian.crmv ? `CRMV-${r.veterinarian.crmvState} ${r.veterinarian.crmv}` : "";
  const generatedAt = formatDateTimeLabel(r.signedAt || r.createdAt || null);
  const appLogoUrl = `${window.location.origin}/Logos VetQuark-03.png`;
  const signatureUrl = String(r.signatureImageUrl || "").trim();

  const valueWithUnit = (it: ReadingResult) => {
    const v = (it.valueLabel || "").trim();
    const u = (it.unit || "").trim();
    if (v && u) return `${v} ${u}`;
    return v || u || "";
  };

  const rangeLabelForKey = (key: string) => {
    const v = String(referenceLabelByKey.get(key) ?? "").trim();
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

        <Text style={reportStyles.sectionTitle}>{`${panelTitle} ${translate("reading.pdf.results")}`}</Text>
        <View style={reportStyles.metaGrid}>
          <View style={reportStyles.metaCol}>
            <View style={reportStyles.metaRow}>
              <Text style={reportStyles.metaKey}>{translate("reading.pdf.reportId")}</Text>
              <Text style={reportStyles.metaValue}>{asReportText(r.id)}</Text>
            </View>
            <View style={reportStyles.metaRow}>
              <Text style={reportStyles.metaKey}>{translate("reading.pdf.generated")}</Text>
              <Text style={reportStyles.metaValue}>{asReportText(generatedAt)}</Text>
            </View>
            <View style={reportStyles.metaRow}>
              <Text style={reportStyles.metaKey}>{translate("reading.pdf.patient")}</Text>
              <Text style={reportStyles.metaValue}>{asReportText(r.patient?.name)}</Text>
            </View>
            <View style={reportStyles.metaRow}>
              <Text style={reportStyles.metaKey}>{translate("reading.pdf.guardian")}</Text>
              <Text style={reportStyles.metaValue}>{asReportText(r.guardian?.fullName)}</Text>
            </View>
          </View>
          <View style={reportStyles.metaCol}>
            <View style={reportStyles.metaRow}>
              <Text style={reportStyles.metaKey}>{translate("reading.pdf.collection")}</Text>
              <Text style={reportStyles.metaValue}>
                {asReportText(formatCollectionMethod(r.identification?.collectionMethod))}
              </Text>
            </View>
            <View style={reportStyles.metaRow}>
              <Text style={reportStyles.metaKey}>{translate("reading.pdf.collectedAt")}</Text>
              <Text style={reportStyles.metaValue}>{asReportText(r.identification?.collectionAt || "")}</Text>
            </View>
            <View style={reportStyles.metaRow}>
              <Text style={reportStyles.metaKey}>{translate("reading.pdf.stripLot")}</Text>
              <Text style={reportStyles.metaValue}>{asReportText(r.identification?.stripLot || "")}</Text>
            </View>
            <View style={reportStyles.metaRow}>
              <Text style={reportStyles.metaKey}>{translate("reading.pdf.stripExpiry")}</Text>
              <Text style={reportStyles.metaValue}>{asReportText(r.identification?.stripExpiry || "")}</Text>
            </View>
          </View>
        </View>

        <Text style={reportStyles.sectionTitle}>{translate("reading.pdf.results")}</Text>
        <View style={reportStyles.resultsTable}>
          <View style={reportStyles.tableHeaderRow}>
            <View style={reportStyles.colName}>
              <Text style={reportStyles.tableHeaderText}>{translate("reading.pdf.test")}</Text>
            </View>
            <View style={reportStyles.colValue}>
              <Text style={reportStyles.tableHeaderText}>{translate("reading.pdf.result")}</Text>
            </View>
            <View style={reportStyles.colRange}>
              <Text style={reportStyles.tableHeaderText}>{translate("reading.pdf.reference")}</Text>
            </View>
            <View style={reportStyles.colStatus}>
              <Text style={[reportStyles.tableHeaderText, { textAlign: "right" }]}>{translate("reading.pdf.status")}</Text>
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
                  {it.status === "Normal" ? translate("reading.pdf.normal") : translate("reading.pdf.abnormal")}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={reportStyles.sectionTitle}>{translate("reading.pdf.remarks")}</Text>
        <View>
          <Text style={reportStyles.blockText}>{asReportText(r.report?.summaryAndInterpretation || r.timer?.analysis?.summary || "")}</Text>
        </View>

        <Text style={reportStyles.sectionTitle}>{translate("reading.pdf.additionalInformation")}</Text>
        <View>
          <Text style={reportStyles.blockText}>{asReportText(r.report?.otherInformation || "")}</Text>
        </View>

        <Text style={reportStyles.sectionTitle}>{translate("reading.pdf.veterinarianNotes")}</Text>
        <View>
          <Text style={reportStyles.blockText}>{asReportText(r.report?.veterinarianNotes || "")}</Text>
        </View>

        <View fixed style={reportStyles.signatureArea}>
          <View style={reportStyles.signatureRow}>
            <View>
              <Text style={reportStyles.signatureLabel}>{translate("reading.pdf.veterinarian")}</Text>
              <Text style={reportStyles.signatureName}>{asReportText(r.veterinarian.fullName)}</Text>
              {crmvLabel ? <Text style={reportStyles.signatureCrmv}>{crmvLabel}</Text> : null}
              {generatedAt ? <Text style={reportStyles.signatureCrmv}>{translate("reading.pdf.signedAt")} {generatedAt}</Text> : null}
            </View>
            <View>
              <Text style={[reportStyles.signatureLabel, { textAlign: "right" }]}>{translate("reading.pdf.signature")}</Text>
              {signatureUrl ? (
                <PdfImage src={{ uri: signatureUrl }} style={reportStyles.signatureImage} />
              ) : (
                <Text style={[reportStyles.signatureCrmv, { textAlign: "right" }]}>{translate("reading.pdf.notAvailable")}</Text>
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
  return { url, fileName, blob };
}

export async function downloadUrinalysisPdf({ readingId, reading, t }: { readingId: string; reading?: ReadingDetail | null; t?: (key: string) => string }) {
  const { url, fileName } = await createUrinalysisPdfObjectUrl({ readingId, reading, t });
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function openUrinalysisPdf({ readingId, reading, t }: { readingId: string; reading?: ReadingDetail | null; t?: (key: string) => string }) {
  const { url } = await createUrinalysisPdfObjectUrl({ readingId, reading, t });
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.assign(url);
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
