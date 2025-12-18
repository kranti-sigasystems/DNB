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

export default function Login() {
  const router = useRouter();
  const { login: setSession } = useAuth();
  
  const [state, formAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await loginFormAction(prevState, formData);
      
      // Handle successful login
      if (result?.success && result?.data) {
        const { accessToken, refreshToken, tokenPayload } = result.data;
        
        // Store in sessionStorage exactly as shown in the image
        sessionStorage.setItem('authToken', accessToken);
        sessionStorage.setItem('refreshToken', refreshToken);
        sessionStorage.setItem('user', JSON.stringify(tokenPayload));
        
        console.log('Stored in sessionStorage:');
        console.log('- authToken:', accessToken);
        console.log('- refreshToken:', refreshToken);
        console.log('- user:', JSON.stringify(tokenPayload));
        
        toast.success("Login successful!");
        
        // Redirect to dashboard or specified route
        if (result.redirectTo) {
          router.push(result.redirectTo);
        }
      }
      
      return result;
    },
    { error: "" }
  );

  const form = useForm<LoginFormData>({
    defaultValues: { businessName: "", email: "", password: "" },
  });

  return (
    <div className="flex flex-col-reverse md:flex-row min-h-screen bg-white">
      {/* Left Section (Form) */}
      <div className="flex w-full md:w-1/2 justify-center items-center px-4 sm:px-8 lg:px-16 py-10 bg-gray-100">
        <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl text-left">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
            Login to your account!
          </h1>

          <Form {...form}>
            <form action={formAction} className="space-y-6">
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
                <div className="text-red-600 text-sm">{state.error}</div>
              )}

              <Button
                type="submit"
                className="w-full button-styling"
                disabled={isPending}
              >
                {isPending ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>

          <div className="flex justify-between items-center mt-6 text-sm font-medium">
            <Link
              href="/forgot-password"
              className="text-blue-600 underline hover:text-blue-800 transition"
            >
              Forgot password?
            </Link>

            <Link
              href="/"
              className="text-blue-600 underline hover:text-blue-800 transition"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>

      {/* Right Section (Image) */}
      <div className="w-full md:w-1/2 h-56 sm:h-72 md:h-auto">
        <img
          src={"/images/loginimage.webp"}
          alt="Login illustration"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}