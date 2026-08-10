import { Link } from '@inertiajs/react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Children, cloneElement, forwardRef, isValidElement } from 'react';
import { cn } from '@/lib/utils';

const Dropdown = DropdownMenuPrimitive.Root;

const Trigger = forwardRef(({ children, className, 'aria-label': ariaLabel = 'Mở menu', ...props }, ref) => {
    const child = Children.only(children);

    if (!isValidElement(child)) {
        throw new Error('Dropdown.Trigger requires one interactive child.');
    }

    return (
        <DropdownMenuPrimitive.Trigger ref={ref} asChild {...props}>
            {/* The child remains the real button, so Radix manages expanded state and focus restoration. */}
            {cloneElement(child, {
                className: cn(child.props.className, className),
                'aria-label': child.props['aria-label'] ?? ariaLabel,
            })}
        </DropdownMenuPrimitive.Trigger>
    );
});
Trigger.displayName = 'DropdownTrigger';

const Content = ({
    align = 'right',
    width = '48',
    contentClasses,
    children,
}) => {
    let alignmentClasses = 'origin-top';

    if (align === 'left') {
        alignmentClasses = 'ltr:origin-top-left rtl:origin-top-right start-0';
    } else if (align === 'right') {
        alignmentClasses = 'ltr:origin-top-right rtl:origin-top-left end-0';
    }

    let widthClasses = '';

    if (width === '48') {
        widthClasses = 'w-48';
    }

    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
                align={align}
                sideOffset={8}
                className={cn(
                    'ui-float z-50 min-w-48 overflow-hidden py-1 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                    alignmentClasses,
                    widthClasses,
                    contentClasses,
                )}
            >
                {children}
            </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
    );
};

const DropdownLink = forwardRef(({ className = '', children, ...props }, ref) => {
    return (
        <DropdownMenuPrimitive.Item asChild>
            <Link
                ref={ref}
                {...props}
                className={cn(
                    'ui-menu-item flex w-full items-center px-4 py-2 text-start text-sm leading-5',
                    className,
                )}
            >
                {children}
            </Link>
        </DropdownMenuPrimitive.Item>
    );
});
DropdownLink.displayName = 'DropdownLink';

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;

export default Dropdown;
