import { useEffect, useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";

type ProductValue = {
  id?: string;
  slug?: string;
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  image?: string;
  active?: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  initialProduct?: ProductValue | null;
  onSaved?: () => void;
};

export default function AddEditProductModal({ open, onOpenChange, initialProduct, onSaved }: Props) {
  const isEdit = Boolean(initialProduct?.id);

  const initial = useMemo(
    () => ({
      name: typeof initialProduct?.name === "string" ? initialProduct.name : "",
      description: typeof initialProduct?.description === "string" ? initialProduct.description : "",
      price: Number.isFinite(Number(initialProduct?.price)) ? String(Number(initialProduct?.price)) : "",
      stock: Number.isFinite(Number(initialProduct?.stock)) ? String(Number(initialProduct?.stock)) : "",
      image: typeof initialProduct?.image === "string" ? initialProduct.image : "",
      status: typeof initialProduct?.active === "boolean" && initialProduct.active === false ? "inactive" : "active",
    }),
    [initialProduct]
  );

  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(initial);
  }, [open, initial]);

  const handleClose = (next: boolean) => {
    if (saving || uploadingImage) return;
    onOpenChange(next);
  };

  const handleProductImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    if (!CLOUD_NAME || !API_KEY) {
      toast.error("Cloudinary is not configured");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large (max 2MB)");
      e.target.value = "";
      return;
    }

    setUploadingImage(true);
    try {
      const signRes = await fetch(`/api/cloudinary/upload?folder=store_products`);
      const signJson = await signRes.json().catch(() => null);
      if (!signRes.ok) {
        toast.error("Failed to prepare upload");
        return;
      }
      const timestamp = String((signJson as any)?.timestamp || "");
      const signature = String((signJson as any)?.signature || "");
      if (!timestamp || !signature) {
        toast.error("Failed to prepare upload");
        return;
      }

      const data = new FormData();
      data.append("file", file);
      data.append("api_key", API_KEY);
      data.append("timestamp", timestamp);
      data.append("signature", signature);
      data.append("folder", "store_products");

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: data });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error("Upload failed");
        return;
      }
      const url = String((json as any)?.secure_url || (json as any)?.url || "");
      if (url) setForm((p) => ({ ...p, image: url }));
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving || uploadingImage) return;

    const name = form.name.trim();
    const description = form.description.trim();
    const image = form.image.trim();
    const active = form.status === "active";

    const priceNumber = Number(form.price);
    const stockNumber = Number(form.stock);

    if (!name) {
      toast.error("Name is required");
      return;
    }
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      toast.error("Invalid price");
      return;
    }
    if (!Number.isFinite(stockNumber) || Math.trunc(stockNumber) < 0) {
      toast.error("Invalid stock");
      return;
    }

    const id = String(initialProduct?.id ?? "");
    const url = isEdit ? `/api/admin/products/${encodeURIComponent(id)}` : "/api/admin/products";
    const method = isEdit ? "PATCH" : "POST";

    const payload: Record<string, any> = {
      name,
      description,
      price: priceNumber,
      stock: Math.trunc(stockNumber),
      image,
      active,
    };

    try {
      setSaving(true);
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(typeof (data as any)?.error === "string" ? (data as any).error : "Failed to save product");
        return;
      }
      toast.success(isEdit ? "Product updated" : "Product created");
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
      <DialogContent className="max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4">
            <label className="block cursor-pointer">
              <input type="file" accept="image/*" onChange={handleProductImageChange} className="hidden" disabled={saving || uploadingImage} />
              <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-4 py-10 text-center">
                {form.image ? (
                  <div className="flex flex-col items-center gap-3">
                    <Image
                      src={form.image}
                      alt="Product image"
                      width={260}
                      height={180}
                      className="h-[160px] w-[260px] rounded-lg object-cover"
                    />
                    <div className="text-sm text-gray-600">{uploadingImage ? "Uploading..." : "Click to change product image"}</div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                      <Upload size={18} />
                    </div>
                    <div className="text-sm font-medium text-gray-800">{uploadingImage ? "Uploading..." : "Click to upload product image"}</div>
                    <div className="text-xs text-gray-500">SVG, PNG, JPG or GIF (max. 2MB)</div>
                  </div>
                )}
              </div>
            </label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-name">Product Name</Label>
            <Input
              id="product-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Rabies Vaccine (10ml)"
              disabled={saving || uploadingImage}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-description">Description</Label>
            <textarea
              id="product-description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Write a short description..."
              disabled={saving || uploadingImage}
              className="min-h-[110px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-price">Unit Price</Label>
              <Input
                id="product-price"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="0.00"
                disabled={saving || uploadingImage}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-stock">Stock Quantity</Label>
              <Input
                id="product-stock"
                type="number"
                inputMode="numeric"
                min={0}
                step="1"
                value={form.stock}
                onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                placeholder="0"
                disabled={saving || uploadingImage}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))} disabled={saving || uploadingImage}>
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

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={saving || uploadingImage}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || uploadingImage}>
              {saving ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
