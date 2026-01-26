'use client'
import { useCallback, useEffect, useState, ChangeEvent } from 'react';
import { RefreshCw, Upload, ChevronDown, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { asNonEmptyTrimmedString, isMongoObjectId } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store/store';
import Pusher from 'pusher-js';
import CustomDatePicker from '@/components/ui/dropdown/datepicker';

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
  const patientId = (searchParams.get('patientId') || '').trim() || null;
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isAlive, setIsAlive] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [linkedGuardian, setLinkedGuardian] = useState<{ id: string; fullName: string; taxId: string } | null>(null);
  const [formData, setFormData] = useState<PatientFormData>({
    photo: null,
    animalName: '',
    microchip: '',
    species: '',
    breed: '',
    sex: '',
    dateOfBirth: '',
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
    if (guardianId) {
      setLinkedGuardian({ id: guardianId, fullName: guardianName || 'N/A', taxId: guardianTaxId });
    } else {
      setLinkedGuardian(null);
    }
  }, [patientId, searchParams]);

  const validateStep = (step: Step) => {
    if (step !== 1) return true;

    if (!patientId) {
      const guardianId = linkedGuardian?.id || '';
      if (!guardianId || !isMongoObjectId(guardianId)) {
        toast.error('Please link a guardian first');
        return false;
      }
    }

    const animalName = asNonEmptyTrimmedString(formData.animalName);
    if (!animalName) {
      toast.error('Animal name is required');
      return false;
    }

    return true;
  };

  const handleChange = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    if (!CLOUD_NAME || !API_KEY) {
      toast.error('Photo upload is not configured');
      console.error('Cloudinary env not set: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_API_KEY');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10MB)');
      console.error('File too large (max 10MB)');
      return;
    }

    setUploadingPhoto(true);

    try {
      const signRes = await fetch(`/api/cloudinary/upload?folder=patients`);
      const signJson = await signRes.json();
      if (!signRes.ok) {
        toast.error('Failed to prepare photo upload');
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
        toast.error('Photo upload failed');
        console.error('Cloudinary upload failed:', json);
        return;
      }
      const url = json.secure_url || json.url;
      if (url) {
        setFormData(prev => ({ ...prev, photo: url }));
      }
    } catch (err) {
      toast.error('Photo upload failed');
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
        toast.error(typeof (json as any)?.error === 'string' ? (json as any).error : 'Failed to save patient');
        return;
      }
      const result = await res.json().catch(() => ({} as any));
      toast.success(patientId ? 'Saved changes' : 'Patient created');
      router.push(`/Veterinarian/home/patientDetails/${result?.id}`);
    } catch (e) {
      toast.error(patientId ? 'Network error while saving changes' : 'Network error while creating patient');
      console.error('Error saving patient:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 space-y-4">
      {/* Header */}
      <div className=" flex items-center justify-between">
        <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => router.back()}>
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-base font-medium text-gray-900">{patientId ? 'Edit Patient' : 'Add new Patient'}</h1>
        <button className="relative w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
          {unreadCount > 0 ? <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500" /> : null}
          <span className="text-white text-sm">
            <Image
              src={"/images/home/bell.svg"}
              alt="Bell icon"
              width={24}
              height={24}
            />
          </span>
        </button>
      </div>
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
            <span className="text-xs font-medium text-gray-900">Guardian</span>
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
            <span className="text-xs font-medium text-gray-500">Patient Details</span>
          </div>
        </div>
      </div>

      {/* Guardian Info */}
      <div className="">
        <p className="text-sm text-gray-500 mb-3">Linked Guardian</p>
        <div className="flex items-center justify-between bg-gray-100 p-2 rounded-[12px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-300 to-orange-400 rounded-full"></div>
            <div>
              <p className="font-medium text-gray-900">{linkedGuardian?.fullName ?? 'N/A'}</p>
              <p className="text-xs text-tertiary">CPF: {linkedGuardian?.taxId || 'N/A'}</p>
            </div>
          </div>
          {!patientId && (
            <button className="flex items-center gap-1 text-primary text-sm font-medium" onClick={() => router.push('/Veterinarian/patient')}>
              <RefreshCw className="w-4 h-4" />
              Change
            </button>
          )}
        </div>

        <div className="flex items-center justify-between bg-gray-100 p-2 mt-2 rounded-[12px]">
          <div>
            <p className="font-medium text-gray-900 text-sm">Animal Status</p>
            <p className="text-xs text-tertiary">Is the animal alive?</p>
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
          <div className="text-sm text-gray-500 py-6">Loading patient...</div>
        ) : (
          <>
            {currentStep === 1 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Identifications</h2>
                  <span className="text-sm text-primary">Step 1/4</span>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {formData.photo ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={formData.photo} alt="Patient" className="w-50 object-cover" />
                        <label className="inline-block mt-2">
                          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                          <span className="px-3 py-2 bg-primary text-white rounded-md cursor-pointer">
                            {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-primary mx-auto" />
                        <p className="text-sm text-gray-700">Drag and drop the photo here, or click to select</p>
                        <label className="inline-block">
                          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                          <span className="px-3 py-2 bg-primary text-white rounded-md cursor-pointer">
                            {uploadingPhoto ? 'Uploading...' : 'Select Photo'}
                          </span>
                        </label>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 10MB</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">
                      Animal Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Pet's Name"
                      value={formData.animalName}
                      onChange={(e) => handleChange('animalName', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">Microchip</label>
                    <input
                      type="text"
                      placeholder="Enter microchip number"
                      value={formData.microchip}
                      onChange={(e) => handleChange('microchip', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">Species</label>
                    <div className="relative">
                      <select
                        value={formData.species}
                        onChange={(e) => handleChange('species', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select an option</option>
                        <option value="dog">Dog</option>
                        <option value="cat">Cat</option>
                        <option value="bird">Bird</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">Breed</label>
                    <input
                      type="text"
                      placeholder="E.g. Labrador, Siamese..."
                      value={formData.breed}
                      onChange={(e) => handleChange('breed', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">Sex</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleChange('sex', 'Male')}
                        className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                          formData.sex === 'Male' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Male
                      </button>
                      <button
                        onClick={() => handleChange('sex', 'Female')}
                        className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                          formData.sex === 'Female' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Female
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">Date Of Birth</label>
                    <CustomDatePicker
                      value={formData.dateOfBirth}
                      onChange={(next) => handleChange('dateOfBirth', next)}
                      placeholder="Select date of birth"
                      max={new Date().toISOString().slice(0, 10)}
                      triggerClassName="bg-gray-100 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Additional Information</h2>
                  <span className="text-sm text-primary">Step 2/4</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-900 mb-2">Temperament</label>
                    <input
                      type="text"
                      placeholder="E.g. Gentle, Agitated"
                      value={formData.temperament}
                      onChange={(e) => handleChange('temperament', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">Size</label>
                    <input
                      type="text"
                      placeholder="E.g. Small, Medium, Large"
                      value={formData.size}
                      onChange={(e) => handleChange('size', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">Coat</label>
                    <input
                      type="text"
                      placeholder="E.g. Short, Long, Smooth"
                      value={formData.coat}
                      onChange={(e) => handleChange('coat', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">Neutered</label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleChange('neutered', 'Yes')}
                        className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                          formData.neutered === 'Yes' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => handleChange('neutered', 'No')}
                        className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                          formData.neutered === 'No' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">RGA</label>
                    <input
                      type="text"
                      placeholder="Enter animal health registration"
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
                  <h2 className="text-lg font-medium text-gray-900">Health Plan</h2>
                  <span className="text-sm text-primary">Step 3/4</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-900 mb-2">Health Plan Name</label>
                    <input
                      type="text"
                      placeholder="Enter health plan name"
                      value={formData.planName}
                      onChange={(e) => handleChange('planName', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">Plan card number</label>
                    <input
                      type="text"
                      placeholder="Enter plan card number"
                      value={formData.cardNumber}
                      onChange={(e) => handleChange('cardNumber', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">Card Validity</label>
                    <CustomDatePicker
                      value={formData.cardValidity}
                      onChange={(next) => handleChange('cardValidity', next)}
                      placeholder="Select card validity"
                      triggerClassName="bg-gray-100 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Clinical Information</h2>
                  <span className="text-sm text-primary">Step 4/4</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-900 mb-2">Allergies</label>
                    <textarea
                      placeholder="Write any known allergies"
                      value={formData.allergies}
                      onChange={(e) => handleChange('allergies', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">Chronic Diseases</label>
                    <textarea
                      placeholder="Write existing chronic diseases"
                      value={formData.chronicDiseases}
                      onChange={(e) => handleChange('chronicDiseases', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">Other Information</label>
                    <textarea
                      placeholder="Write existing chronic diseases"
                      value={formData.otherInformation}
                      onChange={(e) => handleChange('otherInformation', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-900 mb-2">Internal Notes</label>
                    <textarea
                      placeholder="Write your notes about animal"
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
            {currentStep === 4 ? (submitting ? (patientId ? 'Saving...' : 'Creating...') : (patientId ? 'Save Changes' : 'Add Animal')) : 'Next'}
          </button>

        </div>
      </div>
    </div>
  );
}
