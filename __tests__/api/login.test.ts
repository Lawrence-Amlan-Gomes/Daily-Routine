/**
 * Integration tests for performLogin server action.
 *
 * Note: no /api/auth/login REST route exists. Login is handled by the
 * performLogin server action in src/app/actions/index.ts.
 * "use server" is a string directive — harmless in Jest context.
 *
 * Return contract:
 *   - valid credentials  → CleanUser object (not null)
 *   - invalid/wrong creds → null
 *   - unverified email   → throws "EMAIL_NOT_VERIFIED"
 */

import bcrypt from 'bcrypt';
import { performLogin } from '@/app/actions';

// ── Next.js server internals ───────────────────────────────────────────────
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({ set: jest.fn(), get: jest.fn() }),
  headers: jest.fn().mockResolvedValue(new Headers()),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  unstable_noStore: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// ── Auth / DB ──────────────────────────────────────────────────────────────
jest.mock('@/auth', () => ({
  auth: jest.fn().mockResolvedValue(null),
  signOut: jest.fn(),
}));

jest.mock('@/lib/mongo', () => ({
  dbConnect: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/server/jwt', () => ({
  generateToken: jest.fn().mockResolvedValue('mock-jwt-token'),
  verifyToken: jest.fn(),
}));

jest.mock('@/lib/server/rate-limit', () => ({
  enforceRateLimitByIp: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/server/email', () => ({
  sendOtpEmail: jest.fn(),
  sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/photoService', () => ({
  uploadToS3: jest.fn(),
  deleteFromS3: jest.fn(),
}));

jest.mock('@/models/Feedback', () => ({ Feedback: {} }));
jest.mock('@/models/OtpCode', () => ({ OtpCode: {} }));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed'),
}));

// ── User model mock ────────────────────────────────────────────────────────
const mockUser = {
  _id: { toString: () => 'user-id-123' },
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashed-password',
  isEmailVerified: true,
  isAdmin: false,
  isRegisteredWithGoogle: false,
  paymentType: 'Free One Month',
  photo: '',
  photoKey: '',
  createdAt: new Date('2024-01-01'),
  expiredAt: new Date('2024-02-01'),
  routine: {
    saturday: [], sunday: [], monday: [], tuesday: [],
    wednesday: [], thursday: [], friday: [],
  },
  goals: [],
  stats: [],
};

jest.mock('@/models/User', () => ({
  User: {
    findOne: jest.fn(),
  },
}));

// ── Helpers ────────────────────────────────────────────────────────────────
import { User } from '@/models/User';

function mockFindOne(returnValue: typeof mockUser | null) {
  (User.findOne as jest.Mock).mockReturnValue({
    select: jest.fn().mockResolvedValue(returnValue),
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('performLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns user data when credentials are valid', async () => {
    mockFindOne(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await performLogin({
      email: 'test@example.com',
      password: 'validpassword123',
    });

    // performLogin returns { user: CleanUser, token: string }
    expect(result).not.toBeNull();
    expect(result?.user?.email).toBe('test@example.com');
    expect(result?.user?.name).toBe('Test User');
  });

  it('returns null when password is wrong', async () => {
    mockFindOne(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const result = await performLogin({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    expect(result).toBeNull();
  });

  it('returns null when user does not exist', async () => {
    mockFindOne(null);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const result = await performLogin({
      email: 'nobody@example.com',
      password: 'somepassword',
    });

    expect(result).toBeNull();
  });

  it('returns null when schema validation fails (password too short)', async () => {
    const result = await performLogin({
      email: 'test@example.com',
      password: 'short',
    });

    expect(result).toBeNull();
  });

  it('throws EMAIL_NOT_VERIFIED when account is unverified', async () => {
    mockFindOne({ ...mockUser, isEmailVerified: false });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(
      performLogin({ email: 'test@example.com', password: 'validpassword123' }),
    ).rejects.toThrow('EMAIL_NOT_VERIFIED');
  });
});
