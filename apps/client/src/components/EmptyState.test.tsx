import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders a friendly empty message', () => {
    render(<EmptyState />);
    expect(screen.getByText(/no todos yet/i)).toBeInTheDocument();
    expect(screen.getByText(/add your first task/i)).toBeInTheDocument();
  });

  it('does not use error/warning styling cues (no role=alert)', () => {
    render(<EmptyState />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
