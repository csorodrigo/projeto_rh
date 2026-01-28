import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChartCard from './ChartCard';

describe('ChartCard', () => {
  it('renders title when provided', () => {
    render(
      <ChartCard title="Test Chart">
        <div>Chart content</div>
      </ChartCard>
    );

    expect(screen.getByText('Test Chart')).toBeTruthy();
  });

  it('renders subtitle when provided', () => {
    render(
      <ChartCard title="Test Chart" subtitle="Test subtitle">
        <div>Chart content</div>
      </ChartCard>
    );

    expect(screen.getByText('Test subtitle')).toBeTruthy();
  });

  it('renders children', () => {
    render(
      <ChartCard>
        <div>Chart content</div>
      </ChartCard>
    );

    expect(screen.getByText('Chart content')).toBeTruthy();
  });

  it('renders action button when provided', () => {
    render(
      <ChartCard
        title="Test Chart"
        action={<button>Export</button>}
      >
        <div>Chart content</div>
      </ChartCard>
    );

    expect(screen.getByRole('button', { name: 'Export' })).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ChartCard className="custom-class">
        <div>Chart content</div>
      </ChartCard>
    );

    expect(container.firstChild?.classList.contains('custom-class')).toBe(true);
  });
});
