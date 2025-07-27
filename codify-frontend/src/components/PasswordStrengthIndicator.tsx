'use client';

import { validatePassword, getPasswordCriteria, getPasswordStrengthColor, getPasswordStrengthBarColor, getPasswordStrengthPercentage } from '@/utils/passwordValidation';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showCriteria?: boolean;
}

export default function PasswordStrengthIndicator({ password, showCriteria = true }: PasswordStrengthIndicatorProps) {
  const validation = validatePassword(password);
  const criteria = getPasswordCriteria(password);
  const strengthColor = getPasswordStrengthColor(validation.strength);
  const barColor = getPasswordStrengthBarColor(validation.strength);
  const percentage = getPasswordStrengthPercentage(validation.score);

  if (!password) return null;

  return (
    <div className="mt-3 space-y-3">
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Password Strength
          </span>
          <span className={`text-xs font-medium capitalize ${strengthColor}`}>
            {validation.strength}
          </span>
        </div>
        <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Criteria Checklist */}
      {showCriteria && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Password Requirements:
          </h4>
          <div className="grid grid-cols-1 gap-1 text-xs">
            <CriteriaItem
              met={criteria.minLength}
              text="At least 8 characters"
            />
            <CriteriaItem
              met={criteria.hasLowercase}
              text="One lowercase letter"
            />
            <CriteriaItem
              met={criteria.hasUppercase}
              text="One uppercase letter"
            />
            <CriteriaItem
              met={criteria.hasNumber}
              text="One number"
            />
            <CriteriaItem
              met={criteria.hasSpecialChar}
              text="One special character"
            />
            <CriteriaItem
              met={criteria.noCommonPasswords}
              text="Not a common password"
            />
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div className="space-y-1">
          {validation.errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
              <X className="w-3 h-3" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface CriteriaItemProps {
  met: boolean;
  text: string;
}

function CriteriaItem({ met, text }: CriteriaItemProps) {
  return (
    <div className={`flex items-center gap-2 ${met ? 'text-green-600 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
      {met ? (
        <Check className="w-3 h-3" />
      ) : (
        <X className="w-3 h-3" />
      )}
      <span>{text}</span>
    </div>
  );
}
