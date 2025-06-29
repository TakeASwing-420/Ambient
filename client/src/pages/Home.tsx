import { FC } from "react";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Features from "@/components/Features";
import { GoArrowRight } from "react-icons/go";
import { BsStars } from "react-icons/bs";
import { PiWaveform } from "react-icons/pi";
import { MdBolt } from "react-icons/md";
import { IoMoonSharp } from "react-icons/io5";
import Process from "@/components/Process";
import { Link } from "wouter";
import CTA from "@/components/CTA";
import About from "@/components/About";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/all";
import PicGrid from "@/components/PicGrid";

gsap.registerPlugin(ScrollTrigger);

const Home: FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useGSAP(() => {
    const initialClip = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
    const targetClip = "polygon(14% 0%, 72% 0%, 85% 85%, 0% 100%)";
    // const targetClip = 'polygon(40% 40%, 60% 40%, 60% 60%,40% 60%)';

    gsap.set("#img-frame", {
      clipPath: targetClip,
      borderRadius: "0% 0% 40% 10%",
    });

    gsap.from("#img-frame", {
      clipPath: initialClip,
      borderRadius: "0 0 0 0",
      ease: "power2.inOut",
      scrollTrigger: {
        trigger: "#img-frame",
        start: "center center",
        end: "bottom center",
        scrub: true,
      },
    });
  });

  return (
    <>
      <Header />

      {/* <main className="max-w-7xl mx-auto mt-20 md:px-4 px-2 sm:px-6 lg:px-8 py-8 bg-purple-50 min-h-screen h-fit home"> */}
      <main className="max-w-7xl mx-auto mt-20 bg-purple-50 min-h-screen h-fit home px-0 pb-6">
        {/* Hero */}
        <section
          className="relative pb-12 flex justify-center items-center min-h-[75vh] h-fit md:flex-row flex-col hero px-8 mask-clip-path"
          id="img-frame"
        >
          <video
            src="/sound/heroSection.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover z-[-1] pointer-events-none"
          ></video>

          <div className="absolute inset-0 bg-black/50 z-0"></div>

          <div className="w-[95%] z-[1] md:mt-0 mt-8 p-1 flex flex-col justify-center items-center text-left">
            <h2 className="font-poppins font-bold text-2xl md:text-5xl mb-1 md:text-left text-center">
              Transform Your Videos and Images
            </h2>
            <h2 className="font-poppins font-bold text-2xl md:text-5xl mb-5 purpleTitle">
              into Chill LoFi Beats
            </h2>
            <p className="subText max-w-2xl md:text-lg text-sm mb-5 text-center">
              Upload your video and let our tool generate relaxing lofi beats
              tailored to your visuals. Download the remixed video or just the
              vibe.
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
        </section>

        <div className="bg-white animate-float-fast z-[1] absolute top-[12rem] right-[5rem] rounded-md py-3 px-4 shadow-xl AI">
          <h3 className="text-base purpleTitle flex justify-start items-center gap-1">
            Powered By AI <BsStars />
          </h3>
          {/* <p className="text-sm subText">High-quality lofi conversion</p> */}
        </div>

        <div className="bg-white animate-float-fast z-[1] absolute bottom-[2rem] left-[18rem] rounded-md py-3 px-4 shadow-xl AI">
          <h3 className="text-base purpleTitle flex justify-start items-center gap-1">
            High-Quality LoFi Conversion <PiWaveform />
          </h3>
          {/* <p className="text-sm subText">High-quality lofi conversion</p> */}
        </div>

        <div className="bg-white animate-float-slow z-[1] absolute bottom-[8rem] right-[12rem] rounded-md py-3 px-4 shadow-xl AI">
          <h3 className="text-base purpleTitle flex justify-start items-center gap-1">
            Instant Download <MdBolt />
          </h3>
          {/* <p className="text-sm subText">High-quality lofi conversion</p> */}
        </div>

        <div className="bg-white animate-float-slow z-[1] absolute top-[8rem] left-[6rem] rounded-md py-3 px-4 shadow-xl AI">
          <h3 className="text-base purpleTitle flex justify-start items-center gap-1">
            No Noise, Just LoFi <IoMoonSharp />
          </h3>
          {/* <p className="text-sm subText">High-quality lofi conversion</p> */}
        </div>

        {/* Main Workflow Container */}
        {/* <WorkflowContainer /> */}

        {/* Process */}
        <Process />

        {/* Pics Grid */}
        <PicGrid />

        {/* Features */}
        <Features />

        {/* About */}
        <About />

        {/* CTA */}
        <CTA />
      </main>

      <Footer />
    </>
  );
};

export default Home;
