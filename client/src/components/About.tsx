import React from "react";

const About = () => {
  return (
    <section className="pb-12 flex justify-center items-center h-fit md:flex-row flex-col mt-[14rem] mb-24">
      <div className="md:w-1/2 w-full flex justify-center items-center">
        <img
          src="https://cdn.pixabay.com/photo/2023/06/20/01/30/ai-generated-8075767_1280.jpg"
          alt=""
          className="w-[70%] rounded-xl"
        />
      </div>

      <div className="md:w-1/2 w-full my-10 flex flex-col justify-center items-start">
        <h2 className="font-poppins font-bold text-2xl md:text-4xl text-center mb-8">
          Under the <span className="purpleTitle">Hood</span>
        </h2>

        <p className="subText my-2 w-[90%]">
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Error id
          delectus omnis ut molestias consequuntur fugiat quam explicabo maxime
          earum molestiae ullam, quibusdam non saepe. Quos nihil maxime illum
          iste.
        </p>
        <p className="subText my-2 w-[90%]">
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Error id
          delectus omnis ut molestias consequuntur fugiat quam explicabo maxime
          earum molestiae ullam, quibusdam non saepe. Quos nihil maxime illum
          iste.
        </p>
        <p className="subText my-2 w-[90%]">
          Lorem ipsum dolor, sit amet consectetur adipisicing elit. Error id
          delectus omnis ut molestias consequuntur fugiat quam explicabo maxime
          earum molestiae ullam, quibusdam non saepe. Quos nihil maxime illum
          iste.
        </p>
      </div>
    </section>
  );
};

export default About;
