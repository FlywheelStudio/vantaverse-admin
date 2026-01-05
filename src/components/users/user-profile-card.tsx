'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Trash2, Shield, MessageSquare, X } from 'lucide-react';
import { Avatar, getInitials } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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
  const [avatarUrl,] = useState(initialAvatarUrl);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);

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

  return (
    <div className="relative flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto">
      {/* Chat Interface - First on mobile, right side on desktop */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="w-full lg:w-96 order-first lg:order-last"
          >
            <Card className="h-full border-0 shadow-xl bg-gradient-to-br from-background via-background to-primary/5">
              <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-primary/5">
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
      <motion.div
        layout
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="flex-1"
      >
        <Card className="overflow-hidden shadow-xl bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20">
          {/* Header Section with Horizontal Layout */}
          <div className="relative bg-gradient-to-br from-blue-500/10 via-primary/5 to-transparent p-8 border-b border-white/10">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div
                className="relative group cursor-pointer flex-shrink-0"
                onClick={handleAvatarClick}
                onMouseEnter={() => setIsHoveringAvatar(true)}
                onMouseLeave={() => setIsHoveringAvatar(false)}
              >
                <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-2xl ring-4 ring-primary/20 transition-all duration-300 group-hover:ring-primary/40 group-hover:scale-105 bg-white dark:bg-gray-800">
                  <Avatar
                    src={avatarUrl}
                    alt={`${firstName} ${lastName}`}
                    initials={initials}
                    id={userId}
                    size={128}
                    className="!rounded-none w-full h-full"
                  />
                </div>
                {/* Upload Overlay */}
                <AnimatePresence>
                  {isHoveringAvatar && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/70 rounded-3xl flex items-center justify-center backdrop-blur-sm z-10"
                    >
                      <div className="text-center">
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Camera className="w-10 h-10 text-white mx-auto mb-2" />
                          <p className="text-sm text-white font-semibold">Upload Photo</p>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* User Info */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  {firstName || 'Unknown'} {lastName || 'User'}
                </h2>
                <p className="text-muted-foreground mb-3 text-base">{email}</p>
                <Badge
                  variant={getRoleBadgeVariant(role)}
                  className="text-xs font-semibold px-3 py-1 capitalize"
                >
                  {role}
                </Badge>
              </div>
            </div>
          </div>

          <CardContent className="p-8">
            {/* User Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                  Profile Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">
                      First Name
                    </label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="h-12 border-2 focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-muted-foreground">
                      Last Name
                    </label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="h-12 border-2 focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-muted-foreground">
                      Email Address
                    </label>
                    <Input
                      value={email}
                      disabled
                      className="bg-muted/50 h-12 cursor-not-allowed border-2"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-6 border-t-2 border-dashed">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <div className="w-1 h-6 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                  Quick Actions
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={handleDeleteUser}
                    className="gap-2 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete User
                  </Button>
                  <Button
                    variant="default"
                    size="lg"
                    onClick={handleMakeAdmin}
                    className="gap-2 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <Shield className="w-4 h-4" />
                    Make Admin
                  </Button>
                  <Button
                    variant={isChatOpen ? 'secondary' : 'default'}
                    size="lg"
                    onClick={handleChatToggle}
                    className="gap-2 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    {isChatOpen ? (
                      <>
                        <X className="w-4 h-4" />
                        Close Chat
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        Chat
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
