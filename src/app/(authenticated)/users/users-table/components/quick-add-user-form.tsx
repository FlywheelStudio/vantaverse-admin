import { motion, AnimatePresence } from 'framer-motion';
import { Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { OrganizationCombobox } from '../../organization-combobox';
import { TeamCombobox } from '../../team-combobox';
import type { QuickAddUserData } from '../types';

interface QuickAddUserFormProps {
  isOpen: boolean;
  newUserData: QuickAddUserData;
  savingUser: boolean;
  onOrgChange: (value: string | undefined) => void;
  onTeamChange: (value: string | undefined) => void;
  onDataChange: (data: QuickAddUserData) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function QuickAddUserForm({
  isOpen,
  newUserData,
  savingUser,
  onOrgChange,
  onTeamChange,
  onDataChange,
  onSave,
  onCancel,
}: QuickAddUserFormProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="overflow-hidden"
        >
          <div className="bg-[#F5F7FA]/50 border border-[#E5E9F0] rounded-lg p-4">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <OrganizationCombobox
                  value={newUserData.organizationId}
                  onValueChange={onOrgChange}
                />
                <TeamCombobox
                  organizationId={newUserData.organizationId}
                  value={newUserData.teamId}
                  onValueChange={onTeamChange}
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Input
                  value={newUserData.firstName}
                  onChange={(e) =>
                    onDataChange({
                      ...newUserData,
                      firstName: e.target.value,
                    })
                  }
                  placeholder="First Name"
                  className="w-full"
                />
                <Input
                  value={newUserData.lastName}
                  onChange={(e) =>
                    onDataChange({
                      ...newUserData,
                      lastName: e.target.value,
                    })
                  }
                  placeholder="Last Name"
                  className="w-full"
                />
                <Input
                  value={newUserData.email}
                  onChange={(e) =>
                    onDataChange({
                      ...newUserData,
                      email: e.target.value,
                    })
                  }
                  placeholder="Email"
                  type="email"
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={onSave}
                  disabled={
                    !newUserData.email.trim() ||
                    !newUserData.firstName.trim() ||
                    !newUserData.lastName.trim() ||
                    savingUser
                  }
                  className="bg-[#2454FF] hover:bg-[#1E3FCC] text-white font-semibold py-2 rounded-lg cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  onClick={onCancel}
                  variant="outline"
                  disabled={savingUser}
                  className="text-[#64748B] border-[#E5E9F0] font-semibold py-2 rounded-lg cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
