import { toast } from "@/components/starwind/toast";

type ActionOptions<T> = {
  successMessage?: string;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
};

export async function runAction<T>(
  promise: Promise<any>,
  options: ActionOptions<T> = {},
): Promise<boolean> {
  const { data, error } = await promise;

  if (error) {
    const msg = error.code.toLowerCase().replace(/_/g, " ");
    const titleCasedMsg = msg.charAt(0).toUpperCase() + msg.slice(1);
    toast.error(titleCasedMsg, { duration: 2000 });

    if (options.onError) options.onError(error);
    return false;
  }

  if (options.successMessage)
    toast.success(options.successMessage, { duration: 2000 });
  if (options.onSuccess) options.onSuccess(data);

  return true;
}
