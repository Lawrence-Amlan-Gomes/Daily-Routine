/**
 * RegistrationForm validation tests.
 *
 * Key design facts that shape these tests:
 *  - Error text is hidden while a field is empty ("firstTime" guard in EachField).
 *    "Email is required" only appears after typing then clearing; to get a visible
 *    error on first interaction, type an invalid value.
 *  - Email requires @gmail.com — any other format shows "Use @gmail.com as your email format".
 *  - The submit button ("Create Account") is disabled until all fields are valid.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegistrationForm from '@/components/RegistrationForm';

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img {...props} />
  ),
}));

jest.mock('@/app/actions', () => ({
  createUser: jest.fn(),
}));

describe('RegistrationForm', () => {
  it('renders the Create Account button', () => {
    render(<RegistrationForm />);
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('Create Account button is disabled when form fields are empty', () => {
    render(<RegistrationForm />);
    const btn = screen.getByRole('button', { name: /create account/i });
    expect(btn).toBeDisabled();
  });

  it('shows email format error when non-gmail email is typed', async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    // Fill name and password to make only email invalid
    const inputs = screen.getAllByRole('textbox');
    const nameInput = inputs.find((el) =>
      el.getAttribute('name') === 'name' && el.getAttribute('class')?.includes('w-full'),
    ) ?? inputs[0];
    await user.type(nameInput, 'Test User');

    // Type a non-gmail email into the real email input (name="email", isReal=true)
    const emailInputs = document.querySelectorAll('input[name="email"]');
    // The real one is the visible input (not the hidden honeypot)
    const realEmailInput = Array.from(emailInputs).find(
      (el) => !(el as HTMLElement).closest('.opacity-0'),
    ) as HTMLInputElement;
    await user.type(realEmailInput, 'test@example.com');

    expect(
      screen.getByText('Use @gmail.com as your email format'),
    ).toBeInTheDocument();
  });

  it('shows password error when password is too short', async () => {
    const user = userEvent.setup();
    render(<RegistrationForm />);

    const passwordInput = document.querySelector(
      'input[name="password"]:not(.opacity-0 input)',
    ) as HTMLInputElement;
    // Get the visible password input (not the hidden honeypot)
    const passwordInputs = document.querySelectorAll('input[name="password"]');
    const realPasswordInput = Array.from(passwordInputs).find(
      (el) => !(el as HTMLElement).closest('.opacity-0'),
    ) as HTMLInputElement;

    await user.type(realPasswordInput, 'short');

    expect(
      screen.getByText('Your password must be at least 8 characters'),
    ).toBeInTheDocument();
    void passwordInput;
  });
});
