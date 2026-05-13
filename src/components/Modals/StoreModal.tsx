'use client'
import { ArrowLeft, Check, MapPin, Minus, Pencil, Plus, ShoppingCart, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from 'react';
import PhoneInput from "@/components/form/group-input/PhoneInput";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { toast } from "react-toastify";
import Image from "next/image";
import { useTranslation } from "react-i18next";

const brazilianStateOptions = [
    { value: "AC", text: "Acre" },
    { value: "AL", text: "Alagoas" },
    { value: "AP", text: "Amapá" },
    { value: "AM", text: "Amazonas" },
    { value: "BA", text: "Bahia" },
    { value: "CE", text: "Ceará" },
    { value: "DF", text: "Distrito Federal" },
    { value: "ES", text: "Espírito Santo" },
    { value: "GO", text: "Goiás" },
    { value: "MA", text: "Maranhão" },
    { value: "MT", text: "Mato Grosso" },
    { value: "MS", text: "Mato Grosso do Sul" },
    { value: "MG", text: "Minas Gerais" },
    { value: "PA", text: "Pará" },
    { value: "PB", text: "Paraíba" },
    { value: "PR", text: "Paraná" },
    { value: "PE", text: "Pernambuco" },
    { value: "PI", text: "Piauí" },
    { value: "RJ", text: "Rio de Janeiro" },
    { value: "RN", text: "Rio Grande do Norte" },
    { value: "RS", text: "Rio Grande do Sul" },
    { value: "RO", text: "Rondônia" },
    { value: "RR", text: "Roraima" },
    { value: "SC", text: "Santa Catarina" },
    { value: "SP", text: "São Paulo" },
    { value: "SE", text: "Sergipe" },
    { value: "TO", text: "Tocantins" },
];

type StoreStep = "store" | "cart" | "checkout" | "change-address" | "add-address" | "success";
type PaymentMethod = "card" | "pix";

type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
};

type ApiProduct = {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
};

interface Address {
    id: string;
    name: string;
    phone: string;
    location: string;
    addressLine?: string;
    city?: string;
    state?: string;
    postalCode?: string;
}

type Props = {
    isOpen: boolean;
    onClose?: () => void;
    onUpdated?: () => void;
};

const StoreModal: React.FC<Props> = ({ isOpen, onClose, onUpdated }) => {
    const router = useRouter()
    const { t } = useTranslation();
    const [step, setStep] = useState<StoreStep>('store');
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [cart, setCart] = useState<Record<string, number>>({});
    const [placingOrder, setPlacingOrder] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState<string>("");
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [newAddressForm, setNewAddressForm] = useState({
        label: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
    });
    const [lastOrder, setLastOrder] = useState<{
        id: string;
        items: Array<{ name: string; quantity: number }>;
        total: number;
        address: Address;
    } | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("card");
    const [cardNumber, setCardNumber] = useState("");
    const [cardHolderName, setCardHolderName] = useState("");
    const [cardHolderDocument, setCardHolderDocument] = useState("");
    const [cardExpMonth, setCardExpMonth] = useState("");
    const [cardExpYear, setCardExpYear] = useState("");
    const [cardCvv, setCardCvv] = useState("");
    const [payingWithCard, setPayingWithCard] = useState(false);

    const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? addresses[0] ?? null;

    const filteredProducts = products.filter((p) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return `${p.name} ${p.description}`.toLowerCase().includes(q);
    });

    const cartItems = Object.entries(cart)
        .map(([productId, quantity]) => {
            const product = products.find((p) => p.id === productId);
            if (!product) return null;
            const qty = Number(quantity);
            if (!Number.isFinite(qty) || qty <= 0) return null;
            return { product, quantity: qty };
        })
        .filter(Boolean) as Array<{ product: Product; quantity: number }>;

    const cartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cartItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

    const setCartQuantity = (productId: string, quantity: number) => {
        setCart((prev) => {
            const next = { ...prev };
            if (quantity <= 0) {
                delete next[productId];
                return next;
            }
            next[productId] = quantity;
            return next;
        });
    };

    const addToCart = (productId: string) => {
        setCart((prev) => ({ ...prev, [productId]: (prev[productId] ?? 0) + 1 }));
    };

    const handleProceedToPurchase = async () => {
        if (step === "cart") {
            if (cartQuantity <= 0) {
                toast.error(t("auth.store.cartEmpty"));
                return;
            }
            setStep("checkout");
            return;
        }

        if (step === "checkout") {
            if (placingOrder) return;
            if (cartQuantity <= 0) {
                toast.error(t("auth.store.cartEmpty"));
                setStep("store");
                return;
            }
            setPlacingOrder(true);
            try {
                const payload = {
                    items: cartItems.map((i) => ({
                        productId: i.product.id,
                        name: i.product.name,
                        price: i.product.price,
                        quantity: i.quantity,
                    })),
                    total: cartTotal,
                    address: selectedAddress,
                };

                const res = await fetch("/api/store/orders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                const data = await res.json().catch(() => null);
                if (!res.ok) {
                    const msg = data?.error || t("auth.store.failedToCreateOrder");
                    toast.error(msg);
                    return;
                }

                const orderId = typeof data?.order?.id === "string" ? data.order.id : `order_${Date.now()}`;
                setLastOrder({
                    id: orderId,
                    items: cartItems.map((i) => ({ name: i.product.name, quantity: i.quantity })),
                    total: cartTotal,
                    address: selectedAddress!,
                });
                setCart({});
                setStep("success");
                toast.success(t("auth.store.orderCreated"));
                if (onUpdated) onUpdated();
            } finally {
                setPlacingOrder(false);
            }
        }
    };

    const handleViewCart = () => {
        if (cartQuantity <= 0) {
            toast.error(t("auth.store.cartEmpty"));
            return;
        }
        setStep('cart');
    };

    const handleViewOrders = () => {
        router.push("/Veterinarian/store/orders");
    };

    const handleBack = () => {
        if (step === "success") {
            setLastOrder(null);
            setStep("store");
            return;
        }
        if (step === "add-address") {
            setStep("change-address");
            return;
        }
        if (step === "change-address") {
            setStep("checkout");
            return;
        }
        if (step === "checkout") {
            setStep("cart");
            return;
        }
        if (step === "cart") {
            setStep("store");
            return;
        }
        router.back();
    };

    const handleClose = () => {
        setStep('store');
        setCart({});
        setLastOrder(null);
        onClose && onClose();
    };

    async function tokenizeCard() {
        const appId = String(process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY || "pk_test_Z9KybVbULjhmry87").trim();
        if (!appId) {
            toast.error(t("auth.store.missingPublicKey"));
            return null;
        }
        const url = `https://api.pagar.me/core/v5/tokens?appId=${encodeURIComponent(appId)}`;
        const payload = {
            card: {
                number: cardNumber.replace(/\s+/g, ""),
                holder_name: cardHolderName,
                holder_document: cardHolderDocument.replace(/\D/g, "") || undefined,
                exp_month: Number(cardExpMonth || 0),
                exp_year: Number(cardExpYear || 0),
                cvv: cardCvv,
            },
            type: "card",
        };
        const res = await fetch(url, {
            method: "POST",
            headers: { accept: "application/json", "content-type": "application/json" },
            body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
            const msg =
                (typeof data?.message === "string" && data.message) ||
                (Array.isArray(data?.errors) && typeof data.errors?.[0]?.message === "string" && data.errors[0].message) ||
                t("auth.store.failedToTokenizeCard");
            toast.error(msg);
            return null;
        }
        const token = typeof data?.id === "string" ? data.id : "";
        if (!token) {
            toast.error(t("auth.store.tokenizationFailed"));
            return null;
        }
        return token;
    }

    async function payStoreOrderWithCard() {
        if (!lastOrder || payingWithCard) return;
        if (!cardNumber || !cardHolderName || !cardExpMonth || !cardExpYear || !cardCvv) {
            toast.error(t("auth.store.fillAllCardFields"));
            return;
        }
        try {
            setPayingWithCard(true);
            const token = await tokenizeCard();
            if (!token) return;
            const res = await fetch("/api/store/payments/create", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ orderId: lastOrder.id, cardToken: token }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                const msg =
                    (typeof data?.message === "string" && data.message) ||
                    (Array.isArray(data?.details?.errors) && typeof data.details?.errors?.[0]?.message === "string" && data.details.errors[0].message) ||
                    (typeof data?.error === "string" && data.error) ||
                    t("auth.store.paymentFailed");
                toast.error(msg);
                return;
            }
            toast.success(t("auth.store.paymentCompleted"));
            router.push("/Veterinarian/store/orders");
        } catch {
            toast.error(t("auth.store.networkError"));
        } finally {
            setPayingWithCard(false);
        }
    }

    const handleSaveNewAddress = () => {
        const label = newAddressForm.label.trim();
        const phoneRaw = newAddressForm.phone.trim();
        const addressLine = newAddressForm.address.trim();
        const city = newAddressForm.city.trim();
        const state = newAddressForm.state.trim();
        const postalCode = newAddressForm.postalCode.trim();

        if (!label || !phoneRaw || !addressLine || !city || !state || !postalCode) {
            toast.error(t("auth.store.fillAllAddressFields"));
            return;
        }

        const phone = parsePhoneNumberFromString(phoneRaw, "BR");
        if (!phone || !phone.isValid()) {
            toast.error(t("auth.store.invalidPhoneNumber"));
            return;
        }

        (async () => {
            try {
                const res = await fetch("/api/store/addresses", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: label,
                        phone: phone.formatInternational(),
                        addressLine,
                        city,
                        state,
                        postalCode,
                    }),
                });
                const data = await res.json().catch(() => null);
                if (!res.ok) {
                    toast.error(data?.error || t("auth.store.failedToAddAddress"));
                    return;
                }
                const created = data?.address as Address | undefined;
                if (created) {
                    setAddresses((prev) => [created, ...prev]);
                    setSelectedAddressId(created.id);
                }
                setNewAddressForm({
                    label: "",
                    phone: "",
                    address: "",
                    city: "",
                    state: "",
                    postalCode: "",
                });
                setStep("checkout");
                toast.success(t("auth.store.addressAdded"));
            } catch {
                toast.error(t("auth.store.failedToAddAddress"));
            }
        })();
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const [prodRes, addrRes] = await Promise.all([
                    fetch("/api/store/products", { method: "GET" }),
                    fetch("/api/store/addresses", { method: "GET" }),
                ]);
                const prodData = await prodRes.json().catch(() => null);
                const addrData = await addrRes.json().catch(() => null);
                if (!mounted) return;
                if (prodRes.ok && Array.isArray(prodData?.products)) {
                    const mapped = (prodData.products as ApiProduct[]).map((p) => ({
                        id: String(p.id || ""),
                        name: String(p.name || ""),
                        description: String(p.description || ""),
                        price: Number(p.price || 0),
                        image: String(p.image || ""),
                    }));
                    setProducts(mapped);
                } else {
                    toast.error(prodData?.error || t("auth.store.failedToLoadProducts"));
                    setProducts([]);
                }
                if (addrRes.ok && Array.isArray(addrData?.addresses)) {
                    const mapped = addrData.addresses as Address[];
                    setAddresses(mapped);
                    if (!selectedAddressId && mapped.length) {
                        setSelectedAddressId(mapped[0].id);
                    }
                } else {
                    toast.error(addrData?.error || t("auth.store.failedToLoadAddresses"));
                    setAddresses([]);
                }
            } catch {
                if (!mounted) return;
                toast.error(t("auth.store.failedToLoadStoreData"));
                setProducts([]);
                setAddresses([]);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [selectedAddressId]);

    if (!isOpen) return null;

    const formatPrice = (value: number) =>
        `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div
                className="relative w-full max-w-[400px] bg-[#F8F9FD] rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col"
                style={{ maxHeight: '92vh' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0 bg-[#F8F9FD]">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="w-10 h-10 rounded-full bg-[#F0F0F0] flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <div className="flex items-center gap-2 text-[#4A7BF7]">
                        <ShoppingCart className="w-5 h-5" />
                        <span className="text-lg font-semibold">Loja</span>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-5 pb-4">
                    {step === "store" && (
                        <div className="space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t("auth.store.searchPlaceholder")}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-3 pl-11 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white border border-gray-100 text-sm placeholder:text-gray-400"
                                />
                                <svg
                                    className="w-5 h-5 text-primary absolute left-3.5 top-1/2 -translate-y-1/2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                                    <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </div>
                            <div className="space-y-3">
                                {filteredProducts.length === 0 ? (
                                    <div className="py-10 text-center text-sm text-gray-500">
                                        {t("auth.store.noItemsFound")}
                                    </div>
                                ) : (
                                    filteredProducts.map((product) => {
                                        const qtyInCart = cart[product.id] ?? 0;
                                        return (
                                            <div key={product.id} className="bg-white rounded-2xl p-3 flex items-start gap-3">
                                                <div className="w-[72px] h-[72px] rounded-xl bg-[#E8F0FE] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                    {product.image ? (
                                                        <Image src={product.image} height={72} width={72} className="w-full h-full object-cover" alt={product.name} />
                                                    ) : (
                                                        <span className="text-xs text-primary font-bold">{product.name.slice(0, 2)}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-bold text-gray-800 truncate">{product.name}</h3>
                                                    <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{product.description}</p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className="text-sm font-bold text-gray-800">{formatPrice(product.price)}</span>
                                                        {qtyInCart > 0 ? (
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => setCartQuantity(product.id, qtyInCart - 1)}
                                                                    className="w-7 h-7 rounded-full bg-[#E8ECFF] flex items-center justify-center hover:bg-blue-100 transition"
                                                                >
                                                                    <Minus className="w-3.5 h-3.5 text-primary" />
                                                                </button>
                                                                <span className="text-sm font-semibold text-gray-800 w-4 text-center">{qtyInCart}</span>
                                                                <button
                                                                    onClick={() => setCartQuantity(product.id, qtyInCart + 1)}
                                                                    className="w-7 h-7 rounded-full bg-primary flex items-center justify-center hover:bg-blue-700 transition"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5 text-white" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => addToCart(product.id)}
                                                                className="h-8 px-3 rounded-full bg-primary text-white text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                                {t("auth.store.add")}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {step === "cart" && (
                        <div className="space-y-3 pt-2">
                            <h2 className="text-sm font-bold text-gray-800">{t("auth.store.reviewItems")}</h2>
                            {cartItems.length === 0 ? (
                                <div className="py-10 text-center text-sm text-gray-500">
                                    {t("auth.store.cartEmpty")}
                                </div>
                            ) : (
                                cartItems.map((item) => (
                                    <div key={item.product.id} className="bg-white rounded-2xl p-3 flex items-start gap-3">
                                        <div className="w-[72px] h-[72px] rounded-xl bg-[#E8F0FE] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {item.product.image ? (
                                                <Image src={item.product.image} height={72} width={72} className="w-full h-full object-cover" alt={item.product.name} />
                                            ) : (
                                                <span className="text-xs text-primary font-bold">{item.product.name.slice(0, 2)}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-gray-800 truncate">{item.product.name}</h3>
                                            <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{item.product.description}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-sm font-bold text-gray-800">{formatPrice(item.product.price)}</span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setCartQuantity(item.product.id, item.quantity - 1)}
                                                        className="w-7 h-7 rounded-full bg-[#E8ECFF] flex items-center justify-center hover:bg-blue-100 transition"
                                                    >
                                                        <Minus className="w-3.5 h-3.5 text-primary" />
                                                    </button>
                                                    <span className="text-sm font-semibold text-gray-800 w-4 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => setCartQuantity(item.product.id, item.quantity + 1)}
                                                        className="w-7 h-7 rounded-full bg-primary flex items-center justify-center hover:bg-blue-700 transition"
                                                    >
                                                        <Plus className="w-3.5 h-3.5 text-white" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {step === "checkout" && (
                        <div className="space-y-5 pt-2">
                            {/* Delivery Address */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 mb-3">Endereço de entrega</h3>
                                {selectedAddress ? (
                                    <>
                                        <div className="bg-white rounded-2xl border border-gray-100 p-4 relative">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-0.5 w-4 h-4 rounded-full border-[5px] border-primary bg-white flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-800">{selectedAddress.name}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{selectedAddress.phone}</p>
                                                    <p className="text-xs text-gray-400">{selectedAddress.location}</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setStep("change-address")}
                                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setStep("change-address")}
                                            className="mt-2 text-xs text-primary font-medium hover:underline"
                                        >
                                            + Adicionar novo endereço
                                        </button>
                                    </>
                                ) : (
                                    <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                                        <p className="text-sm text-gray-500 mb-3">{t("auth.store.addADeliveryAddress")}</p>
                                        <button
                                            type="button"
                                            onClick={() => setStep("add-address")}
                                            className="h-10 px-4 rounded-full bg-primary text-white text-sm font-semibold hover:bg-blue-700 transition"
                                        >
                                            {t("auth.store.addAddress")}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 mb-3">Método de pagamento</h3>
                                <div className="space-y-3">
                                    {/* Card */}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPayment("card")}
                                        className={`w-full bg-white rounded-2xl border p-3.5 flex items-center gap-3 text-left transition ${selectedPayment === 'card' ? 'border-primary' : 'border-gray-100'}`}
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                <rect x="2" y="4" width="20" height="16" rx="2" fill="#253B80" />
                                                <rect x="2" y="8" width="20" height="4" fill="#FFF" />
                                                <path d="M7 15h2M14 15h3" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                        <span className="flex-1 text-sm font-medium text-gray-700">Cartão de crédito débito</span>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${selectedPayment === 'card' ? 'border-primary' : 'border-gray-300'}`}>
                                            {selectedPayment === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                        </div>
                                    </button>
                                    {/* PIX */}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPayment("pix")}
                                        className={`w-full bg-white rounded-2xl border p-3.5 flex items-center gap-3 text-left transition ${selectedPayment === 'pix' ? 'border-primary' : 'border-gray-100'}`}
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-[#E6F9F1] flex items-center justify-center flex-shrink-0">
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 2L2 12l10 10 10-10L12 2z" fill="#32BCAD" />
                                                <path d="M12 7l-5 5 5 5 5-5-5-5z" fill="#E6F9F1" />
                                            </svg>
                                        </div>
                                        <span className="flex-1 text-sm font-medium text-gray-700">PIX</span>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${selectedPayment === 'pix' ? 'border-primary' : 'border-gray-300'}`}>
                                            {selectedPayment === 'pix' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === "change-address" && (
                        <div className="space-y-3 pt-2">
                            <h2 className="text-sm font-bold text-gray-800">{t("auth.store.changeAddress")}</h2>
                            {addresses.map((address) => {
                                const selected = address.id === selectedAddressId;
                                return (
                                    <button
                                        key={address.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedAddressId(address.id);
                                            setStep("checkout");
                                        }}
                                        className={`w-full rounded-2xl px-4 py-4 text-left border transition ${selected ? 'bg-[#EBF2FF] border-primary' : 'bg-white border-gray-100'}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-gray-800 truncate">{address.name}</div>
                                                <div className="mt-1 text-xs text-gray-400">{address.phone}</div>
                                                <div className="text-xs text-gray-400">{address.location}</div>
                                            </div>
                                            <div className="flex items-center mt-0.5">
                                                {selected ? <Check className="w-5 h-5 text-primary" /> : <div className="w-5 h-5" />}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => setStep("add-address")}
                                className="w-full h-12 rounded-full bg-primary text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                            >
                                <Plus className="w-4 h-4" />
                                {t("auth.store.addNewAddress")}
                            </button>
                        </div>
                    )}

                    {step === "add-address" && (
                        <div className="space-y-4 pt-2">
                            <h2 className="text-sm font-bold text-gray-800">{t("auth.store.addNewAddress")}</h2>
                            <div>
                                <label className="text-xs text-gray-500 mb-1.5 block">{t("auth.store.addressLabel")}</label>
                                <input
                                    value={newAddressForm.label}
                                    onChange={(e) => setNewAddressForm((p) => ({ ...p, label: e.target.value }))}
                                    placeholder={t("auth.store.addressLabelPlaceholder")}
                                    className="w-full h-12 rounded-xl bg-white border border-gray-100 px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1.5 block">{t("auth.store.phoneNumber")}</label>
                                <PhoneInput
                                    name="phone"
                                    value={newAddressForm.phone}
                                    onChange={(next) => setNewAddressForm((p) => ({ ...p, phone: next }))}
                                    defaultCountry="br"
                                    required
                                    inputClassName="!w-full !h-12 !rounded-xl !bg-white !border !border-gray-100 !text-sm !text-gray-800 placeholder:!text-gray-400 focus:!outline-none focus:!border-primary focus:!ring-1 focus:!ring-primary/20"
                                    buttonClassName="!h-12 !bg-white !border !border-gray-100 !rounded-xl"
                                    containerClassName="w-full"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1.5 block">{t("auth.store.address")}</label>
                                <input
                                    value={newAddressForm.address}
                                    onChange={(e) => setNewAddressForm((p) => ({ ...p, address: e.target.value }))}
                                    placeholder={t("auth.store.addressPlaceholder")}
                                    className="w-full h-12 rounded-xl bg-white border border-gray-100 px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1.5 block">{t("auth.store.city")}</label>
                                <input
                                    value={newAddressForm.city}
                                    onChange={(e) => setNewAddressForm((p) => ({ ...p, city: e.target.value }))}
                                    placeholder={t("auth.store.cityPlaceholder")}
                                    className="w-full h-12 rounded-xl bg-white border border-gray-100 px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1.5 block">{t("auth.store.state")}</label>
                                <select
                                    value={newAddressForm.state}
                                    onChange={(e) => setNewAddressForm((p) => ({ ...p, state: e.target.value }))}
                                    className="w-full h-12 rounded-xl bg-white border border-gray-100 px-4 text-sm text-gray-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                >
                                    <option value="" disabled>{t("auth.store.selectState")}</option>
                                    {brazilianStateOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.text}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1.5 block">{t("auth.store.postalCode")}</label>
                                <input
                                    type="text"
                                    value={newAddressForm.postalCode}
                                    onChange={(e) => setNewAddressForm((p) => ({ ...p, postalCode: e.target.value }))}
                                    placeholder={t("auth.store.postalCodePlaceholder")}
                                    className="w-full h-12 rounded-xl bg-white border border-gray-100 px-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                />
                            </div>
                            <button
                                onClick={handleSaveNewAddress}
                                className="w-full h-12 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition"
                            >
                                {t("auth.store.save")}
                            </button>
                        </div>
                    )}

                    {step === "success" && (
                        <div className="space-y-5 pt-2">
                            <div className="text-center">
                                <div className="w-14 h-14 rounded-full bg-[#EBF2FF] flex items-center justify-center mx-auto mb-3">
                                    <Check className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">{t("auth.store.orderPlaced")}</h3>
                                {lastOrder && (
                                    <p className="text-xs text-gray-400 mt-1">{t("auth.store.orderId")}: {lastOrder.id}</p>
                                )}
                            </div>

                            {lastOrder && (
                                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-50">
                                        <p className="text-sm font-bold text-gray-800">{lastOrder.address.name}</p>
                                        <p className="text-xs text-gray-400">{lastOrder.address.phone}</p>
                                        <p className="text-xs text-gray-400">{lastOrder.address.location}</p>
                                    </div>
                                    <div className="px-4 py-3 space-y-2">
                                        {lastOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-700">{item.name}</span>
                                                <span className="text-gray-400">{item.quantity}x</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedPayment === 'card' && lastOrder && (
                                <div className="space-y-3">
                                    <p className="text-sm font-semibold text-gray-800">{t("auth.store.payWithCard")}</p>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder={t("auth.store.cardNumber")}
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value)}
                                        className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder={t("auth.store.cardHolderName")}
                                        value={cardHolderName}
                                        onChange={(e) => setCardHolderName(e.target.value)}
                                        className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                                    />
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder={t("auth.store.cardDocument")}
                                        value={cardHolderDocument}
                                        onChange={(e) => setCardHolderDocument(e.target.value)}
                                        className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                                    />
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder={t("auth.store.expiryMonth")}
                                            value={cardExpMonth}
                                            onChange={(e) => setCardExpMonth(e.target.value)}
                                            className="h-12 flex-1 rounded-xl border border-gray-200 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                                        />
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder={t("auth.store.expiryYear")}
                                            value={cardExpYear}
                                            onChange={(e) => setCardExpYear(e.target.value)}
                                            className="h-12 flex-1 rounded-xl border border-gray-200 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                                        />
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder={t("auth.store.cvv")}
                                            value={cardCvv}
                                            onChange={(e) => setCardCvv(e.target.value)}
                                            className="h-12 w-24 rounded-xl border border-gray-200 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        disabled={payingWithCard || !lastOrder?.id}
                                        onClick={payStoreOrderWithCard}
                                        className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white disabled:opacity-60 hover:bg-blue-700 transition"
                                    >
                                        {payingWithCard ? t("auth.store.processing") : t("auth.store.payWithCard")}
                                    </button>
                                </div>
                            )}

                            {selectedPayment === 'pix' && lastOrder && (
                                <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                                    <div className="w-12 h-12 rounded-full bg-[#E6F9F1] flex items-center justify-center mx-auto mb-3">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2L2 12l10 10 10-10L12 2z" fill="#32BCAD" />
                                            <path d="M12 7l-5 5 5 5 5-5-5-5z" fill="#E6F9F1" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-800">PIX</p>
                                    <p className="text-xs text-gray-400 mt-1">Escaneie o QR code ou copie o código PIX para pagar.</p>
                                    <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                                        <p className="text-xs text-gray-500 font-mono break-all">00020126580014br.gov.bcb.pix0136pix@vetquark.com.br5204000053039865406200.005802BR5925VetQuark6009Sao Paulo62070503***6304</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { toast.success("Código PIX copiado!"); }}
                                        className="mt-3 h-10 px-5 rounded-full bg-[#E6F9F1] text-[#32BCAD] text-sm font-medium hover:bg-[#d0f0e6] transition"
                                    >
                                        Copiar código PIX
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step !== 'success' && step !== 'add-address' && step !== 'change-address' && (
                    <div className="px-5 pb-6 pt-3 bg-[#F8F9FD] border-t border-gray-100 shrink-0 space-y-3">
                        {step === "store" && (
                            <>
                                <button
                                    type="button"
                                    onClick={handleViewOrders}
                                    className="w-full h-11 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2"
                                >
                                    {t("auth.store.viewMyOrders")}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleViewCart}
                                    disabled={cartQuantity <= 0}
                                    className={`w-full h-11 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition flex items-center justify-between px-4 ${cartQuantity <= 0 ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="text-primary h-6 w-6 rounded-full bg-white flex justify-center items-center text-xs font-bold">
                                            {cartQuantity}
                                        </span>
                                        {t("auth.store.viewYourCart")}
                                    </span>
                                    <span className="text-sm font-bold">{formatPrice(cartTotal)}</span>
                                </button>
                            </>
                        )}
                        {step === "cart" && (
                            <>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Valor Total</span>
                                    <span className="font-bold text-gray-800">{formatPrice(cartTotal)}</span>
                                </div>
                                <button
                                    onClick={handleProceedToPurchase}
                                    disabled={cartQuantity <= 0}
                                    className={`w-full h-11 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition ${cartQuantity <= 0 ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    Seguir para compra
                                </button>
                            </>
                        )}
                        {step === "checkout" && (
                            <>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Valor Total</span>
                                    <span className="font-bold text-gray-800">{formatPrice(cartTotal)}</span>
                                </div>
                                <button
                                    onClick={handleProceedToPurchase}
                                    disabled={placingOrder || cartQuantity <= 0 || !selectedAddress}
                                    className={`w-full h-11 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition ${placingOrder || cartQuantity <= 0 || !selectedAddress ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    {placingOrder ? t("auth.store.placingOrder") : 'Finalizar compra'}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoreModal;
