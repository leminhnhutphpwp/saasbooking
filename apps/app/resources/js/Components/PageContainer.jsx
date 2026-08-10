import { cn } from '@/lib/utils';

/**
 * Single page wrapper used by every authenticated page.
 *
 * Provides responsive gutters and vertical rhythm while letting Manager pages
 * use the available shell width. Narrow form/empty-state pages stay constrained.
 *
 * Props:
 *   - size: 'default' (fluid) | 'narrow' (max-w-3xl for forms/empty pages)
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
  const maxWidth = size === 'narrow' ? 'max-w-3xl' : 'max-w-none';

  return (
    <div
      className={cn(
        'mx-auto w-full space-y-6 px-1 py-6 sm:px-2 lg:py-8',
        maxWidth,
        className,
      )}
    >
      {children}
    </div>
  );
}
