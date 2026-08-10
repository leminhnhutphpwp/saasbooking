import {
    Dialog,
    DialogDescription,
    DialogPanel,
    DialogTitle,
    Transition,
    TransitionChild,
} from '@headlessui/react';

export default function Modal({
    children,
    show = false,
    maxWidth = '2xl',
    closeable = true,
    onClose = () => {},
}) {
    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
    }[maxWidth];

    return (
        <Transition show={show} leave="transition-opacity duration-[var(--dur-base)] ease-[var(--ease)]">
            <Dialog
                as="div"
                id="modal"
                className="fixed inset-0 z-50 flex transform items-center overflow-y-auto px-4 py-6 transition-all sm:px-0"
                onClose={close}
            >
                <TransitionChild
                    enter="transition-opacity duration-[var(--dur-base)] ease-[var(--ease)]"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity duration-[var(--dur-base)] ease-[var(--ease)]"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="ui-overlay absolute inset-0" />
                </TransitionChild>

                <TransitionChild
                    enter="transition-opacity duration-[var(--dur-base)] ease-[var(--ease)]"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity duration-[var(--dur-base)] ease-[var(--ease)]"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <DialogPanel
                        className={`ui-dialog mb-6 w-full overflow-hidden sm:mx-auto ${maxWidthClass}`}
                    >
                        {children}
                    </DialogPanel>
                </TransitionChild>
            </Dialog>
        </Transition>
    );
}

export { DialogDescription, DialogTitle };
