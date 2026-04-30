import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LoadingIndicator from './LoadingIndicator';

describe('LoadingIndicator', () => {
  it('renders with status role and polite aria-live', () => {
    render(<LoadingIndicator />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent(/loading todos/i);
  });
});
