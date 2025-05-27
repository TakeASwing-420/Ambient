import React from "react";
import { useEffect } from "react";
import { FC } from "react";
import { Link } from "wouter";
import { GoArrowLeft } from "react-icons/go";
import { GoogleLoginButton } from "react-social-login-buttons";
import { AppleLoginButton } from "react-social-login-buttons";

const Signin: FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-purple-100 min-h-screen h-fit flex justify-center items-center">
        {/* Hero */}
        <section className="text-center w-full flex flex-col justify-center items-center">
          <div className="w-[38%] flex justify-start my-3 subText">
            <Link href="/" className="flex gap-1 justify-center items-center hover:text-purple-600"><GoArrowLeft /> Back to Home</Link>
          </div>

          <form action="POST" className="h-fit w-[38%] bg-white shadow-2xl flex flex-col justify-center items-center px-3 py-6 rounded-xl">
            <h2 className="font-poppins font-bold text-3xl mb-1">
              Welcome to Lofi-fy
            </h2>
            <p className="subText mb-6">Sign in to create your LoFi creations and playlists</p>

            <div className="flex flex-col w-4/5 items-start my-2 gap-1">
                <label htmlFor="name">Name</label>
                <input type="text" name="name" id="name" placeholder="Enter Full Name" className="border-2 formInput"/>
            </div>

            <div className="flex flex-col w-4/5 items-start my-2 gap-1">
                <label htmlFor="username">Username</label>
                <input type="text" name="username" id="username" placeholder="Enter Your Username" className="border-2 formInput"/>
            </div>

            <div className="flex flex-col w-4/5 items-start my-2 gap-1">
                <label htmlFor="email">Email</label>
                <input type="text" name="email" id="email" placeholder="you@example.com" className="border-2 formInput"/>
            </div>

            <div className="flex flex-col w-4/5 items-start my-2 gap-1">
                <label htmlFor="password">Password</label>
                <input type="password" name="password" id="password" placeholder="Enter Password" className="border-2 formInput"/>
            </div>

            <div className="flex flex-col w-4/5 items-start my-2 gap-1">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input type="password" name="confirmPassword" id="confirmPassword" placeholder="Confirm Your Password" className="border-2 formInput"/>
            </div>

            <div className="flex gap-2 justify-start w-4/5 my-2">
                <input type="checkbox" name="agreement" id="agreement" required/>
                <label htmlFor="agreement" className="text-xs">I agree to the Terms of Service and Privacy Policy</label>
            </div>

            <div className="flex gap-2 justify-center w-4/5 items-center mb-1 mt-5">
                <button className="darkBtn w-full rounded-md py-1">Join Lofi-fy</button>
            </div>

            <div className="flex gap-2 justify-start w-4/5 items-center my-1">
                <p className="subText text-sm">Already have an Account? <Link href="/login" className="navLink text-purple-600">Login</Link></p>
            </div>

            <div className="flex flex-col gap-2 justify-center w-4/5 items-center my-5">
                <GoogleLoginButton className="border-2 shadow-none flex justify-center items-center w-full rounded-md py-2 transition duration-200"><span className="text-base flex justify-center items-center">Continue with Google</span></GoogleLoginButton>
                <AppleLoginButton className="border-2 shadow-none flex justify-center items-center w-full rounded-md py-2 transition duration-200"><span className="text-base flex justify-center items-center">Continue with Apple</span></AppleLoginButton>
            </div>
          </form>
        </section>
      </main>
    </>
  );
};

export default Signin;
