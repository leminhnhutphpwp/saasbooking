import { cn } from '@/lib/utils';

/**
 * Single page wrapper used by every authenticated page.
 *
 * Provides consistent max-width, responsive padding, and vertical rhythm
 * so every page looks cohesive regardless of who built it.
 *
 * Props:
 *   - size: 'default' (max-w-6xl) | 'narrow' (max-w-3xl for forms/empty pages)
 *   - className: additional Tailwind classes
 *   - children: page content
 *
 * Usage:
 *   <PageContainer>
 *     <PageHeader title="..." />
 *     <Card>...</Card>
 *   </PageContainer>
 */
export function PageContainer({ size = 'default', className, children }) {
  const maxWidth = size === 'narrow' ? 'max-w-3xl' : 'max-w-6xl';

  return (
    <div
      className={cn(
        'mx-auto w-full px-4 py-6 sm:px-6 space-y-6',
        maxWidth,
        className,
      )}
    >
      {children}
    </div>
  );
}
