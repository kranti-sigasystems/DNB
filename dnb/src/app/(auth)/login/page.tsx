"use client";

import { useActionState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { authValidation } from "@/lib/utils/authValidation";
import { loginFormAction } from "@/actions/auth.actions";
import { InputField } from "@/components/common/InputField";
import { PasswordField } from "@/components/common/PasswordField";
import useAuth from "@/hooks/use-auth";
import { LoginFormData } from "@/types/auth";
import { MoveLeftIcon, RefreshCcw } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const {} = useAuth();

  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await loginFormAction(prevState, formData);
      
      // Handle successful login
      if (result?.success && result?.data) {
        const { authToken, refreshToken, tokenPayload } = result.data;

        // Store in sessionStorage exactly as shown in the image
        sessionStorage.setItem("authToken", authToken);
        sessionStorage.setItem("refreshToken", refreshToken);
        sessionStorage.setItem("user", JSON.stringify(tokenPayload));
        toast.success("Login successful!");
        // Redirect to dashboard or specified route
        if (result.redirectTo) {
          router.push(result.redirectTo);
        }
      }
      
      return result;
    },
    { success: false, error: "" }
  );

  const form = useForm<LoginFormData>({
    defaultValues: { businessName: "", email: "", password: "" },
  });

  return (
    <div className="flex flex-col-reverse lg:flex-row min-h-screen bg-background">
      {/* Left Section (Form) */}
      <div className="flex w-full lg:w-1/2 justify-center items-center px-4 sm:px-6 lg:px-8 xl:px-16 py-6 sm:py-8 lg:py-10 bg-card">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
          <div className="text-center lg:text-left mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
              Login to your account!
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Welcome back! Please sign in to continue.
            </p>
          </div>

          <Form {...form}>
            <form action={formAction} className="space-y-4 sm:space-y-6">
              {/* Business Name */}
              <Controller
                name="businessName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <InputField
                    label="Business Name"
                    placeholder="e.g. Ocean Fresh Seafood"
                    field={field}
                    error={fieldState.error}
                  />
                )}
              />

              {/* Email */}
              <Controller
                name="email"
                control={form.control}
                rules={{ validate: authValidation.email }}
                render={({ field, fieldState }) => (
                  <InputField
                    label="Email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    field={field}
                    error={fieldState.error}
                  />
                )}
              />

              {/* Password */}
              <Controller
                name="password"
                control={form.control}
                rules={{ validate: authValidation.password }}
                render={({ field, fieldState }) => (
                  <PasswordField
                    label="Password"
                    required
                    field={field}
                    error={fieldState.error}
                  />
                )}
              />

              {/* Display error from server action */}
              {state?.error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  {state.error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 sm:h-11 text-sm sm:text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isPending}
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Logging in...
                  </div>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </Form>

          <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-3 sm:gap-4 mt-6 sm:mt-8 text-xs sm:text-sm">
            <Button variant="link" className="decoration-none">
              <RefreshCcw />
              <Link href={"/forgot-password"}>Forgot password</Link>
            </Button>

            <Button variant="link" className="decoration-none">
              <MoveLeftIcon />
              <Link href={"/"}>Back to home</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Right Section (Image) */}
      <div className="w-full lg:w-1/2 h-48 sm:h-64 md:h-80 lg:h-auto">
        <img
          src={"/images/loginimage.webp"}
          alt="Login illustration"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
