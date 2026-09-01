"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
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
  onCancel?: () => void;
}

export default function SupervisorForm({ onSubmit, isLoading = false, error, onCancel }: SupervisorFormProps) {
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
    <Card className="w-full max-w-lg mx-auto rounded-xl border border-border bg-card shadow-sm">
      <CardHeader className="p-5 pb-3 border-b border-border">
        <CardTitle className="text-base font-semibold text-foreground">Tambah Pembina Baru</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="p-5 space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg border border-destructive/20 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium text-foreground">Nama Lengkap</Label>
            <Input
              id="name"
              placeholder="Nama Guru Pembina"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border-input bg-background h-9 text-sm"
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="pembina@pgii.sch.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border-input bg-background h-9 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium text-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border-input bg-background h-9 text-sm"
              required
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-foreground">Kelas Binaan</Label>
              <span className="text-[11px] text-muted-foreground">
                {selectedClasses.length} kelas dipilih
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 border border-border rounded-xl bg-muted/30 max-h-48 overflow-y-auto">
              {AVAILABLE_CLASSES.map((cls) => (
                <div key={cls.id} className="flex items-center gap-2 p-1 rounded-md hover:bg-accent/50 transition-colors">
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
                    className="rounded-md h-4 w-4"
                  />
                  <label htmlFor={`class-${cls.id}`} className="text-xs font-medium text-foreground cursor-pointer select-none py-1 flex-1">
                    Kelas {cls.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-5 pt-0 flex flex-col-reverse sm:flex-row gap-2">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              className="w-full sm:w-auto rounded-lg border-border h-9 px-4 text-xs font-medium active:scale-[0.97] touch-manipulation"
            >
              Batal
            </Button>
          )}
          <Button 
            type="submit" 
            className="w-full sm:flex-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground h-9 text-xs font-medium active:scale-[0.97] touch-manipulation" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Menambahkan...
              </>
            ) : (
              "Tambah Pembina"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
