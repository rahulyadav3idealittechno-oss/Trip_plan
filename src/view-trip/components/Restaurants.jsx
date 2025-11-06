import PropTypes from 'prop-types'
import RestaurantCardItem from './RestaurantCardItem'

function Restaurants({trip}) {
  return (
    <div>
        <h2 className='my-5 text-xl font-bold'>Top Restaurant Picks</h2>
        <div className='grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4'>
            {trip?.tripData?.restaurantOptions?.map((restaurant,index) =>(
                <RestaurantCardItem key={index} restaurant={restaurant}/>
            ))}
        </div>
    </div>
  )
}

Restaurants.propTypes = {
  trip: PropTypes.shape({
    tripData: PropTypes.shape({
      restaurantOptions: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        restaurantName: PropTypes.string,
        vicinity: PropTypes.string,
        restaurantAddress: PropTypes.string,
        price_level: PropTypes.number,
        rating: PropTypes.number,
        restaurantImageUrl: PropTypes.string,
      })).isRequired,
    }).isRequired,
  }).isRequired,
}

export default Restaurants
