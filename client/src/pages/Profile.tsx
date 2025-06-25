import React from "react";
import { FC } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import {
  appwriteDatabases,
  client,
  Query,
  account,
  storage,
} from "../storage/appwriteConfig";

const Profile: FC = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await account.get();
        setUser(response);
        console.log("User data:", response);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    getUser();
  }, []);

  return (
    <div>
      <Header />
      <div className="h-[80vh] flex justify-center items-center">
        {user ? (
          <h1 className="text-xl font-semibold">Name: {user.name}</h1>
        ) : (
          <p className="text-sm mutedText">Loading your profile...</p>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Profile;
