import PropTypes from 'prop-types'
import PlaceCardItem from './PlaceCardItem'

function PlacesToVisit({trip}) {
  return (
    <div>
        <h2 className='my-5 text-xl font-bold'>Top Attractions</h2>
        <div>
          {trip.tripData?.itinerary?.map((item, index)=>(
            <div key={index} className='mt-5'>
            <h2 className='text-lg font-medium'>Day {item.day}</h2>
            <div className='grid gap-5 md:grid-cols-2'>
            {item.plan?.map((place, placeIndex)=>(
              <div key={placeIndex}>
                <h2 className='text-sm font-medium text-blue-600'>{place.time}</h2>
                <PlaceCardItem place={place}/>

              </div>
            ))}
            </div>
        </div>
          ))}
        </div>
    </div>
  )
}

PlacesToVisit.propTypes = {
  trip: PropTypes.shape({
    tripData: PropTypes.shape({
      itinerary: PropTypes.arrayOf(PropTypes.shape({
        day: PropTypes.string.isRequired,
        plan: PropTypes.arrayOf(PropTypes.shape({
          time: PropTypes.string.isRequired,
          // Add other place properties as needed
        })).isRequired,
      })).isRequired,
    }).isRequired,
  }).isRequired,
}

export default PlacesToVisit
