import { describe, expect, it } from 'vitest';
import { formatHours } from './formatHours';

describe('formatHours', () => {
  it('formats open–close, dropping seconds', () => {
    expect(formatHours('09:00', '21:00')).toBe('09:00–21:00');
    expect(formatHours('08:00:00', '22:30:00')).toBe('08:00–22:30');
  });

  it('says "круглосуточно" for an all-day point', () => {
    expect(formatHours('00:00', '24:00')).toBe('круглосуточно');
    expect(formatHours('00:00', '23:59')).toBe('круглосуточно');
  });

  it('shows a dash when the hours are unknown', () => {
    expect(formatHours()).toBe('—');
    expect(formatHours('09:00')).toBe('—');
  });
});
