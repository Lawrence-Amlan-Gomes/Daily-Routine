import { loginSchema } from '@/lib/schemas';

describe('loginSchema', () => {
  it('parses successfully with valid email and password 8+ chars', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'securepass',
    });
    expect(result.success).toBe(true);
  });

  it('fails when password is under 8 characters', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('password');
    }
  });

  it('fails when email format is invalid', () => {
    const result = loginSchema.safeParse({
      email: 'notanemail',
      password: 'validpassword',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.error.issues.map((i) => i.path[0]);
      expect(fields).toContain('email');
    }
  });
});
