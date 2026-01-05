'use client';

import * as React from 'react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Trash2, Shield, MessageSquare, X } from 'lucide-react';
import { Avatar, getInitials } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { updateUserProfile } from '@/app/(authenticated)/users/actions';
import toast from 'react-hot-toast';

interface UserProfileCardProps {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
  role?: string;
}

export function UserProfileCard({
  userId,
  firstName: initialFirstName,
  lastName: initialLastName,
  email,
  avatarUrl: initialAvatarUrl,
  role = 'user',
}: UserProfileCardProps) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [avatarUrl] = useState(initialAvatarUrl);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);

  // Inline editing state
  const [editingField, setEditingField] = useState<
    'firstName' | 'lastName' | null
  >(null);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = getInitials(firstName, lastName, email, undefined);

  const handleAvatarClick = () => {
    // TODO: Implement file upload logic for Supabase bucket
    console.log('Avatar upload clicked');
  };

  const handleDeleteUser = () => {
    // TODO: Implement delete user logic
    console.log('Delete user:', userId);
  };

  const handleMakeAdmin = () => {
    // TODO: Implement make admin logic
    console.log('Make admin:', userId);
  };

  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'super_admin':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleFieldEdit = (field: 'firstName' | 'lastName') => {
    setEditingField(field);
    setEditingValue(field === 'firstName' ? firstName : lastName);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleFieldBlur = async (field: 'firstName' | 'lastName') => {
    const currentValue = field === 'firstName' ? firstName : lastName;
    if (editingValue === currentValue) {
      setEditingField(null);
      return;
    }

    const result = await updateUserProfile(userId, {
      [field === 'firstName' ? 'first_name' : 'last_name']: editingValue,
    });

    if (result.success) {
      if (field === 'firstName') {
        setFirstName(editingValue);
      } else {
        setLastName(editingValue);
      }
      toast.success(`${field === 'firstName' ? 'First' : 'Last'} name updated`);
    } else {
      toast.error(result.error);
      setEditingValue(currentValue);
    }
    setEditingField(null);
  };

  const handleFieldCancel = () => {
    const currentValue = editingField === 'firstName' ? firstName : lastName;
    setEditingValue(currentValue);
    setEditingField(null);
  };

  return (
    <>
      {/* Chat Interface - First on mobile, left side on desktop */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="w-full lg:w-96 order-first lg:order-first"
          >
            <Card className="h-full border-0 shadow-xl bg-linear-to-br from-background via-background to-primary/5">
              <CardHeader className="border-b bg-linear-to-r from-primary/10 to-primary/5">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <span>Chat with {firstName}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleChatToggle}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[500px] bg-muted/30 rounded-xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center backdrop-blur-sm">
                  <p className="text-muted-foreground text-sm">
                    Chat interface placeholder - UI only
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Profile Card */}

      {/* Header Section with Horizontal Layout */}
      <div className="flex items-center gap-6">
        {/* Avatar */}
        <div
          className="relative group cursor-pointer shrink-0"
          onClick={handleAvatarClick}
          onMouseEnter={() => setIsHoveringAvatar(true)}
          onMouseLeave={() => setIsHoveringAvatar(false)}
          style={{
            width: '128px',
            height: '128px',
            minWidth: '128px',
            minHeight: '128px',
            flexShrink: 0,
          }}
        >
          <div className="w-full h-full rounded-full overflow-hidden shadow-2xl ring-4 ring-primary/20 transition-all duration-300 group-hover:ring-primary/40 group-hover:scale-105 bg-white dark:bg-gray-800">
            <Avatar
              src={avatarUrl}
              alt={`${firstName} ${lastName}`}
              initials={initials}
              id={userId}
              size={128}
            />
          </div>
          {/* Upload Overlay */}
          <AnimatePresence>
            {isHoveringAvatar && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center backdrop-blur-sm z-10"
              >
                <div className="flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center justify-center"
                  >
                    <Camera className="w-10 h-10 text-white mb-2" />
                    <p className="text-sm text-white font-semibold">
                      Upload Photo
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* User Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {editingField === 'firstName' ? (
              <Input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={() => handleFieldBlur('firstName')}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    handleFieldCancel();
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFieldBlur('firstName');
                  }
                }}
                className="w-auto max-w-32 text-2xl font-bold h-auto py-1 px-2 border-2"
                autoFocus
              />
            ) : (
              <span
                onClick={() => handleFieldEdit('firstName')}
                className="text-2xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text cursor-pointer hover:text-[#2454FF] transition-colors"
              >
                {firstName || 'Unknown'}
              </span>
            )}
            {editingField === 'lastName' ? (
              <Input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={() => handleFieldBlur('lastName')}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    handleFieldCancel();
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFieldBlur('lastName');
                  }
                }}
                className="w-auto max-w-32 text-2xl font-bold h-auto py-1 px-2 border-2"
                autoFocus
              />
            ) : (
              <span
                onClick={() => handleFieldEdit('lastName')}
                className="text-2xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text cursor-pointer hover:text-[#2454FF] transition-colors"
              >
                {lastName || 'User'}
              </span>
            )}
            <Badge
              variant={getRoleBadgeVariant(role)}
              className="text-xs font-semibold px-3 py-1 capitalize"
            >
              {role}
            </Badge>
          </div>
          <p className="text-muted-foreground mb-3 text-sm cursor-default">
            {email}
          </p>
        </div>
      </div>
    </>
  );
}
