import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SimulationNotice } from '@/components/SimulationNotice';

describe('SimulationNotice', () => {
  it('states that SDG Railway does not provide real transport services', () => {
    render(<SimulationNotice />);
    const note = screen.getByRole('note', { name: /educational simulation notice/i });
    expect(note).toHaveTextContent('does not provide real transport services');
  });
});
