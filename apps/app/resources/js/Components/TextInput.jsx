import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { cn } from '@/lib/utils';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={cn(
                'ui-control h-11 px-4 text-sm placeholder:text-ink-mute disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            ref={localRef}
        />
    );
});
