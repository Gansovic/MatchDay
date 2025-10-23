/**
 * TeamLogo Component Unit Tests
 *
 * Tests the reusable TeamLogo component that displays team logos or initials
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TeamLogo } from '../../../apps/player/src/components/common/team-logo';

describe('TeamLogo Component', () => {
  describe('Logo Display', () => {
    it('should render team logo when logoUrl is provided', () => {
      render(
        <TeamLogo
          name="Test Team"
          logoUrl="https://example.com/logo.png"
          size="md"
        />
      );

      const logo = screen.getByRole('img');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src', expect.stringContaining('logo.png'));
      expect(logo).toHaveAttribute('alt', 'Test Team logo');
    });

    it('should render initial when logoUrl is not provided', () => {
      const { container } = render(
        <TeamLogo
          name="Test Team"
          size="md"
        />
      );

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(container.textContent).toContain('T');
    });

    it('should render initial when logoUrl is null', () => {
      const { container } = render(
        <TeamLogo
          name="Test Team"
          logoUrl={null}
          size="md"
        />
      );

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(container.textContent).toContain('T');
    });

    it('should handle uppercase team names correctly', () => {
      const { container } = render(
        <TeamLogo
          name="BARCELONA"
          size="md"
        />
      );

      expect(container.textContent).toContain('B');
    });

    it('should handle lowercase team names correctly', () => {
      const { container } = render(
        <TeamLogo
          name="real madrid"
          size="md"
        />
      );

      expect(container.textContent).toContain('R');
    });

    it('should handle empty team name with fallback', () => {
      const { container } = render(
        <TeamLogo
          name=""
          size="md"
        />
      );

      expect(container.textContent).toContain('?');
    });
  });

  describe('Color Styling', () => {
    it('should apply custom color when no logo is provided', () => {
      const { container } = render(
        <TeamLogo
          name="Test Team"
          color="#FF5733"
          size="md"
        />
      );

      const logoDiv = container.querySelector('div');
      expect(logoDiv).toHaveStyle({ backgroundColor: '#FF5733' });
    });

    it('should use default gray color when no color and no logo provided', () => {
      const { container } = render(
        <TeamLogo
          name="Test Team"
          size="md"
        />
      );

      const logoDiv = container.querySelector('div');
      expect(logoDiv).toHaveStyle({ backgroundColor: '#374151' });
    });

    it('should not apply background color when logo is provided', () => {
      const { container } = render(
        <TeamLogo
          name="Test Team"
          logoUrl="https://example.com/logo.png"
          color="#FF5733"
          size="md"
        />
      );

      const logoDiv = container.querySelector('div');
      expect(logoDiv).toHaveClass('bg-white');
    });
  });

  describe('Size Variants', () => {
    it('should apply small size classes', () => {
      const { container } = render(
        <TeamLogo
          name="Test Team"
          size="sm"
        />
      );

      const logoDiv = container.querySelector('div');
      expect(logoDiv).toHaveClass('w-6', 'h-6', 'text-xs');
    });

    it('should apply medium size classes', () => {
      const { container } = render(
        <TeamLogo
          name="Test Team"
          size="md"
        />
      );

      const logoDiv = container.querySelector('div');
      expect(logoDiv).toHaveClass('w-8', 'h-8', 'text-sm');
    });

    it('should apply large size classes', () => {
      const { container } = render(
        <TeamLogo
          name="Test Team"
          size="lg"
        />
      );

      const logoDiv = container.querySelector('div');
      expect(logoDiv).toHaveClass('w-10', 'h-10', 'text-base');
    });

    it('should default to medium size when size prop is not provided', () => {
      const { container } = render(
        <TeamLogo
          name="Test Team"
        />
      );

      const logoDiv = container.querySelector('div');
      expect(logoDiv).toHaveClass('w-8', 'h-8', 'text-sm');
    });

    it('should render logo with correct size dimensions', () => {
      render(
        <TeamLogo
          name="Test Team"
          logoUrl="https://example.com/logo.png"
          size="lg"
        />
      );

      const logo = screen.getByRole('img');
      expect(logo).toHaveAttribute('width', '40');
      expect(logo).toHaveAttribute('height', '40');
    });
  });

  describe('Custom Class Names', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <TeamLogo
          name="Test Team"
          className="custom-class"
          size="md"
        />
      );

      const logoDiv = container.querySelector('div');
      expect(logoDiv).toHaveClass('custom-class');
    });

    it('should preserve base classes when custom className is applied', () => {
      const { container } = render(
        <TeamLogo
          name="Test Team"
          className="custom-class"
          size="md"
        />
      );

      const logoDiv = container.querySelector('div');
      expect(logoDiv).toHaveClass('rounded', 'flex', 'custom-class');
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for logo images', () => {
      render(
        <TeamLogo
          name="Manchester United"
          logoUrl="https://example.com/logo.png"
          size="md"
        />
      );

      const logo = screen.getByAltText('Manchester United logo');
      expect(logo).toBeInTheDocument();
    });

    it('should render text content when using initials for screen readers', () => {
      const { container } = render(
        <TeamLogo
          name="Arsenal FC"
          size="md"
        />
      );

      expect(container.textContent).toBe('A');
    });
  });
});
