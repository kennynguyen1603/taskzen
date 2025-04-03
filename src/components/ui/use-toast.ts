import { useState, useEffect, useCallback } from "react"

export interface Toast {
    id: string
    title?: string
    description?: string
    action?: React.ReactNode
    variant?: "default" | "destructive"
}

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000

export type ToasterToast = Toast & {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export const useToast = () => {
    const [toasts, setToasts] = useState<ToasterToast[]>([])

    const toast = useCallback(({ ...props }: Toast) => {
        const id = props.id || String(Date.now())

        setToasts((prevToasts) => {
            // Find if the toast already exists
            const toastExists = prevToasts.find((toast) => toast.id === id)

            if (toastExists) {
                // Update existing toast
                return prevToasts.map((toast) => {
                    if (toast.id === id) {
                        return {
                            ...toast,
                            ...props,
                            open: true,
                            onOpenChange: (open) => {
                                if (!open) {
                                    dismissToast(id)
                                }
                            },
                        }
                    }
                    return toast
                })
            }

            // Create a new toast
            return [
                {
                    ...props,
                    id,
                    open: true,
                    onOpenChange: (open) => {
                        if (!open) {
                            dismissToast(id)
                        }
                    },
                },
                ...prevToasts,
            ].slice(0, TOAST_LIMIT)
        })

        return id
    }, [])

    const dismissToast = useCallback((id: string) => {
        setToasts((prevToasts) =>
            prevToasts.map((toast) =>
                toast.id === id
                    ? {
                        ...toast,
                        open: false,
                    }
                    : toast
            )
        )

        setTimeout(() => {
            setToasts((prevToasts) =>
                prevToasts.filter((toast) => toast.id !== id)
            )
        }, TOAST_REMOVE_DELAY)
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id))
    }, [])

    return {
        toast,
        toasts,
        dismissToast,
        removeToast,
    }
} 