/**
 * Title row for a report form. Plain (no box of its own) because the form already
 * sits inside the page card; a framed banner here nested one container too many.
 */
export default function FormHeader({ icon: Icon, title, description }) {
    return (
        <header className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
                <h3 className="text-lg font-semibold leading-tight text-foreground">{title}</h3>
                {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            </div>
        </header>
    );
}
