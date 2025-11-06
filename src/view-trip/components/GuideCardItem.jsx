import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

function GuideCardItem({ guide }) {
  const [photoUrl, setPhotoUrl] = useState();

  useEffect(() => {
    if (guide) {
      GetPlacePhoto();
    }
  }, [guide]);

  const GetPlacePhoto = async () => {
    const query = guide?.guideName;
    if (!query) return;

    try {
      const res = await axios.get(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
        {
          headers: {
            Authorization: import.meta.env.VITE_PEXELS_API_KEY,
          },
        }
      );

      if (res.data.photos && res.data.photos.length > 0) {
        setPhotoUrl(res.data.photos[0].src.landscape);
      } else {
        setPhotoUrl("/placeholder.jpg");
      }
    } catch (error) {
      console.error("Error fetching photo from Pexels:", error);
      setPhotoUrl("/placeholder.jpg");
    }
  };

  return (
    <div className="flex gap-5 p-3 mt-2 transition-all border cursor-pointer rounded-xl hover:scale-105 hover:shadow-md">
      <img
        src={photoUrl || "/placeholder.jpg"}
        className="w-[130px] h-[130px] rounded-xl object-cover"
        alt={guide?.guideName}
      />
      <div className="flex-1">
        <h2 className="text-lg font-bold">{guide?.guideName}</h2>
        <p className="text-sm text-gray-400">{guide?.guideDescription}</p>
        <h2 className="flex items-center gap-2 text-sm text-black">
          <img
            src="https://em-content.zobj.net/source/whatsapp/401/ticket_1f3ab.png"
            width={15}
            alt="Contact icon"
          />
          {guide?.guideContact}
        </h2>
        <h2 className="flex items-center gap-2 text-sm text-black">
          <img
            src="https://em-content.zobj.net/source/samsung/405/star_2b50.png"
            width={15}
            alt="Rating icon"
          />
          {guide?.guideRating}
        </h2>
        <h2 className="flex items-center gap-2 text-sm text-black">
          <img
            src="https://em-content.zobj.net/source/huawei/375/money-bag_1f4b0.png"
            width={15}
            alt="Price icon"
          />
          {guide?.guidePrice}
        </h2>
      </div>
    </div>
  );
}

GuideCardItem.propTypes = {
  guide: PropTypes.shape({
    guideName: PropTypes.string.isRequired,
    guideDescription: PropTypes.string,
    guideContact: PropTypes.string,
    guideRating: PropTypes.string,
    guidePrice: PropTypes.string,
  }).isRequired,
};

export default GuideCardItem;
