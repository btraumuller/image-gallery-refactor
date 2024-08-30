import Image from "next/image";
import ImageGallery from "./components/imageGallery/imageGallery"

export default function Home() {
  return (
    <div className="max-w-screen-xl mx-auto flex flex-col p-4">
            <ImageGallery />
    </div>
  );
}
