import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const { score, label, color } = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    
    // Length checks
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    
    // Normalize to 0-100
    const normalizedScore = Math.min((score / 7) * 100, 100);
    
    let label = '';
    let color = '';
    
    if (normalizedScore < 30) {
      label = 'Weak';
      color = 'bg-destructive';
    } else if (normalizedScore < 50) {
      label = 'Fair';
      color = 'bg-warning';
    } else if (normalizedScore < 75) {
      label = 'Good';
      color = 'bg-primary';
    } else {
      label = 'Strong';
      color = 'bg-success';
    }
    
    return { score: normalizedScore, label, color };
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <Progress 
        value={score} 
        className={cn("h-1.5", color)} 
      />
      <p className={cn(
        "text-xs font-medium",
        score < 30 && "text-destructive",
        score >= 30 && score < 50 && "text-warning",
        score >= 50 && score < 75 && "text-primary",
        score >= 75 && "text-success"
      )}>
        {label}
      </p>
    </div>
  );
}
