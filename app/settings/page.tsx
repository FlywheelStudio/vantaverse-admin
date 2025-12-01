"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { resetToDefaults } from "@/lib/storage-client";
import { AlertCircle } from "lucide-react";

// Dummy profile data
const initialProfileData = {
  firstName: "Sarah",
  lastName: "Smith",
  email: "sarah.smith@vantaverse.com",
  phone: "+1 (555) 123-4567",
  title: "Lead Physiologist",
  organization: "Vantaverse",
  bio: "Experienced physiologist specializing in physical therapy and injury prevention.",
};

export default function SettingsPage() {
  const [profileData, setProfileData] = useState(initialProfileData);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    toast.success("Profile updated successfully");
  };

  const handleResetDemoData = () => {
    setIsResetting(true);
    try {
      resetToDefaults();
      toast.success("Local storage reset to default values");
    } catch (error) {
      toast.error("Failed to reset local storage");
      console.error(error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profileData.firstName}
                onChange={(e) =>
                  setProfileData({ ...profileData, firstName: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profileData.lastName}
                onChange={(e) =>
                  setProfileData({ ...profileData, lastName: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) =>
                  setProfileData({ ...profileData, email: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={profileData.phone}
                onChange={(e) =>
                  setProfileData({ ...profileData, phone: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={profileData.title}
                onChange={(e) =>
                  setProfileData({ ...profileData, title: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                value={profileData.organization}
                onChange={(e) =>
                  setProfileData({ ...profileData, organization: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) =>
                  setProfileData({ ...profileData, bio: e.target.value })
                }
                rows={4}
              />
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demo Data</CardTitle>
            <CardDescription>Manage demo data and reset to defaults</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-yellow-500">Warning</p>
                  <p className="text-sm text-muted-foreground">
                    Resetting demo data will restore all local storage to default values. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <Separator />
            <Button
              onClick={handleResetDemoData}
              disabled={isResetting}
              variant="destructive"
              className="w-full"
            >
              {isResetting ? "Resetting..." : "Reset Demo Data"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

