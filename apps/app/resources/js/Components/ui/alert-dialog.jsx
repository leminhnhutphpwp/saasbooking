import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { buttonVariants } from "@/Components/ui/button"
import { cn } from "@/lib/utils"

const AlertDialog = DialogPrimitive.Root
const AlertDialogTrigger = DialogPrimitive.Trigger
const AlertDialogPortal = DialogPrimitive.Portal
const AlertDialogCancel = DialogPrimitive.Close

const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "ui-overlay fixed inset-0 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
AlertDialogOverlay.displayName = "AlertDialogOverlay"

const AlertDialogContent = React.forwardRef(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      role="alertdialog"
      className={cn(
        "ui-dialog fixed left-1/2 top-1/2 z-50 grid max-h-screen w-11/12 max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto overscroll-contain p-6 text-left data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = "AlertDialogContent"

const AlertDialogHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-2 text-left", className)} {...props} />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({ className, ...props }) => (
  <div className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("manager-card-title text-foreground", className)} {...props} />
))
AlertDialogTitle.displayName = DialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm leading-5 text-muted-foreground", className)} {...props} />
))
AlertDialogDescription.displayName = DialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants(), className)} {...props} />
))
AlertDialogAction.displayName = "AlertDialogAction"

const AlertDialogCancelButton = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Close ref={ref} className={cn(buttonVariants({ variant: "outline" }), className)} {...props} />
))
AlertDialogCancelButton.displayName = "AlertDialogCancelButton"

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogCancelButton,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
