import colors from "@/app/color/color";
import Image from "next/image";
import { FaQuoteLeft } from "react-icons/fa";

export default function TestimonialCard({
  clientName,
  clientImg,
  clientRole,
  clientQuote,
}: {
  clientName: string;
  clientImg: string;
  clientRole: string;
  clientQuote: string;
}) {
  return (
    <div
      className={`w-full mx-auto p-8 rounded-2xl hover:cursor-pointer border-[1px] flex flex-col justify-between relative ${colors.keyBorder} bg-[#ffffff] dark:bg-[#000000] hover:bg-[#fafafa] dark:hover:bg-[#060606] text-[#aaaaaa] dark:text-[#eeeeee]`}
    >
      <div className="flex flex-col flex-grow">
        {/* Quote Icon */}
        <FaQuoteLeft
          className={`text-xl mb-4 text-[#666666] dark:text-[#aaaaaa]`}
        />

        {/* Quote Text */}
        <p
          className={`lg:text-md text-sm leading-relaxed text-justify mb-6 text-[#666666] dark:text-[#aaaaaa]`}
        >
          {clientQuote}
        </p>
      </div>

      {/* Author Section - Pinned to Bottom */}
      <div className="flex items-center gap-4 mt-auto">
        <div className="relative w-12 h-12 rounded-lg overflow-hidden">
          <Image
            src={clientImg}
            alt={clientName}
            width={50}
            height={50}
            className="object-cover"
          />
        </div>
        <div>
          <h3
            className={`font-semibold lg:text-md text-sm text-[#333333] dark:text-[#dddddd]`}
          >
            {clientName}
          </h3>
          <p className={`text-sm text-[#666666] dark:text-[#aaaaaa]`}>
            {clientRole}
          </p>
        </div>
      </div>
    </div>
  );
}
