'use client'
import { useCallback, useEffect, useState, ChangeEvent, useRef } from 'react';
import { RefreshCw, ChevronDown, ChevronUp, Pencil, User, Plus } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { asNonEmptyTrimmedString, isMongoObjectId } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store/store';
import Pusher from 'pusher-js';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/modal';
import TypedDateInput from '@/components/form/input/TypedDateInput';
import Header from '@/components/common/header';
import PhotoCropScreen from './PhotoCropScreen';

type Step = 1 | 2 | 3 | 4 | 5;

interface PatientFormData {
  // Step 1 - Identifications
  photo: string | null;
  animalName: string;
  microchip: string;
  species: string;
  breed: string;
  sex: 'Male' | 'Female' | '';
  dateOfBirth: string;
  ageYears: string;

  // Step 2 - Additional Information
  temperament: string;
  size: string;
  coat: string;
  neutered: 'Yes' | 'No' | '';
  rga: string;

  // Step 3 - Health Plan
  planName: string;
  cardNumber: string;
  cardValidity: string;

  // Step 4 - Clinical Information
  allergies: string;
  chronicDiseases: string;
  otherInformation: string;
  internalNotes: string;
}

export default function AddPatientMultiStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const profile = useAppSelector((s: RootState) => s.userProfile.profile);
  const userId = profile?.id || '';
  const [unreadCount, setUnreadCount] = useState(0);
  const { t } = useTranslation();
  const patientId = (searchParams.get('patientId') || '').trim() || null;
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isAlive, setIsAlive] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [linkedGuardian, setLinkedGuardian] = useState<{
    id: string;
    fullName: string;
    taxId: string;
    imageUrl?: string;
  } | null>(null);
  const [formData, setFormData] = useState<PatientFormData>({
    photo: null,
    animalName: '',
    microchip: '',
    species: '',
    breed: '',
    sex: '',
    dateOfBirth: '',
    ageYears: '',
    temperament: '',
    size: '',
    coat: '',
    neutered: '',
    rga: '',
    planName: '',
    cardNumber: '',
    cardValidity: '',
    allergies: '',
    chronicDiseases: '',
    otherInformation: '',
    internalNotes: ''
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tempPhotoUrl, setTempPhotoUrl] = useState<string | null>(null);
  const [tempPhotoFile, setTempPhotoFile] = useState<File | null>(null);
  const [showCropPreview, setShowCropPreview] = useState(false);
  const changeImageInputRef = useRef<HTMLInputElement>(null);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread_count', { method: 'GET' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setUnreadCount(0);
        return;
      }
      const next = Number(data?.count || 0);
      setUnreadCount(Number.isFinite(next) && next > 0 ? next : 0);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread, userId]);

  useEffect(() => {
    if (!userId) return;
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    const pusher = new Pusher(key, { cluster, authEndpoint: '/api/pusher/auth' });
    const channelName = `private-notifications-${userId}`;
    const channel = pusher.subscribe(channelName);

    const handler = () => {
      setUnreadCount((prev) => (prev > 0 ? prev + 1 : 1));
    };
    channel.bind('notification:new', handler);

    return () => {
      channel.unbind('notification:new', handler);
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshUnread();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [refreshUnread]);

  useEffect(() => {
    if (patientId) {
      let mounted = true;
      (async () => {
        try {
          setLoadingPatient(true);
          const res = await fetch(`/api/patient/get_patient_details?patientId=${encodeURIComponent(patientId)}`);
          const json = await res.json();
          if (!res.ok) {
            return;
          }
          const item = (json as any)?.item;
          if (!mounted || !item) return;

          setFormData({
            photo: item.photo ?? null,
            animalName: item.animalName ?? '',
            microchip: item.microchip ?? '',
            species: item.species ?? '',
            breed: item.breed ?? '',
            sex: item.sex ?? '',
            dateOfBirth: item.dateOfBirth ?? '',
            ageYears: typeof item.ageYears === 'number' ? String(item.ageYears) : '',
            temperament: item.temperament ?? '',
            size: item.size ?? '',
            coat: item.coat ?? '',
            neutered: item.neutered ?? '',
            rga: item.rga ?? '',
            planName: item.planName ?? '',
            cardNumber: item.cardNumber ?? '',
            cardValidity: item.cardValidity ?? '',
            allergies: item.allergies ?? '',
            chronicDiseases: item.chronicDiseases ?? '',
            otherInformation: item.otherInformation ?? '',
            internalNotes: item.internalNotes ?? '',
          });
          setIsAlive(typeof item.isAlive === 'boolean' ? item.isAlive : true);

          const g = item.guardian;
          if (g && typeof g === 'object') {
            const gid = String(g.id || '').trim();
            if (gid) {
              setLinkedGuardian({
                id: gid,
                fullName: String(g.fullName || '').trim() || 'N/A',
                taxId: String(g.taxId || '').trim(),
                imageUrl: String(g.profileImageUrl || g.avatarUrl || '').trim(),
              });
            }
          }
        } finally {
          if (mounted) setLoadingPatient(false);
        }
      })();
      return () => {
        mounted = false;
      };
    }

    const guardianId = (searchParams.get('guardianId') || '').trim();
    const guardianName = (searchParams.get('guardianName') || '').trim();
    const guardianTaxId = (searchParams.get('guardianTaxId') || '').trim();
    const guardianImage = (searchParams.get('guardianImage') || '').trim();
    if (guardianId) {
      setLinkedGuardian({
        id: guardianId,
        fullName: guardianName || 'N/A',
        taxId: guardianTaxId,
        imageUrl: guardianImage,
      });
    } else {
      setLinkedGuardian(null);
    }
  }, [patientId, searchParams]);

  const validateStep = (step: Step) => {
    if (step === 1) {
      if (!patientId) {
        const guardianId = linkedGuardian?.id || '';
        if (!guardianId || !isMongoObjectId(guardianId)) {
          toast.error(t('newPatient.patientForm.linkGuardianFirst'));
          return false;
        }
      }
      const animalName = asNonEmptyTrimmedString(formData.animalName);
      if (!animalName) {
        toast.error(t('newPatient.patientForm.animalNameRequired'));
        return false;
      }
      const microchip = asNonEmptyTrimmedString(formData.microchip);
      const species = asNonEmptyTrimmedString(formData.species);
      if (!species) {
        toast.error(t('newPatient.patientForm.speciesRequired'));
        return false;
      }
      const breed = asNonEmptyTrimmedString(formData.breed);
      if (!breed) {
        toast.error(t('newPatient.patientForm.breedRequired'));
        return false;
      }
      const sex = formData.sex;
      if (!(sex === 'Male' || sex === 'Female')) {
        toast.error(t('newPatient.patientForm.sexRequired'));
        return false;
      }
      const dob = asNonEmptyTrimmedString(formData.dateOfBirth);
      const ageRaw = (formData.ageYears || '').trim();
      const ageNum = ageRaw ? Number(ageRaw) : NaN;
      const hasAge = Number.isFinite(ageNum) && ageNum >= 0;
      if (!dob && !hasAge) {
        toast.error(t('newPatient.patientForm.dateOrAgeRequired') || 'Provide date of birth or age');
        return false;
      }
      return true;
    }
    if (step === 2) {
      const temperament = asNonEmptyTrimmedString(formData.temperament);
      if (!temperament) {
        toast.error(t('newPatient.patientForm.temperamentRequired'));
        return false;
      }
      const size = asNonEmptyTrimmedString(formData.size);
      if (!size) {
        toast.error(t('newPatient.patientForm.sizeRequired'));
        return false;
      }
      const coat = asNonEmptyTrimmedString(formData.coat);
      if (!coat) {
        toast.error(t('newPatient.patientForm.coatRequired'));
        return false;
      }
      const neutered = formData.neutered;
      if (!(neutered === 'Yes' || neutered === 'No')) {
        toast.error(t('newPatient.patientForm.neuteredRequired'));
        return false;
      }
      return true;
    }
    if (step === 3) {
      const cardValidityStr = asNonEmptyTrimmedString(formData.cardValidity);
      if (cardValidityStr) {
        const todayStr = new Date().toISOString().slice(0, 10);
        if (cardValidityStr <= todayStr) {
          toast.error(t('newPatient.patientForm.cardValidityMustBeFuture'));
          return false;
        }
      }
      return true;
    }

    return true;
  };

  const handleChange = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('newPatient.patientForm.fileTooLarge'));
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setTempPhotoUrl(objectUrl);
    setTempPhotoFile(file);
    setShowCropPreview(true);
    e.target.value = '';
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    if (!CLOUD_NAME || !API_KEY) {
      toast.error(t('newPatient.patientForm.photoUploadNotConfigured'));
      return;
    }
    setUploadingPhoto(true);
    try {
      const signRes = await fetch(`/api/cloudinary/upload?folder=patients`);
      const signJson = await signRes.json();
      if (!signRes.ok) {
        toast.error(t('newPatient.patientForm.failedToPreparePhotoUpload'));
        return;
      }
      const { timestamp, signature } = signJson;
      const data = new FormData();
      data.append('file', croppedBlob, 'pet_photo.jpg');
      data.append('api_key', API_KEY);
      data.append('timestamp', String(timestamp));
      data.append('signature', signature);
      data.append('folder', 'patients');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: data,
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(t('newPatient.patientForm.photoUploadFailed'));
        return;
      }
      const url = json.secure_url || json.url;
      if (url) {
        setFormData(prev => ({ ...prev, photo: url }));
        setHasUnsavedChanges(true);
      }
      if (tempPhotoUrl) URL.revokeObjectURL(tempPhotoUrl);
      setShowCropPreview(false);
      setTempPhotoUrl(null);
      setTempPhotoFile(null);
    } catch (err) {
      toast.error(t('newPatient.patientForm.photoUploadFailed'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCancelCrop = () => {
    if (tempPhotoUrl) URL.revokeObjectURL(tempPhotoUrl);
    setTempPhotoUrl(null);
    setTempPhotoFile(null);
    setShowCropPreview(false);
  };

  const handleChangeImage = () => {
    if (tempPhotoUrl) URL.revokeObjectURL(tempPhotoUrl);
    setTempPhotoUrl(null);
    setTempPhotoFile(null);
    setShowCropPreview(false);
    changeImageInputRef.current?.click();
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 5) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!validateStep(1)) {
        setCurrentStep(1);
        return;
      }
      if (!validateStep(2)) {
        setCurrentStep(2);
        return;
      }
      if (!validateStep(3)) {
        setCurrentStep(3);
        return;
      }

      const isEditing = !!patientId;
      const guardianId = (linkedGuardian?.id || searchParams.get('guardianId') || '').trim();
      setSubmitting(true);
      const res = await fetch('/api/patient/new_patient', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(
          isEditing
            ? {
              patientId,
              isAlive,
              ...formData,
            }
            : {
              guardianId,
              isAlive,
              ...formData,
            }
        ),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({} as any));
        toast.error(typeof (json as any)?.error === 'string' ? (json as any).error : t('newPatient.patientForm.failedToSavePatient'));
        return;
      }
      const result = await res.json().catch(() => ({} as any));
      toast.success(patientId ? t('common.savedChanges') : t('newPatient.patientForm.patientCreated'));
      router.push(`/Veterinarian/home/patientDetails/${result?.id}`);
      setHasUnsavedChanges(false);
    } catch (e) {
      toast.error(patientId ? t('newPatient.patientForm.networkErrorSavingChanges') : t('newPatient.patientForm.networkErrorCreatingPatient'));
      console.error('Error saving patient:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className=" space-y-4">
      {/* Hidden file input for change image */}
      <input ref={changeImageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

      {/* Fullscreen Crop Screen */}
      {showCropPreview && tempPhotoUrl && (
        <PhotoCropScreen
          imageUrl={tempPhotoUrl}
          onConfirm={handleCropConfirm}
          onCancel={handleCancelCrop}
          onChangeImage={handleChangeImage}
          uploading={uploadingPhoto}
        />
      )}

      <Header title={"Adicionar novo paciente"} />


      {/* Progress Stepper */}
      <div className="relative flex items-start justify-between w-[60%] mx-auto">
        {/* Step 1 - Active */}
        <div className="flex flex-col items-center gap-1.5 z-10">
          <div className="w-10 h-10 rounded-full border border-primary bg-[#f5f6f9] flex items-center justify-center">
            <Image
              src={"/user icon.svg"}
              alt={t('newPatient.guardianIconAlt')}
              width={20}
              height={20}
            />
          </div>
          <span className="text-xs font-normal text-primary">{t('newPatient.guardianStep')}</span>
        </div>
        {/* Connecting Line */}
        <div className="absolute w-[70%] border border-primary/50 top-5 left-5 right-5 h-px bg-primary/50 z-0" />
        {/* Step 2 - Inactive */}
        <div className="flex flex-col items-center gap-1.5 z-10">
          <div className="w-10 h-10 rounded-full border border-primary bg-[#f5f6f9] flex items-center justify-center">
            <Image
              src={"/pet footstep.svg"}
              alt={t('newPatient.patientIconAlt')}
              width={20}
              height={20}
            />
          </div>
          <span className="text-xs font-normal text-primary">{t('newPatient.patientDetailsStep')}</span>
        </div>
      </div>

      {/* White Card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-5">
        {/* Responsável Vinculado */}
        <div className="flex items-start justify-between bg-[#ebebee] rounded-xl p-3">
          <div className="flex items-start gap-2">
            <User className="w-4 h-4 text-black/70" />
            <div>
              <p className="text-[12px] text-black/70">{t('newPatient.patientForm.linkedGuardian')}</p>
              <span className="inline-flex items-center border border-primary text-[#1D2939] text-xs font-medium px-2 py-0.5 rounded-xl">
                {linkedGuardian?.fullName ?? t('guardianHome.notAvailable')}
              </span>
              <p className="text-xs text-black/70 mt-1">CPF: {linkedGuardian?.taxId || t('guardianHome.notAvailable')}</p>
            </div>
          </div>
          {!patientId && (
            <button
              className="flex items-center gap-1 bg-[#A7A9AD] border border-[#A7A9AD] text-white text-xs font-medium px-2 py-0.5 rounded-sm hover:bg-gray-50 shrink-0"
              onClick={() => router.push('/Veterinarian/patient')}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {t('common.change')}
            </button>
          )}
        </div>

        {/* Status do Animal */}
        <div className="flex items-center justify-between border border-[#E8E8E8] rounded-md p-2">
          <div>
            <p className="font-normal text-sm text-[#1D2939]">{t('newPatient.patientForm.animalStatusTitle')}</p>
            <p className="text-xs text-[#9CA3AF]">{t('newPatient.patientForm.animalAliveQuestion')}</p>
          </div>
          <button
            onClick={() => setIsAlive(!isAlive)}
            className={`relative w-12 h-7 rounded-full transition-colors ${isAlive ? 'bg-primary' : 'bg-gray-300'}`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${isAlive ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>

        {/* Form Steps */}
        <div className="space-y-4">
          {loadingPatient ? (
            <div className="text-sm text-gray-500 py-6">{t('newPatient.patientForm.loadingPatient')}</div>
          ) : (
            <>
              {currentStep === 1 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[15px] font-semibold text-[#1D2939]">1. {t('newPatient.patientForm.identificationsTitle')}</h2>
                    <span className="flex items-center gap-0.5 text-xs text-primary font-medium">{t('auth.step')} 1/5 <ChevronUp className="w-3.5 h-3.5" /></span>
                  </div>

                  <div>
                    {formData.photo ? (
                      <div className="flex justify-center py-2">
                        <div className="relative">
                          <div className="w-[120px] h-[120px] rounded-full overflow-hidden border-2 border-[#E8E8E8] shadow-sm">
                            <Image width={120} height={120} src={formData.photo} alt={t('common.patient')} className="w-full h-full object-cover" />
                          </div>
                          <label className="absolute bottom-0.5 right-0.5 cursor-pointer">
                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-md">
                              <Pencil className="w-4 h-4 text-white" />
                            </div>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="w-[166px] mx-auto h-[166px] flex flex-col items-center justify-center gap-0 py-8 cursor-pointer border-2 border-dashed border-[#E0E0E0] rounded-full bg-[#FAFAFA]">
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        <Image src={"/upload.svg"} alt="edit icon" width={20} height={20} />

                        <p className="text-[8px] text-[#6B7280] text-center px-4 leading-snug">{t('newPatient.patientForm.dragDropPhoto')}</p>
                        <p className="text-[8px] text-[#9CA3AF]">{t('newPatient.patientForm.photoFormatsHint')}</p>
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-black/90 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {t('newPatient.patientForm.animalNameLabel')}<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={t('newPatient.patientForm.animalNamePlaceholder')}
                      value={formData.animalName}
                      onChange={(e) => handleChange('animalName', e.target.value)}
                      className="flex h-[26px]! w-full rounded-[4px]! bg-[#F6F6F6]! border border-input px-2 py-1 text-[12px]! shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-black/90 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('newPatient.patientForm.microchipLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('newPatient.patientForm.microchipPlaceholder')}
                      value={formData.microchip}
                      onChange={(e) => handleChange('microchip', e.target.value)}
                      className="flex h-[26px]! w-full rounded-[4px]! bg-[#F6F6F6]! border border-input px-2 py-1 text-[12px]! shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-black/90 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('newPatient.patientForm.speciesLabel')}<span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        value={formData.species}
                        onChange={(e) => handleChange('species', e.target.value)}
                        className="flex h-[26px]! w-full rounded-[4px]! bg-[#F6F6F6]! border border-input px-2 py-1 text-[12px]! shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">{t('auth.selectOption')}</option>
                        <option value="dog">{t('newPatient.speciesDog')}</option>
                        <option value="cat">{t('newPatient.speciesCat')}</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-black/90 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('newPatient.patientForm.breedLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('newPatient.patientForm.breedPlaceholder')}
                      value={formData.breed}
                      onChange={(e) => handleChange('breed', e.target.value)}
                      className="flex h-[26px]! w-full rounded-[4px]! bg-[#F6F6F6]! border border-input px-2 py-1 text-[12px]! shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-black/90 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('newPatient.patientForm.sexLabel')}<span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        value={formData.sex}
                        onChange={(e) => handleChange('sex', e.target.value as 'Male' | 'Female' | '')}
                        className="flex h-[26px]! w-full rounded-[4px]! bg-[#F6F6F6]! border border-input px-2 py-1 text-[12px]! shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">{t('auth.selectOption')}</option>
                        <option value="Male">{t('common.male')}</option>
                        <option value="Female">{t('common.female')}</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-black/90 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('profile.dateOfBirth')}</label>
                    <TypedDateInput
                      value={formData.dateOfBirth}
                      onChange={(nextIsoDate) => handleChange('dateOfBirth', nextIsoDate)}
                      max={new Date().toISOString().slice(0, 10)}
                      placeholder="dd/mm/yyyy"
                      className="flex h-[26px]! w-full rounded-[4px]! bg-[#F6F6F6]! border border-input px-2 py-1 text-[12px]! shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      iconSize={12}
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-black/90 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('newPatient.patientForm.ageYearsLabel')}</label>
                    <input
                      type="number"
                      min={0}
                      max={40}
                      placeholder={t('newPatient.patientForm.ageYearsPlaceholder')}
                      value={formData.ageYears}
                      onChange={(e) => handleChange('ageYears', e.target.value)}
                      className="flex h-[26px]! w-full rounded-[4px]! bg-[#F6F6F6]! border border-input px-2 py-1 text-[12px]! shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <p className="mt-1 text-xs text-[#9CA3AF]">{t('newPatient.patientForm.ageYearsHint')}</p>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[15px] font-semibold text-[#1D2939]">2. {t('newPatient.patientForm.additionalInfoTitle')}</h2>
                    <span className="flex items-center gap-0.5 text-xs text-primary font-medium">{t('auth.step')} 2/5 <ChevronUp className="w-3.5 h-3.5" /></span>
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-black/90 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('newPatient.patientForm.temperamentLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('newPatient.patientForm.temperamentPlaceholder')}
                      value={formData.temperament}
                      onChange={(e) => handleChange('temperament', e.target.value)}
                      className="flex h-[26px]! w-full rounded-[4px]! bg-[#F6F6F6]! border border-input px-2 py-1 text-[12px]! shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-black/90 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('newPatient.patientForm.sizeLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('newPatient.patientForm.sizePlaceholder')}
                      value={formData.size}
                      onChange={(e) => handleChange('size', e.target.value)}
                      className="flex h-[26px]! w-full rounded-[4px]! bg-[#F6F6F6]! border border-input px-2 py-1 text-[12px]! shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-black/90 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('newPatient.patientForm.coatLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('newPatient.patientForm.coatPlaceholder')}
                      value={formData.coat}
                      onChange={(e) => handleChange('coat', e.target.value)}
                      className="flex h-[26px]! w-full rounded-[4px]! bg-[#F6F6F6]! border border-input px-2 py-1 text-[12px]! shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-black/90 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('newPatient.patientForm.neuteredLabel')}</label>
                    <div className="relative">
                      <select
                        value={formData.neutered}
                        onChange={(e) => handleChange('neutered', e.target.value as 'Yes' | 'No' | '')}
                        className="flex h-[26px]! w-full rounded-[4px]! bg-[#F6F6F6]! border border-input px-2 py-1 text-[12px]! shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">{t('auth.selectOption')}</option>
                        <option value="Yes">{t('common.yes')}</option>
                        <option value="No">{t('common.no')}</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-black/90 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('newPatient.patientForm.rgaLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('newPatient.patientForm.rgaPlaceholder')}
                      value={formData.rga}
                      onChange={(e) => handleChange('rga', e.target.value)}
                      className="flex h-[26px]! w-full rounded-[4px]! bg-[#F6F6F6]! border border-input px-2 py-1 text-[12px]! shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[15px] font-semibold text-[#1D2939]">3. {t('newPatient.patientForm.healthPlanTitle')}</h2>
                    <span className="flex items-center gap-0.5 text-xs text-primary font-medium">{t('auth.step')} 3/5 <ChevronUp className="w-3.5 h-3.5" /></span>
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-black/90 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('newPatient.patientForm.healthPlanNameLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('newPatient.patientForm.healthPlanNamePlaceholder')}
                      value={formData.planName}
                      onChange={(e) => handleChange('planName', e.target.value)}
                      className="flex h-[26px]! w-full rounded-[4px]! bg-[#F6F6F6]! border border-input px-2 py-1 text-[12px]! shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-black/90 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('newPatient.patientForm.planCardNumberLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('newPatient.patientForm.planCardNumberPlaceholder')}
                      value={formData.cardNumber}
                      onChange={(e) => handleChange('cardNumber', e.target.value)}
                      className="flex h-[26px]! w-full rounded-[4px]! bg-[#F6F6F6]! border border-input px-2 py-1 text-[12px]! shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-black/90 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('newPatient.patientForm.cardValidityLabel')}</label>
                    <TypedDateInput
                      value={formData.cardValidity}
                      onChange={(nextIsoDate) => handleChange('cardValidity', nextIsoDate)}
                      min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
                      placeholder="dd/mm/yyyy"
                      className="flex h-[26px]! w-full rounded-[4px]! bg-[#F6F6F6]! border border-input px-2 py-1 text-[12px]! shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      iconSize={12}
                    />
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[15px] font-semibold text-[#1D2939]">4. {t('newPatient.patientForm.clinicalInfoTitle')}</h2>
                    <span className="flex items-center gap-0.5 text-xs text-primary font-medium">{t('auth.step')} 4/5 <ChevronUp className="w-3.5 h-3.5" /></span>
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-black/90 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('newPatient.patientForm.allergiesLabel')}</label>
                    <textarea
                      placeholder={t('newPatient.patientForm.allergiesPlaceholder')}
                      value={formData.allergies}
                      onChange={(e) => handleChange('allergies', e.target.value)}
                      rows={4}
                      className="flex w-full rounded-[4px]! bg-[#F6F6F6]! border border-input px-2 py-1 text-[12px]! shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#BEBDBD] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-black/90 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('newPatient.patientForm.chronicDiseasesLabel')}</label>
                    <textarea
                      placeholder={t('newPatient.patientForm.chronicDiseasesPlaceholder')}
                      value={formData.chronicDiseases}
                      onChange={(e) => handleChange('chronicDiseases', e.target.value)}
                      rows={4}
                      className="flex w-full rounded-[4px]! bg-[#F6F6F6]! border border-input px-2 py-1 text-[12px]! shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#BEBDBD] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium text-black/90 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t('newPatient.patientForm.otherInformationLabel')}</label>
                    <textarea
                      placeholder={t('newPatient.patientForm.otherInformationPlaceholder')}
                      value={formData.otherInformation}
                      onChange={(e) => handleChange('otherInformation', e.target.value)}
                      rows={4}
                      className="flex w-full rounded-[4px]! bg-[#F6F6F6]! border border-input px-2 py-1 text-[12px]! shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#BEBDBD] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[15px] font-semibold text-[#1D2939]">5. {t('newPatient.patientForm.observationsStepTitle')}</h2>
                    <span className="flex items-center gap-0.5 text-xs text-primary font-medium">{t('auth.step')} 5/5 <ChevronUp className="w-3.5 h-3.5" /></span>
                  </div>

                  <div>
                    <p className="text-sm text-[#6B7280] mb-1.5">{t('newPatient.patientForm.internalNotesLabel')}</p>
                    <textarea
                      placeholder={t('newPatient.patientForm.internalNotesPlaceholder')}
                      value={formData.internalNotes}
                      onChange={(e) => handleChange('internalNotes', e.target.value)}
                      rows={6}
                      className="flex w-full rounded-[4px]! bg-[#F6F6F6]! border border-input px-2 py-1 text-[12px]! shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#BEBDBD] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Button */}
        <div className="pb-2">
          <button
            onClick={currentStep === 5 ? handleSubmit : handleNext}
            disabled={submitting || uploadingPhoto || loadingPatient}
            className="h-[30px] w-full bg-primary hover:bg-primary/90 active:bg-[#3568C0] text-white font-bold text-[13px] rounded-md flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Plus className="w-3 h-3" />
            {currentStep === 5
              ? (submitting
                ? (patientId ? t('common.saving') : t('auth.creating'))
                : (patientId ? t('common.saveChanges') : t('newPatient.patientForm.addAnimalButton')))
              : t('auth.next')}
          </button>
        </div>
        <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} className="max-w-md rounded-2xl p-6">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('common.unsavedChanges')}</h3>
            <p className="mt-2 text-sm text-gray-600">{t('common.unsavedChangesDesc')}</p>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                className="flex-1 px-4 py-2.5 rounded-full bg-[#F3F4F6] text-gray-800 font-medium"
                onClick={() => setConfirmOpen(false)}
              >
                {t('common.keepEditing')}
              </button>
              <button
                type="button"
                className="flex-1 px-4 py-2.5 rounded-full bg-primary text-white font-medium"
                onClick={() => {
                  setConfirmOpen(false);
                  setHasUnsavedChanges(false);
                  router.back();
                }}
              >
                {t('common.discardChanges')}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
