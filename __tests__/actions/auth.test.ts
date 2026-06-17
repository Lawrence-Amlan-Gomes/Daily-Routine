import { performLogin } from '@/app/actions/index';
import { dbConnect } from '@/lib/mongo';
import { User } from '@/models/User';

// 1. Kidnap the dependencies (Mock the modules)
jest.mock('@/lib/mongo');
jest.mock('@/models/User');
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  unstable_noStore: jest.fn(),
}));
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    get: jest.fn(),
  })),
}));

describe('Auth Actions - performLogin', () => {

  beforeEach(() => {
    jest.clearAllMocks(); // Clear the "memory" of our mocks between tests
  });

  it('should throw an error if the user is not found', async () => {
    // Arrange
    const email = 'nonexistent@example.com';
    const password = 'password123';

    // Tell the User model to return null (user not found)
    (User.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
    });

    // Act & Assert
    // Since performLogin returns a promise that might reject, 
    // we use rejects.toThrow()
    await expect(performLogin({ email, password }))
      .rejects.toThrow('INVALID_CREDENTIALS');
    
    // Verify that we actually tried to connect to the DB
    expect(dbConnect).toHaveBeenCalled();
  });
});
