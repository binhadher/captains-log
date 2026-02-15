'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { 
  Ship, 
  Anchor, 
  Loader2, 
  Check, 
  ChevronRight,
  User,
  Phone,
  Mail,
  Camera,
  Image as ImageIcon,
  Trash2,
  Share2,
  ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import { CameraCapture } from '@/components/ui/CameraCapture';

interface CrewProfile {
  id: string;
  name: string;
  title: string;
  title_other?: string;
  phone?: string;
  email?: string;
  photo_url?: string;
  passport_number?: string;
  passport_expiry?: string;
  passport_country?: string;
  passport_url?: string;
  emirates_id_number?: string;
  emirates_id_expiry?: string;
  emirates_id_url?: string;
  marine_license_number?: string;
  marine_license_expiry?: string;
  marine_license_type?: string;
  marine_license_url?: string;
  notes?: string;
  boat: {
    id: string;
    name: string;
    make?: string;
    model?: string;
    photo_url?: string;
  };
}

const TITLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  captain: 'Captain',
  first_mate: 'First Mate',
  engineer: 'Engineer',
  mechanic: 'Mechanic',
  deckhand: 'Deckhand',
  chef: 'Chef',
  steward: 'Steward',
  stewardess: 'Stewardess',
  bosun: 'Bosun',
  other: 'Other',
};

const TITLE_ICONS: Record<string, string> = {
  owner: '🚤',
  captain: '👨‍✈️',
  first_mate: '🧑‍✈️',
  engineer: '🔧',
  mechanic: '🛠️',
  deckhand: '⚓',
  chef: '👨‍🍳',
  steward: '🛎️',
  stewardess: '🛎️',
  bosun: '⚓',
  other: '👤',
};

type DocType = 'passport' | 'emirates_id' | 'marine_license';

export default function CrewProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const crewId = params.crewId as string;

  const [profile, setProfile] = useState<CrewProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  // Documents state
  const [passportNumber, setPassportNumber] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');
  const [passportCountry, setPassportCountry] = useState('');
  const [passportUrl, setPassportUrl] = useState<string | null>(null);
  const [emiratesIdNumber, setEmiratesIdNumber] = useState('');
  const [emiratesIdExpiry, setEmiratesIdExpiry] = useState('');
  const [emiratesIdUrl, setEmiratesIdUrl] = useState<string | null>(null);
  const [marineLicenseNumber, setMarineLicenseNumber] = useState('');
  const [marineLicenseExpiry, setMarineLicenseExpiry] = useState('');
  const [marineLicenseType, setMarineLicenseType] = useState('');
  const [marineLicenseUrl, setMarineLicenseUrl] = useState<string | null>(null);

  const [uploading, setUploading] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState<DocType | null>(null);

  const passportInputRef = useRef<HTMLInputElement>(null);
  const emiratesIdInputRef = useRef<HTMLInputElement>(null);
  const marineLicenseInputRef = useRef<HTMLInputElement>(null);

  // Fetch crew profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/crew/${crewId}/profile`);
        if (!res.ok) {
          if (res.status === 403) {
            setError('You do not have permission to view this profile');
          } else if (res.status === 404) {
            setError('Crew profile not found');
          } else {
            setError('Failed to load profile');
          }
          return;
        }
        
        const data = await res.json();
        setProfile(data.crew);
        
        // Initialize form with existing data
        setPhone(data.crew.phone || '');
        setEmail(data.crew.email || '');
        setPassportNumber(data.crew.passport_number || '');
        setPassportExpiry(data.crew.passport_expiry || '');
        setPassportCountry(data.crew.passport_country || '');
        setPassportUrl(data.crew.passport_url || null);
        setEmiratesIdNumber(data.crew.emirates_id_number || '');
        setEmiratesIdExpiry(data.crew.emirates_id_expiry || '');
        setEmiratesIdUrl(data.crew.emirates_id_url || null);
        setMarineLicenseNumber(data.crew.marine_license_number || '');
        setMarineLicenseExpiry(data.crew.marine_license_expiry || '');
        setMarineLicenseType(data.crew.marine_license_type || '');
        setMarineLicenseUrl(data.crew.marine_license_url || null);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded && isSignedIn && crewId) {
      fetchProfile();
    } else if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [crewId, isLoaded, isSignedIn, router]);

  // Upload document handler
  const handleDocUpload = async (file: File, docType: DocType) => {
    if (!profile) return;
    setUploading(docType);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('boat_id', profile.boat.id);
      formData.append('category', 'other');
      formData.append('name', `crew_${docType}_${Date.now()}`);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const { document } = await response.json();
      const url = document.file_url;

      if (docType === 'passport') setPassportUrl(url);
      else if (docType === 'emirates_id') setEmiratesIdUrl(url);
      else if (docType === 'marine_license') setMarineLicenseUrl(url);
    } catch (err) {
      setError(`Failed to upload ${docType.replace('_', ' ')}`);
    } finally {
      setUploading(null);
    }
  };

  const handleCameraCapture = (file: File) => {
    const docType = showCamera;
    setShowCamera(null);
    if (docType) {
      handleDocUpload(file, docType);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, docType: DocType) => {
    const file = e.target.files?.[0];
    if (file) {
      handleDocUpload(file, docType);
    }
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    setError(null);

    try {
      const payload = {
        phone: phone || null,
        email: email || null,
        passport_number: passportNumber || null,
        passport_expiry: passportExpiry || null,
        passport_country: passportCountry || null,
        passport_url: passportUrl || null,
        emirates_id_number: emiratesIdNumber || null,
        emirates_id_expiry: emiratesIdExpiry || null,
        emirates_id_url: emiratesIdUrl || null,
        marine_license_number: marineLicenseNumber || null,
        marine_license_expiry: marineLicenseExpiry || null,
        marine_license_type: marineLicenseType || null,
        marine_license_url: marineLicenseUrl || null,
      };

      const res = await fetch(`/api/crew/${crewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save profile');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = () => {
    if (profile) {
      router.push(`/boats/${profile.boat.id}`);
    }
  };

  // Loading state
  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Anchor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Oops!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const titleLabel = profile.title === 'other' ? profile.title_other : TITLE_LABELS[profile.title];
  const titleIcon = TITLE_ICONS[profile.title] || '👤';

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center animate-fadeIn">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Aboard! 🎉
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your profile has been saved. You now have access to <strong>{profile.boat.name}</strong>.
          </p>
          <button
            onClick={handleContinue}
            className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-cyan-700 transition shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2"
          >
            Continue to Boat
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Camera capture overlay
  if (showCamera) {
    return (
      <CameraCapture
        onCapture={handleCameraCapture}
        onClose={() => setShowCamera(null)}
      />
    );
  }

  // Document upload section
  const DocUploadSection = ({ 
    docType, 
    docUrl, 
    setDocUrl, 
    inputRef, 
    docName 
  }: { 
    docType: DocType; 
    docUrl: string | null; 
    setDocUrl: (url: string | null) => void; 
    inputRef: React.RefObject<HTMLInputElement | null>;
    docName: string;
  }) => (
    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e, docType)}
      />
      {docUrl ? (
        <div className="flex items-center gap-3">
          <img src={docUrl} alt={docName} className="h-16 w-auto rounded border object-cover" />
          <button
            type="button"
            onClick={() => setDocUrl(null)}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading === docType}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
          >
            {uploading === docType ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4 text-gray-400" />}
            <span className="text-sm text-gray-500">Upload</span>
          </button>
          <button
            type="button"
            onClick={() => setShowCamera(docType)}
            disabled={uploading === docType}
            className="flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-teal-400 dark:border-teal-500 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
          >
            <Camera className="w-4 h-4 text-teal-500" />
            <span className="text-sm text-teal-600 dark:text-teal-400">Photo</span>
          </button>
        </div>
      )}
    </div>
  );

  // Main profile form
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pb-20">
      {/* Boat Header */}
      <div className="relative h-40 bg-gradient-to-br from-teal-500 to-cyan-600">
        {profile.boat.photo_url ? (
          <Image
            src={profile.boat.photo_url}
            alt={profile.boat.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Ship className="w-16 h-16 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-white/80 text-sm mb-1">Welcome to</p>
          <h1 className="text-2xl font-bold text-white">{profile.boat.name}</h1>
          {profile.boat.make && (
            <p className="text-white/70 text-sm">
              {profile.boat.make} {profile.boat.model}
            </p>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <div className="max-w-lg mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Profile Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-3xl">
                {titleIcon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile.name}</h2>
                <p className="text-gray-500 dark:text-gray-400">{titleLabel}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Complete your profile so the boat owner can contact you and verify your documents.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide flex items-center gap-2">
                <User className="w-4 h-4" />
                Contact Information
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Documents (Optional)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Upload copies of your documents for the boat&apos;s records. This helps with port inspections and emergency situations.
              </p>

              {/* Passport */}
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  🛂 Passport
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={passportNumber}
                    onChange={(e) => setPassportNumber(e.target.value)}
                    placeholder="Number"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <input
                    type="text"
                    value={passportCountry}
                    onChange={(e) => setPassportCountry(e.target.value)}
                    placeholder="Country"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <input
                    type="date"
                    value={passportExpiry}
                    onChange={(e) => setPassportExpiry(e.target.value)}
                    placeholder="Expiry"
                    className="col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <DocUploadSection
                  docType="passport"
                  docUrl={passportUrl}
                  setDocUrl={setPassportUrl}
                  inputRef={passportInputRef}
                  docName="Passport"
                />
              </div>

              {/* Emirates ID */}
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  🪪 Emirates ID
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={emiratesIdNumber}
                    onChange={(e) => setEmiratesIdNumber(e.target.value)}
                    placeholder="ID Number"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <input
                    type="date"
                    value={emiratesIdExpiry}
                    onChange={(e) => setEmiratesIdExpiry(e.target.value)}
                    placeholder="Expiry"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <DocUploadSection
                  docType="emirates_id"
                  docUrl={emiratesIdUrl}
                  setDocUrl={setEmiratesIdUrl}
                  inputRef={emiratesIdInputRef}
                  docName="Emirates ID"
                />
              </div>

              {/* Marine License */}
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  ⚓ Marine License
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={marineLicenseNumber}
                    onChange={(e) => setMarineLicenseNumber(e.target.value)}
                    placeholder="License Number"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <input
                    type="text"
                    value={marineLicenseType}
                    onChange={(e) => setMarineLicenseType(e.target.value)}
                    placeholder="Type (e.g. Master)"
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <input
                    type="date"
                    value={marineLicenseExpiry}
                    onChange={(e) => setMarineLicenseExpiry(e.target.value)}
                    placeholder="Expiry"
                    className="col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <DocUploadSection
                  docType="marine_license"
                  docUrl={marineLicenseUrl}
                  setDocUrl={setMarineLicenseUrl}
                  inputRef={marineLicenseInputRef}
                  docName="Marine License"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-cyan-700 transition shadow-lg shadow-teal-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Save &amp; Continue
                </>
              )}
            </button>
            
            <button
              onClick={handleContinue}
              className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2"
            >
              Skip for now
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
