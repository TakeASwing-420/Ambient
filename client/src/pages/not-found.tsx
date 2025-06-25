import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();
  const [seconds, setSeconds] = useState(5);

  useEffect(() => {
    const countdown = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    const timer = setTimeout(() => {
      navigate("/");
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdown);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center notFound">
      <div className="flex mb-2 gap-2 w-fit justify-center items-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h1 className="text-5xl font-bold">
          <span className="purpleTitle">404</span> - Page Lost in the LoFi Loop
        </h1>
      </div>

      <p className="mt-4 text-base mutedText">
        You might be lost in the reverb. Let's bring you back to the mix.
        <Link
          href="/"
          className="purpleTitle hover:text-purple-500 transition-all duration-200 ease-in-out"
        >
          {" "}
          Home
        </Link>
      </p>

      <p className="text-base mutedText mt-4">Rejoining the mix in <span className="purpleTitle">{seconds}</span></p>
    </div>
  );
}
