'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { GraduationCap, Mail, ShieldCheck, ArrowRight, RotateCw } from 'lucide-react';

type Step = 'email' | 'otp' | 'profile';

export default function LoginPage() {
  const { startLogin, verifyOtp, completeProfile } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = startLogin(email);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'Bir hata oluştu.');
      return;
    }
    setDemoCode(res.code || null);
    setStep('otp');
    toast.success(`Demo: doğrulama kodun ${res.code}`, {
      description: 'Gerçek e-posta gönderilmez — bu bir prototip.',
      duration: 8000,
    });
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (otp.length !== 6) {
      setError('6 haneli kodu girin.');
      return;
    }
    setLoading(true);
    const res = verifyOtp(otp);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || 'Doğrulama başarısız.');
      return;
    }
    if (res.needsProfile) {
      setStep('profile');
    }
  };

  const handleResend = () => {
    setError(null);
    setOtp('');
    const res = startLogin(email);
    if (res.ok) {
      setDemoCode(res.code || null);
      toast.success(`Demo: yeni doğrulama kodun ${res.code}`, {
        duration: 8000,
      });
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setError('Lütfen adınızı girin.');
      return;
    }
    if (trimmedName.length > 60) {
      setError('Ad Soyad en fazla 60 karakter olabilir.');
      return;
    }
    if (/[<>{}\[\];|&$=*%#]/.test(trimmedName)) {
      setError('Ad Soyad alanında özel karakterler (< > { } [ ] | & $ = * % #) kullanılamaz.');
      return;
    }
    const trimmedDept = department.trim();
    if (trimmedDept.length > 80) {
      setError('Bölüm en fazla 80 karakter olabilir.');
      return;
    }
    if (trimmedDept && /[<>{}\[\];|&$=*%#]/.test(trimmedDept)) {
      setError('Bölüm alanında özel karakterler (< > { } [ ] | & $ = * % #) kullanılamaz.');
      return;
    }
    setLoading(true);
    completeProfile(trimmedName, trimmedDept);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7" strokeWidth={1.5} />
            <span className="font-serif-display text-2xl font-semibold tracking-tight">
              Stylish Campus
            </span>
          </div>
        </div>
        <div className="relative z-10 space-y-4">
          <h1 className="font-serif-display text-4xl xl:text-5xl font-semibold leading-[1.1]">
            Kampüsün ikinci el pazarı.
          </h1>
          <p className="text-primary-foreground/70 text-lg max-w-md leading-relaxed">
            Eşyalarını listele, mesajlaş, kampüste buluş ve elden teslim et.
            Kargo yok, ödeme yok — sadece öğrenciler.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {['Elden Teslim', '.edu.tr Doğrulaması', 'Kampüs İçi'].map((t) => (
              <span
                key={t}
                className="text-xs px-3 py-1 rounded-full border border-primary-foreground/30 text-primary-foreground/80"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-xs text-primary-foreground/50">
          © 2025 Stylish Campus — Bir prototip çalışması.
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-8 animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 text-primary">
            <GraduationCap className="h-7 w-7" strokeWidth={1.5} />
            <span className="font-serif-display text-2xl font-semibold tracking-tight">
              Stylish Campus
            </span>
          </div>

          {step === 'email' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-serif-display text-2xl font-semibold">
                  Giriş Yap
                </h2>
                <p className="text-sm text-muted-foreground">
                  Üniversite e-postan ile giriş yap. Sadece .edu.tr uzantılı
                  adresler kabul edilir.
                </p>
              </div>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="ad.soyad@universite.edu.tr"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      autoFocus
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  .edu ile Giriş Yap
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <ShieldCheck className="h-5 w-5" strokeWidth={1.5} />
                  <span className="text-xs uppercase tracking-widest font-medium">
                    Doğrulama
                  </span>
                </div>
                <h2 className="font-serif-display text-2xl font-semibold">
                  Kodu Gir
                </h2>
                <p className="text-sm text-muted-foreground">
                  {email} adresine gönderilen 6 haneli kodu gir. Kod 3 dakika
                  geçerlidir.
                </p>
              </div>
              {demoCode && (
                <div className="rounded-lg border border-dashed border-primary/30 bg-accent/40 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">Demo kodu: </span>
                  <span className="font-mono font-semibold text-primary">{demoCode}</span>
                </div>
              )}
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {error && <p className="text-sm text-destructive text-center">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                  Doğrula
                </Button>
              </form>
              <button
                onClick={handleResend}
                className="w-full text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCw className="h-3.5 w-3.5" />
                Yeni kod iste
              </button>
            </div>
          )}

          {step === 'profile' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="font-serif-display text-2xl font-semibold">
                  Profili Tamamla
                </h2>
                <p className="text-sm text-muted-foreground">
                  Hoş geldin! Sana nasıl hitap edeceğimizi ve hangi bölümden
                  olduğunu belirt.
                </p>
              </div>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Ad Soyad</Label>
                  <Input
                    id="fullName"
                    placeholder="Adınız Soyadınız"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value.slice(0, 60))}
                    maxLength={60}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Bölüm (isteğe bağlı)</Label>
                  <Input
                    id="department"
                    placeholder="örn. İktisat"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value.slice(0, 80))}
                    maxLength={80}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  Hesabı Oluştur
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
