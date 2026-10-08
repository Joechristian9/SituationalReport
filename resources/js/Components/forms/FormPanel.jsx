import { cn } from '@/lib/utils';

/**
 * The single frame around a report form on a page (design system: border + shadow-sm).
 * Forms inside it must not add cards of their own.
 */
export default function FormPanel({ className, children }) {
    return <section className={cn('mx-auto max-w-7xl rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6', className)}>{children}</section>;
}
