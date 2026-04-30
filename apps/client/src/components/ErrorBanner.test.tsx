import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { errorBannerStore } from '@app/hooks/use-error-banner';

import ErrorBanner from './ErrorBanner';

describe('ErrorBanner', () => {
  beforeEach(() => errorBannerStore.dismiss());
  afterEach(() => errorBannerStore.dismiss());

  it('renders the message when an error is set', () => {
    errorBannerStore.setError('something failed');
    render(<ErrorBanner />);
    expect(screen.getByRole('alert')).toHaveTextContent('something failed');
  });

  it('renders nothing when no error is set', () => {
    const { container } = render(<ErrorBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('clicking dismiss clears the error and unmounts the banner', async () => {
    errorBannerStore.setError('please go away');
    render(<ErrorBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /dismiss error/i }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('uses aria-live=assertive for screen-reader announcement', () => {
    errorBannerStore.setError('urgent');
    render(<ErrorBanner />);
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  });
});
