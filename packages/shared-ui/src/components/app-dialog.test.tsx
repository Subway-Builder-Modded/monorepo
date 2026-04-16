// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { CircleAlert } from 'lucide-react';
import { describe, expect, it, vi } from 'vite-plus/test';

import { AppDialog } from './app-dialog';

describe('AppDialog', () => {
  it('renders dialog content and handles confirm/cancel actions', () => {
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    render(
      <AppDialog
        open
        onOpenChange={onOpenChange}
        title="Delete profile"
        icon={CircleAlert}
        description="This action cannot be undone."
        tone="uninstall"
        confirm={{
          label: 'Delete',
          cancelLabel: 'Keep',
          onConfirm,
        }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep' }));

    expect(screen.getByText('Delete profile')).toBeTruthy();
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows disabled reason and blocks confirm when disabled', () => {
    const onConfirm = vi.fn();

    render(
      <AppDialog
        open
        onOpenChange={vi.fn()}
        title="Install mod"
        icon={CircleAlert}
        description="Waiting for the game to close."
        tone="install"
        confirm={{
          label: 'Install',
          onConfirm,
          disabled: true,
          disabledReason: 'Close the game first',
        }}
      />,
    );

    const button = screen.getByRole('button', { name: 'Install' });
    fireEvent.click(button);

    expect(screen.getByText('Close the game first')).toBeTruthy();
    expect(button.getAttribute('disabled')).not.toBeNull();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});