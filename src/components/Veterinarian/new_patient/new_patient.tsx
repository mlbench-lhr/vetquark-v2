'use client'
import { useCallback, useEffect, useRef, useState, ChangeEvent } from 'react';
import { RefreshCw, Calendar, Upload, ChevronDown, ChevronLeft, Pencil } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { asNonEmptyTrimmedString, isMongoObjectId } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store/store';
import Pusher from 'pusher-js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import Header from '@/components/common/header';
import { Modal } from '@/components/ui/modal';

type Step = 1 | 2 | 3 | 4;

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
  const dobRef = useRef<HTMLInputElement | null>(null);
  const cardValidityRef = useRef<HTMLInputElement | null>(null);
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

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    if (!CLOUD_NAME || !API_KEY) {
      toast.error(t('newPatient.patientForm.photoUploadNotConfigured'));
      console.error('Cloudinary env not set: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_API_KEY');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('newPatient.patientForm.fileTooLarge'));
      console.error('File too large (max 10MB)');
      return;
    }

    setUploadingPhoto(true);

    try {
      const signRes = await fetch(`/api/cloudinary/upload?folder=patients`);
      const signJson = await signRes.json();
      if (!signRes.ok) {
        toast.error(t('newPatient.patientForm.failedToPreparePhotoUpload'));
        console.error('Failed to get Cloudinary signature:', signJson);
        return;
      }
      const { timestamp, signature } = signJson;

      const data = new FormData();
      data.append('file', file);
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
        console.error('Cloudinary upload failed:', json);
        return;
      }
      const url = json.secure_url || json.url;
      if (url) {
        setFormData(prev => ({ ...prev, photo: url }));
        setHasUnsavedChanges(true);
      }
    } catch (err) {
      toast.error(t('newPatient.patientForm.photoUploadFailed'));
      console.error('Cloudinary error:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 4) {
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
    <div className="space-y-4">
      {/* Header */}
      <Header
        title={patientId ? t('newPatient.editPatientTitle') : t('newPatient.addNewPatientTitle')}
        onBack={() => {
          if (hasUnsavedChanges) {
            setConfirmOpen(true);
          } else {
            router.back();
          }
        }}
      />

      {/* Progress Tabs */}
      <div className="bg-white ">
        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-3 bg-white z-1 pe-2.5">
            <div className="w-10 h-10 bg-[#EBF2FF] rounded-full flex items-center justify-center">
              <Image
                src={"/images/new_patient/user-active.svg"}
                alt="User icon"
                width={24}
                height={24}
              />
            </div>
            <span className="text-xs font-medium text-gray-900">{t('newPatient.guardianStep')}</span>
          </div>
          <div className="w-32 h-1 bg-primary rounded-full w-[100%] absolute left-0 top-1/2 z-0"></div>

          <div className="flex items-center gap-3 ps-2.5 z-1 bg-white">
            <div className="w-10 h-10 bg-[#EBF2FF] rounded-full flex items-center justify-center">
              <Image
                src={"/images/new_patient/paw-active.svg"}
                alt="User icon"
                width={24}
                height={24}
              />
            </div>
            <span className="text-xs font-medium text-gray-500">{t('newPatient.patientDetailsStep')}</span>
          </div>
        </div>
      </div>

      {/* Guardian Info */}
      <div className="">
        <p className="text-sm text-gray-500 mb-3">{t('newPatient.patientForm.linkedGuardian')}</p>
        <div className="flex items-center justify-between bg-gray-100 p-2 rounded-[12px]">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={linkedGuardian?.imageUrl || ''} alt={linkedGuardian?.fullName || t('auth.guardian')} />
              <AvatarFallback>
                {(linkedGuardian?.fullName || 'G').slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-gray-900">{linkedGuardian?.fullName ?? t('guardianHome.notAvailable')}</p>
              <p className="text-xs text-tertiary">{t('profile.nationalId')}: {linkedGuardian?.taxId || t('guardianHome.notAvailable')}</p>
            </div>
          </div>
          {!patientId && (
            <button className="flex items-center gap-1 text-primary text-sm font-medium" onClick={() => router.push('/Veterinarian/patient')}>
              <RefreshCw className="w-4 h-4" />
              {t('common.change')}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between bg-gray-100 p-2 mt-2 rounded-[12px]">
          <div>
            <p className="font-medium text-gray-900 text-sm">{t('newPatient.patientForm.animalStatusTitle')}</p>
            <p className="text-xs text-tertiary">{t('newPatient.patientForm.animalAliveQuestion')}</p>
          </div>
          <button
            onClick={() => setIsAlive(!isAlive)}
            className={`relative w-12 h-7 rounded-full transition-colors ${isAlive ? 'bg-primary' : 'bg-gray-300'
              }`}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${isAlive ? 'translate-x-5' : 'translate-x-0'
                }`}
            />
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="p">
        {loadingPatient ? (
          <div className="text-sm text-gray-500 py-6">{t('newPatient.patientForm.loadingPatient')}</div>
        ) : (
          <>
            {currentStep === 1 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">{t('newPatient.patientForm.identificationsTitle')}</h2>
                  <span className="text-sm text-primary">{t('auth.step')} 1/4</span>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p- text-center">
                    {formData.photo ? (
                      <div className="flex w-full h-[200px] flex-col relative items-center gap-3">
                        <Image width={200} height={200} src={formData.photo} alt={t('common.patient')} className="w-full h-full object-contain rounded-lg bg-white" />
                        <label className="inline-block absolute -top-2 -right-2">
                          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                          {uploadingPhoto ? <span className="px-3 py-2 bg-primary text-white rounded-md cursor-pointer"> {t('auth.uploading')}
                          </span>
                            : <div className="p-2 bg-primary rounded-full">
                              <Pencil color="white" size={16} />
                            </div>}
                        </label>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <Upload className="w-8 h-8 text-primary mx-auto" />
                        <p className="text-sm text-gray-700">{t('newPatient.patientForm.dragDropPhoto')}</p>
                        <label className="inline-block">
                          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                          <span className="px-3 py-2 bg-primary text-white rounded-md cursor-pointer">
                            {uploadingPhoto ? t('auth.uploading') : t('newPatient.patientForm.selectPhoto')}
                          </span>
                        </label>
                        <p className="text-xs text-gray-500">{t('newPatient.patientForm.photoFormatsHint')}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">
                      {t('newPatient.patientForm.animalNameLabel')}<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder={t('newPatient.patientForm.animalNamePlaceholder')}
                      value={formData.animalName}
                      onChange={(e) => handleChange('animalName', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">{t('newPatient.patientForm.microchipLabel')}</label>
                    <input
                      type="number"
                      placeholder={t('newPatient.patientForm.microchipPlaceholder')}
                      value={formData.microchip}
                      onChange={(e) => handleChange('microchip', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">{t('newPatient.patientForm.speciesLabel')}<span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select
                        value={formData.species}
                        onChange={(e) => handleChange('species', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">{t('auth.selectOption')}</option>
                        <option value="dog">{t('newPatient.speciesDog')}</option>
                        <option value="cat">{t('newPatient.speciesCat')}</option>
                        {/* <option value="bird">{t('newPatient.speciesBird')}</option> */}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">{t('newPatient.patientForm.breedLabel')}<span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder={t('newPatient.patientForm.breedPlaceholder')}
                      value={formData.breed}
                      onChange={(e) => handleChange('breed', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">{t('newPatient.patientForm.sexLabel')}<span className="text-red-500">*</span></label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleChange('sex', 'Male')}
                        className={`flex-1 py-3 rounded-lg font-medium transition-colors ${formData.sex === 'Male' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-700'
                          }`}
                      >
                        {t('common.male')}
                      </button>
                      <button
                        onClick={() => handleChange('sex', 'Female')}
                        className={`flex-1 py-3 rounded-lg font-medium transition-colors ${formData.sex === 'Female' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-700'
                          }`}
                      >
                        {t('common.female')}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">{t('profile.dateOfBirth')}</label>
                    <div className="relative">
                      <input
                        ref={dobRef}
                        type="date"
                        max={new Date().toISOString().slice(0, 10)}
                        placeholder={t('newPatient.patientForm.selectDateOfBirth')}
                        value={formData.dateOfBirth}
                        onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                        style={{ colorScheme: 'light' }}
                      />
                      <Calendar
                        color="#3F78D8"
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-40 cursor-pointer"
                        onClick={() => {
                          const el = dobRef.current as any;
                          if (!el) return;
                          if (typeof el.showPicker === 'function') el.showPicker();
                          else el.click();
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">{t('newPatient.patientForm.ageYearsLabel')}</label>
                    <input
                      type="number"
                      min={0}
                      max={40}
                      placeholder={t('newPatient.patientForm.ageYearsPlaceholder')}
                      value={formData.ageYears}
                      onChange={(e) => handleChange('ageYears', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {t('newPatient.patientForm.ageYearsHint')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">{t('newPatient.patientForm.additionalInfoTitle')}</h2>
                  <span className="text-sm text-primary">{t('auth.step')} 2/4</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-900 mb-2">{t('newPatient.patientForm.temperamentLabel')}<span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder={t('newPatient.patientForm.temperamentPlaceholder')}
                      value={formData.temperament}
                      onChange={(e) => handleChange('temperament', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">{t('newPatient.patientForm.sizeLabel')}<span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder={t('newPatient.patientForm.sizePlaceholder')}
                      value={formData.size}
                      onChange={(e) => handleChange('size', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">{t('newPatient.patientForm.coatLabel')}<span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      placeholder={t('newPatient.patientForm.coatPlaceholder')}
                      value={formData.coat}
                      onChange={(e) => handleChange('coat', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">{t('newPatient.patientForm.neuteredLabel')}<span className="text-red-500">*</span></label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleChange('neutered', 'Yes')}
                        className={`flex-1 py-3 rounded-lg font-medium transition-colors ${formData.neutered === 'Yes' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-700'
                          }`}
                      >
                        {t('common.yes')}
                      </button>
                      <button
                        onClick={() => handleChange('neutered', 'No')}
                        className={`flex-1 py-3 rounded-lg font-medium transition-colors ${formData.neutered === 'No' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-700'
                          }`}
                      >
                        {t('common.no')}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">{t('newPatient.patientForm.rgaLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('newPatient.patientForm.rgaPlaceholder')}
                      value={formData.rga}
                      onChange={(e) => handleChange('rga', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">{t('newPatient.patientForm.healthPlanTitle')}</h2>
                  <span className="text-sm text-primary">{t('auth.step')} 3/4</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-900 mb-2">{t('newPatient.patientForm.healthPlanNameLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('newPatient.patientForm.healthPlanNamePlaceholder')}
                      value={formData.planName}
                      onChange={(e) => handleChange('planName', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">{t('newPatient.patientForm.planCardNumberLabel')}</label>
                    <input
                      type="number"
                      placeholder={t('newPatient.patientForm.planCardNumberPlaceholder')}
                      value={formData.cardNumber}
                      onChange={(e) => handleChange('cardNumber', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">{t('newPatient.patientForm.cardValidityLabel')}</label>
                    <div className="relative">
                      <input
                        ref={cardValidityRef}
                        type="date"
                        min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)}
                        placeholder={t('newPatient.patientForm.selectDate')}
                        value={formData.cardValidity}
                        onChange={(e) => handleChange('cardValidity', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                        style={{ colorScheme: 'light' }}
                      />
                      <Calendar
                        color="#3F78D8"
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-40 cursor-pointer"
                        onClick={() => {
                          const el = cardValidityRef.current as any;
                          if (!el) return;
                          if (typeof el.showPicker === 'function') el.showPicker();
                          else el.click();
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">{t('newPatient.patientForm.clinicalInfoTitle')}</h2>
                  <span className="text-sm text-primary">{t('auth.step')} 4/4</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-900 mb-2">{t('newPatient.patientForm.allergiesLabel')}</label>
                    <textarea
                      placeholder={t('newPatient.patientForm.allergiesPlaceholder')}
                      value={formData.allergies}
                      onChange={(e) => handleChange('allergies', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">{t('newPatient.patientForm.chronicDiseasesLabel')}</label>
                    <textarea
                      placeholder={t('newPatient.patientForm.chronicDiseasesPlaceholder')}
                      value={formData.chronicDiseases}
                      onChange={(e) => handleChange('chronicDiseases', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">{t('newPatient.patientForm.otherInformationLabel')}</label>
                    <textarea
                      placeholder={t('newPatient.patientForm.otherInformationPlaceholder')}
                      value={formData.otherInformation}
                      onChange={(e) => handleChange('otherInformation', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">{t('newPatient.patientForm.internalNotesLabel')}</label>
                    <textarea
                      placeholder={t('newPatient.patientForm.internalNotesPlaceholder')}
                      value={formData.internalNotes}
                      onChange={(e) => handleChange('internalNotes', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="f">
        <div className="">
          <button
            onClick={currentStep === 4 ? handleSubmit : handleNext}
            disabled={submitting || uploadingPhoto || loadingPatient}
            className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-4 rounded-2xl transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {currentStep === 4
              ? (submitting
                ? (patientId ? t('common.saving') : t('auth.creating'))
                : (patientId ? t('common.saveChanges') : t('newPatient.patientForm.addAnimalButton')))
              : t('auth.next')}
          </button>

        </div>
      </div>
      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} className="max-w-md rounded-2xl p-6">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('common.unsavedChanges')}</h3>
          <p className="mt-2 text-sm text-gray-600">{t('common.unsavedChangesDesc')}</p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              className="flex-1 px-4 py-2 rounded-full bg-gray-100 text-gray-800"
              onClick={() => setConfirmOpen(false)}
            >
              {t('common.keepEditing')}
            </button>
            <button
              type="button"
              className="flex-1 px-4 py-2 rounded-full bg-primary text-white"
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
  );
}
