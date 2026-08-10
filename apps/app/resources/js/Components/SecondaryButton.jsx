export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex h-11 items-center justify-center rounded-full bg-surface px-5 text-sm font-semibold text-ink shadow-flat transition-colors hover:bg-sunk disabled:cursor-not-allowed disabled:opacity-50 ` +
                className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
