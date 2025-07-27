export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  score: number;
}

export interface PasswordCriteria {
  minLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  noCommonPasswords: boolean;
}

// Common weak passwords to avoid
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'iloveyou',
  'princess', 'rockyou', '12345', '123123', 'password1', 'superman'
];


export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  let score = 0;

  // Check minimum length (8 characters)
  const minLength = password.length >= 8;
  if (!minLength) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  // Check for lowercase letters
  const hasLowercase = /[a-z]/.test(password);
  if (!hasLowercase) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  // Check for uppercase letters
  const hasUppercase = /[A-Z]/.test(password);
  if (!hasUppercase) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  // Check for numbers
  const hasNumber = /\d/.test(password);
  if (!hasNumber) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  // Check for special characters
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"\\|,.<>/?~`)');
  } else {
    score += 1;
  }

  // Check against common passwords
  const noCommonPasswords = !COMMON_PASSWORDS.includes(password.toLowerCase());
  if (!noCommonPasswords) {
    errors.push('Password is too common and easily guessable');
  } else {
    score += 1;
  }

  // Additional scoring for longer passwords
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Check for repeated characters
  const hasRepeatedChars = /(.)\1{2,}/.test(password);
  if (hasRepeatedChars) {
    errors.push('Password should not contain repeated characters (e.g., "aaa", "111")');
    score -= 1;
  }

  // Check for sequential characters
  const hasSequential = /(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password);
  if (hasSequential) {
    errors.push('Password should not contain sequential characters (e.g., "123", "abc")');
    score -= 1;
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong';
  if (score <= 2) {
    strength = 'weak';
  } else if (score <= 4) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score
  };
}

/**
 * Get password criteria checklist
 */
export function getPasswordCriteria(password: string): PasswordCriteria {
  return {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
    noCommonPasswords: !COMMON_PASSWORDS.includes(password.toLowerCase())
  };
}

/**
 * Generate password strength color
 */
export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'text-red-500';
    case 'medium':
      return 'text-yellow-500';
    case 'strong':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Generate password strength bar color
 */
export function getPasswordStrengthBarColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'bg-red-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'strong':
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
}


export function getPasswordStrengthPercentage(score: number): number {
  return Math.min(100, (score / 6) * 100);
}
