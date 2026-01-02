import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createUserQuickAdd } from '../../actions';
import type { QuickAddUserData } from '../types';

export function useQuickAddUser() {
  const queryClient = useQueryClient();
  const [creatingRow, setCreatingRow] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [newUserData, setNewUserData] = useState<QuickAddUserData>({
    organizationId: undefined,
    teamId: undefined,
    firstName: '',
    lastName: '',
    email: '',
  });

  const handleQuickAdd = useCallback(() => {
    setCreatingRow(true);
    setNewUserData({
      organizationId: undefined,
      teamId: undefined,
      firstName: '',
      lastName: '',
      email: '',
    });
  }, []);

  const handleOrgChange = useCallback((value: string | undefined) => {
    setNewUserData((prev) => ({
      ...prev,
      organizationId: value,
      teamId: undefined, // Reset team when org changes
    }));
  }, []);

  const handleTeamChange = useCallback((value: string | undefined) => {
    setNewUserData((prev) => ({
      ...prev,
      teamId: value,
    }));
  }, []);

  const handleSaveNewUser = async () => {
    if (!newUserData.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!newUserData.firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!newUserData.lastName.trim()) {
      toast.error('Last name is required');
      return;
    }

    setSavingUser(true);
    try {
      const result = await createUserQuickAdd({
        email: newUserData.email.trim(),
        firstName: newUserData.firstName.trim(),
        lastName: newUserData.lastName.trim(),
        organizationId: newUserData.organizationId,
        teamId: newUserData.teamId,
      });

      if (result.success) {
        // Invalidate queries to refresh the users list
        await queryClient.invalidateQueries({ queryKey: ['users'] });
        await queryClient.invalidateQueries({ queryKey: ['profiles'] });
        toast.success('User created successfully');
        setCreatingRow(false);
        setNewUserData({
          organizationId: undefined,
          teamId: undefined,
          firstName: '',
          lastName: '',
          email: '',
        });
      } else {
        toast.error(result.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setSavingUser(false);
    }
  };

  const handleCancelNewUser = () => {
    setCreatingRow(false);
    setNewUserData({
      organizationId: undefined,
      teamId: undefined,
      firstName: '',
      lastName: '',
      email: '',
    });
  };

  return {
    creatingRow,
    savingUser,
    newUserData,
    setNewUserData,
    handleQuickAdd,
    handleOrgChange,
    handleTeamChange,
    handleSaveNewUser,
    handleCancelNewUser,
  };
}
