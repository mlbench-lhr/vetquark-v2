import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

type PanelRuleType = "range" | "exact" | "negative" | "lt" | "gt";

type PanelReferenceRangeValue = {
  key: string;
  label: string;
  rule: { type: PanelRuleType; low?: number; high?: number; value?: number };
};

type PanelValue = {
  id?: string;
  code?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  params?: string;
  visibleKeys?: string[] | null;
  suggestedPriceBRL?: number;
  commissionPriceBRL?: number | null;
  active?: boolean;
  sortOrder?: number;
  referenceRanges?: PanelReferenceRangeValue[];
};

type Props = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  initialPanel?: PanelValue | null;
  onSaved?: () => void;
};

function normalizePanelCode(value: unknown) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function isValidPanelCode(code: string) {
  if (!code) return false;
  if (!code.startsWith("VETQ_")) return false;
  return /^[A-Z0-9_]+$/.test(code);
}

export default function AddEditPanelModal({ open, onOpenChange, initialPanel, onSaved }: Props) {
  const isEdit = Boolean(initialPanel?.id);

  const initial = useMemo(
    () => ({
      code: normalizePanelCode(initialPanel?.code),
      title: typeof initialPanel?.title === "string" ? initialPanel.title : "",
      subtitle: typeof initialPanel?.subtitle === "string" ? initialPanel.subtitle : "",
      description: typeof initialPanel?.description === "string" ? initialPanel.description : "",
      params: typeof initialPanel?.params === "string" ? initialPanel.params : "",
      visibleKeysCsv: Array.isArray(initialPanel?.visibleKeys) ? initialPanel.visibleKeys.join(", ") : "",
      suggestedPriceBRL: Number.isFinite(Number(initialPanel?.suggestedPriceBRL)) ? String(Number(initialPanel?.suggestedPriceBRL)) : "0",
      commissionPriceBRL:
        initialPanel?.commissionPriceBRL === null || initialPanel?.commissionPriceBRL === undefined
          ? ""
          : Number.isFinite(Number(initialPanel?.commissionPriceBRL))
            ? String(Number(initialPanel?.commissionPriceBRL))
            : "",
      sortOrder: Number.isFinite(Number(initialPanel?.sortOrder)) ? String(Number(initialPanel?.sortOrder)) : "0",
      status: typeof initialPanel?.active === "boolean" && initialPanel.active === false ? "inactive" : "active",
      referenceRanges: Array.isArray(initialPanel?.referenceRanges) ? initialPanel.referenceRanges : [],
    }),
    [initialPanel]
  );

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initial);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    if (!isEdit) return;
    const id = String(initialPanel?.id || "");
    if (!id) return;
    let mounted = true;
    (async () => {
      try {
        setLoadingDetails(true);
        const res = await fetch(`/api/admin/panels/${encodeURIComponent(id)}`);
        const data = await res.json().catch(() => null);
        if (!mounted) return;
        if (!res.ok) return;
        const panel = (data as any)?.panel;
        if (!panel || typeof panel !== "object") return;
        setForm((p) => ({
          ...p,
          code: normalizePanelCode(panel.code),
          title: typeof panel.title === "string" ? panel.title : "",
          subtitle: typeof panel.subtitle === "string" ? panel.subtitle : "",
          description: typeof panel.description === "string" ? panel.description : "",
          params: typeof panel.params === "string" ? panel.params : "",
          visibleKeysCsv: Array.isArray(panel.visibleKeys) ? panel.visibleKeys.join(", ") : "",
          suggestedPriceBRL: Number.isFinite(Number(panel.suggestedPriceBRL)) ? String(Number(panel.suggestedPriceBRL)) : "0",
          commissionPriceBRL: Number.isFinite(Number(panel.commissionPriceBRL)) ? String(Number(panel.commissionPriceBRL)) : "",
          sortOrder: Number.isFinite(Number(panel.sortOrder)) ? String(Number(panel.sortOrder)) : "0",
          status: panel.active === false ? "inactive" : "active",
          referenceRanges: Array.isArray(panel.referenceRanges) ? panel.referenceRanges : [],
        }));
      } catch {
      } finally {
        if (mounted) setLoadingDetails(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open, isEdit, initialPanel?.id]);

  const handleClose = (next: boolean) => {
    if (saving || loadingDetails) return;
    onOpenChange(next);
  };

  const handleAddRange = () => {
    setForm((p) => ({
      ...p,
      referenceRanges: [
        ...p.referenceRanges,
        {
          key: "",
          label: "",
          rule: { type: "range", low: 0, high: 0 },
        },
      ],
    }));
  };

  const handleRemoveRange = (idx: number) => {
    setForm((p) => ({
      ...p,
      referenceRanges: p.referenceRanges.filter((_, i) => i !== idx),
    }));
  };

  const handleUpdateRange = (idx: number, next: Partial<PanelReferenceRangeValue>) => {
    setForm((p) => ({
      ...p,
      referenceRanges: p.referenceRanges.map((r, i) => (i === idx ? { ...r, ...next } : r)),
    }));
  };

  const handleUpdateRule = (idx: number, next: Partial<PanelReferenceRangeValue["rule"]>) => {
    setForm((p) => ({
      ...p,
      referenceRanges: p.referenceRanges.map((r, i) => (i === idx ? { ...r, rule: { ...r.rule, ...next } } : r)),
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving || loadingDetails) return;

    const code = normalizePanelCode(form.code);
    const title = form.title.trim();
    const subtitle = form.subtitle.trim();
    const description = form.description.trim();
    const params = form.params.trim();
    const active = form.status === "active";
    const sortOrderN = Number(form.sortOrder);
    const suggestedPriceBRL = Number(form.suggestedPriceBRL);
    const commissionPriceBRL = form.commissionPriceBRL.trim() === "" ? null : Number(form.commissionPriceBRL);

    if (!isEdit && !isValidPanelCode(code)) {
      toast.error("Invalid code (use VETQ_ prefix)");
      return;
    }
    if (!title) {
      toast.error("Title is required");
      return;
    }
    if (!Number.isFinite(sortOrderN)) {
      toast.error("Invalid sort order");
      return;
    }
    if (!Number.isFinite(suggestedPriceBRL) || suggestedPriceBRL < 0) {
      toast.error("Invalid suggested price");
      return;
    }
    if (commissionPriceBRL !== null && (!Number.isFinite(commissionPriceBRL) || commissionPriceBRL < 0)) {
      toast.error("Invalid commission price");
      return;
    }

    const visibleKeys = form.visibleKeysCsv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const visibleKeysValue = visibleKeys.length ? visibleKeys : null;

    const ranges: PanelReferenceRangeValue[] = [];
    for (const rr of form.referenceRanges) {
      const key = String(rr?.key || "").trim();
      const label = String(rr?.label || "").trim();
      const type = String(rr?.rule?.type || "").trim() as PanelRuleType;
      if (!key || !label) continue;
      if (!["range", "exact", "negative", "lt", "gt"].includes(type)) continue;
      if (type === "negative") {
        ranges.push({ key, label, rule: { type: "negative" } });
        continue;
      }
      if (type === "range") {
        const low = Number((rr.rule as any).low);
        const high = Number((rr.rule as any).high);
        if (!Number.isFinite(low) || !Number.isFinite(high)) continue;
        ranges.push({ key, label, rule: { type: "range", low, high } });
        continue;
      }
      const value = Number((rr.rule as any).value);
      if (!Number.isFinite(value)) continue;
      ranges.push({ key, label, rule: { type, value } });
    }

    const payload: Record<string, any> = {
      ...(isEdit ? {} : { code }),
      title,
      subtitle,
      description,
      params,
      active,
      sortOrder: Math.trunc(sortOrderN),
      suggestedPriceBRL,
      commissionPriceBRL,
      visibleKeys: visibleKeysValue,
      referenceRanges: ranges,
    };

    const id = String(initialPanel?.id ?? "");
    const url = isEdit ? `/api/admin/panels/${encodeURIComponent(id)}` : "/api/admin/panels";
    const method = isEdit ? "PATCH" : "POST";

    try {
      setSaving(true);
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(typeof (data as any)?.error === "string" ? (data as any).error : "Failed to save panel");
        return;
      }
      toast.success(isEdit ? "Panel updated" : "Panel created");
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95%] overflow-auto max-h-[95vh] md:max-w-[960px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Panel" : "Add New Panel"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="panel-code">Code</Label>
              <Input
                id="panel-code"
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="VETQ_MASTER_360"
                disabled={saving || loadingDetails || isEdit}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="panel-title">Title</Label>
              <Input
                id="panel-title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Master 360"
                disabled={saving || loadingDetails}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="panel-subtitle">Subtitle</Label>
              <Input
                id="panel-subtitle"
                value={form.subtitle}
                onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                placeholder=""
                disabled={saving || loadingDetails}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="panel-params">Params</Label>
              <Input
                id="panel-params"
                value={form.params}
                onChange={(e) => setForm((p) => ({ ...p, params: e.target.value }))}
                placeholder="LEU, NIT, BLD, PH, SG"
                disabled={saving || loadingDetails}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="panel-description">Description</Label>
            <textarea
              id="panel-description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder=""
              disabled={saving || loadingDetails}
              className="min-h-[90px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="panel-suggested">Suggested Price (BRL)</Label>
              <Input
                id="panel-suggested"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={form.suggestedPriceBRL}
                onChange={(e) => setForm((p) => ({ ...p, suggestedPriceBRL: e.target.value }))}
                disabled={saving || loadingDetails}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="panel-commission">Commission Price (BRL)</Label>
              <Input
                id="panel-commission"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={form.commissionPriceBRL}
                onChange={(e) => setForm((p) => ({ ...p, commissionPriceBRL: e.target.value }))}
                placeholder=""
                disabled={saving || loadingDetails}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="panel-sort">Sort Order</Label>
              <Input
                id="panel-sort"
                type="number"
                inputMode="numeric"
                step="1"
                value={form.sortOrder}
                onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                disabled={saving || loadingDetails}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="panel-visible-keys">Visible Keys (comma-separated)</Label>
              <Input
                id="panel-visible-keys"
                value={form.visibleKeysCsv}
                onChange={(e) => setForm((p) => ({ ...p, visibleKeysCsv: e.target.value }))}
                placeholder="glucose, ketone-bodies, ph"
                disabled={saving || loadingDetails}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))} disabled={saving || loadingDetails}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-gray-900">Reference Ranges</div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddRange} disabled={saving || loadingDetails}>
                <Plus size={16} />
                Add Range
              </Button>
            </div>

            {form.referenceRanges.length ? (
              <div className="space-y-2">
                {form.referenceRanges.map((rr, idx) => {
                  const type = rr?.rule?.type || "range";
                  return (
                    <div key={idx} className="rounded-lg border border-gray-200 p-3">
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                        <div className="md:col-span-3 space-y-1.5">
                          <Label>Key</Label>
                          <Input
                            value={rr.key}
                            onChange={(e) => handleUpdateRange(idx, { key: e.target.value })}
                            disabled={saving || loadingDetails}
                          />
                        </div>
                        <div className="md:col-span-3 space-y-1.5">
                          <Label>Label</Label>
                          <Input
                            value={rr.label}
                            onChange={(e) => handleUpdateRange(idx, { label: e.target.value })}
                            disabled={saving || loadingDetails}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                          <Label>Rule</Label>
                          <Select
                            value={type}
                            onValueChange={(v) => {
                              const t = v as PanelRuleType;
                              if (t === "negative") handleUpdateRule(idx, { type: t, low: undefined, high: undefined, value: undefined });
                              else if (t === "range") handleUpdateRule(idx, { type: t, low: 0, high: 0, value: undefined });
                              else handleUpdateRule(idx, { type: t, low: undefined, high: undefined, value: 0 });
                            }}
                            disabled={saving || loadingDetails}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="range">Range</SelectItem>
                              <SelectItem value="exact">Exact</SelectItem>
                              <SelectItem value="negative">Negative</SelectItem>
                              <SelectItem value="lt">Less than</SelectItem>
                              <SelectItem value="gt">Greater than</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {type === "range" ? (
                          <>
                            <div className="md:col-span-2 space-y-1.5">
                              <Label>Low</Label>
                              <Input
                                type="number"
                                inputMode="decimal"
                                value={String(rr.rule.low ?? "")}
                                onChange={(e) => handleUpdateRule(idx, { low: e.target.value === "" ? undefined : Number(e.target.value) })}
                                disabled={saving || loadingDetails}
                              />
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                              <Label>High</Label>
                              <Input
                                type="number"
                                inputMode="decimal"
                                value={String(rr.rule.high ?? "")}
                                onChange={(e) => handleUpdateRule(idx, { high: e.target.value === "" ? undefined : Number(e.target.value) })}
                                disabled={saving || loadingDetails}
                              />
                            </div>
                          </>
                        ) : type === "negative" ? (
                          <div className="md:col-span-4" />
                        ) : (
                          <div className="md:col-span-4 space-y-1.5">
                            <Label>Value</Label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              value={String(rr.rule.value ?? "")}
                              onChange={(e) => handleUpdateRule(idx, { value: e.target.value === "" ? undefined : Number(e.target.value) })}
                              disabled={saving || loadingDetails}
                            />
                          </div>
                        )}

                        <div className="md:col-span-1 flex items-end justify-end">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center text-black/60"
                            onClick={() => handleRemoveRange(idx)}
                            disabled={saving || loadingDetails}
                            aria-label="Remove"
                            title="Remove"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No reference ranges yet.</div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={saving || loadingDetails}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || loadingDetails}>
              {saving ? "Saving..." : isEdit ? "Update Panel" : "Create Panel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

