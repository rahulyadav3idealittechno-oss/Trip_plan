import { useState } from 'react';
import LocationSearchInput from '../components/custom/LocationSearchInput';
import { Button } from '../components/ui/button';
import { getNearbyHotels, getNearbyRestaurants, getNearbyGuides, getNearbyPlaces, getPlacePhotoFromPexels } from '../service/GlobalApi';
import { chatSession } from '../service/AIModel';
import { toast } from 'sonner';

function Explore() {
  const [location, setLocation] = useState(null);
  const [exploreData, setExploreData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('hotels');

  const handleHotelBooking = async (hotel) => {
    // Use Booking.com URL for booking
    const searchQuery = encodeURIComponent(`${hotel.hotelName} ${hotel.hotelAddress}`);
    const bookingUrl = `https://www.booking.com/search.html?ss=${searchQuery}`;
    window.open(bookingUrl, '_blank');
    toast.success('Opening Booking.com...');
  };

  const handleExplore = async () => {
    if (!location) {
      toast("Please select a location first.");
      return;
    }

    setLoading(true);
    try {
      const lat = location.lat;
      const lng = location.lon;
      const locationName = location.display_name;

      let hotelData, restaurantData, guideData, placesData = [];

      // Fetch hotels
      try {
        console.log('Fetching hotels...');
        hotelData = await getNearbyHotels(lat, lng);
        console.log('Hotels fetched successfully');
      } catch (hotelError) {
        console.error('Hotel fetch error:', hotelError);
        toast('Hotel data unavailable');
        hotelData = { data: [] };
      }

      // Fetch restaurants
      try {
        console.log('Fetching restaurants...');
        restaurantData = await getNearbyRestaurants(lat, lng);
        console.log('Restaurants fetched successfully');
      } catch (restaurantError) {
        console.error('Restaurant fetch error:', restaurantError);
        // Fallback to AI-generated restaurant data
        try {
          const restaurantPrompt = `Generate 6-8 diverse restaurant recommendations for ${locationName} including various cuisines like local food, breakfast places, cafes, fine dining, street food, and international options. Each restaurant should have: name, vicinity (realistic address in ${locationName}), price_level (1-4 where 1 is cheap, 4 is expensive), rating (3.5-5.0), geometry: {location: {lat: (realistic latitude near ${lat}), lng: (realistic longitude near ${lng})}}. Return only valid JSON format with "data": {"results": [...]}, no markdown or code blocks.`;
          const restaurantResult = await chatSession.sendMessage(restaurantPrompt);
          let restaurantText = restaurantResult.response.text();

          // Clean up the response to remove markdown code blocks if present
          restaurantText = restaurantText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();

          const restaurantJson = JSON.parse(restaurantText);
          restaurantData = restaurantJson;
          console.log('AI-generated restaurants used as fallback');
        } catch (aiError) {
          console.error('AI restaurant fallback failed:', aiError);
          toast('Restaurant data unavailable');
          restaurantData = { data: { results: [] } };
        }
      }

      // Fetch places using Google Places API
      try {
        console.log('Fetching places...');
        const placesDataResponse = await getNearbyPlaces(lat, lng);
        placesData = placesDataResponse.data.results || [];
        console.log('Places fetched successfully');
      } catch (placesError) {
        console.error('Places fetch error:', placesError);
        // Fallback to AI-generated places data
        try {
          const placesPrompt = `Generate 6-8 tourist attraction recommendations for ${locationName} with name, vicinity (realistic address), rating (3.5-5.0), geometry: {location: {lat: (realistic latitude near ${lat}), lng: (realistic longitude near ${lng})}}. Return only valid JSON format with "data": {"results": [...]}, no markdown or code blocks.`;
          const placesResult = await chatSession.sendMessage(placesPrompt);
          let placesText = placesResult.response.text();

          // Clean up the response to remove markdown code blocks if present
          placesText = placesText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();

          const placesJson = JSON.parse(placesText);
          placesData = placesJson.data.results || [];
          console.log('AI-generated places used as fallback');
        } catch (aiError) {
          console.error('AI places fallback failed:', aiError);
          toast('Places data unavailable');
          placesData = [];
        }
      }

      // Fetch guides
      try {
        console.log('Fetching guides...');
        guideData = await getNearbyGuides(lat, lng, locationName);
        console.log('Guides fetched successfully');
      } catch (guideError) {
        console.error('Guide fetch error:', guideError);
        toast('Guide data unavailable');
        guideData = { guides: [] };
      }

      // Format data
      const formattedHotels = hotelData.data.slice(0, 8).map(hotel => ({
        hotelName: hotel.name || 'Unknown Hotel',
        hotelAddress: hotel.address?.lines?.join(', ') + ', ' + hotel.address?.cityName + ', ' + hotel.address?.countryCode || 'Address not available',
        price: 'Contact hotel for pricing',
        hotelImageUrl: '',
        geoCoordinates: `${hotel.geoCode?.latitude}° N, ${hotel.geoCode?.longitude}° W`,
        rating: 'N/A',
        description: 'Hotel near your destination',
        hotelId: hotel.hotelId || hotel.dupeId || (hotel.chainCode && hotel.iuCode ? hotel.chainCode + hotel.iuCode : null) || 'N/A'
      }));

      const formattedRestaurants = restaurantData.data.results.slice(0, 8).map(restaurant => ({
        restaurantName: restaurant.name || restaurant.restaurantName,
        restaurantAddress: restaurant.vicinity || restaurant.restaurantAddress,
        price_level: restaurant.price_level,
        rating: restaurant.rating,
        restaurantImageUrl: '',
        geometry: restaurant.geometry
      }));

      const formattedGuides = guideData.guides ? guideData.guides.slice(0, 8) : [];

      const formattedPlaces = placesData.slice(0, 8).map(place => ({
        placeName: place.name || 'Unknown Place',
        placeDetails: place.vicinity || `Tourist attraction in ${locationName}`,
        placeImageUrl: '',
        geoCoordinates: `${place.geometry?.location?.lat}° N, ${place.geometry?.location?.lng}° W`,
        ticketPricing: 'Varies',
        rating: place.rating || '4.0',
        timeTravel: 'Check maps',
        geometry: place.geometry
      }));

      // Fetch real Pexels images with iteration
      const fetchPexelsImages = async () => {
        const imagePromises = [];

        // Hotels images - fetch real Pexels images with AI Unsplash fallback
        formattedHotels.forEach(hotel => {
          imagePromises.push(
            getPlacePhotoFromPexels(hotel.hotelName + ' hotel')
              .then(response => {
                if (response.data.photos && response.data.photos.length > 0) {
                  hotel.hotelImageUrl = response.data.photos[0].src.medium || response.data.photos[0].src.landscape;
                }
              })
              .catch(() => {
                // AI-generated fallback using Unsplash
                hotel.hotelImageUrl = `https://source.unsplash.com/featured/?${encodeURIComponent(hotel.hotelName + ' hotel')}`;
              })
          );
        });

        // Restaurants images - fetch real Pexels images with AI Unsplash fallback
        formattedRestaurants.forEach(restaurant => {
          imagePromises.push(
            getPlacePhotoFromPexels(restaurant.restaurantName + ' restaurant')
              .then(response => {
                if (response.data.photos && response.data.photos.length > 0) {
                  restaurant.restaurantImageUrl = response.data.photos[0].src.medium || response.data.photos[0].src.landscape;
                }
              })
              .catch(() => {
                // AI-generated fallback using Unsplash
                restaurant.restaurantImageUrl = `https://source.unsplash.com/featured/?${encodeURIComponent(restaurant.restaurantName + ' restaurant')}`;
              })
          );
        });

        // Places images - fetch real Pexels images with AI Unsplash fallback
        formattedPlaces.forEach(place => {
          imagePromises.push(
            getPlacePhotoFromPexels(place.placeName + ' landmark')
              .then(response => {
                if (response.data.photos && response.data.photos.length > 0) {
                  place.placeImageUrl = response.data.photos[0].src.medium || response.data.photos[0].src.landscape;
                }
              })
              .catch(() => {
                // AI-generated fallback using Unsplash
                place.placeImageUrl = `https://source.unsplash.com/featured/?${encodeURIComponent(place.placeName + ' landmark')}`;
              })
          );
        });

        // Guides images - fetch real Pexels images with AI Unsplash fallback
        formattedGuides.forEach(guide => {
          imagePromises.push(
            getPlacePhotoFromPexels(guide.guideName + ' guide')
              .then(response => {
                if (response.data.photos && response.data.photos.length > 0) {
                  guide.guideImageUrl = response.data.photos[0].src.medium || response.data.photos[0].src.landscape;
                }
              })
              .catch(() => {
                // AI-generated fallback using Unsplash
                guide.guideImageUrl = `https://source.unsplash.com/featured/?${encodeURIComponent(guide.guideName + ' guide')}`;
              })
          );
        });

        try {
          await Promise.all(imagePromises);
          console.log('All Pexels images fetched successfully');
        } catch (imageError) {
          console.error('Error fetching some Pexels images:', imageError);
        }
      };

      await fetchPexelsImages();

      setExploreData({
        hotelOptions: formattedHotels,
        restaurantOptions: formattedRestaurants,
        guideOptions: formattedGuides,
        places: formattedPlaces
      });

    } catch (error) {
      console.error('Unexpected error in explore data fetching:', error);
      toast("Failed to load explore data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'hotels', label: 'Stays', icon: '🏨' },
    { id: 'restaurants', label: 'Restaurants', icon: '🍽️' },
    { id: 'places', label: 'Places', icon: '📍' },
    { id: 'guides', label: 'Guides', icon: '👥' }
  ];

  return (
    <div className='min-h-screen bg-gray-50 overflow-y-auto'>
      {/* Header */}
      <div className='bg-white shadow-sm border-b'>
        <div className='p-4 sm:p-6 md:px-8 lg:px-20 xl:px-32 2xl:px-44'>
          <h1 className='text-2xl sm:text-3xl font-bold text-gray-800 mb-2'>Explore {location ? location.display_name : 'Destinations'}</h1>
          <p className='text-gray-600 text-sm sm:text-base'>Discover amazing places to stay, eat, visit, and get guided tours</p>
        </div>
      </div>

      {/* Location Selector */}
      <div className='bg-white p-4 sm:p-6 md:px-8 lg:px-20 xl:px-32 2xl:px-44 border-b'>
        <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center'>
          <div className='flex-1 w-full'>
            <LocationSearchInput
              onSelect={(place) => setLocation(place)}
            />
          </div>
          <Button
            onClick={handleExplore}
            disabled={loading}
            className='w-full sm:w-auto px-6 sm:px-8 py-2 bg-blue-600 hover:bg-blue-700 text-sm sm:text-base'
          >
            {loading ? 'Exploring...' : 'Explore This Location'}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      {exploreData && (
        <div className='bg-white border-b sticky top-0 z-40'>
          <div className='p-4 sm:p-6 md:px-8 lg:px-20 xl:px-32 2xl:px-44'>
            <div className='flex space-x-1 overflow-x-auto scrollbar-hide'>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className='p-4 sm:p-6 md:px-8 lg:px-20 xl:px-32 2xl:px-44 pb-20'>
        {exploreData && (
          <div className='max-w-7xl mx-auto'>
            {activeTab === 'hotels' && (
              <div>
                <h2 className='text-2xl font-bold mb-6'>🏨 Places to Stay</h2>
                {exploreData.hotelOptions.length > 0 ? (
                  <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'>
                    {exploreData.hotelOptions.map((hotel, index) => (
                      <div key={index} className='bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow'>
                        <img
                          src={hotel.hotelImageUrl || "/placeholder.jpg"}
                          alt={hotel.hotelName}
                          className='w-full h-32 sm:h-40 md:h-48 object-cover'
                        />
                        <div className='p-3 sm:p-4'>
                          <h3 className='font-bold text-base sm:text-lg mb-2 line-clamp-2'>{hotel.hotelName}</h3>
                          <p className='text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2'>{hotel.hotelAddress}</p>
                          <div className='flex justify-between items-center mb-3'>
                            <span className='text-green-600 font-semibold text-xs sm:text-sm'>{hotel.price}</span>
                            <span className='text-yellow-500 text-xs sm:text-sm'>⭐ {hotel.rating}</span>
                          </div>
                          <div className='flex flex-col sm:flex-row gap-2'>
                            <button
                              className='flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm'
                              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.hotelName + "," + hotel.hotelAddress)}`, '_blank')}
                            >
                              View on Map
                            </button>
                            <button
                              className='flex-1 bg-green-500 text-white py-2 px-3 rounded-lg hover:bg-green-600 transition-colors text-xs sm:text-sm'
                              onClick={() => handleHotelBooking(hotel)}
                            >
                              Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-12'>
                    <p className='text-gray-500 text-lg'>No hotel data available for this location.</p>
                    <p className='text-gray-400 text-sm mt-2'>Try selecting a different location or check back later.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'restaurants' && (
              <div>
                <h2 className='text-xl sm:text-2xl font-bold mb-4 sm:mb-6'>🍽️ Restaurants</h2>
                {exploreData.restaurantOptions.length > 0 ? (
                  <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'>
                    {exploreData.restaurantOptions.map((restaurant, index) => (
                      <div key={index} className='bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow'>
                        <img
                          src={restaurant.restaurantImageUrl || "/placeholder.jpg"}
                          alt={restaurant.restaurantName}
                          className='w-full h-32 sm:h-40 md:h-48 object-cover'
                        />
                        <div className='p-3 sm:p-4'>
                          <h3 className='font-bold text-base sm:text-lg mb-2 line-clamp-2'>{restaurant.restaurantName}</h3>
                          <p className='text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2'>{restaurant.restaurantAddress}</p>
                          <div className='flex items-center justify-between mb-2'>
                            <span className='text-green-600 font-semibold text-xs sm:text-sm'>{'$'.repeat(restaurant.price_level || 1)}</span>
                            <span className='text-yellow-500 text-xs sm:text-sm'>⭐ {restaurant.rating || 'N/A'}</span>
                          </div>
                          {restaurant.geometry && restaurant.geometry.location && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${restaurant.geometry.location.lat},${restaurant.geometry.location.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className='inline-block text-blue-600 text-xs sm:text-sm hover:text-blue-800'
                            >
                              📍 View on Map
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-8 sm:py-12'>
                    <p className='text-gray-500 text-base sm:text-lg'>No restaurant data available for this location.</p>
                    <p className='text-gray-400 text-xs sm:text-sm mt-2'>Try selecting a different location or check back later.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'places' && (
              <div>
                <h2 className='text-xl sm:text-2xl font-bold mb-4 sm:mb-6'>📍 Places to Visit</h2>
                {exploreData.places.length > 0 ? (
                  <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'>
                    {exploreData.places.map((place, index) => (
                      <div key={index} className='bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow'>
                        <img
                          src={place.placeImageUrl || "/placeholder.jpg"}
                          alt={place.placeName}
                          className='w-full h-32 sm:h-40 md:h-48 object-cover'
                        />
                        <div className='p-3 sm:p-4'>
                          <h3 className='font-bold text-base sm:text-lg mb-2 line-clamp-2'>{place.placeName}</h3>
                          <p className='text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2'>{place.placeDetails}</p>
                          <div className='flex items-center justify-between mb-2'>
                            <span className='text-blue-600 font-semibold text-xs sm:text-sm'>{place.ticketPricing}</span>
                            <span className='text-yellow-500 text-xs sm:text-sm'>⭐ {place.rating}</span>
                          </div>
                          {place.geometry && place.geometry.location && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${place.geometry.location.lat},${place.geometry.location.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className='inline-block text-blue-600 text-xs sm:text-sm hover:text-blue-800'
                            >
                              📍 View on Map
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-8 sm:py-12'>
                    <p className='text-gray-500 text-base sm:text-lg'>No places data available for this location.</p>
                    <p className='text-gray-400 text-xs sm:text-sm mt-2'>Try selecting a different location or check back later.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'guides' && (
              <div>
                <h2 className='text-xl sm:text-2xl font-bold mb-4 sm:mb-6'>👥 Local Guides</h2>
                {exploreData.guideOptions.length > 0 ? (
                  <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6'>
                    {exploreData.guideOptions.map((guide, index) => (
                      <div key={index} className='bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow'>
                        <img
                          src={guide.guideImageUrl || "/placeholder.jpg"}
                          alt={guide.guideName}
                          className='w-full h-32 sm:h-40 md:h-48 object-cover'
                        />
                        <div className='p-3 sm:p-4'>
                          <h3 className='font-bold text-base sm:text-lg mb-2 line-clamp-2'>{guide.guideName}</h3>
                          <p className='text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2'>{guide.guideDescription}</p>
                          <div className='flex items-center justify-between'>
                            <span className='text-green-600 font-semibold text-xs sm:text-sm'>{guide.guidePrice}</span>
                            <span className='text-yellow-500 text-xs sm:text-sm'>⭐ {guide.guideRating}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-8 sm:py-12'>
                    <p className='text-gray-500 text-base sm:text-lg'>No guide data available for this location.</p>
                    <p className='text-gray-400 text-xs sm:text-sm mt-2'>Try selecting a different location or check back later.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Explore;
