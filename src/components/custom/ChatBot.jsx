import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { chatSession } from '@/service/AIModel';
import {
  getPlacePhotoFromPexels,
  getPlaceDetails,
  getNearbyHotels,
  AMADEUS_API_KEY,
  AMADEUS_SECRET_KEY
} from '@/service/GlobalApi';
import { FiLoader, FiX, FiMapPin, FiSend } from 'react-icons/fi';
import PropTypes from 'prop-types';
import { toast } from 'sonner';

function ChatBot({ onClose }) {
  const [messages, setMessages] = useState([
    { 
      type: 'text', 
      text: '👋 **Hello! I\'m your AI Travel Assistant!**\n\n🗺️ **I can help you with:**\n• Plan detailed trip itineraries\n• Find hotels and accommodations\n• Discover local restaurants\n• Answer travel questions\n• Provide destination insights\n\n💡 **Try asking:**\n• "Plan a 3 day trip to Paris"\n• "Best places to visit in Tokyo"\n• "What to eat in Italy"\n• "Hotels in New York"\n\n**What would you like to know?**', 
      sender: 'bot' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [mapCenter, setMapCenter] = useState({ lat: 22.7196, lng: 75.8577 });
  const [hotels, setHotels] = useState([]);

  // Trip Display Component
  const TripDisplay = ({ tripData }) => {
    const handleLocationClick = (place) => {
      if (place.lat && place.lon) {
        setMapCenter({ lat: parseFloat(place.lat), lng: parseFloat(place.lon) });
      }
    };

    const handleHotelClick = (hotel) => {
      if (hotel.lat && hotel.lon) {
        setMapCenter({ lat: parseFloat(hotel.lat), lng: parseFloat(hotel.lon) });
      }
    };

    const handleRestaurantClick = (restaurant) => {
      if (restaurant.lat && restaurant.lon) {
        setMapCenter({ lat: parseFloat(restaurant.lat), lng: parseFloat(restaurant.lon) });
      } else {
        window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(restaurant.restaurantName)}`, '_blank');
      }
    };

    return (
      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl overflow-y-auto w-full max-h-[70vh] shadow-lg">
        
        {/* Hotels Section - Show First */}
        {tripData?.hotelOptions && tripData.hotelOptions.length > 0 && (
          <div className="mb-6 bg-white rounded-xl p-4 shadow-lg border-2 border-indigo-200">
            <h4 className="text-lg font-bold mb-4 text-indigo-700 flex items-center gap-2">
              🏨 Recommended Hotels
            </h4>
            <div className="grid grid-cols-1 gap-4">
              {tripData.hotelOptions.map((hotel, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-indigo-200 hover:shadow-xl transition-all duration-300">
                  {hotel.hotelImageUrl && !hotel.hotelImageUrl.includes('example.com') && (
                    <img 
                      src={hotel.hotelImageUrl} 
                      alt={hotel.hotelName}
                      className="w-full h-40 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleHotelClick(hotel)}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <p className="font-bold text-md text-gray-800 mb-2">{hotel.hotelName}</p>
                  <p className="text-sm text-gray-600 mb-2 flex items-start gap-2">
                    <span className="text-indigo-500">📍</span>
                    <span>{hotel.hotelAddress}</span>
                  </p>
                  {hotel.description && (
                    <p className="text-xs text-gray-600 mb-3 italic leading-relaxed">{hotel.description}</p>
                  )}
                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <span className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
                      <span>⭐</span>
                      <span className="font-semibold">{hotel.rating}</span>
                    </span>
                    <span className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                      <span>💰</span>
                      <span className="font-semibold text-xs">{hotel.price}</span>
                    </span>
                  </div>
                  <button 
                    className="w-full px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md flex items-center justify-center gap-2"
                    onClick={() => handleHotelClick(hotel)}
                  >
                    <span>🔍</span>
                    <span>View & Book Hotel</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Restaurants Section */}
        {tripData?.restaurantOptions && tripData.restaurantOptions.length > 0 && (
          <div className="mb-6 bg-white rounded-xl p-4 shadow-lg border-2 border-orange-200">
            <h4 className="text-lg font-bold mb-4 text-orange-700 flex items-center gap-2">
              🍽️ Must-Try Restaurants
            </h4>
            <div className="grid grid-cols-1 gap-4">
              {tripData.restaurantOptions.map((restaurant, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200 hover:shadow-xl transition-all duration-300">
                  {restaurant.restaurantImageUrl && !restaurant.restaurantImageUrl.includes('example.com') && (
                    <img 
                      src={restaurant.restaurantImageUrl} 
                      alt={restaurant.restaurantName}
                      className="w-full h-40 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleRestaurantClick(restaurant)}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <p className="font-bold text-md text-gray-800 mb-2">{restaurant.restaurantName}</p>
                  <p className="text-sm text-gray-600 mb-2 flex items-start gap-2">
                    <span className="text-orange-500">📍</span>
                    <span>{restaurant.restaurantAddress}</span>
                  </p>
                  {restaurant.description && (
                    <p className="text-xs text-gray-600 mb-3 italic leading-relaxed">{restaurant.description}</p>
                  )}
                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <span className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
                      <span>⭐</span>
                      <span className="font-semibold">{restaurant.rating}</span>
                    </span>
                    <span className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                      <span>💰</span>
                      <span className="font-semibold text-xs">{restaurant.price}</span>
                    </span>
                  </div>
                  <button 
                    className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm rounded-lg hover:from-orange-600 hover:to-red-700 transition-all shadow-md flex items-center justify-center gap-2"
                    onClick={() => handleRestaurantClick(restaurant)}
                  >
                    <FiMapPin className="w-4 h-4" />
                    <span>View Location</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Itinerary Days */}
        {tripData?.itinerary && tripData.itinerary.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-blue-200">
            <h4 className="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2">
              🗺️ Day-by-Day Itinerary
            </h4>
            {tripData.itinerary.map((day, dayIndex) => (
              <div key={dayIndex} className="mb-6 bg-white rounded-lg p-4 shadow-lg border border-indigo-100">
                <h5 className="font-bold text-lg mb-3 text-indigo-600 flex items-center gap-2">
                  📅 Day {day.day}
                </h5>
                {day.plan?.map((place, placeIndex) => (
                  <div key={placeIndex} className="ml-4 mb-4 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
                    <p className="font-semibold text-md text-gray-800 mb-2">{place.placeName}</p>
                    <p className="text-sm text-gray-600 mb-2 leading-relaxed">{place.placeDetails}</p>
                    <img
                      src={place.placeImageUrl || '/placeholder.jpg'}
                      alt={place.placeName}
                      className="w-full h-40 object-cover rounded-lg mt-2 cursor-pointer hover:opacity-90 transition-opacity shadow-md"
                      onClick={() => handleLocationClick(place)}
                      onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                    />
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-600 flex-wrap">
                      <span className="flex items-center gap-1">⭐ {place.rating}</span>
                      <span className="flex items-center gap-1">💰 {place.ticketPricing}</span>
                      <span className="flex items-center gap-1">🕐 {place.time}</span>
                    </div>
                    <button
                      className="mt-3 px-3 py-1.5 bg-indigo-500 text-white text-xs rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-1 shadow-sm"
                      onClick={() => handleLocationClick(place)}
                    >
                      <FiMapPin className="w-3 h-3" /> Center on Map
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Hotel Display Component
  const HotelDisplay = ({ hotelData }) => {
    const { hotels, location, response } = hotelData;

    const handleHotelClick = (hotel) => {
      if (hotel.lat && hotel.lon) {
        setMapCenter({ lat: parseFloat(hotel.lat), lng: parseFloat(hotel.lon) });
      }
      const searchQuery = encodeURIComponent(`${hotel.hotelName} ${hotel.hotelAddress}`);
      window.open(`https://www.booking.com/search.html?ss=${searchQuery}`, '_blank');
    };

    return (
      <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl overflow-y-auto w-full max-h-[70vh] shadow-lg">
        {/* AI Response */}
        <div className="mb-6 bg-white rounded-xl p-4 shadow-lg border-2 border-green-200">
          <h4 className="text-lg font-bold mb-4 text-green-700 flex items-center gap-2">
            🏨 Hotel Recommendations for {location}
          </h4>
          <p className="text-sm text-gray-700 leading-relaxed">{response}</p>
        </div>

        {/* Hotels List */}
        {hotels && hotels.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-green-200">
            <h4 className="text-lg font-bold mb-4 text-green-700 flex items-center gap-2">
              📋 Available Hotels
            </h4>
            <div className="grid grid-cols-1 gap-4">
              {hotels.map((hotel, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 hover:shadow-xl transition-all duration-300">
                  {hotel.hotelImageUrl && !hotel.hotelImageUrl.includes('example.com') && (
                    <img
                      src={hotel.hotelImageUrl}
                      alt={hotel.hotelName}
                      className="w-full h-40 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleHotelClick(hotel)}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <p className="font-bold text-md text-gray-800 mb-2">{hotel.hotelName}</p>
                  <p className="text-sm text-gray-600 mb-2 flex items-start gap-2">
                    <span className="text-green-500">📍</span>
                    <span>{hotel.hotelAddress}</span>
                  </p>
                  {hotel.description && (
                    <p className="text-xs text-gray-600 mb-3 italic leading-relaxed">{hotel.description}</p>
                  )}
                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <span className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
                      <span>⭐</span>
                      <span className="font-semibold">{hotel.rating}</span>
                    </span>
                    <span className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
                      <span>💰</span>
                      <span className="font-semibold text-xs">{hotel.price}</span>
                    </span>
                  </div>
                  <button
                    className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white text-sm rounded-lg hover:from-green-600 hover:to-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
                    onClick={() => handleHotelClick(hotel)}
                  >
                    <span>🔍</span>
                    <span>View & Book Hotel</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  TripDisplay.propTypes = {
    tripData: PropTypes.object.isRequired,
  };

  HotelDisplay.propTypes = {
    hotelData: PropTypes.shape({
      hotels: PropTypes.array,
      location: PropTypes.string,
      response: PropTypes.string
    }).isRequired,
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Preload data for default location on mount
  useEffect(() => {
    preloadLocationData(22.7196, 75.8577);
  }, []);



  // Fetch image from Pexels API with Unsplash fallback
  const fetchImageFromPexels = async (query) => {
    try {
      const response = await getPlacePhotoFromPexels(query);
      // Pexels API returns photos array, use index 0 for first photo
      return response.data.photos[0]?.src?.medium || '/placeholder.jpg';
    } catch (error) {
      console.error('Pexels image fetch error:', error);
      return '/placeholder.jpg';
    }
  };
  
  // Preload location data (hotels, places, restaurants)
  const preloadLocationData = async (lat, lng) => {
    try {
      // Fetch hotels
      if (AMADEUS_API_KEY && AMADEUS_SECRET_KEY) {
        try {
          const hotelResponse = await getNearbyHotels(lat, lng);
          const hotelsData = await processHotels(hotelResponse.data.slice(0, 3));
          setHotels(hotelsData);
        } catch {
          console.error('Hotel fetch error');
          setHotels([]);
        }
      }


    } catch (error) {
      console.error('Preload error:', error);
    }
  };

  // Process hotels data with Pexels images
  const processHotels = async (hotelList) => {
    return Promise.all(hotelList.map(async (hotel) => {
      const hotelName = hotel.name || 'Hotel';
      const imageUrl = await fetchImageFromPexels(`${hotelName} hotel luxury room`);
      return {
        hotelName,
        hotelAddress: `${hotel.address?.lines?.join(', ') || ''}, ${hotel.address?.cityName || ''}`.trim(),
        price: 'Contact for price',
        hotelImageUrl: imageUrl,
        rating: 'N/A',
        description: 'Comfortable accommodation',
        lat: hotel.geoCode?.latitude,
        lon: hotel.geoCode?.longitude,
        hotelId: hotel.hotelId || 'N/A'
      };
    }));
  };



  // Extract location from user query
  const extractLocationFromQuery = (query) => {
    const patterns = [
      /(?:to|in|visit|at)\s+([A-Za-z\s]+?)(?:\s+for|\s+\d|$)/i,
      /(\d+)\s+days?\s+(?:in|to|at)\s+([A-Za-z\s]+?)(?:\s|$)/i,
      /plan.*?(?:to|in)\s+([A-Za-z\s]+?)(?:\s|$)/i,
      /trip\s+(?:to|in)\s+([A-Za-z\s]+?)(?:\s|$)/i,
      /(?:places|hotels|restaurants)\s+(?:in|at)\s+([A-Za-z\s]+?)(?:\s|$)/i,
      /(?:near|close to|around)\s+([A-Za-z\s]+?)(?:\s|$)/i,
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        return (match[2] || match[1]).trim();
      }
    }
    return null;
  };

  // Extract duration from user query
  const extractDuration = (query) => {
    const match = query.match(/(\d+)\s+days?/i);
    return match ? parseInt(match[1]) : 3; // Default 3 days
  };

  // Check if query is travel-related
  const isTravelRelated = (query) => {
    const travelKeywords = [
      'trip', 'travel', 'visit', 'tour', 'vacation', 'holiday', 'destination',
      'hotel', 'accommodation', 'stay', 'lodge', 'resort', 'motel', 'booking', 'book',
      'restaurant', 'food', 'eat', 'dining', 'cuisine', 'meal',
      'place', 'attraction', 'landmark', 'sightseeing', 'tourist', 'museum',
      'itinerary', 'plan', 'schedule', 'route', 'guide',
      'flight', 'train', 'transport', 'airport', 'bus',
      'best time', 'weather', 'climate', 'season', 'temperature',
      'budget', 'cost', 'price', 'cheap', 'expensive', 'affordable',
      'culture', 'local', 'tradition', 'festival', 'event',
      'beach', 'mountain', 'city', 'country', 'island', 'park'
    ];

    const lowerQuery = query.toLowerCase();
    return travelKeywords.some(keyword => lowerQuery.includes(keyword));
  };

  // Check if query is hotel-related
  const isHotelRelated = (query) => {
    const hotelKeywords = [
      'hotel', 'accommodation', 'stay', 'lodge', 'resort', 'motel', 'booking', 'book',
      'room', 'check-in', 'check-out', 'amenities', 'luxury', 'budget', 'price',
      'rate', 'cost', 'expensive', 'cheap', 'affordable', 'stars', 'rating'
    ];

    const lowerQuery = query.toLowerCase();
    return hotelKeywords.some(keyword => lowerQuery.includes(keyword));
  };

  // Generate AI prompt for trip itinerary
  const generateTripPrompt = (location, duration, userQuery) => {
    return `You are an expert travel planner. Create a detailed ${duration}-day itinerary for ${location}.

USER REQUEST: "${userQuery}"

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - no text before or after
2. Each place must have realistic details
3. Include 3-5 places per day with detailed descriptions
4. Use real, famous attractions in ${location}
5. Provide realistic coordinates, pricing, and timing

JSON STRUCTURE (respond with this format ONLY):
{
  "itinerary": [
    {
      "day": 1,
      "plan": [
        {
          "placeName": "Actual landmark/attraction name in ${location}",
          "placeDetails": "Detailed 80-120 word description about what makes this place special, its history, what visitors can do there, and why it's worth visiting. Include practical information.",
          "placeImageUrl": null,
          "geoCoordinates": "XX.XXXX° N, YY.YYYY° E",
          "ticketPricing": "Actual price range or 'Free' or 'Varies' (be specific if possible)",
          "rating": "4.5",
          "time": "Morning/Afternoon/Evening",
          "lat": XX.XXXX,
          "lon": YY.YYYY
        }
      ]
    }
  ]
}

REQUIREMENTS:
- Include breakfast, lunch, dinner suggestions in descriptions
- Mix cultural, historical, recreational, and food experiences
- Realistic timing: morning (9am-12pm), afternoon (1pm-5pm), evening (6pm-9pm)
- Consider travel time between locations
- Include insider tips and local recommendations
- Use actual GPS coordinates for ${location}
- Ensure variety in activities (don't repeat similar attractions)
- Consider opening hours and best visiting times

Generate ONLY the JSON with no additional text or explanations!`;
  };

  // Generate AI fallback data for hotels/restaurants when API fails
  const generateAIFallbackData = async (location, dataType) => {
    let prompt = '';
    
    if (dataType === 'hotels') {
      prompt = `Generate 3 realistic, well-known hotel recommendations for ${location}. Include a mix of budget, mid-range, and luxury options.

Respond with ONLY valid JSON array (no other text):
[
  {
    "hotelName": "Actual famous hotel name in ${location}",
    "hotelAddress": "Complete real address in ${location}",
    "price": "$100-200/night" or "$$-$$$",
    "rating": "4.5",
    "description": "Brief description of hotel amenities and location"
  }
]`;
    } else if (dataType === 'restaurants') {
      prompt = `Generate 3 realistic, popular restaurant recommendations for ${location}. Include variety in cuisine types.

Respond with ONLY valid JSON array (no other text):
[
  {
    "restaurantName": "Actual famous restaurant name in ${location}",
    "restaurantAddress": "Complete real address in ${location}",
    "price": "$$" or "$$$",
    "rating": "4.5",
    "description": "Cuisine type and specialty dishes"
  }
]`;
    }

    try {
      const result = await chatSession.sendMessage(prompt);
      const response = result?.response?.text();
      let cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const startIndex = cleanedResponse.indexOf('[');
      const endIndex = cleanedResponse.lastIndexOf(']');
      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        cleanedResponse = cleanedResponse.substring(startIndex, endIndex + 1);
      }
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('AI fallback generation error:', error);
      return [];
    }
  };

  // Generate friendly response for general travel questions
  const generateFriendlyResponse = async (query) => {
    const prompt = `You are a friendly, knowledgeable travel assistant with years of experience. Answer this travel-related question naturally and helpfully:

"${query}"

INSTRUCTIONS:
- Be conversational, warm, and enthusiastic about travel
- Provide specific, useful, and accurate information
- Include practical tips and insider recommendations if relevant
- Use emojis very sparingly (maximum 1-2 in entire response)
- Keep response concise: 3-5 well-crafted sentences with bullet points if needed for clarity.
- If about a destination, mention 2-3 specific highlights
- If about planning, give actionable, step-by-step advice
- If about timing, mention specific months or seasons
- If about food, name actual dishes or restaurants

Be natural and helpful - respond as a travel expert would:`;

    try {
      const result = await chatSession.sendMessage(prompt);
      return result?.response?.text()?.trim() || 'I\'d be happy to help with that! Could you provide more details about what you\'re looking for?';
    } catch (error) {
      console.error('Friendly response error:', error);
      return 'I\'m here to help with your travel questions! What would you like to know?';
    }
  };

  // Generate response for non-travel queries
  const generateNonTravelResponse = () => {
    return `I'm specifically designed to help with **travel planning**! 🗺️✈️

**I can assist you with:**
• Planning detailed trip itineraries
• Finding hotels and restaurants
• Destination recommendations and tips
• Travel advice and budgeting
• Local attractions and activities

**Could you ask me something about travel?**

**For example:**
• "Plan a 3 day trip to Paris"
• "Best places to visit in Japan"
• "What's the best time to visit Bali?"
• "Cheap hotels in London"
• "Traditional food in Thailand"

What destination would you like to explore?`;
  };

  // Main message handler
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    const userQuery = input;
    setInput('');
    setLoading(true);

    try {
      const lowerQuery = userQuery.toLowerCase().trim();

      // Check if query is travel-related
      if (!isTravelRelated(userQuery)) {
        const nonTravelResponse = generateNonTravelResponse();
        setMessages(prev => [...prev, { 
          type: 'text', 
          text: nonTravelResponse, 
          sender: 'bot' 
        }]);
        setLoading(false);
        return;
      }

      // Handle simple greetings
      if (/^(hi|hello|hey|hii|helloo|good morning|good evening)$/i.test(lowerQuery)) {
        setMessages(prev => [...prev, { 
          type: 'text', 
          text: '👋 Hello! I\'m your personal travel assistant. Ready to plan an amazing adventure?\n\nTell me:\n• Where would you like to go?\n• How many days do you want to stay?\n\nOr ask me anything about travel destinations, hotels, food, or tips!', 
          sender: 'bot' 
        }]);
        setLoading(false);
        return;
      }

      // Check if it's a trip planning query
      const isTripQuery = /\b(plan|create|make|generate|itinerary|schedule|days?)\b/i.test(lowerQuery);

      // Check if it's a hotel-related query
      const isHotelQuery = isHotelRelated(userQuery);

      if (isTripQuery) {
        // Extract location and duration
        const location = extractLocationFromQuery(userQuery);
        const duration = extractDuration(userQuery);

        if (!location) {
          setMessages(prev => [...prev, { 
            type: 'text', 
            text: '❓ I couldn\'t identify your destination.\n\n**Please try formats like:**\n• "Plan a 3 day trip to Paris"\n• "Create 5 day itinerary for Tokyo"\n• "Make a 7 day trip to Bali"\n\nWhat destination interests you?', 
            sender: 'bot' 
          }]);
          setLoading(false);
          return;
        }

        // Get location coordinates
        try {
          const locationResponse = await getPlaceDetails(location);
          const locData = locationResponse.data[0];
          
          if (!locData?.lat || !locData?.lon) {
            throw new Error('Location not found');
          }

          const lat = parseFloat(locData.lat);
          const lng = parseFloat(locData.lon);
          setMapCenter({ lat, lng });

          // Fetch real data with fallback to AI
          let hotelsData = [];

          // Try to fetch hotels from API, fallback to AI
          if (AMADEUS_API_KEY && AMADEUS_SECRET_KEY) {
            try {
              const hotelResponse = await getNearbyHotels(lat, lng);
              hotelsData = await processHotels(hotelResponse.data.slice(0, 3));
            } catch {
              console.log('Hotel API failed, using AI fallback...');
              hotelsData = await generateAIFallbackData(location, 'hotels');
            }
          } else {
            console.log('No hotel API key, using AI fallback...');
            hotelsData = await generateAIFallbackData(location, 'hotels');
          }

          setHotels(hotelsData);

          // Generate itinerary with AI
          const prompt = generateTripPrompt(location, duration, userQuery);
          const result = await chatSession.sendMessage(prompt);
          const aiResponse = result?.response?.text();

          // Clean and parse JSON response
          let cleanedResponse = aiResponse.trim();
          cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
          cleanedResponse = cleanedResponse.replace(/^[^{]*({.*})[^}]*$/s, '$1');

          const tripData = JSON.parse(cleanedResponse);
          
          // Fetch Pexels images for each place in itinerary with Unsplash fallback
          for (const day of tripData.itinerary) {
            for (const place of day.plan) {
              if (!place.placeImageUrl || place.placeImageUrl.includes('placeholder') || place.placeImageUrl.includes('123456')) {
                place.placeImageUrl = await fetchImageFromPexels(place.placeName);
              }
            }
          }

          // Add hotel data to trip
          tripData.hotelOptions = hotelsData;

          setMessages(prev => [...prev, { 
            type: 'trip', 
            data: tripData, 
            sender: 'bot' 
          }]);

        } catch (error) {
          console.error('Trip planning error:', error);
          setMessages(prev => [...prev, { 
            type: 'text', 
            text: `❌ I encountered an error while planning your trip to ${location || 'that destination'}.\n\n**Possible issues:**\n• Location name might be misspelled\n• Try being more specific (e.g., "Paris, France")\n\n**You can also try:**\n• "Best places in ${location || 'Paris'}"\n• "What to do in ${location || 'Tokyo'}"\n• "Guide to ${location || 'Rome'}"`, 
            sender: 'bot' 
          }]);
        }
      } else if (isHotelQuery) {
        // Handle hotel-related queries
        const location = extractLocationFromQuery(userQuery);

        if (!location) {
          setMessages(prev => [...prev, {
            type: 'text',
            text: '❓ I couldn\'t identify your destination for hotel recommendations.\n\n**Please try formats like:**\n• "Hotels in Paris"\n• "Best accommodations in Tokyo"\n• "Cheap stays in Bali"\n\nWhat destination interests you?',
            sender: 'bot'
          }]);
          setLoading(false);
          return;
        }

        // Get location coordinates
        try {
          const locationResponse = await getPlaceDetails(location);
          const locData = locationResponse.data[0];

          if (!locData?.lat || !locData?.lon) {
            throw new Error('Location not found');
          }

          const lat = parseFloat(locData.lat);
          const lng = parseFloat(locData.lon);
          setMapCenter({ lat, lng });

          // Fetch hotel data
          let hotelsData = [];

          if (AMADEUS_API_KEY && AMADEUS_SECRET_KEY) {
            try {
              const hotelResponse = await getNearbyHotels(lat, lng);
              hotelsData = await processHotels(hotelResponse.data.slice(0, 6)); // More hotels for hotel queries
            } catch {
              console.log('Hotel API failed, using AI fallback...');
              hotelsData = await generateAIFallbackData(location, 'hotels');
            }
          } else {
            console.log('No hotel API key, using AI fallback...');
            hotelsData = await generateAIFallbackData(location, 'hotels');
          }

          setHotels(hotelsData);

          // Generate hotel-focused AI response
          const hotelPrompt = `You are a hotel booking expert. Provide detailed information about hotels in ${location}.

USER QUERY: "${userQuery}"

Provide a helpful response about hotel options, booking tips, and recommendations for ${location}. Include:
- Types of accommodations available
- Price ranges for different budgets
- Best areas to stay
- Booking tips and recommendations
- Any seasonal considerations

Keep response informative but concise (4-6 sentences). Be helpful and specific to ${location}.`;

          const result = await chatSession.sendMessage(hotelPrompt);
          const aiResponse = result?.response?.text()?.trim() || `Here are some great hotel options in ${location}!`;

          setMessages(prev => [...prev, {
            type: 'hotels',
            data: { hotels: hotelsData, location, response: aiResponse },
            sender: 'bot'
          }]);

        } catch (error) {
          console.error('Hotel query error:', error);
          setMessages(prev => [...prev, {
            type: 'text',
            text: `❌ I encountered an error finding hotels in ${location || 'that destination'}.\n\n**Possible issues:**\n• Location name might be misspelled\n• Try being more specific (e.g., "Paris, France")\n\n**You can also try:**\n• "Accommodations in ${location || 'Paris'}"\n• "Places to stay in ${location || 'Tokyo'}"`,
            sender: 'bot'
          }]);
        }
      } else {
        // Handle general travel questions with friendly AI response
        const friendlyResponse = await generateFriendlyResponse(userQuery);
        setMessages(prev => [...prev, {
          type: 'text',
          text: friendlyResponse,
          sender: 'bot'
        }]);
      }
    } catch (error) {
      console.error('Message handling error:', error);
      setMessages(prev => [...prev, { 
        type: 'text', 
        text: '⚠️ **Oops! Something went wrong.**\n\nPlease try:\n• Rephrasing your question\n• Being more specific\n• Asking a different question\n\nI\'m here to help!', 
        sender: 'bot' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Handle hotel booking
  const handleHotelBooking = (hotel) => {
    const searchQuery = encodeURIComponent(`${hotel.hotelName} ${hotel.hotelAddress}`);
    window.open(`https://www.booking.com/search.html?ss=${searchQuery}`, '_blank');
    toast.success('Opening booking site...');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white w-full h-full flex shadow-2xl">
        
        {/* Chat Section - Left Side */}
        <div className="w-1/2 flex flex-col">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white flex justify-between items-center shadow-lg">
            <h3 className="text-lg font-bold flex items-center gap-2">
              ✈️ AI Travel Assistant
            </h3>
            <div className="flex gap-2">
              <Button 
                onClick={() => window.location.href = '/'} 
                variant="ghost" 
                className="text-white hover:bg-white/20 transition-all"
              >
                🏠 Home
              </Button>
              <Button 
                onClick={onClose} 
                variant="ghost" 
                className="text-white hover:bg-white/20 transition-all"
              >
                <FiX className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
            {messages.map((msg, index) => (
              <div key={index} className={`mb-4 animate-fadeIn ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.type === 'trip' ? (
                  <TripDisplay tripData={msg.data} />
                ) : msg.type === 'hotels' ? (
                  <HotelDisplay hotelData={msg.data} />
                ) : (
                  <div className={`inline-block p-4 rounded-2xl max-w-[85%] shadow-lg ${
                    msg.sender === 'user' 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' 
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}>
                    <div 
                      className="whitespace-pre-wrap leading-relaxed text-sm"
                      dangerouslySetInnerHTML={{
                        __html: msg.text
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n/g, '<br/>')
                          .replace(/•/g, '<span class="text-indigo-600 font-bold">•</span>')
                      }} 
                    />
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-center gap-3 text-indigo-600 bg-white p-4 rounded-2xl shadow-lg inline-block animate-pulse">
                <FiLoader className='h-5 w-5 animate-spin' />
                <span className="text-sm font-medium">Planning your perfect trip...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <div className="p-4 border-t bg-white shadow-lg">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='Try: "Plan a 5 day trip to Bali" or "Best hotels in Paris"'
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
                className="flex-1 border-2 border-gray-300 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm"
                disabled={loading}
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <FiLoader className="h-5 w-5 animate-spin" /> : <FiSend className="h-5 w-5" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              💡 Tip: Be specific with your destination and duration for best results
            </p>
          </div>
        </div>

        {/* Map and Info Section - Right Side */}
        <div className="w-1/2 p-4 bg-gradient-to-br from-gray-50 to-blue-50 overflow-y-auto">
          <h4 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
            <FiMapPin className="text-indigo-600" /> Location & Recommendations
          </h4>
          
          {/* OpenStreetMap */}
          <div className="h-64 bg-gray-300 rounded-xl mb-4 overflow-hidden shadow-lg border-2 border-gray-200">
            <iframe
              key={`${mapCenter.lat}-${mapCenter.lng}`}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lng-0.05},${mapCenter.lat-0.05},${mapCenter.lng+0.05},${mapCenter.lat+0.05}&layer=mapnik&marker=${mapCenter.lat},${mapCenter.lng}`}
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              title="OpenStreetMap"
              loading="lazy"
            />
          </div>

          {/* Hotels Section */}
          <div className="mb-4">
            <h5 className="text-md font-semibold mb-3 text-gray-700 flex items-center gap-2">
              🏨 Recommended Hotels
            </h5>
            {hotels.length > 0 ? (
              <div className="space-y-3">
                {hotels.map((hotel, index) => (
                  <div key={index} className="p-3 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200">
                    <img
                      src={hotel.hotelImageUrl}
                      alt={hotel.hotelName}
                      className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        if (hotel.lat && hotel.lon) {
                          setMapCenter({ lat: parseFloat(hotel.lat), lng: parseFloat(hotel.lon) });
                        }
                      }}
                      onError={(e) => { e.target.src = '/placeholder.jpg'; }}
                    />
                    <p className="font-semibold text-sm mt-3 text-gray-800">{hotel.hotelName}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{hotel.hotelAddress}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">⭐ {hotel.rating}</span>
                      <span className="flex items-center gap-1">💰 {hotel.price}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        className="flex-1 px-3 py-2 bg-indigo-500 text-white text-xs rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-1 shadow-sm"
                        onClick={() => {
                          if (hotel.lat && hotel.lon) {
                            setMapCenter({ lat: parseFloat(hotel.lat), lng: parseFloat(hotel.lon) });
                          }
                        }}
                      >
                        <FiMapPin className="w-3 h-3" /> Map
                      </button>
                      <button
                        className="flex-1 px-3 py-2 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                        onClick={() => handleHotelBooking(hotel)}
                      >
                        📅 Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm text-gray-500">No hotels available yet</p>
                <p className="text-xs text-gray-400 mt-1">Plan a trip to see recommendations!</p>
              </div>
            )}
          </div>


        </div>
      </div>
    </div>
  );
}

ChatBot.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default ChatBot;
