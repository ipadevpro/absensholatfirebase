"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AVAILABLE_CLASSES } from "@/lib/constants";

interface SupervisorFormProps {
  onSubmit: (data: {
    name: string;
    email: string;
    password: string;
    classes: string[];
  }) => Promise<boolean | void>;
  isLoading?: boolean;
  error?: string | null;
}

export default function SupervisorForm({ onSubmit, isLoading = false, error }: SupervisorFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    const success = await onSubmit({ 
      name, 
      email, 
      password, 
      classes: selectedClasses 
    });
    if (success !== false) {
      setName("");
      setEmail("");
      setPassword("");
      setSelectedClasses([]);
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label>Kelas Binaan</Label>
            <div className="grid grid-cols-2 gap-3 p-3 border border-emerald-100 rounded-xl bg-gray-50/50">
              {AVAILABLE_CLASSES.map((cls) => (
                <div key={cls.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`class-${cls.id}`}
                    checked={selectedClasses.includes(cls.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedClasses([...selectedClasses, cls.id]);
                      } else {
                        setSelectedClasses(selectedClasses.filter((c) => c !== cls.id));
                      }
                    }}
                    className="border-emerald-200 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 rounded-md"
                  />
                  <label htmlFor={`class-${cls.id}`} className="text-sm font-medium text-gray-750 cursor-pointer select-none">
                    {cls.name}
                  </label>
                </div>
              ))}
            </div>
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
