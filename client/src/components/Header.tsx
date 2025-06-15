// import { FC } from 'react';
// import { Link } from 'wouter';

// const Header: FC = () => {
//   return (
//     <header className="bg-white shadow">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//         <div className="flex items-center justify-between">
//           <Link href="/">
//             <div className="flex items-center cursor-pointer">
//               <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
//                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                   <path d="M9 18V5l12-2v13"></path>
//                   <circle cx="6" cy="18" r="3"></circle>
//                   <circle cx="18" cy="16" r="3"></circle>
//                 </svg>
//               </div>
//               <h1 className="ml-3 font-poppins font-bold text-2xl text-gray-800">Lofify</h1>
//             </div>
//           </Link>
//           <div>
//             <Link href="/">
//               <span className="font-medium text-primary hover:text-primary/90 transition-colors cursor-pointer">
//                 About
//               </span>
//             </Link>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// };

// export default Header;

import { FC } from "react";
import { Link, useLocation } from "wouter";
import React from "react";
import { useEffect, useState } from "react";
import { MdOutlineLightMode } from "react-icons/md";
import { MdOutlineDarkMode } from "react-icons/md";
import { RiMenu3Fill } from "react-icons/ri";
import { IoMdClose } from "react-icons/io";

const Header: FC = () => {
  const [theme, setTheme] = useState("light");
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const navbar = document.getElementById("navbar");

    window.onscroll = () => {
      if (window.scrollY > 10) {
        navbar?.classList.add("scrolled");
      } else {
        navbar?.classList.remove("scrolled");
      }
    };
  }, []);

  useEffect(() => {
    const savedTheme =
      localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");

    setTheme(savedTheme);

    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);

    if (newTheme === "dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  };

  return (
    <header
      className="bg-white fixed top-0 right-0 w-screen z-[100] transition-all ease-in-out"
      id="navbar"
    >
      <div className="max-w-7xl mx-auto px-4 h-fit sm:px-6 lg:px-8 py-3">
        <div className="flex items-center h-fit justify-between">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <div className="md:w-10 md:h-10 w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="md:h-6 md:w-6 h-4 w-6 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
              </div>
              <h1 className="ml-3 font-poppins font-bold md:text-2xl text-lg text-gray-800 logo">
                LoFi-fy
              </h1>
            </div>
          </Link>

          <div className="flex justify-center items-center gap-8">
            <ul className="sm:flex justify-center items-center md:gap-8 gap-4 hidden">
              <li className="font-normal text-gray-600 cursor-pointer">
                <Link
                  href="/"
                  className={`${
                    location === "/" ? "activeLink" : ""
                  } navLink transition-colors`}
                >
                  Home
                </Link>
              </li>
              <li className="font-normal text-gray-600 cursor-pointer">
                <Link
                  href="/convert"
                  className={`${
                    location === "/convert" ? "activeLink" : ""
                  } navLink transition-colors`}
                >
                  Convert
                </Link>
              </li>
              <li className="font-normal text-gray-600 cursor-pointer">
                <Link
                  href="/dashboard"
                  className={`${
                    location === "/dashboard" ? "activeLink" : ""
                  } navLink transition-colors`}
                >
                  Dashboard
                </Link>
              </li>
              <li className="font-normal text-gray-600 cursor-pointer">
                <Link
                  href="/about"
                  className={`${
                    location === "/about" ? "activeLink" : ""
                  } navLink transition-colors`}
                >
                  About
                </Link>
              </li>
            </ul>

            <div className="flex justify-center items-center gap-4">
              <button
                className="lightBtn md:p-2 px-2 py-[0.4rem] rounded-lg"
                onClick={toggleTheme}
              >
                {theme == "light" ? (
                  <MdOutlineDarkMode />
                ) : (
                  <MdOutlineLightMode />
                )}
              </button>

              <button className="darkBtn md:py-2 py-1 md:px-3 px-2 rounded-lg text-sm">
                <Link href="/signin">Sign in</Link>
              </button>

              <button className="sm:hidden flex">
                <p
                  className="text-xl"
                  onClick={() => {
                    open ? setOpen(false) : setOpen(true);
                  }}
                >
                  {open === false ? <RiMenu3Fill /> : <IoMdClose />}
                </p>
              </button>
            </div>
          </div>
        </div>

        <ul
          className={`flex-col sm:hidden my-3 gap-2 ${
            open ? "flex" : "hidden"
          } transition-all duration-200 ease-in-out`}
        >
          <li className="font-normal text-gray-600 cursor-pointer">
            <Link
              href="/"
              className={`${
                location === "/" ? "activeLink" : ""
              } navLink transition-colors`}
            >
              Home
            </Link>
          </li>
          <li className="font-normal text-gray-600 cursor-pointer">
            <Link
              href="/convert"
              className={`${
                location === "/convert" ? "activeLink" : ""
              } navLink transition-colors`}
            >
              Convert
            </Link>
          </li>
          <li className="font-normal text-gray-600 cursor-pointer">
            <Link
              href="/dashboard"
              className={`${
                location === "/dashboard" ? "activeLink" : ""
              } navLink transition-colors`}
            >
              Dashboard
            </Link>
          </li>
          <li className="font-normal text-gray-600 cursor-pointer">
            <Link
              href="/about"
              className={`${
                location === "/about" ? "activeLink" : ""
              } navLink transition-colors`}
            >
              About
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
};

export default Header;
