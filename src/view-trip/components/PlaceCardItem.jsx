import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

function PlaceCardItem({ place }) {
  const [photoUrl, setPhotoUrl] = useState();

  const GetPlacePhoto = useCallback(async () => {
    const query = place?.placeName;
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
      console.error("Error fetching place photo:", error);
      setPhotoUrl("/placeholder.jpg");
    }
  }, [place?.placeName]);

  useEffect(() => {
    if (place) {
      GetPlacePhoto();
    }
  }, [place, GetPlacePhoto]);

  return (
    <div className="flex gap-5 p-3 mt-2 transition-all border cursor-pointer rounded-xl hover:scale-105 hover:shadow-md">
      <img
        src={photoUrl || "/placeholder.jpg"}
        className="w-[130px] h-[130px] rounded-xl object-cover"
        alt={place?.placeName}
      />
      <div className="flex-1">
        <h2 className="text-lg font-bold">{place?.placeName}</h2>
        <p className="text-sm text-gray-400">{place?.placeDetails}</p>
        <h2 className="flex items-center gap-2 text-sm text-black">
          <img
            src="https://em-content.zobj.net/source/whatsapp/401/ticket_1f3ab.png"
            width={15}
            alt="Ticket icon"
          />
          {place?.ticketPricing}
        </h2>
        <h2 className="flex items-center gap-2 text-sm text-black">
          <img
            src="https://em-content.zobj.net/source/samsung/405/ten-oclock_1f559.png"
            width={15}
            alt="Time icon"
          />
          {place?.timeTravel}
        </h2>
        <iframe
          src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(place?.placeName)}`}
          width="100%"
          height="150"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="mt-2 rounded"
        ></iframe>
      </div>
    </div>
  );
}

PlaceCardItem.propTypes = {
  place: PropTypes.shape({
    placeName: PropTypes.string.isRequired,
    placeDetails: PropTypes.string,
    ticketPricing: PropTypes.string,
    timeTravel: PropTypes.string,
  }).isRequired,
};

export default PlaceCardItem;
