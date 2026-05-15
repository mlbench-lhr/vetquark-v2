'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

interface SaldoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function maskPixKey(payoutMethod: any, fallback = '***222.***-00'): string {
  if (!payoutMethod || typeof payoutMethod !== 'object') return fallback;
  const raw =
    typeof payoutMethod.pixKey === 'string'
      ? payoutMethod.pixKey
      : typeof payoutMethod.holderCpfCnpj === 'string'
        ? payoutMethod.holderCpfCnpj
        : '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 6) return `***${digits.slice(3, 6)}.***-${digits.slice(-2)}`;
  return raw ? '***' : fallback;
}

const SaldoModal: React.FC<SaldoModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const profile = useAppSelector((s: RootState) => s.userProfile.profile);

  const [balance, setBalance] = useState(0);
  const [balanceLabel, setBalanceLabel] = useState('R$ 0,00');
  const [amountInput, setAmountInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const payoutMethod = (profile as any)?.payoutMethod;
  const pixLabel =
    payoutMethod?.type === 'pix'
      ? `PIX (CPF/CNPJ): ${maskPixKey(payoutMethod)}`
      : payoutMethod?.type === 'bank'
        ? `Banco: ${payoutMethod.bankName || ''}`
        : 'PIX (CPF/CNPJ): ***222.***-00';

  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/wallet', { credentials: 'include' });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        const num = typeof data.balance === 'number' ? data.balance : 0;
        setBalance(num);
        setBalanceLabel(
          `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        );
        if (!amountInput) {
          setAmountInput(
            num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          );
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isOpen) {
      fetchBalance();
    }
  }, [isOpen, fetchBalance]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEditToggle = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const handleAmountBlur = () => {
    setIsEditing(false);
  };

  const parseAmount = (str: string): number => {
    const cleaned = str.replace(/[^\d,\.]/g, '');
    const normalized = cleaned.replace(',', '.');
    const num = parseFloat(normalized);
    return Number.isFinite(num) && num > 0 ? num : 0;
  };

  const displayAmount = (): string => {
    if (!amountInput) return 'R$ 0,00';
    const num = parseAmount(amountInput);
    if (num === 0) return 'R$ 0,00';
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleWithdraw = async () => {
    const amount = parseAmount(amountInput);
    if (!amount || amount <= 0) {
      toast.error('Insira um valor válido');
      return;
    }
    if (amount > balance) {
      toast.error('Valor maior que o saldo disponível');
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(typeof data?.error === 'string' ? data.error : 'Falha ao sacar');
        return;
      }
      toast.success('Saque solicitado com sucesso');
      await fetchBalance();
      onClose();
    } catch {
      toast.error('Erro de rede');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-150 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-full max-w-sm bg-white rounded-3xl px-6 py-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top row */}
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Title */}
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#2563EB" strokeWidth="1.8" />
              <path d="M12 7v1m0 8v1M9.5 9.5C9.5 8.67 10.67 8 12 8s2.5.67 2.5 1.5S13.33 11 12 11s-2.5.83-2.5 1.5S10.67 16 12 16s2.5-.67 2.5-1.5" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-base font-semibold text-gray-800">Saldo</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center shadow-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Balance */}
        <div className="text-center mb-6">
          {loading ? (
            <div className="h-10 w-40 mx-auto bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <p className="text-[40px] font-bold text-primary leading-none tracking-tight">
              {balanceLabel}
            </p>
          )}
        </div>

        {/* Withdrawal amount field */}
        <div
          className="border border-gray-200 rounded-2xl px-4 pt-3 pb-4 mb-3 cursor-pointer"
          onClick={handleEditToggle}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Valor do saque</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              onBlur={handleAmountBlur}
              className="text-2xl font-bold text-gray-900 w-full outline-none border-none bg-transparent"
              placeholder="0,00"
            />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{displayAmount()}</p>
          )}
        </div>

        {/* Payment method */}
        <div className="border border-gray-200 rounded-2xl px-4 py-4 mb-6">
          <p className="text-xs text-gray-500 mb-1">Método de recebimento:</p>
          <p className="text-sm font-semibold text-gray-900 mb-1">{pixLabel}</p>
          <button
            type="button"
            onClick={() => { onClose(); router.push('/Veterinarian/Menu/wallet/bankDetails'); }}
            className="text-sm font-medium text-primary hover:underline"
          >
            Alterar dados bancários
          </button>
        </div>

        {/* Sacar button */}
        <button
          type="button"
          onClick={handleWithdraw}
          disabled={submitting}
          className="w-full bg-primary hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-base py-4 rounded-2xl transition-colors"
        >
          {submitting ? 'Processando...' : 'sacar'}
        </button>
      </div>
    </div>
  );
};

export default SaldoModal;
