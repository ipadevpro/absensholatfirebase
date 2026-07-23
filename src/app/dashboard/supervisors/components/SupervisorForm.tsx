"use client";

import { useState } from "react";
import { Supervisor } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface SupervisorFormProps {
  onSubmit: (data: Omit<Supervisor, "id" | "createdAt">) => Promise<boolean | void>;
  isLoading?: boolean;
  error?: string | null;
}

export default function SupervisorForm({ onSubmit, isLoading = false, error }: SupervisorFormProps) {
  const [name, setName] = useState("");
  const [uid, setUid] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !uid) return;

    const success = await onSubmit({ name, uid });
    if (success !== false) {
      setName("");
      setUid("");
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Tambah Pembina Baru</CardTitle>
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
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              placeholder="Nama Pembina"
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
              Salin UID dari dashboard Firebase Authentication.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Menambahkan..." : "Tambah Pembina"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
