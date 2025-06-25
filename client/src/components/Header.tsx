import { FC } from "react";
import { Link, useLocation } from "wouter";
import React from "react";
import { useEffect, useState } from "react";
import { MdOutlineLightMode } from "react-icons/md";
import { MdOutlineDarkMode } from "react-icons/md";
import { RiMenu3Fill } from "react-icons/ri";
import { IoMdClose } from "react-icons/io";
import { MdKeyboardArrowDown } from "react-icons/md";
import { account } from "../auth/appwrite";

const Header: FC = () => {
  const [theme, setTheme] = useState("light");
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [options, setOptions] = useState(false);

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

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await account.get();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    console.log(user);
    if (!user) {
      alert("Not Current User Session!");
      return;
    }

    try {
      await account.deleteSession("current");
      console.log("Logged out successfully");
      setUser(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  return (
    <header
      className="bg-purple-200/50 backdrop-blur-md rounded-2xl fixed top-2 right-[4.5dvw] w-[90dvw] z-[100] transition-all ease-in-out"
      id="navbar"
    >
      <div className="max-w-7xl mx-auto px-4 h-fit sm:px-6 lg:px-8 py-3">
        <div className="flex items-center h-fit justify-between">
          <Link href="/">
            <div className="flex items-center cursor-pointer">
              <div className="md:w-10 md:h-10 w-8 h-8 bg-gradient-to-br from-purple-500 via-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
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

              {!user ? (
                <button className="darkBtn md:py-2 py-1 md:px-3 px-2 rounded-lg text-sm">
                  <Link href="/signin">Sign in</Link>
                </button>
              ) : (
                ""
                // <button
                //   className="darkBtn md:py-2 py-1 md:px-3 px-2 rounded-lg text-sm"
                //   onClick={handleLogout}
                // >
                //   <p>Logout</p>
                // </button>
              )}

              {user && (
                <div
                  className="ml-1 flex gap-1 justify-center items-center cursor-pointer px-3 py-2 rounded-lg lightBtn relative"
                  onClick={() => {
                    setOptions(!options);
                  }}
                >
                  <div className="w-[30px] h-[30px] bg-gray-300 rounded-full flex justify-center items-center">
                    {user.profile ? (
                      <img src={user.profile} alt="" />
                    ) : (
                      <h1 className="text-black font-bold">{user.name[0]}</h1>
                    )}
                  </div>
                  <p className="mutedText sm:block hidden">
                    {user.name.slice(0, user.name.indexOf(" "))}
                  </p>

                  <MdKeyboardArrowDown
                    className={`${
                      options ? "rotate-180" : ""
                    } transition-all duration-200 ease-in-out`}
                  />

                  <div
                    className={`absolute w-full min-w-fit top-[3.2rem] right-0 ${
                      options ? "" : "hidden"
                    }`}
                  >
                    <ul className="flex flex-col justify-center items-center lightBtnOptions p-2 rounded-lg">
                      <li className="text-sm my-1 optionLink rounded-lg">
                        <Link href="/profile">Profile</Link>
                      </li>
                      <li className="text-sm my-1 optionLink rounded-lg">
                        <Link href="/dashboard">Playlist</Link>
                      </li>
                      <li className="text-sm my-1 optionLink rounded-lg">
                        <Link href="/community">Community</Link>
                      </li>
                      <li
                        className="text-sm my-1 optionLink rounded-lg"
                        onClick={handleLogout}
                      >
                        Logout
                      </li>
                    </ul>
                  </div>
                </div>
              )}

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
          {/* <li className="font-normal text-gray-600 cursor-pointer">
            <Link
              href="/about"
              className={`${
                location === "/about" ? "activeLink" : ""
              } navLink transition-colors`}
            >
              About
            </Link>
          </li> */}
        </ul>
      </div>
    </header>
  );
};

export default Header;
