import { ValidationRules, ValidationRule } from "@/types/auth";

export const authValidation: ValidationRules = {
  email: (value: string) => {
    if (!value) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Enter a valid email";
    return true;
  },

  password: (value: string) => {
    if (!value) return "Password is required";
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()[\]{}<>?/|~`])[A-Za-z\d!@#$%^&*()[\]{}<>?/|~`]{8,}$/;

    if (!passwordRegex.test(value)) {
      return "Password must be at least 8 characters, include 1 uppercase, 1 lowercase, 1 number, and 1 special character";
    }
    return true;
  },

  required: (fieldName: string) => (value: string) => {
    if (!value) return `${fieldName} is required`;
    return true;
  },

  minLength: (fieldName: string, length: number) => (value: string) => {
    if (!value || value.length < length)
      return `${fieldName} must be at least ${length} characters`;
    return true;
  },

  maxLength: (fieldName: string, length: number) => (value: string) => {
    if (value && value.length > length)
      return `${fieldName} must be less than ${length} characters`;
    return true;
  },
};