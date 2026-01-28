import { toast } from "sonner"
import { Check, X, Info, AlertTriangle, Loader2 } from "lucide-react"

/**
 * Enhanced toast utilities with animations
 */

export const toastSuccess = (title: string, description?: string) => {
  toast.success(title, {
    description,
    icon: <Check className="size-4 text-green-500 animate-in zoom-in duration-300" />,
    duration: 4000,
    classNames: {
      toast: "animate-in slide-in-from-right duration-300",
    },
  })
}

export const toastError = (title: string, description?: string) => {
  toast.error(title, {
    description,
    icon: <X className="size-4 text-red-500 animate-shake" />,
    duration: 5000,
    classNames: {
      toast: "animate-shake",
    },
  })
}

export const toastInfo = (title: string, description?: string) => {
  toast.info(title, {
    description,
    icon: <Info className="size-4 text-blue-500" />,
    duration: 4000,
  })
}

export const toastWarning = (title: string, description?: string) => {
  toast.warning(title, {
    description,
    icon: <AlertTriangle className="size-4 text-yellow-500" />,
    duration: 5000,
  })
}

export const toastLoading = (title: string, description?: string) => {
  return toast.loading(title, {
    description,
    icon: <Loader2 className="size-4 animate-spin" />,
  })
}

export const toastPromise = <T,>(
  promise: Promise<T>,
  {
    loading,
    success,
    error,
  }: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: Error) => string)
  }
) => {
  return toast.promise(promise, {
    loading,
    success: (data: T) => typeof success === "function" ? success(data) : success,
    error: (err: Error) => typeof error === "function" ? error(err) : error,
  })
}

export const toastCustom = (
  title: string,
  description: string,
  icon: React.ReactNode,
  duration = 4000
) => {
  toast.custom(
    (t) => (
      <div className="flex items-start gap-3 p-4 bg-background border rounded-lg shadow-lg animate-in slide-in-from-right duration-300">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1">
          <p className="font-medium text-sm">{title}</p>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <button
          onClick={() => toast.dismiss(t)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
    ),
    { duration }
  )
}
