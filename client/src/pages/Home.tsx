import { FC } from "react";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Features from "@/components/Features";
import { GoArrowRight } from "react-icons/go";
import { BsStars } from "react-icons/bs";
import Process from "@/components/Process";

const Home: FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Header />

      <main className="max-w-7xl mx-auto mt-20 px-4 sm:px-6 lg:px-8 py-8 bg-purple-50 min-h-screen h-fit">
        {/* Hero */}
        <section className="pb-12 flex justify-center items-center h-[75vh]">
          <div className="w-1/2 p-1 flex flex-col justify-center items-start text-left">
            <h2 className="font-poppins font-bold text-3xl md:text-5xl mb-1">
              Transform Your Music into
            </h2>
            <h2 className="font-poppins font-bold text-3xl md:text-5xl mb-5 purpleTitle">
              Chill LoFi Beats
            </h2>
            <p className="subText max-w-2xl text-lg mx-auto mb-5">
              Upload your track, adjust the parameters, and let our AI transform
              it into a chill lofi masterpiece.
            </p>

            <div className="flex gap-4">
              <button className="darkBtn rounded-md text-[0.925rem] px-5 py-2 flex justify-center items-center gap-2">
                Get Your Lofi Track <GoArrowRight />
              </button>
              <button className="lightBtn rounded-md text-[0.925rem] px-5 py-2">
                Your Dashboard
              </button>
            </div>
          </div>

          <div className="w-1/2 flex justify-center items-center rounded-xl relative">
            <img
              src="https://static.vecteezy.com/system/resources/thumbnails/040/983/192/small_2x/ai-generated-an-animated-scene-featuring-a-girl-with-wine-and-a-cat-against-a-nighttime-cityscape-backdrop-lo-fi-style-continuous-loop-free-video.jpg"
              alt=""
              className="w-[95%] rounded-xl"
            />

            <div className="bg-white absolute bottom-[-1.75rem] right-[-0.5rem] rounded-md py-3 px-4 shadow-xl">
              <h3 className="text-base purpleTitle flex justify-start items-center gap-1">Powered By AI <BsStars /></h3>
              <p className="text-sm subText">High-quality lofi conversion</p>
            </div>
          </div>
        </section>

        {/* Main Workflow Container */}
        {/* <WorkflowContainer /> */}

        {/* Process */}
        <Process/>

        {/* Features */}
        <Features />
      </main>

      <Footer />
    </>
  );
};

export default Home;
