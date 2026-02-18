import LoginForm from "@/components/auth/LoginForm";
import { useUser } from "../hooks/UseUser";
import { useEffect } from "react";

export default function LoginPage() {
  const { user } = useUser();

    useEffect(() => {
        console.log(user);
    }, [])

  return (
    <div className="w-screen h-screen bg-primary flex justify-center items-center">
        <LoginForm />
    </div>
  );
}
