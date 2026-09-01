import { useState } from "react";
import { Gender } from "@/types";
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
import { AlertCircle, Loader2 } from "lucide-react";
import { AVAILABLE_CLASSES } from "@/lib/constants";

interface CoordinatorFormProps {
  onSubmit: (data: {
    name: string;
    email: string;
    password: string;
    classId: string;
    gender: Gender;
  }) => Promise<boolean | void>;
  isLoading?: boolean;
  error?: string | null;
  onCancel?: () => void;
}

export default function CoordinatorForm({ onSubmit, isLoading = false, error, onCancel }: CoordinatorFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [classId, setClassId] = useState("");
  const [gender, setGender] = useState<Gender | "">("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !classId || !gender) return;

    const success = await onSubmit({
      name,
      email,
      password,
      classId,
      gender: gender as Gender,
    });
    
    if (success !== false) {
      setName("");
      setEmail("");
      setPassword("");
      setClassId("");
      setGender("");
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto rounded-xl border border-border bg-card shadow-sm">
      <CardHeader className="p-5 pb-3 border-b border-border">
        <CardTitle className="text-base font-semibold text-foreground">Tambah Koordinator Baru</CardTitle>
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
              placeholder="Nama Koordinator"
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
              placeholder="nama@pgii.sch.id"
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

          <div className="space-y-1.5">
            <Label htmlFor="classId" className="text-xs font-medium text-foreground">Kelas</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger id="classId" className="rounded-lg border-input bg-background h-9 text-sm">
                <SelectValue placeholder="Pilih Kelas" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {AVAILABLE_CLASSES.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id} className="text-xs">
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gender" className="text-xs font-medium text-foreground">Kategori (Gender)</Label>
            <Select value={gender} onValueChange={(val) => setGender(val as Gender)}>
              <SelectTrigger id="gender" className="rounded-lg border-input bg-background h-9 text-sm">
                <SelectValue placeholder="Pilih Kategori" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="ikhwan" className="text-xs">Ikhwan</SelectItem>
                <SelectItem value="akhwat" className="text-xs">Akhwat</SelectItem>
              </SelectContent>
            </Select>
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
              "Tambah Koordinator"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
