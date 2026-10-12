/** Page heading for the AppLayout header: optional icon, title, and a subtitle from sm up. */
export default function PageTitle({ icon: Icon, subtitle, children }) {
    return (
        <div className="flex min-w-0 items-center gap-2">
            {Icon && (
                <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            )}
            <div className="min-w-0">
                <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">
                    {children}
                </h1>
                {subtitle && (
                    <p className="hidden truncate text-xs text-muted-foreground sm:block">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}
