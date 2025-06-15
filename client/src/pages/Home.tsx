import { FC } from "react";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Features from "@/components/Features";
import { GoArrowRight } from "react-icons/go";
import { BsStars } from "react-icons/bs";
import Process from "@/components/Process";
import { Link } from "wouter";
import CTA from "@/components/CTA";

const Home: FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto mt-20 md:px-4 px-2 sm:px-6 lg:px-8 py-8 bg-purple-50 min-h-screen h-fit home">
        {/* Hero */}
        <section className="pb-12 flex justify-center items-center min-h-[75vh] h-fit md:flex-row flex-col">
          <div className="md:w-1/2 w-[95%] md:mt-0 mt-8 p-1 flex flex-col justify-center md:items-start items-center text-left">
            <h2 className="font-poppins font-bold text-2xl md:text-5xl mb-1 md:text-left text-center">
              Transform Your Video into
            </h2>
            <h2 className="font-poppins font-bold text-2xl md:text-5xl mb-5 purpleTitle">
              Chill LoFi Beats
            </h2>
            <p className="subText max-w-2xl md:text-lg text-sm mx-auto mb-5 md:text-left text-center">
              Upload your video and let our tool generate relaxing lofi beats tailored to your visuals. Download the remixed video or just the vibe.
            </p>

            <div className="flex md:gap-4 gap-2">
              <Link href="/convert">
                <button className="darkBtn rounded-md md:text-[0.925rem] text-xs px-5 py-2 flex justify-center items-center gap-2">
                  Get Your Lofi Track <GoArrowRight />
                </button>
              </Link>

              <Link href="/dashboard">
                <button className="lightBtn rounded-md md:text-[0.925rem] text-xs px-5 py-2">
                  Your Dashboard
                </button>
              </Link>
            </div>
          </div>

          <div className="md:w-1/2 w-[95%] md:mt-0 mt-10 flex justify-center items-center rounded-xl relative">
            <img
              src="https://static.vecteezy.com/system/resources/thumbnails/040/983/192/small_2x/ai-generated-an-animated-scene-featuring-a-girl-with-wine-and-a-cat-against-a-nighttime-cityscape-backdrop-lo-fi-style-continuous-loop-free-video.jpg"
              alt=""
              className="w-[95%] rounded-xl"
            />

            <div className="bg-white absolute bottom-[-1.75rem] right-[-0.5rem] rounded-md py-3 px-4 shadow-xl AI">
              <h3 className="text-base purpleTitle flex justify-start items-center gap-1">
                Powered By AI <BsStars />
              </h3>
              <p className="text-sm subText">High-quality lofi conversion</p>
            </div>
          </div>
        </section>

        {/* Main Workflow Container */}
        {/* <WorkflowContainer /> */}

        {/* Process */}
        <Process />

        {/* Features */}
        <Features />

        {/* CTA */}
        <CTA />
      </main>

      <Footer />
    </>
  );
};

export default Home;
