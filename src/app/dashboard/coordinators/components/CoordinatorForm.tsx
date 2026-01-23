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

interface CoordinatorFormProps {
  onSubmit: (data: Omit<Coordinator, "id" | "createdAt">) => Promise<void>;
  isLoading?: boolean;
}

export default function CoordinatorForm({ onSubmit, isLoading = false }: CoordinatorFormProps) {
  const [name, setName] = useState("");
  const [uid, setUid] = useState("");
  const [classId, setClassId] = useState("");
  const [gender, setGender] = useState<Gender | "">("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !uid || !classId || !gender) return;

    await onSubmit({
      name,
      uid,
      classId,
      gender: gender as Gender,
    });
    
    // Reset form is handled by parent or manual reset if needed, 
    // but typically nice to clear inputs after success
    setName("");
    setUid("");
    setClassId("");
    setGender("");
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Add New Coordinator</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="classId">Class ID</Label>
            <Input
              id="classId"
              placeholder="e.g. 7A"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              required
            />
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
