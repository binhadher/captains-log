'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Ship, 
  Settings, 
  FileText, 
  Wrench,
  Calendar,
  MapPin,
  Pencil,
  Trash2,
  Plus,
  Cog,
  Coins,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Camera,
  ImageIcon,
  Upload,
  Loader2,
  Star,
  X,
  ChevronLeft,
} from 'lucide-react';
import { BoatDetailSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { CurrencyToggle } from '@/components/ui/CurrencyToggle';
import { useCurrency, AedSymbol } from '@/components/providers/CurrencyProvider';
import dynamic from 'next/dynamic';

// Dynamic import for Clerk components to prevent SSR issues
const UserButton = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.UserButton),
  { ssr: false, loading: () => <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" /> }
);
import { Boat, BoatComponent, Part, HealthCheck, Document, SafetyEquipment } from '@/types/database';
import { ComponentList } from '@/components/boats/ComponentList';
import { ComponentSetupModal } from '@/components/boats/ComponentSetupModal';
import { BoatSetupWizard } from '@/components/boats/BoatSetupWizard';
import { AddComponentModal } from '@/components/boats/AddComponentModal';
import { PartsList } from '@/components/parts/PartsList';
import { AddPartModal } from '@/components/parts/AddPartModal';
import { EditPartModal } from '@/components/parts/EditPartModal';
import { HealthCheckList } from '@/components/health/HealthCheckList';
import { AddHealthCheckModal } from '@/components/health/AddHealthCheckModal';
import { EditHealthCheckModal } from '@/components/health/EditHealthCheckModal';
import { DocumentsList } from '@/components/documents/DocumentsList';
import { AddDocumentModal } from '@/components/documents/AddDocumentModal';
import { EditDocumentModal } from '@/components/documents/EditDocumentModal';
import { AlertsList } from '@/components/alerts/AlertsList';
import { CrewList, CrewMember } from '@/components/crew/CrewList';
import { AddCrewModal } from '@/components/crew/AddCrewModal';
import { CrewDetailModal } from '@/components/crew/CrewDetailModal';
import { InviteCrewModal } from '@/components/crew/InviteCrewModal';
import { UserPlus } from 'lucide-react';
import { Alert } from '@/lib/alerts';
import { Package, Activity, AlertTriangle, Users, Shield } from 'lucide-react';
import { EditBoatModal } from '@/components/boats/EditBoatModal';
import { EditEnginesModal } from '@/components/boats/EditEnginesModal';
import { EditComponentModal } from '@/components/boats/EditComponentModal';
import { AddMaintenanceModal } from '@/components/maintenance/AddMaintenanceModal';
import { PDFExport } from '@/components/export/PDFExport';
import { DataPlateUpload } from '@/components/boats/DataPlateUpload';
import { BoatHero } from '@/components/boats/BoatHero';
import { SafeImage } from "@/components/ui/SafeImage";
import { FileUpload } from "@/components/ui/FileUpload";
import { CameraCapture } from "@/components/ui/CameraCapture";
// FAB removed - BottomNav handles mobile, section buttons handle desktop
import { SafetyEquipmentList } from '@/components/safety/SafetyEquipmentList';

const MAX_GALLERY_PHOTOS = 30;
import { AddSafetyEquipmentModal } from '@/components/safety/AddSafetyEquipmentModal';
import { EditSafetyEquipmentModal } from '@/components/safety/EditSafetyEquipmentModal';
import { SafetyEquipmentDetailModal } from '@/components/safety/SafetyEquipmentDetailModal';
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal';
import { PartDetailModal } from '@/components/parts/PartDetailModal';
import { HealthCheckDetailModal } from '@/components/health/HealthCheckDetailModal';
import { useBoatAccess } from '@/hooks/useBoatAccess';

export default function BoatDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currency } = useCurrency();
  const boatId = params.id as string;
  const { role, canDelete, canInvite, canEdit, isOwner } = useBoatAccess(boatId);
  const [boat, setBoat] = useState<Boat | null>(null);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [components, setComponents] = useState<BoatComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [showAddPart, setShowAddPart] = useState(false);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [showAddHealthCheck, setShowAddHealthCheck] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [showAddBoatDetails, setShowAddBoatDetails] = useState(false);
  const [showAddRegistration, setShowAddRegistration] = useState(false);
  const [boatDetailsExpanded, setBoatDetailsExpanded] = useState(false);
  const [gallery, setGallery] = useState<Array<{ id: string; file_url: string; file_type: 'image' | 'video'; mime_type: string; file_size: number; caption: string | null; created_at: string }>>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryNotice, setGalleryNotice] = useState<string>('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showGalleryCamera, setShowGalleryCamera] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [showAddCrew, setShowAddCrew] = useState(false);
  const [showInviteCrew, setShowInviteCrew] = useState(false);
  const [editingCrew, setEditingCrew] = useState<CrewMember | null>(null);
  const [viewingCrew, setViewingCrew] = useState<CrewMember | null>(null);
  const [showEditBoat, setShowEditBoat] = useState(false);
  const [showEditEngines, setShowEditEngines] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [editingHealthCheck, setEditingHealthCheck] = useState<HealthCheck | null>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingComponent, setEditingComponent] = useState<BoatComponent | null>(null);
  const [maintenanceAlert, setMaintenanceAlert] = useState<{ alert: Alert; component: BoatComponent } | null>(null);
  const [maintenanceLogs, setMaintenanceLogs] = useState<Array<{
    id: string;
    maintenance_item: string;
    date: string;
    description?: string;
    cost?: number;
    currency?: string;
    hours_at_service?: number;
    notes?: string;
    component_name?: string;
  }>>([]);
  const [safetyEquipment, setSafetyEquipment] = useState<SafetyEquipment[]>([]);
  const [showAddSafetyEquipment, setShowAddSafetyEquipment] = useState(false);
  const [editingSafetyEquipment, setEditingSafetyEquipment] = useState<SafetyEquipment | null>(null);
  
  // Viewing state for detail modals
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [viewingPart, setViewingPart] = useState<Part | null>(null);
  const [viewingHealthCheck, setViewingHealthCheck] = useState<HealthCheck | null>(null);
  const [viewingSafetyEquipment, setViewingSafetyEquipment] = useState<SafetyEquipment | null>(null);

  // Fetch all maintenance logs for PDF export
  const fetchMaintenanceLogs = async (boatId: string) => {
    try {
      const response = await fetch(`/api/boats/${boatId}/logs`);
      if (response.ok) {
        const data = await response.json();
        setMaintenanceLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching maintenance logs:', err);
    }
  };

  // Handle alert completion - open maintenance modal
  const handleAlertCompleted = (alert: Alert) => {
    if (!alert.componentId) return;
    
    // Find the component for this alert
    const component = components.find(c => c.id === alert.componentId);
    if (component) {
      setMaintenanceAlert({ alert, component });
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchBoat(params.id as string);
      fetchComponents(params.id as string);
      fetchParts(params.id as string);
      fetchHealthChecks(params.id as string);
      fetchAlerts(params.id as string);
      fetchDocuments(params.id as string);
      fetchCrew(params.id as string);
      fetchCosts(params.id as string);
      fetchMaintenanceLogs(params.id as string);
      fetchSafetyEquipment(params.id as string);
      fetchGallery(params.id as string);
    }
  }, [params.id]);

  // Check if crew member needs to complete their profile
  useEffect(() => {
    async function checkCrewProfile() {
      if (!params.id || isOwner || role === null) return;
      
      // Only check for crew members (not owners)
      if (role === 'crew' || role === 'captain') {
        try {
          const res = await fetch(`/api/boats/${params.id}/my-crew-profile`);
          if (res.ok) {
            const data = await res.json();
            // If crew member exists but profile is incomplete (no phone), redirect
            if (data.crewMember && !data.crewMember.phone) {
              router.replace(`/crew/profile/${data.crewMember.id}`);
            }
          }
        } catch (err) {
          console.error('Error checking crew profile:', err);
        }
      }
    }
    
    checkCrewProfile();
  }, [params.id, role, isOwner, router]);

  // Handle quick action from bottom nav
  useEffect(() => {
    const action = searchParams.get('action');
    if (action) {
      switch (action) {
        case 'health':
          setShowAddHealthCheck(true);
          break;
        case 'part':
          setShowAddPart(true);
          break;
        case 'document':
          setShowAddDocument(true);
          break;
        case 'crew':
          setShowAddCrew(true);
          break;
      }
      // Clean up URL
      router.replace(`/boats/${params.id}`, { scroll: false });
    }
  }, [searchParams, params.id, router]);

  // Store viewCrew param to persist it while crew loads
  const [pendingViewCrewId, setPendingViewCrewId] = useState<string | null>(null);
  
  // Capture viewCrew param on mount
  useEffect(() => {
    const viewCrewId = searchParams.get('viewCrew');
    if (viewCrewId) {
      setPendingViewCrewId(viewCrewId);
      // Clean up URL immediately
      router.replace(`/boats/${params.id}`, { scroll: false });
    }
  }, [searchParams, params.id, router]);

  // Open crew modal when crew data loads and we have a pending viewCrew
  useEffect(() => {
    if (pendingViewCrewId && crew.length > 0) {
      const crewMember = crew.find(c => c.id === pendingViewCrewId);
      if (crewMember) {
        setViewingCrew(crewMember);
        setPendingViewCrewId(null); // Clear it
      }
    }
  }, [pendingViewCrewId, crew]);

  const fetchCosts = async (boatId: string) => {
    try {
      const response = await fetch(`/api/boats/${boatId}/costs`);
      if (response.ok) {
        const data = await response.json();
        setTotalCost(data.summary?.totalAllTime || 0);
      }
    } catch (err) {
      console.error('Error fetching costs:', err);
    }
  };

  const fetchSafetyEquipment = async (boatId: string) => {
    try {
      const response = await fetch(`/api/boats/${boatId}/safety-equipment`);
      if (response.ok) {
        const data = await response.json();
        setSafetyEquipment(data.equipment || []);
      }
    } catch (err) {
      console.error('Error fetching safety equipment:', err);
    }
  };

  const fetchComponents = async (boatId: string) => {
    try {
      const response = await fetch(`/api/boats/${boatId}/components`);
      if (response.ok) {
        const data = await response.json();
        setComponents(data.components || []);
      }
    } catch (err) {
      console.error('Error fetching components:', err);
    }
  };

  const fetchParts = async (boatId: string) => {
    try {
      const response = await fetch(`/api/boats/${boatId}/parts`);
      if (response.ok) {
        const data = await response.json();
        setParts(data.parts || []);
      }
    } catch (err) {
      console.error('Error fetching parts:', err);
    }
  };

  const fetchHealthChecks = async (boatId: string) => {
    try {
      const response = await fetch(`/api/boats/${boatId}/health-checks`);
      if (response.ok) {
        const data = await response.json();
        setHealthChecks(data.checks || []);
      }
    } catch (err) {
      console.error('Error fetching health checks:', err);
    }
  };

  const fetchAlerts = async (boatId: string) => {
    try {
      const response = await fetch(`/api/boats/${boatId}/alerts`);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  const fetchDocuments = async (boatId: string) => {
    try {
      const response = await fetch(`/api/boats/${boatId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  const fetchGallery = async (boatId: string) => {
    try {
      const response = await fetch(`/api/boats/${boatId}/gallery`);
      if (response.ok) {
        const data = await response.json();
        setGallery(data.gallery || []);
      }
    } catch (err) {
      console.error('Error fetching gallery:', err);
    }
  };

  const fetchCrew = async (boatId: string) => {
    try {
      const response = await fetch(`/api/boats/${boatId}/crew`);
      if (response.ok) {
        const data = await response.json();
        setCrew(data.crew || []);
      }
    } catch (err) {
      console.error('Error fetching crew:', err);
    }
  };

  const handleDeleteCrew = async (member: CrewMember) => {
    // Note: confirm dialog is shown in CrewList component
    try {
      const response = await fetch(`/api/crew/${member.id}`, { method: 'DELETE' });
      if (response.ok && boat) {
        fetchCrew(boat.id);
      }
    } catch (err) {
      console.error('Error deleting crew member:', err);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const response = await fetch(`/api/boats/${params.id}/documents?docId=${docId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        // Use functional update to handle bulk deletes correctly
        setDocuments(prev => prev.filter(d => d.id !== docId));
        // Refresh alerts since a document with expiry might have been deleted
        fetchAlerts(params.id as string);
      }
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !boat) return;
    setUploadingGallery(true);
    setGalleryNotice('');
    try {
      let addedCount = 0;
      for (const file of Array.from(files)) {
        if (gallery.length + addedCount >= MAX_GALLERY_PHOTOS) {
          setGalleryNotice(`Photo limit reached (${MAX_GALLERY_PHOTOS} max).`);
          break;
        }
        // 1) get a signed upload URL (proven flow used by BoatHero)
        const ext = file.name.split('.').pop() || 'jpg';
        const signedRes = await fetch('/api/upload/signed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: `gallery-${Date.now()}.${ext}`, fileType: file.type, boatId: boat.id }),
        });
        const signed = await signedRes.json().catch(() => ({}));
        if (!signedRes.ok) throw new Error(signed.error || 'Failed to sign upload');
        // 2) PUT the file directly
        const upRes = await fetch(signed.signedUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
        if (!upRes.ok) throw new Error('Failed to upload image');
        // 3) insert gallery row with the returned publicUrl
        const insRes = await fetch(`/api/boats/${boat.id}/gallery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_url: signed.publicUrl, file_type: file.type.startsWith('video/') ? 'video' : 'image', mime_type: file.type, file_size: file.size }),
        });
        const ins = await insRes.json().catch(() => ({}));
        if (!insRes.ok) throw new Error(ins.error || 'Failed to save gallery item');
        addedCount++;
      }
      fetchGallery(boat.id);
      fetchBoat(boat.id);
    } catch (err) {
      console.error('Gallery upload error:', err);
      setGalleryNotice('Failed to upload photo.');
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleGalleryCameraCapture = async (file: File) => {
    if (!boat) return;
    setUploadingGallery(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/boats/${boat.id}/gallery`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      fetchGallery(boat.id);
      fetchBoat(boat.id);
    } catch (err) {
      console.error('Gallery camera upload error:', err);
      alert('Failed to upload photo');
    } finally {
      setUploadingGallery(false);
      setShowGalleryCamera(false);
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    if (!confirm('Delete this photo?')) return;
    try {
      const res = await fetch(`/api/boats/${params.id}/gallery?itemId=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGallery(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error('Gallery delete error:', err);
    }
  };

  const handleGalleryShare = async (item: { id: string; file_url: string; file_type: string; mime_type: string; caption: string | null }) => {
    try {
      const response = await fetch(item.file_url);
      const blob = await response.blob();
      const filename = item.caption || `boat-photo-${item.id.slice(0, 8)}.jpg`;
      const file = new File([blob], filename, { type: item.mime_type || 'image/jpeg' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
        alert('Failed to share photo');
      }
    }
  };

  const handleSetCover = async (item: { id: string; file_url: string; file_type: string }) => {
    if (item.file_type !== 'image' || !boat) return;
    try {
      const res = await fetch(`/api/boats/${boat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: item.file_url }),
      });
      if (!res.ok) throw new Error('Failed to set cover');
      fetchBoat(boat.id);
    } catch (err) {
      console.error('Set cover error:', err);
      alert('Failed to set cover photo');
    }
  };

  const fetchBoat = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/boats/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Boat not found');
        }
        throw new Error('Failed to fetch boat');
      }
      
      const data = await response.json();
      setBoat(data.boat);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load boat');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!boat) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete "${boat.name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/boats/${boat.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete boat');
      }

      router.push('/');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete boat');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <BoatDetailSkeleton />;
  }

  if (error || !boat) {
    return (
      <div className="min-h-screen bg-dubai flex items-center justify-center">
        <div className="text-center">
          <Ship className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{error || 'Boat not found'}</h2>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const engineLabels = getEngineLabels(boat.number_of_engines || 2);

  return (
    <div className="min-h-screen bg-dubai">
      {/* Header */}
      <header className="glass-header sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
              <Link href="/" className="p-2 hover:bg-gray-200 dark:hover:bg-white/20 rounded-lg transition-colors flex-shrink-0">
                <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-white" />
              </Link>
              <h1 className="text-lg font-bold text-teal-700 dark:text-white truncate">{boat.name}</h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <CurrencyToggle />
              <ThemeToggle />
              <Link 
                href={`/boats/${params.id}/gallery`}
                className="p-2 bg-gray-200 dark:bg-white/20 hover:bg-gray-300 dark:hover:bg-white/30 rounded-lg transition-colors"
                title="Photo Gallery"
              >
                <Camera className="w-5 h-5 text-gray-700 dark:text-white" />
              </Link>
              <PDFExport
                boat={boat}
                components={components}
                logs={maintenanceLogs}
                documents={documents}
              />
              <Link 
                href="/settings" 
                className="p-2 bg-gray-200 dark:bg-white/20 hover:bg-gray-300 dark:hover:bg-white/30 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-gray-700 dark:text-white" />
              </Link>
              <button 
                onClick={handleDelete} 
                disabled={deleting}
                className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                title="Delete boat"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Photo */}
        <BoatHero
          boatId={boat.id}
          boatName={boat.name}
          photoUrl={boat.photo_url}
          onPhotoChange={(url) => setBoat({ ...boat, photo_url: url || undefined })}
        />

        {/* Boat Info Card */}
        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Ship className="w-4 h-4" />
              Boat Details
            </h2>
            {canEdit && (
              <button
                onClick={() => setShowEditBoat(true)}
                className="p-2 text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                title="Edit boat details"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(boat.make || boat.model) && (
              <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-200 uppercase tracking-wide mb-1">Model</p>
                  <p className="text-gray-900 dark:text-white font-medium text-sm">
                    {[boat.make, boat.model].filter(Boolean).join(' ')}
                  </p>
                </div>
              </div>
            )}
            {boat.year && (
              <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-200 uppercase tracking-wide mb-1">Year</p>
                  <p className="text-gray-900 dark:text-white font-medium text-sm">{boat.year}</p>
                </div>
              </div>
            )}
            {boat.length && (
              <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-200 uppercase tracking-wide mb-1">Length</p>
                  <p className="text-gray-900 dark:text-white font-medium text-sm">{boat.length} ft</p>
                </div>
              </div>
            )}
            {boat.hull_id && (
              <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-200 uppercase tracking-wide mb-1">Hull</p>
                  <p className="text-gray-900 dark:text-white font-medium text-sm">{boat.hull_id}</p>
                </div>
              </div>
            )}
            {boat.home_port && (
              <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-200 uppercase tracking-wide mb-1">Port</p>
                  <p className="text-gray-900 dark:text-white font-medium text-sm">{boat.home_port}</p>
                </div>
              </div>
            )}

            {/* Registration */}
            <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Registration</span>
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowAddRegistration(true)}
                      disabled={uploadingGallery}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Take photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowAddRegistration(true)}
                      disabled={uploadingGallery}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Upload file"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <DocumentsList
                  documents={documents.filter(d => d.category === 'registration')}
                  onView={(doc) => setViewingDocument(doc)}
                  onEdit={canDelete ? (doc) => setEditingDocument(doc) : undefined}
                  onDelete={canDelete ? handleDeleteDocument : undefined}
                  maxHeight="160px"
                />
              </div>
            </div>

            {/* Boat Photo Gallery */}
            <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Photo Gallery</span>
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowGalleryCamera(true)}
                      disabled={uploadingGallery}
                      className="p-2 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Take photo"
                    >
                      {uploadingGallery ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    </button>
                    <label className="p-2 text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
                      <ImageIcon className="w-4 h-4" />
                      <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleGalleryUpload}
                        id="gallery-upload"
                      />
                    </label>
                  </div>
                )}
              </div>
              {gallery.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No gallery photos yet</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {gallery.map((item, idx) => (
                    <div
                      key={item.id}
                      className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-zoom-in"
                      onClick={() => setLightboxIndex(idx)}
                    >
                      <SafeImage
                        src={item.file_url}
                        alt={item.caption || 'Boat photo'}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-between p-1.5 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleGalleryShare(item)}
                          className="p-1 bg-white/90 dark:bg-gray-900/90 rounded text-gray-700 dark:text-gray-200"
                          title="Share"
                        >
                          <Upload className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteGalleryItem(item.id)}
                          className="p-1 bg-white/90 dark:bg-gray-900/90 rounded text-red-600 dark:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{gallery.length}/{MAX_GALLERY_PHOTOS} photos</span>
              </div>
              {galleryNotice && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{galleryNotice}</p>
              )}
            </div>
          </div>
        </div>

        {/* Gallery Lightbox */}
        {lightboxIndex !== null && gallery[lightboxIndex] && (
          <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center" onClick={() => setLightboxIndex(null)}>
            <button onClick={() => setLightboxIndex(null)} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white" title="Close">
              <X className="w-6 h-6" />
            </button>
            {gallery.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + gallery.length) % gallery.length); }} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white" title="Previous">
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            <div className="flex flex-col items-center max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <SafeImage
                src={gallery[lightboxIndex].file_url}
                alt={gallery[lightboxIndex].caption || 'Boat photo'}
                className="max-w-full max-h-[82vh] object-contain rounded"
              />
              <div className="mt-3 flex items-center gap-3 text-white">
                <span className="text-sm">{lightboxIndex + 1} / {gallery.length}</span>
                <button onClick={() => handleGalleryShare(gallery[lightboxIndex])} className="p-1.5 text-white/80 hover:text-white" title="Share">
                  <Upload className="w-5 h-5" />
                </button>
                <button onClick={() => handleDeleteGalleryItem(gallery[lightboxIndex].id)} className="p-1.5 text-red-400 hover:text-red-300" title="Delete">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            {gallery.length > 1 && (
              <button onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % gallery.length); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white" title="Next">
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
        )}

        {/* Engines Card */}
        {boat.engines && boat.engines.length > 0 && (
          <div className="glass-card rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Engines
              </h2>
              {canEdit && (
                <button
                  onClick={() => setShowEditEngines(true)}
                  className="p-2 text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                  title="Edit engines & generator"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {boat.engines.map((engine, index) => (
                <div key={index} className="bg-gray-50/50 dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-200 uppercase tracking-wide mb-1">
                        {engineLabels[index]}
                      </p>
                      {engine.brand || engine.model ? (
                        <p className="text-gray-900 dark:text-white font-medium text-sm">
                          {[engine.brand, engine.model].filter(Boolean).join(' ')}
                        </p>
                      ) : (
                        <p className="text-gray-400 dark:text-gray-400 italic text-sm">Not specified</p>
                      )}
                    </div>
                  </div>
                  {/* Engine Data Plate */}
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Data Plate</span>
                      <DataPlateUpload
                        label={`${engineLabels[index]} Data Plate`}
                        currentUrl={engine.data_plate_url}
                        onUpload={async (file) => {
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('type', 'engine');
                          formData.append('engineIndex', index.toString());
                          
                          const response = await fetch(`/api/boats/${boat.id}/data-plate`, {
                            method: 'POST',
                            body: formData,
                          });
                          
                          if (!response.ok) throw new Error('Upload failed');
                          const data = await response.json();
                          setBoat(data.boat);
                        }}
                        onDelete={async () => {
                          const response = await fetch(
                            `/api/boats/${boat.id}/data-plate?type=engine&engineIndex=${index}`,
                            { method: 'DELETE' }
                          );
                          if (!response.ok) throw new Error('Delete failed');
                          const data = await response.json();
                          setBoat(data.boat);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Generator */}
            {(boat.generator_brand || boat.generator_model) && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-200 uppercase tracking-wide mb-1">Generator</p>
                    <p className="text-gray-900 dark:text-white font-medium text-sm">
                      {[boat.generator_brand, boat.generator_model].filter(Boolean).join(' ')}
                    </p>
                  </div>
                </div>
                {/* Generator Data Plate */}
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Data Plate</span>
                    <DataPlateUpload
                      label="Generator Data Plate"
                      currentUrl={boat.generator_data_plate}
                      onUpload={async (file) => {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('type', 'generator');
                        
                        const response = await fetch(`/api/boats/${boat.id}/data-plate`, {
                          method: 'POST',
                          body: formData,
                        });
                        
                        if (!response.ok) throw new Error('Upload failed');
                        const data = await response.json();
                        setBoat(data.boat);
                      }}
                      onDelete={async () => {
                        const response = await fetch(
                          `/api/boats/${boat.id}/data-plate?type=generator`,
                          { method: 'DELETE' }
                        );
                        if (!response.ok) throw new Error('Delete failed');
                        const data = await response.json();
                        setBoat(data.boat);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="glass-card rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Upcoming
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({alerts.length})</span>
              </h2>
            </div>
            <AlertsList 
              alerts={alerts} 
              boatId={boat.id} 
              compact 
              onAlertDismissed={() => fetchAlerts(boat.id)}
              onAlertCompleted={handleAlertCompleted}
            />
          </div>
        )}

        {/* Cost Tracking Quick Link */}
        <Link 
          href={`/boats/${boat.id}/costs`}
          className="glass-card rounded-xl p-4 mb-4 flex items-center justify-between hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Coins className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Cost Tracking</h2>
              {totalCost > 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  Total: {currency === 'AED' && <AedSymbol className="w-3 h-3 inline" />}
                  {currency === 'USD' && '$'}
                  {currency === 'EUR' && '€'}
                  {totalCost.toLocaleString()}
                </p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">View spending trends & breakdown</p>
              )}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
        </Link>

        {/* Components Section */}
        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Cog className="w-4 h-4" />
              Systems & Components
            </h2>
          </div>
          <ComponentList 
            components={components} 
            boatId={boat.id}
            onSetupClick={() => setShowWizard(true)}
            onAddClick={() => setShowAddComponent(true)}
            onEditComponent={canEdit ? (comp) => setEditingComponent(comp) : undefined}
          />
        </div>

        {/* Safety Equipment Section */}
        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Safety Equipment
              {safetyEquipment.length > 0 && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({safetyEquipment.length})</span>
              )}
            </h2>
            <Button size="sm" onClick={() => setShowAddSafetyEquipment(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          <SafetyEquipmentList
            equipment={safetyEquipment}
            onView={(item) => setViewingSafetyEquipment(item)}
            onEdit={canDelete ? (item) => setEditingSafetyEquipment(item) : undefined}
            onDelete={canDelete ? async (item) => {
              try {
                const response = await fetch(`/api/safety-equipment/${item.id}`, { method: 'DELETE' });
                if (response.ok) {
                  fetchSafetyEquipment(boat!.id);
                  fetchAlerts(boat!.id);
                }
              } catch (err) {
                console.error('Error deleting safety equipment:', err);
              }
            } : undefined}
          />
        </div>

        {/* Boat Health */}
        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Boat Health
              {healthChecks.length > 0 && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({healthChecks.length})</span>
              )}
            </h2>
            <Button size="sm" onClick={() => setShowAddHealthCheck(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Quick Check
            </Button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <HealthCheckList 
              checks={healthChecks}
              onView={(check) => setViewingHealthCheck(check)}
              onEdit={canDelete ? (check) => setEditingHealthCheck(check) : undefined}
              onDelete={canDelete ? async (check) => {
                try {
                  const response = await fetch(`/api/health-checks/${check.id}`, { method: 'DELETE' });
                  if (response.ok) {
                    fetchHealthChecks(boat.id);
                  }
                } catch (err) {
                  console.error('Error deleting health check:', err);
                }
              } : undefined}
            />
          </div>
        </div>

        {/* Parts Catalog */}
        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4" />
              Parts Catalog
              {parts.length > 0 && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({parts.length})</span>
              )}
            </h2>
            <Button size="sm" onClick={() => setShowAddPart(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Part
            </Button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <PartsList 
              parts={parts}
              onView={(part) => setViewingPart(part)}
              onEdit={canDelete ? (part) => setEditingPart(part) : undefined}
              onDelete={canDelete ? async (part) => {
                try {
                  const response = await fetch(`/api/parts/${part.id}`, { method: 'DELETE' });
                  if (response.ok) {
                    fetchParts(boat.id);
                  }
                } catch (err) {
                  console.error('Error deleting part:', err);
                }
              } : undefined}
            />
          </div>
        </div>

        {/* Boat-level Documents (registration, insurance, etc.) */}
        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Boat Documents
              {documents.filter(d => d.category !== 'boat_details' && d.category !== 'registration').length > 0 && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({documents.filter(d => d.category !== 'boat_details' && d.category !== 'registration').length})</span>
              )}
            </h2>
            <Button size="sm" onClick={() => setShowAddDocument(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Upload
            </Button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <DocumentsList 
              documents={documents.filter(d => d.category !== 'boat_details' && d.category !== 'registration')}
              onView={(doc) => setViewingDocument(doc)}
              onEdit={canDelete ? (doc) => setEditingDocument(doc) : undefined}
              onDelete={canDelete ? handleDeleteDocument : undefined}
            />
          </div>
        </div>

        {/* Boat Details Attachments */}
        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Boat Details Attachments
              {documents.filter(d => d.category === 'boat_details').length > 0 && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({documents.filter(d => d.category === 'boat_details').length})
                </span>
              )}
            </h2>
            <Button size="sm" onClick={() => setShowAddBoatDetails(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <DocumentsList
              documents={documents.filter(d => d.category === 'boat_details')}
              onView={(doc) => setViewingDocument(doc)}
              onEdit={canDelete ? (doc) => setEditingDocument(doc) : undefined}
              onDelete={canDelete ? handleDeleteDocument : undefined}
            />
          </div>
        </div>

        {/* Crew Section */}
        <div className="glass-card rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4" />
              Crew
              {crew.length > 0 && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({crew.filter(c => c.status === 'active').length} active)</span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              {canInvite && (
                <Button 
                  size="sm" 
                  onClick={() => setShowInviteCrew(true)}
                  className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Invite
                </Button>
              )}
              {canDelete && (
                <Button size="sm" variant="outline" onClick={() => setShowAddCrew(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <CrewList 
              crew={crew}
              boatId={boatId}
              onView={(member) => setViewingCrew(member)}
              onEdit={canDelete ? (member) => { setEditingCrew(member); setShowAddCrew(true); } : undefined}
              onDelete={canDelete ? handleDeleteCrew : undefined}
              onInviteSent={() => fetchCrew(boatId)}
            />
          </div>
        </div>
      </main>

      {/* Gallery Camera Capture */}
      {showGalleryCamera && (
        <CameraCapture
          onCapture={handleGalleryCameraCapture}
          onClose={() => setShowGalleryCamera(false)}
          mode="photo"
        />
      )}

      {/* Add Component Modal (single component) */}
      <AddComponentModal
        isOpen={showAddComponent}
        onClose={() => setShowAddComponent(false)}
        boatId={boat.id}
        onSuccess={() => fetchComponents(boat.id)}
      />

      {/* Boat Setup Wizard (new guided flow) */}
      <BoatSetupWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        boatId={boat.id}
        boatName={boat.name}
        onComplete={() => {
          setShowWizard(false);
          fetchComponents(boat.id);
        }}
      />

      {/* Component Setup Modal (legacy quick setup) */}
      <ComponentSetupModal
        isOpen={showSetup}
        onClose={() => setShowSetup(false)}
        boatId={boat.id}
        numberOfEngines={boat.number_of_engines || 2}
        engines={boat.engines}
        generatorBrand={boat.generator_brand}
        generatorModel={boat.generator_model}
        onComplete={() => fetchComponents(boat.id)}
      />

      {/* Add Part Modal */}
      <AddPartModal
        isOpen={showAddPart}
        onClose={() => setShowAddPart(false)}
        boatId={boat.id}
        components={components}
        onSuccess={() => fetchParts(boat.id)}
      />

      {/* Add Health Check Modal */}
      <AddHealthCheckModal
        isOpen={showAddHealthCheck}
        onClose={() => setShowAddHealthCheck(false)}
        boatId={boat.id}
        components={components}
        onSuccess={() => fetchHealthChecks(boat.id)}
      />

      {/* Add Document Modal */}
      <AddDocumentModal
        isOpen={showAddDocument}
        onClose={() => setShowAddDocument(false)}
        boatId={boat.id}
        onSuccess={() => {
          fetchDocuments(boat.id);
          fetchAlerts(boat.id); // Refresh alerts for new expiry dates
        }}
      />

      {/* Add Boat Details Attachment Modal */}
      <AddDocumentModal
        isOpen={showAddBoatDetails}
        onClose={() => setShowAddBoatDetails(false)}
        boatId={boat.id}
        defaultCategory="boat_details"
        onSuccess={() => {
          fetchDocuments(boat.id);
          fetchAlerts(boat.id); // Refresh alerts for new expiry dates
        }}
      />

{/* Add Registration Modal */}
      <AddDocumentModal
        isOpen={showAddRegistration}
        onClose={() => setShowAddRegistration(false)}
        boatId={boat.id}
        defaultCategory="registration"
        onSuccess={() => {
          fetchDocuments(boat.id);
          fetchAlerts(boat.id); // Refresh alerts for new expiry dates
        }}
      />

      {/* Add/Edit Crew Modal */}
      <AddCrewModal
        isOpen={showAddCrew}
        onClose={() => { setShowAddCrew(false); setEditingCrew(null); }}
        boatId={boat.id}
        editingMember={editingCrew}
        onSuccess={() => {
          fetchCrew(boat.id);
        }}
      />

      {/* Invite Crew Modal */}
      <InviteCrewModal
        isOpen={showInviteCrew}
        onClose={() => setShowInviteCrew(false)}
        boatId={boat.id}
        boatName={boat.name}
        onInviteSent={() => {
          fetchCrew(boat.id);
        }}
      />

      {/* Crew Detail Modal */}
      <CrewDetailModal
        isOpen={!!viewingCrew}
        onClose={() => setViewingCrew(null)}
        member={viewingCrew}
        onEdit={canDelete ? (member) => {
          setViewingCrew(null);
          setEditingCrew(member);
          setShowAddCrew(true);
        } : undefined}
        boatId={boat.id}
        boatName={boat.name}
      />

      {/* Edit Boat Details Modal */}
      <EditBoatModal
        isOpen={showEditBoat}
        onClose={() => setShowEditBoat(false)}
        boat={boat}
        onSuccess={(updatedBoat) => {
          setBoat(updatedBoat);
        }}
      />

      {/* Edit Engines & Generator Modal */}
      <EditEnginesModal
        isOpen={showEditEngines}
        onClose={() => setShowEditEngines(false)}
        boat={boat}
        onSuccess={(updatedBoat) => {
          setBoat(updatedBoat);
        }}
      />

      {/* Edit Part Modal */}
      <EditPartModal
        isOpen={!!editingPart}
        onClose={() => setEditingPart(null)}
        part={editingPart}
        onSuccess={() => fetchParts(boat.id)}
        onDelete={() => fetchParts(boat.id)}
      />

      {/* Edit Health Check Modal */}
      <EditHealthCheckModal
        isOpen={!!editingHealthCheck}
        onClose={() => setEditingHealthCheck(null)}
        check={editingHealthCheck}
        onSuccess={() => fetchHealthChecks(boat.id)}
        onDelete={() => fetchHealthChecks(boat.id)}
      />

      {/* Edit Document Modal */}
      <EditDocumentModal
        isOpen={!!editingDocument}
        onClose={() => setEditingDocument(null)}
        document={editingDocument}
        onSuccess={() => {
          fetchDocuments(boat.id);
          fetchAlerts(boat.id);
        }}
      />

      {/* Edit Component Modal */}
      <EditComponentModal
        isOpen={!!editingComponent}
        onClose={() => setEditingComponent(null)}
        component={editingComponent}
        onSuccess={() => fetchComponents(boat.id)}
      />

      {/* Add Maintenance Modal (from alert completion) */}
      <AddMaintenanceModal
        isOpen={!!maintenanceAlert}
        onClose={() => setMaintenanceAlert(null)}
        componentId={maintenanceAlert?.component.id || ''}
        componentType={maintenanceAlert?.component.type || ''}
        componentName={maintenanceAlert?.component.name || ''}
        currentHours={maintenanceAlert?.component.current_hours || undefined}
        onSuccess={() => {
          setMaintenanceAlert(null);
          fetchAlerts(boat.id);
          fetchComponents(boat.id);
        }}
      />

      {/* Add Safety Equipment Modal */}
      <AddSafetyEquipmentModal
        isOpen={showAddSafetyEquipment}
        onClose={() => setShowAddSafetyEquipment(false)}
        boatId={boat.id}
        engineType={boat.engine_type}
        onSuccess={() => {
          fetchSafetyEquipment(boat.id);
          fetchAlerts(boat.id);
        }}
      />

      {/* Edit Safety Equipment Modal */}
      <EditSafetyEquipmentModal
        isOpen={!!editingSafetyEquipment}
        onClose={() => setEditingSafetyEquipment(null)}
        equipment={editingSafetyEquipment}
        engineType={boat.engine_type}
        onSuccess={() => {
          fetchSafetyEquipment(boat.id);
          fetchAlerts(boat.id);
        }}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
        document={viewingDocument}
        onEdit={(doc) => {
          setViewingDocument(null);
          setEditingDocument(doc);
        }}
        onDelete={async (docId) => {
          await handleDeleteDocument(docId);
        }}
      />

      {/* Part Detail Modal */}
      <PartDetailModal
        isOpen={!!viewingPart}
        onClose={() => setViewingPart(null)}
        part={viewingPart}
        onEdit={(part) => {
          setViewingPart(null);
          setEditingPart(part);
        }}
        onDelete={async (part) => {
          try {
            const response = await fetch(`/api/parts/${part.id}`, { method: 'DELETE' });
            if (response.ok) {
              fetchParts(boat.id);
            }
          } catch (err) {
            console.error('Error deleting part:', err);
          }
        }}
      />

      {/* Health Check Detail Modal */}
      <HealthCheckDetailModal
        isOpen={!!viewingHealthCheck}
        onClose={() => setViewingHealthCheck(null)}
        check={viewingHealthCheck}
        onEdit={(check) => {
          setViewingHealthCheck(null);
          setEditingHealthCheck(check);
        }}
        onDelete={async (check) => {
          try {
            const response = await fetch(`/api/health-checks/${check.id}`, { method: 'DELETE' });
            if (response.ok) {
              fetchHealthChecks(boat.id);
            }
          } catch (err) {
            console.error('Error deleting health check:', err);
          }
        }}
      />

      {/* Safety Equipment Detail Modal */}
      <SafetyEquipmentDetailModal
        isOpen={!!viewingSafetyEquipment}
        onClose={() => setViewingSafetyEquipment(null)}
        equipment={viewingSafetyEquipment}
        onEdit={(item) => {
          setViewingSafetyEquipment(null);
          setEditingSafetyEquipment(item);
        }}
        onDelete={async (item) => {
          try {
            const response = await fetch(`/api/safety-equipment/${item.id}`, { method: 'DELETE' });
            if (response.ok) {
              fetchSafetyEquipment(boat.id);
              fetchAlerts(boat.id);
            }
          } catch (err) {
            console.error('Error deleting safety equipment:', err);
          }
        }}
      />
    </div>
  );
}

function getEngineLabels(count: number): string[] {
  const labels: Record<number, string[]> = {
    1: ['Engine'],
    2: ['Port Engine', 'Starboard Engine'],
    3: ['Port Engine', 'Center Engine', 'Starboard Engine'],
    4: ['Port Outer', 'Port Inner', 'Starboard Inner', 'Starboard Outer'],
    5: ['Port Outer', 'Port Inner', 'Center', 'Starboard Inner', 'Starboard Outer'],
    6: ['Port Outer', 'Port Mid', 'Port Inner', 'Starboard Inner', 'Starboard Mid', 'Starboard Outer'],
  };
  return labels[count] || labels[2];
}
