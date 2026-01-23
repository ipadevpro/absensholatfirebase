"use client";

import { useState } from "react";
import { Coordinator, Gender } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const AVAILABLE_CLASSES = [
  { id: "7a", name: "7-A" },
  { id: "7b", name: "7-B" },
  { id: "8a", name: "8-A" },
  { id: "8b", name: "8-B" },
  { id: "9a", name: "9-A" },
  { id: "9b", name: "9-B" },
];

interface CoordinatorFormProps {
  onSubmit: (data: Omit<Coordinator, "id" | "createdAt">) => Promise<boolean | void>;
  isLoading?: boolean;
  error?: string | null;
}

export default function CoordinatorForm({ onSubmit, isLoading = false, error }: CoordinatorFormProps) {
  const [name, setName] = useState("");
  const [uid, setUid] = useState("");
  const [classId, setClassId] = useState("");
  const [gender, setGender] = useState<Gender | "">("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !uid || !classId || !gender) return;

    const success = await onSubmit({
      name,
      uid,
      classId,
      gender: gender as Gender,
    });
    
    // Only reset if success (explicit true or void/undefined which implies we didn't return false)
    if (success !== false) {
        setName("");
        setUid("");
        setClassId("");
        setGender("");
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Add New Coordinator</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="uid">User ID (UID)</Label>
            <Input
              id="uid"
              placeholder="Firebase Auth UID"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Copy the UID from the Firebase Authentication dashboard or User Management table.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="classId">Class ID</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger id="classId">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_CLASSES.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={gender} onValueChange={(val) => setGender(val as Gender)}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ikhwan">Ikhwan</SelectItem>
                <SelectItem value="akhwat">Akhwat</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Coordinator"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
