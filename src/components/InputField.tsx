import { useState } from "react";
import { FieldError } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

type InputFieldProps = {
  label: string;
  type?: string;
  register: any;
  name: string;
  defaultValue?: string;
  error?: FieldError;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

const InputField = ({
  label,
  type = "text",
  register,
  name,
  defaultValue,
  error,
  inputProps,
}: InputFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-2 w-full md:w-1/4">
      <label className="text-xs text-gray-700 dark:text-gray-300 capitalize">{label}</label>
      <div className="relative w-full">
        <input
          type={inputType}
          {...register(name)}
          className={`ring-[1.5px] ring-gray-400 dark:ring-gray-600 p-2 rounded-md text-sm w-full bg-white dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#707E94] ${
            isPassword ? "pr-10" : ""
          }`}
          {...inputProps}
          defaultValue={defaultValue}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error?.message && <p className="text-xs text-red-600">{error.message.toString()}</p>}
    </div>
  );
};

export default InputField;