'use client'
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Briefcase, Edit, Edit2, Home, Minus, Plus, Send, X } from 'lucide-react';
import { Modal } from '../ui/modal';
import { toast } from 'react-toastify';
import Image from 'next/image';

type Props = {
    isOpen: boolean;
    onClose?: () => void;
    onUpdated?: () => void;
};

const StoreModal: React.FC<Props> = ({ isOpen, onClose, onUpdated }) => {
    const [step, setStep] = useState<'cart' | 'checkout'>('cart');
    const [quantities, setQuantities] = useState<number[]>([1, 1, 1, 1, 1, 1, 1, 1]);
    const [selectedPayment, setSelectedPayment] = useState<'card' | 'pix'>('card');

    const handleIncrease = (index: number) => {
        const newQuantities = [...quantities];
        newQuantities[index] += 1;
        setQuantities(newQuantities);
    };

    const handleDecrease = (index: number) => {
        const newQuantities = [...quantities];
        if (newQuantities[index] > 1) {
            newQuantities[index] -= 1;
            setQuantities(newQuantities);
        }
    };

    const getTotalAmount = () => {
        const total = quantities.reduce((sum, qty) => sum + (qty * 135), 0);
        return total;
    };

    const handleProceedToPurchase = () => {
        setStep('checkout');
    };

    const handleBack = () => {
        if (step === 'checkout') {
            setStep('cart');
        } else {
            onClose && onClose();
        }
    };

    const handleClose = () => {
        setStep('cart');
        setQuantities([1, 1]);
        onClose && onClose();
    };

    const handleCompletePurchase = () => {
        // Handle purchase completion
        console.log('Purchase completed');
        handleClose();
        if (onUpdated) onUpdated();
    };

    return (
        <div className="bg-gray-50 rounded-2xl max-h-[85vh] relative">
            {/* Content */}
            <div className="p- bg-transparent">
                {/* Header */}

                {step === 'cart' ? (
                    <div className='flex flex-col justify-between h-[70vh]'>
                        {/* Cart Items */}
                        <div className="space-y-4 mb-6 overflow-y-auto max-h-[calc(70vh-120px)] pr-">
                            {quantities.map((qty, index) => (
                                <div key={index} className="h-[92px] rounded-[12px] p-2 flex items-start gap-4 bg-white">
                                    <div className="w-[80px] h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                        VETRIX
                                    </div>

                                    <div className="flex-1 text-xs">
                                        <h3 className="font-semibold text-gray-800">Vetrix Box</h3>
                                        <p className="max-w-[110px] text-gray-400">Box with 100 units of reagent strips</p>
                                        <div className='flex justify-between items-center gap-2'>
                                            <p className="text-base font-bold text-gray-800">£135.00</p>
                                            <div className="flex items-center">
                                                <button
                                                    onClick={() => handleDecrease(index)}
                                                    className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition"
                                                >
                                                    <Minus className="w-4 h-4 text-primary" />
                                                </button>
                                                <span className="w-8 text-center font-semibold">{qty}</span>
                                                <button
                                                    onClick={() => handleIncrease(index)}
                                                    className="w-6 h-6 rounded-full bg-primary flex items-center justify-center hover:bg-blue-700 transition"
                                                >
                                                    <Plus className="w-4 h-4 text-white" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            ))}
                        </div>

                        {/* Total and Button */}

                    </div>
                ) : (
                    <div className='flex flex-col justify-between h-[70vh]'>
                        <div className="flex flex-col">
                            {/* Delivery Address */}
                            <div className="mb-1">
                                <h3 className="text-base font-semibold text-gray-800 mb-4">Delivery address</h3>

                                <div className="rounded-md p-2 border bg-white relative">
                                    <div className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full border-2 border-primary bg-white mt-1 flex-shrink-0 flex items-center justify-center">
                                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                                        </div>

                                        <div className="flex-1 text-sm">
                                            <h4 className="font-semibold text-gray-800 mb-1">Taltal Clinic</h4>
                                            <p className="text-gray-400">(205) 555-024</p>
                                            <p className="text-gray-400">Arcoverde, Pernambuco</p>
                                        </div>

                                        <button className="w-8 h-8 rounded-lg bg-white flex items-center justify-center hover:bg-gray-50 transition">
                                            <Edit className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </div>
                                </div>

                                <button className="w-full text-primary/90 font-medium py-2 flex items-center justify-between gap-2 hover:bg-blue-50 rounded-lg transition">
                                    <div className='w-1/3'></div>
                                    <div className='w-1/3 text-center'>
                                        <Plus className="w-4 h-4 text-center mx-auto" />
                                    </div>
                                    <p className='text-xs w-1/3 whitespace-nowrap'>
                                        Add new address
                                    </p>
                                </button>
                            </div>

                            {/* Payment Method */}
                            <div className="mb-6">
                                <h3 className="text-base font-semibold text-gray-800 mb-4">Payment method</h3>

                                <div className="space-y-3">
                                    <div
                                        onClick={() => setSelectedPayment('card')}
                                        className={`border-2 ${selectedPayment === 'card' ? 'border-primary bg-blue-50' : 'border-gray-200'} rounded-xl p-2 hover:border-blue-300 transition cursor-pointer`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Image src="/images/dashboard/paypal.svg" alt="Credit/debit card" width={36} height={36} />
                                            </div>

                                            <span className="text-sm flex-1 font-medium text-gray-800">Credit/debit card</span>

                                            <div className={`w-5 h-5 rounded-full border-2 ${selectedPayment === 'card' ? 'border-primary' : 'border-gray-300'} flex items-center justify-center`}>
                                                {selectedPayment === 'card' && (
                                                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setSelectedPayment('pix')}
                                        className={`border-2 ${selectedPayment === 'pix' ? 'border-primary bg-blue-50' : 'border-gray-200'} rounded-xl p-2 hover:border-blue-300 transition cursor-pointer`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Image src="/images/dashboard/pix.svg" alt="PIX" width={36} height={36} />
                                            </div>

                                            <span className="text-sm flex-1 font-medium text-gray-800">PIX</span>

                                            <div className={`w-5 h-5 rounded-full border-2 ${selectedPayment === 'pix' ? 'border-primary' : 'border-gray-300'} flex items-center justify-center`}>
                                                {selectedPayment === 'pix' && (
                                                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Total and Button */}
                        <div className="space-y-4 border-t pt-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Total Amount</span>
                                <span className=" font-bold text-gray-800">R$ {getTotalAmount().toFixed(2)}</span>
                            </div>

                            <button
                                onClick={handleCompletePurchase}
                                className="w-full bg-primary text-white py-2 rounded-xl font-semibold hover:bg-blue-700 transition"
                            >
                                Complete purchase
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className="space-y-4 bordert p-4 rounded-t-4xl bg-white absolute w-full bottom-0 z-300">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Total Amount</span>
                    <span className=" font-bold text-gray-800">R$ {getTotalAmount().toFixed(2)}</span>
                </div>

                <button
                    onClick={handleProceedToPurchase}
                    className="w-full bg-primary text-white py-2 rounded-full font-semibold hover:bg-blue-700 transition"
                >
                    Proceed to purchase
                </button>
            </div>
        </div>
    );
};

export default StoreModal;
