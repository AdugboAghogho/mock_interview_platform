"use client";

import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { signIn, signUp } from "@/lib/actions/auth.action";
import FormField from "./FormField";

const authFormSchema = (type: FormType) => {
  return z.object({
    name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(3),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();

  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (type === "sign-up") {
        const { name, email, password } = data;

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const result = await signUp({
          uid: userCredential.user.uid,
          name: name!,
          email,
          password,
        });

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        toast.success("Account created successfully. Please sign in.");
        router.push("/sign-in");
      } else {
        const { email, password } = data;

        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        const idToken = await userCredential.user.getIdToken();
        if (!idToken) {
          toast.error("Sign in Failed. Please try again.");
          return;
        }

        await signIn({
          email,
          idToken,
        });

        toast.success("Signed in successfully.");
        router.push("/");
      }
    } catch (error) {
      console.log(error);
      toast.error(`There was an error: ${error}`);
    }
  };

  // 2. NEW GOOGLE SIGN-IN LOGIC
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      const user = userCredential.user;
      const isNewUser = (userCredential as any).additionalUserInfo?.isNewUser;
      const idToken = await user.getIdToken();

      if (!idToken) {
        toast.error("Google Sign-in Failed. Please try again.");
        return;
      }

      if (isNewUser) {
        const result = await signUp({
          uid: user.uid,
          name: user.displayName || "User",
          email: user.email!,
          password: "",
        });

        if (!result.success) {
          toast.error(
            result.message || "Failed to finalize account creation in database."
          );
        }
      }

      await signIn({
        email: user.email!,
        idToken,
      });

      toast.success("Signed in successfully with Google.");
      router.push("/");
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      if (error && error.code === "auth/popup-closed-by-user") {
        toast.error("Sign-in cancelled. The popup was closed.");
      } else {
        toast.error(`Google Sign-In failed: ${error}`);
      }
    }
  };

  const isSignIn = type === "sign-in";

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">MrKels HireMind</h2>
        </div>

        <h3>Practice job interviews with AI</h3>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6 mt-4 form"
          >
            {!isSignIn && (
              <FormField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Your Name"
                type="text"
              />
            )}

            <FormField
              control={form.control}
              name="email"
              label="Email"
              placeholder="Your email address"
              type="email"
            />

            <FormField
              control={form.control}
              name="password"
              label="Password"
              placeholder="Enter your password"
              type="password"
            />

            <Button className="btn" type="submit">
              {isSignIn ? "Sign In" : "Create an Account"}
            </Button>
          </form>
        </Form>

        {/* Divider and Google Button */}
        <div className="flex items-center justify-center gap-4 text-sm text-gray-400 my-0">
          <div className="h-px bg-gray-600 w-full" />
          <h4 className=" text-gray-400 font-bold">OR</h4>
          <div className="h-px bg-gray-600 w-full" />
        </div>

        <Button
          type="button"
          className="h-10 font-bold border-transparent btn rounded-full shadow-sm cursor-pointer"
          onClick={handleGoogleSignIn}
        >
          {/* START: Google Logo SVG */}
          <svg
            className="w-5 h-5"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M44 24.5C44 23.3 43.9 22.1 43.7 21H24V29.5H35.4C34.7 33.3 32.7 36 29.5 38V43H36C40.6 38.6 43.5 32.1 44 24.5Z"
              fill="#4285F4"
            />
            <path
              d="M24 44C29.4 44 34.1 42.2 37.8 39L30.9 33.6C29.2 34.8 26.8 35.5 24 35.5C18.4 35.5 13.6 31.8 11.8 26.5H5.1V31.8C8.9 38.8 15.9 44 24 44Z"
              fill="#34A853"
            />
            <path
              d="M11.8 26.5C11.3 25.3 11 24.7 11 24C11 23.3 11.3 22.7 11.8 21.5V16.2H5.1C3.9 18.5 3.3 21.2 3.3 24C3.3 26.8 3.9 29.5 5.1 31.8L11.8 26.5Z"
              fill="#FBBC04"
            />
            <path
              d="M24 12.5C26.9 12.5 29.6 13.5 31.8 15.5L37.8 10C34.1 6.8 29.4 5 24 5C15.9 5 8.9 10.2 5.1 17.2L11.8 22.5C13.6 17.2 18.4 13.5 24 13.5V12.5Z"
              fill="#EA4335"
            />
          </svg>
          {/* END: Google Logo SVG */}
          Continue with Google
        </Button>

        <p className="text-center">
          {isSignIn ? "No account yet?" : "Have an account already?"}
          <Link
            href={!isSignIn ? "/sign-in" : "/sign-up"}
            className="font-bold Sign-in_up text-user-primary ml-1"
          >
            {!isSignIn ? "Sign In" : "Sign Up"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
