import React from 'react'
import { FC } from "react";

const PicGrid: FC = () => {
  return (
    <div className='w-full overflow-hidden h-fit flex md:flex-row flex-col gap-4 justify-center items-center md:mt-0 mt-10'>
      <div className='md:w-[45%] w-full h-full flex flex-col items-end gap-4'>
        <img src="https://cdn.leonardo.ai/users/3d0492f3-4379-4545-9162-2c7ab59d1d3a/generations/9e864938-ae79-488d-b942-63708a95b4a1/Leonardo_Anime_XL_Lofi_musicrelated_images_for_my_dark_website_0.jpg" alt="" className='w-[38%] animatePic' /> {/* Long */}
         <img src="https://cdn.leonardo.ai/users/3d0492f3-4379-4545-9162-2c7ab59d1d3a/generations/84923f4d-79f7-419f-80fa-025a92b6eeac/Leonardo_Anime_XL_Lofi_musicrelated_images_for_my_dark_website_0.jpg" alt="" className='w-[80%] animatePic' /> {/* Wide */}
      </div>

      <div className='md:w-[45%] w-full h-full flex flex-col md:mt-[250px] mt-0 gap-4'>
        <img src="https://cdn.leonardo.ai/users/3d0492f3-4379-4545-9162-2c7ab59d1d3a/generations/84923f4d-79f7-419f-80fa-025a92b6eeac/Leonardo_Anime_XL_Lofi_musicrelated_images_for_my_dark_website_2.jpg" alt="" className='w-[80%] animatePic' /> {/* Wide */}
        <img src="https://cdn.leonardo.ai/users/3d0492f3-4379-4545-9162-2c7ab59d1d3a/generations/9e864938-ae79-488d-b942-63708a95b4a1/Leonardo_Anime_XL_Lofi_musicrelated_images_for_my_dark_website_1.jpg" alt="" className='w-[38%] animatePic' /> {/* Long */}
      </div>
    </div>
  )
}

export default PicGrid
