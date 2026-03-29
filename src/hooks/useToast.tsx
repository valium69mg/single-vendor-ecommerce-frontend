import { toast } from "sonner"

export const useToast = () => ({
  toast,
  success: toast.success,
  error: toast.error,
  info: toast.info,
  warning: toast.warning,
  promise: toast.promise,
})