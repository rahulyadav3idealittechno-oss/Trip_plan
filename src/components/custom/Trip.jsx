import PropTypes from 'prop-types';

function Trip({ data }) {
  const { itinerary, hotelOptions, restaurantOptions } = data;

  return (
    <div className="trip-display p-4 bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Itinerary Section */}
      {itinerary && itinerary.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            🗺️ Trip Itinerary
          </h3>
          {itinerary.map((day, dayIndex) => (
            <div key={dayIndex} className="mb-4">
              <h4 className="text-md font-semibold text-indigo-600 mb-2">
                📅 Day {day.day}
              </h4>
              {day.plan && day.plan.map((place, placeIndex) => (
                <div key={placeIndex} className="ml-4 p-3 bg-gray-50 rounded-lg mb-2">
                  <div className="flex gap-3">
                    {place.placeImageUrl && (
                      <img
                        src={place.placeImageUrl}
                        alt={place.placeName}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                        onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                      />
                    )}
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-800">{place.placeName}</h5>
                      <p className="text-sm text-gray-600 mt-1">{place.placeDetails}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {place.geoCoordinates && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">📍 {place.geoCoordinates}</span>
                        )}
                        {place.ticketPricing && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">💰 {place.ticketPricing}</span>
                        )}
                        {place.rating && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">⭐ {place.rating}</span>
                        )}
                        {place.time && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">🕐 {place.time}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Hotels Section */}
      {hotelOptions && hotelOptions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            🏨 Recommended Hotels
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hotelOptions.map((hotel, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex gap-3">
                  {hotel.hotelImageUrl && (
                    <img
                      src={hotel.hotelImageUrl}
                      alt={hotel.hotelName}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{hotel.hotelName}</h4>
                    <p className="text-sm text-gray-600">{hotel.hotelAddress}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {hotel.price && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">💰 {hotel.price}</span>}
                      {hotel.rating && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">⭐ {hotel.rating}</span>}
                    </div>
                    {hotel.description && <p className="text-xs text-gray-500 mt-2">{hotel.description}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restaurants Section */}
      {restaurantOptions && restaurantOptions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            🍽️ Recommended Restaurants
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {restaurantOptions.map((restaurant, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex gap-3">
                  {restaurant.restaurantImageUrl && (
                    <img
                      src={restaurant.restaurantImageUrl}
                      alt={restaurant.restaurantName}
                      className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{restaurant.restaurantName}</h4>
                    <p className="text-sm text-gray-600">{restaurant.restaurantAddress}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {restaurant.price && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">💰 {restaurant.price}</span>}
                      {restaurant.rating && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">⭐ {restaurant.rating}</span>}
                    </div>
                    {restaurant.description && <p className="text-xs text-gray-500 mt-2">{restaurant.description}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

Trip.propTypes = {
  data: PropTypes.shape({
    itinerary: PropTypes.array,
    hotelOptions: PropTypes.array,
    restaurantOptions: PropTypes.array,
  }).isRequired,
};

export default Trip;
