import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancelButton,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/Components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { AlertTriangle, CircleCheckBig, Loader2 } from 'lucide-react';

export function ConfirmActionDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmLabel = 'Xác nhận',
    processingLabel = 'Đang xử lý…',
    cancelLabel = 'Hủy',
    processing = false,
    variant = 'destructive',
}) {
    const destructive = variant === 'destructive';
    const Icon = destructive ? AlertTriangle : CircleCheckBig;

    return (
        <AlertDialog
            open={open}
            onOpenChange={(nextOpen) => {
                if (!processing) onOpenChange(nextOpen);
            }}
        >
            <AlertDialogContent className="max-w-md gap-5 rounded-2xl">
                <AlertDialogHeader className="items-center text-center sm:items-start sm:text-left">
                    <div
                        className={cn(
                            'mb-1 flex h-11 w-11 items-center justify-center rounded-xl',
                            destructive
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-primary/10 text-primary',
                        )}
                    >
                        <Icon className="h-5 w-5" />
                    </div>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription className="leading-6">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancelButton disabled={processing}>
                        {cancelLabel}
                    </AlertDialogCancelButton>
                    <AlertDialogAction
                        type="button"
                        onClick={onConfirm}
                        disabled={processing}
                        className={cn(
                            destructive &&
                                'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                        )}
                    >
                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {processing ? processingLabel : confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
