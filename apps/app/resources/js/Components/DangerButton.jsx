export default function DangerButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `ui-danger inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors hover:bg-sunk disabled:cursor-not-allowed disabled:opacity-50 ${
                    disabled ? 'opacity-25' : ''
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
