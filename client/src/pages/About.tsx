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
import { FaLinkedin } from "react-icons/fa6";
import { FaGithubSquare } from "react-icons/fa";
import { FaInstagramSquare } from "react-icons/fa";

const About: FC = () => {
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
            <h2 className="font-poppins font-bold text-2xl md:text-5xl mb-4 md:text-left text-center">
              What is <span className="purpleTitle">LoFi-fy?</span>
            </h2>
            <p className="subText max-w-2xl md:text-lg text-sm mx-auto mb-5 md:text-left text-center">
              LoFify is a web-based platform that transforms your ordinary
              videos into soothing lofi experiences using AI-generated audio.
              Whether you're a content creator, student, or someone who enjoys
              ambient aesthetics, LoFify helps you effortlessly remix your
              visuals with custom lofi soundtracks — no editing skills required.
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

          <div className="md:w-1/2 w-[92%] md:mt-0 mt-10 flex justify-center items-center rounded-xl relative">
            <img
              src="https://cdn.pixabay.com/photo/2023/10/10/12/36/lofi-8306349_1280.jpg"
              alt=""
              className="w-[92%] rounded-xl"
            />

            <div className="bg-white absolute bottom-[-1.75rem] right-[-0.5rem] rounded-md py-3 px-4 shadow-xl AI">
              <h3 className="text-base purpleTitle flex justify-start items-center gap-1">
                Powered By AI <BsStars />
              </h3>
              <p className="text-sm subText">High-quality lofi conversion</p>
            </div>
          </div>
        </section>

        <section className="pb-12 flex justify-center items-center h-fit md:flex-row flex-col mt-14 mb-24">
          <div className="md:w-1/2 w-full flex justify-center items-center">
            <img src="https://cdn.pixabay.com/photo/2023/06/20/01/30/ai-generated-8075767_1280.jpg" alt="" className="w-[70%] rounded-xl"/>
          </div>

          <div className="md:w-1/2 w-full my-10 flex flex-col justify-center items-start">
            <h2 className="font-poppins font-bold text-2xl md:text-4xl text-center mb-8">
              Under the <span className="purpleTitle">Hood</span>
            </h2>

            <p className="subText my-2 w-[90%]">
              Lorem ipsum dolor, sit amet consectetur adipisicing elit. Error id
              delectus omnis ut molestias consequuntur fugiat quam explicabo
              maxime earum molestiae ullam, quibusdam non saepe. Quos nihil
              maxime illum iste.
            </p>
            <p className="subText my-2 w-[90%]">
              Lorem ipsum dolor, sit amet consectetur adipisicing elit. Error id
              delectus omnis ut molestias consequuntur fugiat quam explicabo
              maxime earum molestiae ullam, quibusdam non saepe. Quos nihil
              maxime illum iste.
            </p>
            <p className="subText my-2 w-[90%]">
              Lorem ipsum dolor, sit amet consectetur adipisicing elit. Error id
              delectus omnis ut molestias consequuntur fugiat quam explicabo
              maxime earum molestiae ullam, quibusdam non saepe. Quos nihil
              maxime illum iste.
            </p>
          </div>
        </section>

        <section className="pb-12 flex justify-center items-center h-fit flex-col" id="team">
          <h2 className="font-poppins font-bold text-2xl md:text-4xl text-center mb-12">
            Meet team <span className="purpleTitle">Rebase</span>
          </h2>

          <div className="flex md:flex-row flex-col justify-center items-center gap-6 mb-6">
            {/* Team Member */}
            <div className="md:w-[45%] w-[90%] px-6 py-4 min-h-[220px] h-fit card flex md:flex-row flex-col gap-4 justify-center items-center">
              <div className="flex justify-center items-center md:w-[100%] w-[70%]">
                <img src="/images/Deep.jpg" alt="" className="rounded-full"/>
              </div>

              <div>
                <h3 className="font-poppins font-bold text-lg md:text-xl mb-1">Deep Mondal</h3>
                <p className="purpleTitle md:text-sm text-xs mb-3">AI/ML Engineer & Music Logic Developer</p>
                <p className="subText md:text-base text-sm">Architected the AI system that analyzes video mood and generates synchronized lofi music. Deep fine-tuned the musical logic for the perfect vibe.</p>

                <div className="flex gap-2 mt-2 text-2xl">
                  <a href="https://www.linkedin.com/in/deep-mondal-268a93242/" target="_blank"><FaLinkedin className="opacity-60 hover:opacity-100 hover:text-purple-700 transition-all duration-200 ease-in-out"/></a>
                  <a href="https://github.com/TakeASwing-420" target="_blank"><FaGithubSquare className="opacity-60 hover:opacity-100 hover:text-purple-700 transition-all duration-200 ease-in-out"/></a>
                  <a href="" target="_blank"><FaInstagramSquare className="opacity-60 hover:opacity-100 hover:text-purple-700 transition-all duration-200 ease-in-out"/></a>
                </div>
              </div>
            </div>

            {/* Team Member */}
            <div className="md:w-[45%] w-[90%] px-6 py-4 min-h-[220px] h-fit card flex md:flex-row flex-col gap-4 justify-center items-center">
              <div className="flex justify-center items-center md:w-[100%] w-[70%]">
                <img src="/images/Arpan.jpg" alt="" className="rounded-full"/>
              </div>

              <div>
                <h3 className="font-poppins font-bold text-lg md:text-xl mb-1">Arpan Mondal</h3>
                <p className="purpleTitle md:text-sm text-xs mb-3">AI/ML Engineer & Backend Developer</p>
                <p className="subText md:text-base text-sm">Developed backend services and managed the integration of AI components. Arpan ensured efficient processing and robust media handling under the hood.</p>

                <div className="flex gap-2 mt-2 text-2xl">
                  <a href="https://www.linkedin.com/in/arpan-mandal-74a0672a2/" target="_blank"><FaLinkedin className="opacity-60 hover:opacity-100 hover:text-purple-700 transition-all duration-200 ease-in-out"/></a>
                  <a href="https://github.com/EnthusiastiCoder" target="_blank"><FaGithubSquare className="opacity-60 hover:opacity-100 hover:text-purple-700 transition-all duration-200 ease-in-out"/></a>
                  <a href="https://www.instagram.com/arpanmandal499/" target="_blank"><FaInstagramSquare className="opacity-60 hover:opacity-100 hover:text-purple-700 transition-all duration-200 ease-in-out"/></a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex md:flex-row flex-col justify-center items-center gap-6">
            {/* Team Member */}
            <div className="md:w-[45%] w-[90%] px-6 py-4 min-h-[220px] h-fit card flex md:flex-row flex-col gap-4 justify-center items-center">
              <div className="flex justify-center items-center md:w-[100%] w-[70%]">
                <img src="/images/Saksham.JPG" alt="" className="rounded-full"/>
              </div>

              <div>
                <h3 className="font-poppins font-bold text-lg md:text-xl mb-1">Saksham Jaiswal</h3>
                <p className="purpleTitle md:text-sm text-xs mb-3">Frontend Developer</p>
                <p className="subText md:text-base text-sm">Built the entire frontend interface with a focus on responsiveness, usability, and aesthetic appeal. Saksham ensured users enjoy a smooth and modern experience from upload to download.</p>

                <div className="flex gap-2 mt-2 text-2xl">
                  <a href="https://www.linkedin.com/in/saksham-jaiswal-220637302/" target="_blank"><FaLinkedin className="opacity-60 hover:opacity-100 hover:text-purple-700 transition-all duration-200 ease-in-out"/></a>
                  <a href="https://github.com/Saksham-Jaiswal-2004" target="_blank"><FaGithubSquare className="opacity-60 hover:opacity-100 hover:text-purple-700 transition-all duration-200 ease-in-out"/></a>
                  <a href="https://www.instagram.com/saksham__jaiswal" target="_blank"><FaInstagramSquare className="opacity-60 hover:opacity-100 hover:text-purple-700 transition-all duration-200 ease-in-out"/></a>
                </div>
              </div>
            </div>

            {/* Team Member */}
            <div className="md:w-[45%] w-[90%] px-6 py-4 min-h-[220px] h-fit card flex md:flex-row flex-col gap-4 justify-center items-center">
              <div className="flex justify-center items-center md:w-[100%] w-[70%]">
                <img src="/images/Arup.jpg" alt="" className="rounded-full"/>
              </div>

              <div>
                <h3 className="font-poppins font-bold text-lg md:text-xl mb-1">Arup Matabber</h3>
                <p className="purpleTitle md:text-sm text-xs mb-3">UI/UX Designer & Research Strategist</p>
                <p className="subText md:text-base text-sm">Led the design and user experience strategy. Arup crafted clean, intuitive flows and ensured every interaction felt effortless and intentional.</p>

                <div className="flex gap-2 mt-2 text-2xl">
                  <a href="https://www.linkedin.com/in/arup-matabber/" target="_blank"><FaLinkedin className="opacity-60 hover:opacity-100 hover:text-purple-700 transition-all duration-200 ease-in-out"/></a>
                  <a href="https://github.com/arup-matabber" target="_blank"><FaGithubSquare className="opacity-60 hover:opacity-100 hover:text-purple-700 transition-all duration-200 ease-in-out"/></a>
                  <a href="https://www.instagram.com/_arup.18_/" target="_blank"><FaInstagramSquare className="opacity-60 hover:opacity-100 hover:text-purple-700 transition-all duration-200 ease-in-out"/></a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CTA/>
      </main>

      <Footer />
    </>
  );
};

export default About;
