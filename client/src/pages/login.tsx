import React from "react";
import { useState, useEffect } from "react";
import { FC } from "react";
import { Link } from "wouter";
import { GoArrowLeft } from "react-icons/go";
import { account } from "../auth/appwrite";

const Login: FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const session = await account.createEmailPasswordSession(email, password);
      console.log("Session:", session);
      window.location.href = "/";
    } catch (error) {
      console.error("Login Error: ", error.message);
      alert(error.message);
    }
  };

  return (
    <>
      <main className="w-full mx-auto px-2 sm:px-6 lg:px-8 py-8 bg-purple-100 min-h-screen h-fit flex justify-center items-center secondBg">
        {/* Hero */}
        <section className="text-center w-full flex flex-col justify-center items-center">
          <div className="md:w-[38%] sm:w-[80%] w-[100%] flex justify-start my-3 subText">
            <Link
              href="/"
              className="flex gap-1 justify-center items-center hover:text-purple-600"
            >
              <GoArrowLeft /> Back to Home
            </Link>
          </div>

          <form
            action="POST"onSubmit={(e) => {
              e.preventDefault();
              handleLogin(email, password)
            }}
            className="h-fit md:w-[38%] sm:w-[80%] w-[100%] bg-white shadow-2xl flex flex-col justify-center items-center px-3 py-6 rounded-xl mainBg"
          >
            <h2 className="font-poppins font-bold md:text-3xl text-2xl mb-1">
              Welcome Back to Lofi-fy
            </h2>
            <p className="subText mb-6">
              Log in to continue your LoFi music journey
            </p>

            <div className="flex flex-col w-4/5 items-start my-2 gap-1">
              <label htmlFor="email">Email</label>
              <input
                type="text"
                name="email"
                id="email"
                placeholder="you@example.com"
                className="border-2 formInput"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col w-4/5 items-start my-2 gap-1">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                name="password"
                id="password"
                placeholder="Enter Password"
                className="border-2 formInput"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex gap-2 justify-start w-4/5 my-2">
              <input type="checkbox" name="agreement" id="agreement" />
              <label htmlFor="agreement" className="text-xs">
                Remember Me
              </label>
            </div>

            <div className="flex gap-2 justify-end w-4/5 mt-2">
              <Link
                href="/login"
                className="text-sm subText hover:text-purple-600"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="flex gap-2 justify-center w-4/5 items-center mb-1 mt-2">
              <button type="submit" className="darkBtn w-full rounded-md py-1">
                Log In to Vibe
              </button>
            </div>

            <div className="flex gap-2 justify-start w-4/5 items-center my-1">
              <p className="subText text-sm">
                Don&apos;t have an Account?{" "}
                <Link href="/signin" className="navLink text-purple-600 link">
                  Sign-in
                </Link>
              </p>
            </div>
          </form>
        </section>
      </main>
    </>
  );
};

export default Login;
