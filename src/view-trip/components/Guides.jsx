import PropTypes from 'prop-types'
import GuideCardItem from './GuideCardItem'

function Guides({trip}) {
  return (
    <div>
        <h2 className='my-5 text-xl font-bold'>Recommended Guides</h2>
        <div>
          {trip?.tripData?.guideOptions?.map((guide,index) =>(
            <div key={index}>
              <GuideCardItem guide={guide}/>
            </div>
          ))}
        </div>
    </div>
  )
}

Guides.propTypes = {
  trip: PropTypes.shape({
    tripData: PropTypes.shape({
      guideOptions: PropTypes.arrayOf(PropTypes.shape({
        guideName: PropTypes.string.isRequired,
        guideDescription: PropTypes.string,
        guideContact: PropTypes.string,
        guideRating: PropTypes.string,
        guidePrice: PropTypes.string,
      })).isRequired,
    }).isRequired,
  }).isRequired,
}

export default Guides
