'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export type BoatRole = 'owner' | 'captain' | 'crew' | null;

interface BoatAccess {
  role: BoatRole;
  isOwner: boolean;
  isCaptain: boolean;
  isCrew: boolean;
  canEdit: boolean;      // Can edit boat details
  canDelete: boolean;    // Can delete items
  canInvite: boolean;    // Can invite crew
  canAddEntries: boolean; // Can add logs, parts, etc.
  loading: boolean;
}

export function useBoatAccess(boatId: string | null): BoatAccess {
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState<BoatRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !user || !boatId) {
      setLoading(!isLoaded);
      return;
    }

    async function fetchRole() {
      try {
        const res = await fetch(`/api/boats/${boatId}/access`);
        if (res.ok) {
          const data = await res.json();
          setRole(data.role);
        } else {
          setRole(null);
        }
      } catch (err) {
        console.error('Error fetching boat access:', err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [boatId, user, isLoaded]);

  const isOwner = role === 'owner';
  const isCaptain = role === 'captain';
  const isCrew = role === 'crew';

  return {
    role,
    isOwner,
    isCaptain,
    isCrew,
    canEdit: isOwner,                          // Only owner can edit boat details
    canDelete: isOwner || isCaptain,           // Owner and captain can delete
    canInvite: isOwner || isCaptain,           // Owner and captain can invite
    canAddEntries: isOwner || isCaptain || isCrew, // Everyone can add entries
    loading,
  };
}
