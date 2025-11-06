import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from 'axios';

function RestaurantCardItem({ restaurant }) {
  const [photoUrl, setPhotoUrl] = useState();

  useEffect(() => {
    if (restaurant) {
      if (restaurant.restaurantImageUrl && restaurant.restaurantImageUrl !== '') {
        setPhotoUrl(restaurant.restaurantImageUrl);
      } else {
        GetPlacePhoto();
      }
    }
  }, [restaurant]);

  const GetPlacePhoto = async () => {
    const query = restaurant?.name || restaurant?.restaurantName;
    if (!query) return;

    try {
      const res = await axios.get(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query + ' restaurant')}&per_page=1`,
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
    <Link
      to={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant?.name || restaurant?.restaurantName + "," + (restaurant?.vicinity || restaurant?.restaurantAddress))}`}
      target="_blank"
    >
      <div className="transition-all cursor-pointer hover:scale-105">
        <img
          src={photoUrl || "/placeholder.jpg"}
          className="rounded-xl h-[180px] w-full object-cover"
          alt={restaurant?.name || restaurant?.restaurantName}
        />
        <div className="flex flex-col gap-2 my-3">
          <h2 className="font-medium text-black">{restaurant?.name || restaurant?.restaurantName}</h2>
          <h2 className="flex items-center gap-2 text-xs text-gray-600">
            <img
              src="https://em-content.zobj.net/source/apple/391/round-pushpin_1f4cd.png"
              width={15}
              alt="Address icon"
            />
            {restaurant?.vicinity || restaurant?.restaurantAddress}
          </h2>
          <h2 className="flex items-center gap-2 text-xs text-black">
            <img
              src="https://em-content.zobj.net/source/huawei/375/money-bag_1f4b0.png"
              width={15}
              alt="Price icon"
            />
            {restaurant?.price_level ? '$'.repeat(restaurant.price_level) : 'Price not available'}
          </h2>
          <h2 className="flex items-center gap-2 text-xs text-black">
            <img
              src="https://em-content.zobj.net/source/samsung/405/star_2b50.png"
              width={15}
              alt="Rating icon"
            />
            {restaurant?.rating || 'N/A'}
          </h2>
        </div>
      </div>
    </Link>
  );
}

RestaurantCardItem.propTypes = {
  restaurant: PropTypes.shape({
    name: PropTypes.string,
    restaurantName: PropTypes.string,
    vicinity: PropTypes.string,
    restaurantAddress: PropTypes.string,
    price_level: PropTypes.number,
    rating: PropTypes.number,
    restaurantImageUrl: PropTypes.string,
  }).isRequired,
};

export default RestaurantCardItem;
