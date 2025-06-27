import { FC } from "react";
import { FaVideo } from "react-icons/fa6";
import { BsSliders2Vertical } from "react-icons/bs";
import { FiDownload } from "react-icons/fi";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";

gsap.registerPlugin(ScrollTrigger);

const Process: FC = () => {
  useGSAP(() => {
    const clipAnimation = gsap.timeline({
      scrollTrigger: {
        trigger: "#clip",
        start: "+=200 center",
        end: "bottom center",
        // scrub: 0.5,
        scrub: true,
        pin: true,
        pinSpacing: true,
      },
    });

    clipAnimation.to(".mask-clip-path", {
      // clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
      clipPath: "polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%)",
      width: "100%",
      height: "85vh",
      borderRadius: "0",
      ease: "power1.inOut",
    });
  });

  return (
    <section className="mt-40 min-h-[95vh] flex flex-col justify-center items-center h-fit relative">
      <h1 className="md:text-5xl text-2xl font-poppins font-bold mb-20">Enter the world of <span className="purpleTitle">LoFi-fy</span></h1>

      <div className="h-dvh w-full" id="clip">
        <div className="mask-clip-path absolute left-1/2 top-0 z-20 h-[60vh] w-full origin-center -translate-x-1/2 overflow-hidden rounded-3xl md:w-[30vw]">
          <img
            src="https://static.vecteezy.com/system/resources/thumbnails/040/983/192/small_2x/ai-generated-an-animated-scene-featuring-a-girl-with-wine-and-a-cat-against-a-nighttime-cityscape-backdrop-lo-fi-style-continuous-loop-free-video.jpg"
            alt=""
            className="absolute left-0 top-0 size-full object-cover"
          />
        </div>
      </div>

      <div className="w-full">
        <h2 className="purpleTitle font-poppins font-bold text-2xl md:text-4xl text-left mb-2">
          How It Works
        </h2>
        <p className="subText text-left w-[65%] mb-12">
          From upload to AI-generated lofi vibes in just three simple steps.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 px-2">
        <div className="card flex flex-col items-center p-6 shadow-md hover:shadow-lg">
          <div className="w-20 h-20 p-1 bg-purple-600 bg-opacity-10 rounded-full flex items-center justify-center mb-4">
            <FaVideo className="text-3xl purpleTitle bounce-pop" />
          </div>
          <h3 className="font-poppins font-semibold text-lg mb-2">
            Upload Video
          </h3>
          <p className="subText text-center">
            Select and upload your video — we support all common formats for
            quick and seamless processing.
          </p>
        </div>

        <div className="card flex flex-col items-center p-6 shadow-md hover:shadow-lg">
          <div className="w-20 h-20 p-1 bg-purple-600 bg-opacity-10 rounded-full flex items-center justify-center mb-4">
            <BsSliders2Vertical className="text-3xl bounce-pop" />
          </div>
          <h3 className="font-poppins font-semibold text-lg mb-2">
            AI Generates Lofi Audio
          </h3>
          <p className="subText text-center">
            Our AI analyzes the video&apos;s mood and crafts a unique lofi beat
            that fits the vibe.
          </p>
        </div>

        <div className="card flex flex-col items-center p-6 shadow-md hover:shadow-lg">
          <div className="w-20 h-20 p-1 bg-purple-600 bg-opacity-10 rounded-full flex items-center justify-center mb-4">
            <FiDownload className="text-3xl purpleTitle bounce-pop" />
          </div>
          <h3 className="font-poppins font-semibold text-lg mb-2">
            Preview & Download
          </h3>
          <p className="subText text-center">
            Instantly preview your enhanced video or download the remixed
            version or standalone lofi audio track.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Process;
