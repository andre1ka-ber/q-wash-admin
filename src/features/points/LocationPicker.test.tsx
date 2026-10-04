import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LocationPicker } from './LocationPicker';

// react-leaflet's MapContainer needs real layout jsdom lacks, so only the
// no-key path (which never mounts the map) is rendered for real here.
describe('LocationPicker', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('shows a notice instead of the map when no CARTO key is configured', () => {
    vi.stubEnv('VITE_CARTO_API_KEY', '');
    render(<LocationPicker value={null} onChange={() => {}} />);
    expect(screen.getByText('Карта недоступна')).toBeInTheDocument();
  });
});
