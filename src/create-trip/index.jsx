import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AI_PROMPT, SelectBudgetOptions, SelectTravelesList } from '@/constants/options';
import { chatSession } from '@/service/AIModel';
import { getNearbyHotels, getNearbyRestaurants, getOpenTripMapPlaces, getOpenTripMapPlaceDetails, getPlacePhotoFromPexels } from '@/service/GlobalApi';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
// import { FcGoogle } from "react-icons/fc";
import { FiLoader, FiMessageSquare } from "react-icons/fi";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { useGoogleLogin } from '@react-oauth/google';
// import axios from 'axios';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/service/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import LocationSearchInput from '@/components/custom/LocationSearchInput';
import ChatBot from '@/components/custom/ChatBot';

function CreateTrip() {
  // const [place, setPlace] = useState();
  const [formData, setFormData] = useState([]);
  // const [openDailog, setOpenDailog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showChatBot, setShowChatBot] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  useEffect(() => {
    console.log(formData);
  }, [formData]);

  // const login = useGoogleLogin({
  //   onSuccess: (codeResp) => GetUserProfile(codeResp),
  //   onError: (error) => console.log(error)
  // });

  const OnGenerateTrip = async () => {
    // Simulate a guest user
    // const user = {
    //   name: 'Guest User',
    //   email: 'guest@example.com',
    //   picture: '/cat.png'
    // };

    // if (!user) {
    //   setOpenDailog(true);
    //   return;
    // }

    if (formData?.noOfDays > 10 || !formData?.location || !formData?.budget || !formData?.traveler) {
      toast("Please fill all details.");
      return;
    }

    setLoading(true);

    // Fetch real hotels, restaurants, and places using APIs
    let realHotels = [];
    let realRestaurants = [];
    let realPlaces = [];
    try {
      const lat = formData?.location?.lat;
      const lng = formData?.location?.lon;
      if (lat && lng) {
        // Fetch hotels using Amadeus API
        const hotelData = await getNearbyHotels(lat, lng);
        realHotels = hotelData.data.slice(0, 4).map(hotel => ({
          hotelName: hotel.name || 'Unknown Hotel',
          hotelAddress: hotel.address?.lines?.join(', ') + ', ' + hotel.address?.cityName + ', ' + hotel.address?.countryCode || 'Address not available',
          price: 'Contact hotel for pricing',
          hotelImageUrl: '', // Will use Pexels for images
          geoCoordinates: `${hotel.geoCode?.latitude}° N, ${hotel.geoCode?.longitude}° W`,
          rating: 'N/A',
          description: 'Hotel near your destination'
        }));

        // Fetch restaurants using Google Places API
        const restaurantData = await getNearbyRestaurants(lat, lng);
        realRestaurants = restaurantData.data.results.slice(0, 4).map(restaurant => ({
          restaurantName: restaurant.name,
          restaurantAddress: restaurant.vicinity,
          price: restaurant.price_level ? '$'.repeat(restaurant.price_level) : '$',
          rating: restaurant.rating || 'N/A',
          restaurantImageUrl: '', // Will use Pexels for images
          geoCoordinates: `${restaurant.geometry?.location?.lat}° N, ${restaurant.geometry?.location?.lng}° W`,
          description: restaurant.types?.join(', ') || 'Local restaurant'
        }));

        // Fetch places using OpenTripMap API
        const placesData = await getOpenTripMapPlaces(lat, lng);
        realPlaces = placesData.data.slice(0, 4).map(async (place) => {
          // Get detailed place info
          const placeDetails = await getOpenTripMapPlaceDetails(place.xid);
          const detail = placeDetails.data;

          // Get image using Pexels API
          let imageUrl = '';
          try {
            const imageData = await getPlacePhotoFromPexels(detail.name || place.name);
            imageUrl = imageData.data.photos[0]?.src?.medium || '';
          } catch (imageError) {
            console.error('Error fetching image for place:', place.name, imageError);
          }

          return {
            placeName: detail.name || place.name,
            placeDetails: detail.wikipedia_extracts?.text || detail.info?.descr || 'Beautiful destination to explore',
            placeImageUrl: imageUrl,
            geoCoordinates: `${place.point?.lat}° N, ${place.point?.lon}° W`,
            ticketPricing: 'Varies',
            rating: '4.5',
            time: 'All day',
            lat: place.point?.lat,
            lon: place.point?.lon
          };
        });

        // Wait for all place promises to resolve
        realPlaces = await Promise.all(realPlaces);
      }
    } catch (error) {
      console.error('Error fetching data from APIs:', error);
      // Fallback to AI-generated data if APIs fail
    }

    const FINAL_PROMPT = AI_PROMPT.replace('{location}', formData?.location.display_name)
      .replace('{totalDays}', formData?.noOfDays)
      .replace('{traveler}', formData?.traveler)
      .replace('{budget}', formData?.budget)
      .replace('{totalDays}', formData?.noOfDays);

    const result = await chatSession.sendMessage(FINAL_PROMPT);

    console.log("--", result?.response?.text());
    setLoading(false);

    // Clean and parse JSON response
    let cleanedResponse = result?.response?.text().trim();
    cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    cleanedResponse = cleanedResponse.replace(/^[^{]*({.*})[^}]*$/s, '$1');

    // If still not valid JSON, try to extract just the JSON part
    if (!cleanedResponse.startsWith('{')) {
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }
    }

    console.log('Cleaned AI Response:', cleanedResponse);

    let tripData;
    try {
      tripData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Failed to parse:', cleanedResponse);
      throw new Error('Invalid JSON response from AI');
    }

    // Modify trip data to use real data if available
    if (realHotels.length > 0) {
      tripData.hotelOptions = realHotels;
    }
    if (realRestaurants.length > 0) {
      tripData.restaurantOptions = realRestaurants;
    }
    if (realPlaces.length > 0) {
      // Replace AI-generated places with real OpenTripMap data
      tripData.itinerary = tripData.itinerary || [];
      tripData.itinerary.forEach((day) => {
        if (day.plan && day.plan.length > 0) {
          // Replace each place in the plan with real data if available
          day.plan.forEach((place, placeIndex) => {
            if (realPlaces[placeIndex]) {
              day.plan[placeIndex] = realPlaces[placeIndex];
            }
          });
        }
      });
    }

    SaveAiTrip(JSON.stringify(tripData));
  };

  const SaveAiTrip = async (TripData) => {
    setLoading(true);
    const user = {
      name: 'Guest User',
      email: 'guest@example.com',
      picture: '/cat.png'
    };
    const docId = Date.now().toString();
    await setDoc(doc(db, "AITrips", docId), {
      userSelection: formData,
      tripData: JSON.parse(TripData),
      userEmail: user?.email,
      id: docId
    });
    setLoading(false);
    navigate('/view-trip/' + docId);
  };

  // const GetUserProfile = (tokenInfo) => {
  //   axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${tokenInfo?.access_token}`, {
  //     headers: {
  //       Authorization: `Bearer ${tokenInfo?.access_token}`,
  //       Accept: 'application/json',
  //     },
  //   })
  //   .then((resp) => {
  //     console.log(resp);
  //     localStorage.setItem('user', JSON.stringify(resp.data));
  //     setOpenDailog(false);
  //     OnGenerateTrip();
  //   });
  // };

  return (
    <div className='px-5 mt-10 sm:px-10 md:px-32 lg:px-56 xl:px-72'>
    <h2 className="text-3xl font-bold text-center text-gray-800 sm:text-4xl sm:text-left">
        Share your ideal travel style and interests
    </h2>
    <p className="mt-3 text-base text-center text-gray-500 sm:text-lg sm:text-left">
      Tell us a few details and our AI will craft a personalized itinerary just for you.
    </p>

      <div className='flex flex-col gap-12 mt-16'>
        <div>
          <h2 className='mb-3 text-lg font-semibold text-gray-700 sm:text-xl'>Where would you like to explore next?</h2>
          <LocationSearchInput
            onSelect={(place) => {
              // setPlace(place);
              handleInputChange('location', place);
            }}
          />
        </div>
        <div>
          <h2 className='mb-3 text-lg font-semibold text-gray-700 sm:text-xl'>Duration of your trip</h2>
          <Input placeholder={'For Example: 2'} type="number"
            onChange={(e) => handleInputChange('noOfDays', e.target.value)}
          />
        </div>
        <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-700 sm:text-xl">
          What&apos;s your estimated budget?
        </h2>
          <div className='grid grid-cols-2 gap-5 mt-4 sm:grid-cols-3'>
            {SelectBudgetOptions.map((item, index) =>
              <div key={index}
                onClick={() => handleInputChange('budget', item.title)}
                className={`p-5 rounded-xl border transition cursor-pointer bg-white hover:shadow-lg
                ${formData?.budget == item.title && 'shadow-lg border-blue-700'}
                `}>
                <h2 className='mb-2 text-3xl'>{item.icon}</h2>
                <h2 className='text-base font-semibold'>{item.title}</h2>
                <h2 className='text-sm text-gray-500'>{item.desc}</h2>
              </div>
            )}
          </div>
        </div>
        <div>
          <h2 className='mb-3 text-lg font-semibold text-gray-700 sm:text-xl'>Who&apos;s Joining You on This Adventure?</h2>
          <div className='grid grid-cols-2 gap-5 mt-4 sm:grid-cols-3'>
            {SelectTravelesList.map((item, index) =>
              <div key={index}
                onClick={() => handleInputChange('traveler', item.people)}
                className={`p-5 rounded-xl border transition cursor-pointer bg-white hover:shadow-lg
                ${formData?.traveler == item.people && 'shadow-lg border-blue-700'}
                `}>
                <h2 className='mb-2 text-3xl'>{item.icon}</h2>
                <h2 className='text-base font-semibold'>{item.title}</h2>
                <h2 className='text-sm text-gray-500'>{item.desc}</h2>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className='flex justify-end mt-12 mb-3 gap-4'>
        <Button
          variant="outline"
          className='px-6 py-3 text-sm font-semibold rounded-full shadow-md sm:text-base'
          onClick={() => setShowChatBot(true)}
        >
          <FiMessageSquare className='h-5 w-5 mr-2' />
          Chat with AI
        </Button>
        <Button className='px-6 py-3 text-sm font-semibold text-white transition bg-blue-700 rounded-full shadow-md hover:bg-blue-700 sm:text-base disabled:opacity-60'
          disabled={loading}
          onClick={OnGenerateTrip}>
          {loading ?
            <FiLoader className='h-7 w-7 animate-spin' /> : 'Plan My Journey'
          }
        </Button>
      </div>
      {showChatBot && <ChatBot onClose={() => setShowChatBot(false)} />}
      {/* <Dialog open={openDailog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center text-gray-800">Sign In Required</DialogTitle>

            <DialogDescription>
              <img src="/logo.png" width={200} />
              <h2 className='text-lg font-bold mt-7'>Sign In Required</h2>
              <p>Sign in to the App with Google authentication securely</p>
              <Button
                disabled={loading}
                onClick={login}
                className="flex items-center w-full gap-4 mt-5">
                <FcGoogle className='h-9 w-9' />Continue with Google
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog> */}
    </div>
  );
}

export default CreateTrip;
