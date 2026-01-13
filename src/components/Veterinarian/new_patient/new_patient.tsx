'use client'
import { useRef, useState, ChangeEvent } from 'react';
import { ArrowLeft, Bell, RefreshCw, Calendar, Upload, ChevronDown, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const dobRef = useRef<HTMLInputElement | null>(null);
  const cardValidityRef = useRef<HTMLInputElement | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isAlive, setIsAlive] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
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

  const handleChange = (field: keyof PatientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const API_KEY = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    if (!CLOUD_NAME || !API_KEY) {
      console.error('Cloudinary env not set: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_API_KEY');
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      console.error('File too large (max 10MB)');
      return;
    }

    setUploadingPhoto(true);

    try {
      const signRes = await fetch(`/api/cloudinary/upload?folder=patients`);
      const signJson = await signRes.json();
      if (!signRes.ok) {
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
        console.error('Cloudinary upload failed:', json);
        return;
      }
      const url = json.secure_url || json.url;
      if (url) {
        setFormData(prev => ({ ...prev, photo: url }));
      }
    } catch (err) {
      console.error('Cloudinary error:', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    const guardianId = searchParams.get('guardianId');
    try {
      const res = await fetch('/api/patient/new_patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guardianId,
          isAlive,
          ...formData,
        }),
      });
      if (!res.ok) {
        console.error('Failed to save patient');
        return;
      }
      const result = await res.json();
      router.push(`/Veterinarian/home/patientDetails/${result?.id}`);
    } catch (e) {
      console.error('Error saving patient:', e);
    }
  };

  return (
    <div className="min-h-screen p-4 space-y-4">
      {/* Header */}
      <div className=" flex items-center justify-between">
        <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => router.back()}>
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-base font-medium text-gray-900">Add new Patient</h1>
        <button className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
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
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <div className="w-10 h-10 bg-[#EBF2FF] rounded-full flex items-center justify-center">
              <Image
                src={"/images/new_patient/user-active.svg"}
                alt="User icon"
                width={24}
                height={24}
              />
            </div>
            <span className="text-xs font-medium">Guardian</span>
          </div>
          <div className="w-28 h-1 bg-primary rounded-full ml-2"></div>

          <div className="flex items-center gap-1 ">
            <div className="w-10 h-10 bg-[#EBF2FF] rounded-full flex items-center justify-center">
              <Image
                src={"/images/new_patient/paw-active.svg"}
                alt="User icon"
                width={24}
                height={24}
              />
            </div>
            <span className="text-xs font-medium whitespace-nowrap">Patient Details</span>
          </div>
        </div>
      </div>

      {/* Guardian Info */}
      <div className="">
        <p className="text-sm text-gray-500 mb-3">Linked Guardian</p>
        <div className="flex items-center justify-between bg-gray-100 p-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-300 to-orange-400 rounded-full"></div>
            <div>
              <p className="font-medium text-gray-900">{searchParams.get('guardianName') ?? 'N/A'}</p>
              <p className="text-xs text-tertiary">CPF: N/A</p>
            </div>
          </div>
          <button className="flex items-center gap-1 text-primary text-sm font-medium" onClick={() => router.push('/Veterinarian/patient')}>
            <RefreshCw className="w-4 h-4" />
            Change
          </button>
        </div>

        <div className="flex items-center justify-between bg-gray-100 p-2 mt-2">
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
        {currentStep === 1 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Identifications</h2>
              <span className="text-sm text-primary">Step 1/4</span>
            </div>

            <div className="space-y-4">
              {/* Photo Upload */}
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {formData.photo ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={formData.photo} alt="Patient" className="w-50 object-cover" />
                    <label className="inline-block mt-2">
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      <span className="px-3 py-2 bg-primary text-white rounded-md cursor-pointer">{uploadingPhoto ? 'Uploading...' : 'Change Photo'}</span>
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-primary mx-auto" />
                    <p className="text-sm text-gray-700">Drag and drop the photo here, or click to select</p>
                    <label className="inline-block">
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      <span className="px-3 py-2 bg-primary text-white rounded-md cursor-pointer">{uploadingPhoto ? 'Uploading...' : 'Select Photo'}</span>
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
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${formData.sex === 'Male'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-700'
                      }`}
                  >
                    Male
                  </button>
                  <button
                    onClick={() => handleChange('sex', 'Female')}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${formData.sex === 'Female'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-700'
                      }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-900 mb-2">Date Of Birth</label>
                <div className="relative">
                  <input
                    ref={dobRef}
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    placeholder="Select date of birth"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                    style={{ colorScheme: 'light' }}
                  />
                  <Calendar
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer"
                    onClick={() => {
                      const el = dobRef.current as any;
                      if (!el) return;
                      if (typeof el.showPicker === "function") el.showPicker();
                      else el.click();
                    }}
                  />
                </div>
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
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${formData.neutered === 'Yes'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-700'
                      }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => handleChange('neutered', 'No')}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${formData.neutered === 'No'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-700'
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
                <label className="block text-sm text-gray-900 mb-2">Plan Name</label>
                <input
                  type="text"
                  placeholder="Enter health plan name"
                  value={formData.planName}
                  onChange={(e) => handleChange('planName', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-900 mb-2">Card number</label>
                <input
                  type="text"
                  placeholder="Enter health plan number"
                  value={formData.cardNumber}
                  onChange={(e) => handleChange('cardNumber', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-900 mb-2">Card Validity</label>
                <div className="relative">
                  <input
                    ref={cardValidityRef}
                    type="date"
                    placeholder="Select date of birth"
                    value={formData.cardValidity}
                    onChange={(e) => handleChange('cardValidity', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                    style={{ colorScheme: 'light' }}
                  />
                  <Calendar
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 cursor-pointer"
                    onClick={() => {
                      const el = cardValidityRef.current as any;
                      if (!el) return;
                      if (typeof el.showPicker === "function") el.showPicker();
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
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="f">
        <div className="">
          <button
            onClick={currentStep === 4 ? handleSubmit : handleNext}
            className="w-full bg-primary hover:bg-blue-600 text-white font-medium py-4 rounded-2xl transition-colors"
          >
            {currentStep === 4 ? 'Add Animal' : 'Next'}
          </button>

        </div>
      </div>
    </div>
  );
}