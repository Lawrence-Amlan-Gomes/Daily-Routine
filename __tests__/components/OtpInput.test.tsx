/**
 * OtpInput is a pure controlled component — no button inside.
 * This test wraps it with a verify button (mirroring how RegistrationForm uses it)
 * to assert the disabled/enabled state based on digit count.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import OtpInput from '@/components/OtpInput';

const TestWrapper = () => {
  const [value, setValue] = useState('');
  return (
    <>
      <OtpInput value={value} onChange={setValue} />
      <button disabled={value.length !== 6}>Verify</button>
    </>
  );
};

describe('OtpInput', () => {
  it('renders 6 digit inputs', () => {
    render(<TestWrapper />);
    for (let i = 1; i <= 6; i++) {
      expect(screen.getByRole('textbox', { name: `Digit ${i}` })).toBeInTheDocument();
    }
  });

  it('verify button is disabled when no digits entered', () => {
    render(<TestWrapper />);
    expect(screen.getByRole('button', { name: /verify/i })).toBeDisabled();
  });

  it('verify button becomes enabled after typing 6 digits', async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    for (let i = 1; i <= 6; i++) {
      const input = screen.getByRole('textbox', { name: `Digit ${i}` });
      await user.type(input, String(i));
    }

    expect(screen.getByRole('button', { name: /verify/i })).toBeEnabled();
  });

  it('verify button stays disabled with fewer than 6 digits', async () => {
    const user = userEvent.setup();
    render(<TestWrapper />);

    for (let i = 1; i <= 4; i++) {
      const input = screen.getByRole('textbox', { name: `Digit ${i}` });
      await user.type(input, String(i));
    }

    expect(screen.getByRole('button', { name: /verify/i })).toBeDisabled();
  });
});
