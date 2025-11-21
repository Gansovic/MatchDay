/**
 * Professional Card Component
 *
 * A reusable card component that gives amateur players a professional appearance.
 * Follows LEVER principles by being highly reusable and customizable.
 *
 * @example
 * ```typescript
 * <ProfessionalCard
 *   title="Player Profile"
 *   subtitle="Forward"
 *   image="/player-avatar.jpg"
 *   stats={[
 *     { label: "Goals", value: 15 },
 *     { label: "Assists", value: 8 }
 *   ]}
 * />
 * ```
 */
import React from 'react';
interface Stat {
    label: string;
    value: string | number;
    highlight?: boolean;
}
interface ProfessionalCardProps {
    title: string;
    subtitle?: string;
    image?: string;
    stats?: Stat[];
    badges?: string[];
    className?: string;
    onClick?: () => void;
    children?: React.ReactNode;
    variant?: 'default' | 'player' | 'team' | 'match';
}
export declare const ProfessionalCard: React.NamedExoticComponent<ProfessionalCardProps>;
export {};
//# sourceMappingURL=professional-card.d.ts.map