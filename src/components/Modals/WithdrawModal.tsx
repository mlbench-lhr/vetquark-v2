'use client'
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Briefcase, Edit, Edit2, Home, Minus, Plus, Send, X } from 'lucide-react';
import { Modal } from '../ui/modal';
import { toast } from 'react-toastify';
import Image from 'next/image';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onUpdated?: () => void;
};

const WithdrawModal: React.FC<Props> = ({ isOpen, onClose, onUpdated }) => {
    const [balance] = useState<number>(925.00);
    const [withdrawAmount, setWithdrawAmount] = useState<string>('40.00');
    const [paymentMethod] = useState<string>('PIX (CPF/CNPJ): ***222***-00');

    const handleClose = () => {
        setWithdrawAmount('40.00');
        onClose();
    };

    const handleWithdraw = () => {
        console.log('Withdraw amount:', withdrawAmount);
        handleClose();
        if (onUpdated) onUpdated();
    };

    const handleEditAmount = () => {
        // Focus on input or show edit state
        console.log('Edit amount');
    };

    const handleChangeBankDetails = () => {
        console.log('Change bank details');
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[350px] w-full">
            <div className="bg-gray-50 rounded-2xl">
                <div className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <button
                            onClick={handleClose}
                            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition invisible"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-700" />
                        </button>

                        <div className="flex items-center gap-2">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xl font-semibold text-primary">Balance</span>
                        </div>

                        <button
                            onClick={handleClose}
                            className="w-10 h-10 rounded-full  flex items-center justify-center hover:bg-gray-200 transition"
                        >
                            <X className="w-5 h-5 text-gray-700" />
                        </button>
                    </div>

                    {/* Balance Display */}
                    <div className="text-center mb-8">
                        <div className="text-5xl font-bold text-primary">£{balance.toFixed(2)}</div>
                    </div>

                    {/* Withdrawal Amount */}
                    <div className="mb-6">
                        <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                                <label className="text-sm text-gray-500">Withdrawal amount</label>
                                <button 
                                    onClick={handleEditAmount}
                                    className="text-gray-400 hover:text-gray-600 transition"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="text-2xl font-bold text-gray-800">
                                £{withdrawAmount}
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="mb-8">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                            <div className="text-sm text-gray-500 mb-1">Payment method:</div>
                            <div className="font-semibold text-gray-800 mb-2">{paymentMethod}</div>
                            <button 
                                onClick={handleChangeBankDetails}
                                className="text-sm text-primary hover:text-blue-700 font-medium"
                            >
                                Change bank details
                            </button>
                        </div>
                    </div>

                    {/* Withdraw Button */}
                    <button
                        onClick={handleWithdraw}
                        className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
                    >
                        withdraw
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default WithdrawModal;
