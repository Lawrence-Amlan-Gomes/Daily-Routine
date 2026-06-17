import { isValidEmail } from '@/lib/isValidEmail';

describe('isValidEmail', () => {
  it('returns true for a valid email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('returns false when @ is missing', () => {
    expect(isValidEmail('notanemail')).toBe(false);
  });

  it('returns false when domain is missing', () => {
    expect(isValidEmail('test@')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });
});
