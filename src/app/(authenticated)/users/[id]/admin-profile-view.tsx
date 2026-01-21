'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '@/components/page-wrapper';
import { UserProfileCard } from '@/components/users/user-profile-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrganizationTabs } from './partials/org-tabs';
import { PatientList } from './partials/patient-list';
import { ChatInterface } from './partials/chat-interface';
import { getOrCreateChatForPatient } from './chat-actions';
import { AddMembersModal } from '@/app/(authenticated)/groups/add-members/add-members-modal';
import { Loader2, Plus } from 'lucide-react';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import { useAuth } from '@/hooks/use-auth';

interface Organization {
  id: string;
  name: string;
  description: string | null;
  picture_url: string | null;
}

interface Patient {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface AdminProfileViewProps {
  user: ProfileWithStats;
  organizations: Organization[];
  patientsByOrg: Record<string, Patient[]>;
}

export function AdminProfileView({
  user,
  organizations,
  patientsByOrg,
}: AdminProfileViewProps) {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
    organizations[0]?.id || null,
  );
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );
  const [chatId, setChatId] = useState<string | null>(null);
  const [isOpeningChat, setIsOpeningChat] = useState(false);

  const currentPatients = useMemo(() => {
    if (!selectedOrgId) return [];
    return patientsByOrg[selectedOrgId] || [];
  }, [selectedOrgId, patientsByOrg]);

  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null;
    return currentPatients.find((p) => p.id === selectedPatientId) || null;
  }, [selectedPatientId, currentPatients]);

  const handlePatientSelect = async (patientId: string) => {
    if (isOpeningChat || !selectedOrgId || !isYourself) return;

    setIsOpeningChat(true);

    const result = await getOrCreateChatForPatient(selectedOrgId, patientId);

    if (result.success) {
      setChatId(result.data.chatId);
      setSelectedPatientId(patientId);
    }

    setIsOpeningChat(false);
  };

  const handleChatClose = () => {
    setChatId(null);
    setSelectedPatientId(null);
  };

  const patientName = selectedPatient
    ? `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim() ||
      'Patient'
    : '';

  const { user: currentUser } = useAuth();
  const router = useRouter();
  const isYourself = useMemo(
    () => user.id === currentUser?.id,
    [user.id, currentUser?.id],
  );

  const [addMembersModalOpen, setAddMembersModalOpen] = useState(false);

  const selectedOrganization = useMemo(() => {
    if (!selectedOrgId) return null;
    return organizations.find((org) => org.id === selectedOrgId) || null;
  }, [selectedOrgId, organizations]);

  return (
    <PageWrapper
      subheader={
        <h1 className="text-2xl font-medium">
          {isYourself
            ? 'Your '
            : `${user.first_name && `${user.first_name}'s `} `}
          Profile
        </h1>
      }
    >
      <div className="flex flex-col gap-6 h-full min-h-0">
        {/* User Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden shadow-xl bg-white dark:bg-background border border-border">
            <div className="relative bg-linear-to-br from-blue-500/10 via-primary/5 to-transparent p-8 border-b border-white/10">
              <UserProfileCard
                userId={user.id}
                firstName={user.first_name || ''}
                lastName={user.last_name || ''}
                email={user.email || ''}
                avatarUrl={user.avatar_url}
                description={user.description}
                role={user.role}
              />
            </div>
          </Card>
        </motion.div>

        {/* Main Content - Organizations, Patients, and Chat */}
        <div
          className={`grid grid-cols-1 ${isYourself ? 'lg:grid-cols-2' : ''} gap-6 flex-1 min-h-0`}
        >
          {/* Left Side - Organizations and Patients */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="h-full flex flex-col min-h-0"
          >
            <Card className="overflow-hidden shadow-xl border border-border flex flex-col min-h-0 h-full">
            <div className="flex-1 min-h-0 flex flex-col">
              {organizations.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground text-sm text-center">
                  No organizations assigned yet
                </div>
              ) : (
                <OrganizationTabs
                  organizations={organizations}
                  selectedOrgId={selectedOrgId}
                  onOrgSelect={setSelectedOrgId}
                  actionButton={
                    <Button
                      onClick={() => setAddMembersModalOpen(true)}
                      className="bg-[#2454FF] hover:bg-[#1E3FCC] text-white font-semibold px-6 rounded-xl shadow-lg cursor-pointer gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Members
                    </Button>
                  }
                >
                  {isOpeningChat ? (
                    <div className="flex-1 flex items-center justify-center p-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <PatientList
                      patients={currentPatients}
                      selectedPatientId={selectedPatientId}
                      onPatientSelect={handlePatientSelect}
                    />
                  )}
                </OrganizationTabs>
              )}
            </div>
          </Card>
          </motion.div>

          {/* Right Side - Chat Interface (only on own profile) */}
          {isYourself && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="h-full min-h-0 lg:sticky lg:top-6"
            >
              <AnimatePresence mode="wait">
                {chatId && selectedPatient && selectedOrgId ? (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <ChatInterface
                      chatId={chatId}
                      patientName={patientName}
                      onClose={handleChatClose}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <Card className="h-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                      <p className="text-muted-foreground text-sm text-center p-8">
                        Select a patient to start a chat
                      </p>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {selectedOrganization && (
        <AddMembersModal
          open={addMembersModalOpen}
          onOpenChange={async (open) => {
            setAddMembersModalOpen(open);
            if (!open) {
              router.refresh();
            }
          }}
          type="organization"
          id={selectedOrganization.id}
          name={selectedOrganization.name}
          organizationId={selectedOrganization.id}
          organizationName={selectedOrganization.name}
          initialRole="patient"
        />
      )}
    </PageWrapper>
  );
}
