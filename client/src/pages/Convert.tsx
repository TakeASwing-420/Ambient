import React from "react";
import { useEffect } from "react";
import { FC } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Convert: FC = () => {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto mt-20 px-4 sm:px-6 lg:px-8 py-4 bg-purple-50 min-h-screen h-fit">
        {/* Hero */}
        <section className="pb-12 flex flex-col justify-center items-center h-fit">
          <div className="w-full p-1 flex justify-center items-center text-left">
            <h2 className="font-poppins font-bold text-2xl md:text-4xl">
              Convert Your Music into&nbsp;
            </h2>
            <h2 className="font-poppins font-bold text-2xl md:text-4xl purpleTitle">
              LoFi
            </h2>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Convert;
