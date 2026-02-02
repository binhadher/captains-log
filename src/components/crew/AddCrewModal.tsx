'use client';

import { useState, useEffect, useRef } from 'react';
import { X, User, Phone, Mail, FileText, Upload, Loader2, Camera, Image, Trash2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CrewMember } from './CrewList';

interface AddCrewModalProps {
  isOpen: boolean;
  onClose: () => void;
  boatId: string;
  editingMember?: CrewMember | null;
  onSuccess: () => void;
}

const TITLES = [
  { value: 'captain', label: 'Captain', icon: '👨‍✈️' },
  { value: 'first_mate', label: 'First Mate', icon: '🧑‍✈️' },
  { value: 'engineer', label: 'Engineer', icon: '🔧' },
  { value: 'mechanic', label: 'Mechanic', icon: '🛠️' },
  { value: 'deckhand', label: 'Deckhand', icon: '⚓' },
  { value: 'chef', label: 'Chef', icon: '👨‍🍳' },
  { value: 'steward', label: 'Steward', icon: '🛎️' },
  { value: 'stewardess', label: 'Stewardess', icon: '🛎️' },
  { value: 'bosun', label: 'Bosun', icon: '⚓' },
  { value: 'other', label: 'Other', icon: '👤' },
];

export function AddCrewModal({ isOpen, onClose, boatId, editingMember, onSuccess }: AddCrewModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'documents'>('basic');
  
  // Form state
  const [name, setName] = useState('');
  const [title, setTitle] = useState('deckhand');
  const [titleOther, setTitleOther] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  
  // Document state
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
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState<string | null>(null); // which doc is uploading

  // Reset form when modal opens/closes or editing member changes
  useEffect(() => {
    if (isOpen) {
      if (editingMember) {
        setName(editingMember.name);
        setTitle(editingMember.title);
        setTitleOther(editingMember.title_other || '');
        setPhone(editingMember.phone || '');
        setEmail(editingMember.email || '');
        setStatus(editingMember.status);
        // Document fields
        setPassportNumber(editingMember.passport_number || '');
        setPassportExpiry(editingMember.passport_expiry || '');
        setPassportCountry(editingMember.passport_country || '');
        setPassportUrl(editingMember.passport_url || null);
        setEmiratesIdNumber(editingMember.emirates_id_number || '');
        setEmiratesIdExpiry(editingMember.emirates_id_expiry || '');
        setEmiratesIdUrl(editingMember.emirates_id_url || null);
        setMarineLicenseNumber(editingMember.marine_license_number || '');
        setMarineLicenseExpiry(editingMember.marine_license_expiry || '');
        setMarineLicenseType(editingMember.marine_license_type || '');
        setMarineLicenseUrl(editingMember.marine_license_url || null);
        setNotes(editingMember.notes || '');
      } else {
        resetForm();
      }
      setActiveTab('basic');
      setError(null);
    }
  }, [isOpen, editingMember]);

  const resetForm = () => {
    setName('');
    setTitle('deckhand');
    setTitleOther('');
    setPhone('');
    setEmail('');
    setStatus('active');
    setPassportNumber('');
    setPassportExpiry('');
    setPassportCountry('');
    setPassportUrl(null);
    setEmiratesIdNumber('');
    setEmiratesIdExpiry('');
    setEmiratesIdUrl(null);
    setMarineLicenseNumber('');
    setMarineLicenseExpiry('');
    setMarineLicenseType('');
    setMarineLicenseUrl(null);
    setNotes('');
  };

  // Upload document handler
  const handleDocUpload = async (file: File, docType: 'passport' | 'emirates_id' | 'marine_license') => {
    setUploading(docType);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('boat_id', boatId);
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

  // Share document handler
  const handleShareDoc = async (docName: string, docUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name || 'Crew'} - ${docName}`,
          text: `${docName}: ${docUrl}`,
          url: docUrl,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(docUrl);
      alert('Link copied to clipboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        title,
        title_other: title === 'other' ? titleOther : null,
        phone: phone || null,
        email: email || null,
        status,
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
        notes: notes || null,
      };

      const url = editingMember 
        ? `/api/crew/${editingMember.id}`
        : `/api/boats/${boatId}/crew`;
      
      const response = await fetch(url, {
        method: editingMember ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save crew member');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingMember ? 'Edit Crew Member' : 'Add Crew Member'}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('basic')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'basic'
                  ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Basic Info
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'documents'
                  ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Documents
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[60vh] p-4">
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                {error}
              </div>
            )}

            {activeTab === 'basic' && (
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role *
                  </label>
                  <select
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  >
                    {TITLES.map(t => (
                      <option key={t.value} value={t.value}>
                        {t.icon} {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Other title */}
                {title === 'other' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Specify Role
                    </label>
                    <input
                      type="text"
                      value={titleOther}
                      onChange={(e) => setTitleOther(e.target.value)}
                      placeholder="e.g., Security Officer"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus('active')}
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                        status === 'active'
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('inactive')}
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                        status === 'inactive'
                          ? 'bg-gray-500 text-white border-gray-500'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      Inactive
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                {/* Passport */}
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    🛂 Passport
                    <span className="text-xs text-gray-500 font-normal">(optional)</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                      placeholder="Passport number"
                      className="col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
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
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  {/* Passport Upload */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                    {passportUrl ? (
                      <div className="flex items-center gap-3">
                        <a href={passportUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <img src={passportUrl} alt="Passport" className="h-16 w-auto rounded border object-cover" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleShareDoc('Passport', passportUrl)}
                          className="p-2 text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPassportUrl(null)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleDocUpload(e.target.files[0], 'passport')}
                          />
                          {uploading === 'passport' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4 text-gray-400" />}
                          <span className="text-sm text-gray-500">Upload</span>
                        </label>
                        <label className="flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleDocUpload(e.target.files[0], 'passport')}
                          />
                          <Camera className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">Camera</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Emirates ID */}
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    🪪 Emirates ID
                    <span className="text-xs text-gray-500 font-normal">(optional)</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={emiratesIdNumber}
                      onChange={(e) => setEmiratesIdNumber(e.target.value)}
                      placeholder="ID number"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <input
                      type="date"
                      value={emiratesIdExpiry}
                      onChange={(e) => setEmiratesIdExpiry(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  {/* Emirates ID Upload */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                    {emiratesIdUrl ? (
                      <div className="flex items-center gap-3">
                        <a href={emiratesIdUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <img src={emiratesIdUrl} alt="Emirates ID" className="h-16 w-auto rounded border object-cover" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleShareDoc('Emirates ID', emiratesIdUrl)}
                          className="p-2 text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmiratesIdUrl(null)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleDocUpload(e.target.files[0], 'emirates_id')}
                          />
                          {uploading === 'emirates_id' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4 text-gray-400" />}
                          <span className="text-sm text-gray-500">Upload</span>
                        </label>
                        <label className="flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleDocUpload(e.target.files[0], 'emirates_id')}
                          />
                          <Camera className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">Camera</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Marine License */}
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    ⚓ Marine License
                    <span className="text-xs text-gray-500 font-normal">(optional)</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={marineLicenseNumber}
                      onChange={(e) => setMarineLicenseNumber(e.target.value)}
                      placeholder="License number"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <input
                      type="text"
                      value={marineLicenseType}
                      onChange={(e) => setMarineLicenseType(e.target.value)}
                      placeholder="Type (e.g., Master 200GT)"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                    <input
                      type="date"
                      value={marineLicenseExpiry}
                      onChange={(e) => setMarineLicenseExpiry(e.target.value)}
                      placeholder="Expiry date"
                      className="col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  {/* Marine License Upload */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                    {marineLicenseUrl ? (
                      <div className="flex items-center gap-3">
                        <a href={marineLicenseUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <img src={marineLicenseUrl} alt="Marine License" className="h-16 w-auto rounded border object-cover" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleShareDoc('Marine License', marineLicenseUrl)}
                          className="p-2 text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/30 rounded-lg"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMarineLicenseUrl(null)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleDocUpload(e.target.files[0], 'marine_license')}
                          />
                          {uploading === 'marine_license' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4 text-gray-400" />}
                          <span className="text-sm text-gray-500">Upload</span>
                        </label>
                        <label className="flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleDocUpload(e.target.files[0], 'marine_license')}
                          />
                          <Camera className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">Camera</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                  />
                </div>
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              {editingMember ? 'Save Changes' : 'Add Crew Member'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
