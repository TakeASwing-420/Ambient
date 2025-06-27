import React from "react";
import { FC } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Community: FC = () => {
  return (
    <div>
      <Header />
      <div className="max-w-7xl mx-auto mt-20 bg-purple-50 min-h-[70vh] h-fit home px-2 pb-6 flex flex-col justify-center items-center">
        <iframe src="https://lottie.host/embed/40f2a2af-1c0b-41fc-b54d-40dd27c886b6/6d1m4BNjmD.lottie" width={500} height={300}></iframe>
        <h2 className="text-5xl font-poppins font-bold">Page Coming Soon</h2>
        <p className="mutedText purpleTitle mt-4 mb-1 text-lg">We're Still Tuning the Vibes...</p>
        <p className="w-[65%] text-center subText">Thanks for stopping by! This page is currently under development — we&apos;re fine-tuning the beats and polishing the pixels.</p>
        <p className="subText">" Something chill is on the way "</p>
      </div>
      <Footer />
    </div>
  );
};

export default Community;
