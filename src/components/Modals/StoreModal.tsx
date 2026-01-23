'use client'
import { Check, ChevronLeft, MapPin, Minus, Plus, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from 'react';
import PhoneInput from "@/components/form/group-input/PhoneInput";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { toast } from "react-toastify";

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

type Product = {
    id: string;
    name: string;
    description: string;
    price: number;
};

const PRODUCTS: Product[] = [
    { id: "vetquark-box", name: "VetQuark Box", description: "Box with 100 units of reagent strips", price: 135 },
    { id: "svovmi", name: "SVOFMI", description: "Reagent strips pack", price: 75 },
    { id: "amoxylife-la", name: "Amoxylife-LA", description: "Long-acting antibiotic", price: 110 },
    { id: "vetquark-kits", name: "VetQuark Kits", description: "Starter kits for clinic use", price: 250 },
];

type Props = {
    isOpen: boolean;
    onClose?: () => void;
    onUpdated?: () => void;
};

const StoreModal: React.FC<Props> = ({ isOpen, onClose, onUpdated }) => {
    const router = useRouter()
    const [step, setStep] = useState<StoreStep>('store');
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [cart, setCart] = useState<Record<string, number>>({});
    const [placingOrder, setPlacingOrder] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState<string>("taltal");
    const [addresses, setAddresses] = useState<Address[]>([
        { id: "taltal", name: "Taltal Clinic", phone: "(205) 555-024", location: "Arcoverde, Pernambuco" },
        { id: "nova-vida", name: "Nova Vida Hospital", phone: "(205) 555-030", location: "Recife, Pernambuco" },
        { id: "saude-total", name: "Saúde Total Center", phone: "(205) 555-045", location: "Olinda, Pernambuco" },
        { id: "cuidado-familiar", name: "Cuidado Familiar Clinic", phone: "(205) 555-052", location: "Jaboatão dos Guararapes, Pernambuco" },
    ]);
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

    const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? addresses[0];

    const filteredProducts = PRODUCTS.filter((p) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return `${p.name} ${p.description}`.toLowerCase().includes(q);
    });

    const cartItems = Object.entries(cart)
        .map(([productId, quantity]) => {
            const product = PRODUCTS.find((p) => p.id === productId);
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
                toast.error("Your cart is empty");
                return;
            }
            setStep("checkout");
            return;
        }

        if (step === "checkout") {
            if (placingOrder) return;
            if (cartQuantity <= 0) {
                toast.error("Your cart is empty");
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
                    const msg = data?.error || "Failed to create order";
                    toast.error(msg);
                    return;
                }

                const orderId = typeof data?.order?.id === "string" ? data.order.id : `order_${Date.now()}`;
                setLastOrder({
                    id: orderId,
                    items: cartItems.map((i) => ({ name: i.product.name, quantity: i.quantity })),
                    total: cartTotal,
                    address: selectedAddress,
                });
                setCart({});
                setStep("success");
                toast.success("Order created");
                if (onUpdated) onUpdated();
            } finally {
                setPlacingOrder(false);
            }
        }
    };

    const handleViewCart = () => {
        if (cartQuantity <= 0) {
            toast.error("Your cart is empty");
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

    const handleSaveNewAddress = () => {
        const label = newAddressForm.label.trim();
        const phoneRaw = newAddressForm.phone.trim();
        const addressLine = newAddressForm.address.trim();
        const city = newAddressForm.city.trim();
        const state = newAddressForm.state.trim();
        const postalCode = newAddressForm.postalCode.trim();

        if (!label || !phoneRaw || !addressLine || !city || !state || !postalCode) {
            toast.error("Please fill all address fields");
            return;
        }

        const phone = parsePhoneNumberFromString(phoneRaw, "BR");
        if (!phone || !phone.isValid()) {
            toast.error("Please enter a valid phone number");
            return;
        }

        const id =
            typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto
                ? (globalThis.crypto as Crypto).randomUUID()
                : `addr_${Date.now()}_${Math.random().toString(16).slice(2)}`;

        const location = `${city}, ${state}`;
        const next: Address = {
            id,
            name: label,
            phone: phone.formatInternational(),
            location,
            addressLine,
            city,
            state,
            postalCode,
        };

        setAddresses((prev) => [...prev, next]);
        setSelectedAddressId(next.id);
        setNewAddressForm({
            label: "",
            phone: "",
            address: "",
            city: "",
            state: "",
            postalCode: "",
        });
        setStep("checkout");
        toast.success("Address added");
    };

    return (
        <div className="min-h-[100dvh] w-full bg-white">
            <div className="mx-auto w-full pb-6 pt-[calc(env(safe-area-inset-top)+20px)]">

                <div className=" flex items-center justify-between">
                    <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors" onClick={handleBack}>
                        <ChevronLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <h1 className="text-base font-medium text-gray-900">
                        {step === "store"
                            ? "Store"
                            : step === "cart"
                                ? "Cart"
                                : step === "checkout"
                                    ? "Checkout"
                                    : step === "success"
                                        ? "Order Confirmed"
                                    : step === "change-address"
                                        ? "Change Address"
                                        : "Add New Address"}
                    </h1>
                    {
                        step === "store" ?
                            <button className="w-12 h-12 bg-gray-10 rounded-full flex items-center justify-center relative" onClick={handleViewCart}>
                                <span className="h-10 w-10 flex justify-center items-center bg-[#F5F6F6] text-white text-sm rounded-full relative">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <path d="M17 18C15.89 18 15 18.89 15 20C15 20.5304 15.2107 21.0391 15.5858 21.4142C15.9609 21.7893 16.4696 22 17 22C17.5304 22 18.0391 21.7893 18.4142 21.4142C18.7893 21.0391 19 20.5304 19 20C19 19.4696 18.7893 18.9609 18.4142 18.5858C18.0391 18.2107 17.5304 18 17 18ZM1 2V4H3L6.6 11.59L5.24 14.04C5.09 14.32 5 14.65 5 15C5 15.5304 5.21071 16.0391 5.58579 16.4142C5.96086 16.7893 6.46957 17 7 17H19V15H7.42C7.3537 15 7.29011 14.9737 7.24322 14.9268C7.19634 14.8799 7.17 14.8163 7.17 14.75C7.17 14.7 7.18 14.66 7.2 14.63L8.1 13H15.55C16.3 13 16.96 12.58 17.3 11.97L20.88 5.5C20.95 5.34 21 5.17 21 5C21 4.73478 20.8946 4.48043 20.7071 4.29289C20.5196 4.10536 20.2652 4 20 4H5.21L4.27 2M7 18C5.89 18 5 18.89 5 20C5 20.5304 5.21071 21.0391 5.58579 21.4142C5.96086 21.7893 6.46957 22 7 22C7.53043 22 8.03914 21.7893 8.41421 21.4142C8.78929 21.0391 9 20.5304 9 20C9 19.4696 8.78929 18.9609 8.41421 18.5858C8.03914 18.2107 7.53043 18 7 18Z" fill="#2B2B2B" />
                                    </svg>
                                    {cartQuantity > 0 ? (
                                        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                                            {cartQuantity}
                                        </span>
                                    ) : null}
                                </span>
                            </button>
                            : <div className="w-12 h-12" />}

                </div>
                {
                    step === "store" ?
                        <div className="flex-1 relative mx-2">
                            <input
                                type="text"
                                placeholder="Search for an item"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-3 pl-12  rounded-xl focus:outline-none focus:border-primary bg-gray-100"
                            />
                            <svg
                                className="w-5 h-5 text-primary absolute left-4 top-1/2 -translate-y-1/2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                                <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div> :
                        step === "cart" ?
                            <div className="font-semibold text-base mx-2 mt-4">Review your items before payment
                            </div> : null
                }
                {step === "add-address" ? (
                    <div className="mt-6 px-4 pb-28">
                        <div className="space-y-5">
                            <div>
                                <div className="text-[14px] leading-[18px] text-[#111827] mb-2">
                                    Address Label
                                </div>
                                <input
                                    value={newAddressForm.label}
                                    onChange={(e) => setNewAddressForm((p) => ({ ...p, label: e.target.value }))}
                                    placeholder="e.g. My Clinic"
                                    className="w-full h-[52px] rounded-2xl bg-[#F3F4F6] px-4 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] outline-none"
                                />
                            </div>

                            <div>
                                <div className="text-[14px] leading-[18px] text-[#111827] mb-2">
                                    Phone Number
                                </div>
                                <PhoneInput
                                    name="phone"
                                    value={newAddressForm.phone}
                                    onChange={(next) => setNewAddressForm((p) => ({ ...p, phone: next }))}
                                    defaultCountry="br"
                                    required
                                    inputClassName="!w-full !h-[52px] !rounded-2xl !bg-[#F3F4F6] !border-0 !text-[15px] !text-[#111827] placeholder:!text-[#9CA3AF] focus:!outline-none"
                                    buttonClassName="!h-[52px] !bg-[#F3F4F6] !border-0 !rounded-2xl"
                                    containerClassName="w-full"
                                />
                            </div>

                            <div>
                                <div className="text-[14px] leading-[18px] text-[#111827] mb-2">
                                    Address
                                </div>
                                <input
                                    value={newAddressForm.address}
                                    onChange={(e) => setNewAddressForm((p) => ({ ...p, address: e.target.value }))}
                                    placeholder="Enter your address"
                                    className="w-full h-[52px] rounded-2xl bg-[#F3F4F6] px-4 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] outline-none"
                                />
                            </div>

                            <div>
                                <div className="text-[14px] leading-[18px] text-[#111827] mb-2">
                                    City
                                </div>
                                <input
                                    value={newAddressForm.city}
                                    onChange={(e) => setNewAddressForm((p) => ({ ...p, city: e.target.value }))}
                                    placeholder="Enter your city name"
                                    className="w-full h-[52px] rounded-2xl bg-[#F3F4F6] px-4 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] outline-none"
                                />
                            </div>

                            <div>
                                <div className="text-[14px] leading-[18px] text-[#111827] mb-2">
                                    State
                                </div>
                                <select
                                    value={newAddressForm.state}
                                    onChange={(e) => setNewAddressForm((p) => ({ ...p, state: e.target.value }))}
                                    className="w-full h-[52px] rounded-2xl bg-[#F3F4F6] px-4 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] outline-none"
                                >
                                    <option value="" disabled>
                                        Select a state
                                    </option>
                                    {brazilianStateOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.text}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="text-[14px] leading-[18px] text-[#111827] mb-2">
                                    Postal Code
                                </div>
                                <input
                                    value={newAddressForm.postalCode}
                                    onChange={(e) => setNewAddressForm((p) => ({ ...p, postalCode: e.target.value }))}
                                    placeholder="Enter postal code i.e 27492"
                                    className="w-full h-[52px] rounded-2xl bg-[#F3F4F6] px-4 text-[15px] text-[#111827] placeholder:text-[#9CA3AF] outline-none"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSaveNewAddress}
                            className="w-full bg-primary text-white mt-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition"
                        >
                            Save
                        </button>
                    </div>
                ) : step === "change-address" ? (
                    <div className="mt-4 px-4 pb-24">
                        <div className="space-y-3">
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
                                        className={[
                                            "w-full rounded-2xl px-4 py-4 text-left",
                                            selected ? "bg-[#EBF2FF]" : "bg-[#F3F4F6]",
                                        ].join(" ")}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-[16px] leading-[20px] font-semibold text-[#111827] truncate">
                                                    {address.name}
                                                </div>
                                                <div className="mt-2 text-[14px] leading-[18px] text-[#9CA3AF]">
                                                    {address.phone}
                                                </div>
                                                <div className="mt-1 text-[14px] leading-[18px] text-[#9CA3AF]">
                                                    {address.location}
                                                </div>
                                            </div>

                                            <div className="flex items-center">
                                                {selected ? <Check className="w-5 h-5 text-[#4A7BF7]" /> : <div className="w-5 h-5" />}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="fixed left-0 right-0 bottom-0 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3">
                            <button
                                type="button"
                                onClick={() => setStep("add-address")}
                                className="w-full h-[56px] rounded-full bg-[#4A7BF7] text-white text-[16px] font-medium flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Add New Address
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={`mt-6 space-y-4 p-4 rounded-[16px] ${step === "store" && "bg-[#F5F6F6]"} `}>
                        <div className="bg-gray-0 rounded-2xl max-h-[85vh] relative">
                            {/* Content */}
                            <div className="p- bg-transparent">
                                {/* Header */}

                                {step === 'store' ? (
                                    <div className='flex flex-col justify-between h-[70vh]'>
                                        <div className="space-y-4 mb-6 overflow-y-auto max-h-[calc(70vh-120px)] pr-">
                                            {filteredProducts.length === 0 ? (
                                                <div className="py-10 text-center text-sm text-gray-500">
                                                    No items found
                                                </div>
                                            ) : (
                                                filteredProducts.map((product) => {
                                                    const qtyInCart = cart[product.id] ?? 0;
                                                    return (
                                                        <div key={product.id} className="h-[92px] rounded-[12px] p-2 flex items-start gap-4 bg-white">
                                                            <div className="w-[80px] h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                                                VetQuark
                                                            </div>

                                                            <div className="flex-1 text-xs">
                                                                <h3 className="font-semibold text-gray-800">{product.name}</h3>
                                                                <p className="max-w-[180px] text-gray-400">{product.description}</p>
                                                                <div className='flex justify-between items-center gap-2'>
                                                                    <p className="text-base font-bold text-gray-800">R$ {product.price.toFixed(2)}</p>
                                                                    <div className="flex items-center gap-2">
                                                                        {qtyInCart > 0 ? (
                                                                            <span className="text-xs text-gray-500">{qtyInCart} in cart</span>
                                                                        ) : null}
                                                                        <button
                                                                            onClick={() => addToCart(product.id)}
                                                                            className="h-8 px-3 rounded-full bg-primary text-white text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1"
                                                                        >
                                                                            <Plus className="w-4 h-4" />
                                                                            Add
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                ) : step === 'cart' ? (
                                    <div className='flex flex-col justify-between h-[70vh]'>
                                        <div className="space-y-4 mb-6 overflow-y-auto max-h-[calc(70vh-120px)] pr-">
                                            {cartItems.length === 0 ? (
                                                <div className="py-10 text-center text-sm text-gray-500">
                                                    Your cart is empty
                                                </div>
                                            ) : (
                                                cartItems.map((item) => (
                                                    <div key={item.product.id} className="h-[92px] rounded-[12px] p-2 flex items-start gap-4 bg-white">
                                                        <div className="w-[80px] h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                                            VetQuark
                                                        </div>

                                                        <div className="flex-1 text-xs">
                                                            <h3 className="font-semibold text-gray-800">{item.product.name}</h3>
                                                            <p className="max-w-[180px] text-gray-400">{item.product.description}</p>
                                                            <div className='flex justify-between items-center gap-2'>
                                                                <p className="text-base font-bold text-gray-800">R$ {item.product.price.toFixed(2)}</p>
                                                                <div className="flex items-center">
                                                                    <button
                                                                        onClick={() => setCartQuantity(item.product.id, item.quantity - 1)}
                                                                        className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition"
                                                                    >
                                                                        <Minus className="w-4 h-4 text-primary" />
                                                                    </button>
                                                                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                                                                    <button
                                                                        onClick={() => setCartQuantity(item.product.id, item.quantity + 1)}
                                                                        className="w-6 h-6 rounded-full bg-primary flex items-center justify-center hover:bg-blue-700 transition"
                                                                    >
                                                                        <Plus className="w-4 h-4 text-white" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ) : step === "checkout" ? (
                                    <div className='h-[70vh]'>
                                        <DeliveryAddress
                                            address={selectedAddress}
                                            onChangeAddress={() => setStep("change-address")}
                                            onAddNewAddress={() => setStep("add-address")}
                                        />
                                        <div className="h-2 bg-secondary" />
                                        <OrderSummary items={cartItems.map((i) => ({ name: i.product.name, quantity: i.quantity }))} />
                                    </div>
                                ) : (
                                    <div className='h-[70vh] px-4 py-6 overflow-y-auto'>
                                        <div className="text-lg font-semibold text-gray-900">Order placed</div>
                                        {lastOrder ? (
                                            <div className="mt-1 text-sm text-gray-500">Order ID: {lastOrder.id}</div>
                                        ) : null}
                                        {lastOrder ? (
                                            <div className="mt-4 rounded-2xl bg-white border border-gray-100">
                                                <div className="px-4 py-4 border-b border-gray-100">
                                                    <div className="text-sm font-semibold text-gray-900">{lastOrder.address.name}</div>
                                                    <div className="text-sm text-gray-500">{lastOrder.address.phone}</div>
                                                    <div className="text-sm text-gray-500">{lastOrder.address.location}</div>
                                                </div>
                                                <OrderSummary items={lastOrder.items} />
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4 bordert p-4 rounded-t-4xl bg-white absolute w-full bottom-0 z-300">
                                {
                                    step === "store" ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handleViewOrders}
                                                className="w-full bg-[#F5F6F6] text-black py-2 rounded-full font-semibold px-3 flex items-center justify-center hover:bg-gray-200 transition"
                                            >
                                                View My Orders
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleViewCart}
                                                disabled={cartQuantity <= 0}
                                                className={[
                                                    "w-full bg-primary text-white py-2 rounded-full font-semibold px-3 flex justify-between items-center hover:bg-blue-700 transition",
                                                    cartQuantity <= 0 ? "opacity-50 pointer-events-none" : "",
                                                ].join(" ")}
                                            >
                                                <span className='text-base text-primary h-6 w-6 rounded-full bg-white flex justify-center items-center'>
                                                    {cartQuantity}
                                                </span>
                                                View Your Cart
                                                <span className='text-sm font-bold text-white'>R$ {cartTotal.toFixed(2)}</span>
                                            </button>
                                        </>
                                    ) : step === "cart" ? (
                                        <>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">Total Amount</span>
                                                <span className="font-bold text-gray-800">R$ {cartTotal.toFixed(2)}</span>
                                            </div>
                                            <button
                                                onClick={handleProceedToPurchase}
                                                disabled={cartQuantity <= 0}
                                                className={[
                                                    "w-full bg-primary text-white py-2 rounded-full font-semibold hover:bg-blue-700 transition",
                                                    cartQuantity <= 0 ? "opacity-50 pointer-events-none" : "",
                                                ].join(" ")}
                                            >
                                                Proceed to checkout
                                            </button>
                                        </>
                                    ) : step === "checkout" ? (
                                        <>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">Total Amount</span>
                                                <span className="font-bold text-gray-800">R$ {cartTotal.toFixed(2)}</span>
                                            </div>
                                            <button
                                                onClick={handleProceedToPurchase}
                                                disabled={placingOrder || cartQuantity <= 0}
                                                className={[
                                                    "w-full bg-primary text-white py-2 rounded-full font-semibold hover:bg-blue-700 transition",
                                                    placingOrder || cartQuantity <= 0 ? "opacity-50 pointer-events-none" : "",
                                                ].join(" ")}
                                            >
                                                {placingOrder ? "Placing order..." : "Place order"}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={handleClose}
                                            className="w-full bg-primary text-white py-2 rounded-full font-semibold hover:bg-blue-700 transition"
                                        >
                                            Done
                                        </button>
                                    )
                                }
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

    );
};

export default StoreModal;


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

interface DeliveryAddressProps {
    address: Address;
    onChangeAddress?: () => void;
    onAddNewAddress?: () => void;
}

const DeliveryAddress = ({ address, onChangeAddress, onAddNewAddress }: DeliveryAddressProps) => {
    return (
        <div className="px-4 py-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" fill="hsl(var(--primary))" />
                    <span className="text-base font-semibold text-foreground">Delivery Address</span>
                </div>
                <button
                    onClick={onChangeAddress}
                    className="text-primary text-base font-medium"
                >
                    Change
                </button>
            </div>

            {/* Address Card */}
            <div className="border border-border rounded-lg p-4 mb-3">
                <h3 className="text-base font-semibold text-foreground mb-1">{address.name}</h3>
                <p className="text-muted-foreground text-sm mb-0.5">{address.phone}</p>
                <p className="text-muted-foreground text-sm">{address.location}</p>
            </div>

            {/* Add New Address */}
            <div className="flex justify-end">
                <button
                    onClick={onAddNewAddress}
                    className="text-primary text-base font-medium"
                >
                    + Add New Address
                </button>
            </div>
        </div>
    );
};


interface OrderItem {
    name: string;
    quantity: number;
}

interface OrderSummaryProps {
    items: OrderItem[];
}

const OrderSummary = ({ items }: OrderSummaryProps) => {
    return (
        <div className="px-4 py-5">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Ticket className="w-5 h-5 text-primary" />
                <span className="text-base font-semibold text-foreground">Order Summary</span>
            </div>

            {/* Items List */}
            <div className="space-y-3">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                        <span className="text-base text-foreground">{item.name}</span>
                        <span className="text-base text-muted-foreground">{item.quantity}x</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
