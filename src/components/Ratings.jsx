import { ratingLabel } from '../format'

const ICONS = {
  CHECKIN: ['M8 11V8a4 4 0 0 1 8 0v3', 'M6.5 11h11v9h-11z'],
  ACCURACY: ['M5 12.5l4.2 4.2L19 7'],
  LOCATION: ['M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z', 'M12 11.4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z'],
  COMMUNICATION: ['M5 6.5h14v8H8.5L5 17.5v-11z'],
  VALUE: ['M4.5 12.5l8-8H19v6.5l-8 8-6.5-6.5z', 'M15.2 8.2h.01'],
  CLEANLINESS: ['M12 3.5l1.3 3.8 3.8 1.3-3.8 1.3L12 13.7l-1.3-3.8L6.9 8.6l3.8-1.3L12 3.5z', 'M17.5 14.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6z'],
}

function Icon({ category }) {
  const paths = ICONS[category] || ICONS.ACCURACY
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}

function ScoreRing({ value }) {
  const portion = Math.max(0, Math.min(1, value / 5))
  const radius = 28
  const circumference = 2 * Math.PI * radius
  return (
    <svg className="score-ring" viewBox="0 0 72 72" role="img" aria-label={`${value.toFixed(1)} out of 5`}>
      <circle cx="36" cy="36" r={radius} />
      <circle
        className="score-ring-value"
        cx="36"
        cy="36"
        r={radius}
        strokeDasharray={`${circumference * portion} ${circumference}`}
      />
      <text x="36" y="41">
        {value.toFixed(1)}
      </text>
    </svg>
  )
}

export default function Ratings({ rating, host }) {
  const categories = (rating?.categories || []).filter((item) => Number.isFinite(item.rating))
  const hasScore = rating?.count > 0 && Number.isFinite(rating.average)

  return (
    <section className="ratings" aria-labelledby="ratings-title">
      <div className="ratings-head">
        <div>
          <h2 id="ratings-title">Ratings</h2>
          {hasScore ? (
            <p className="quiet">
              Based on {rating.count} stays. The host’s overall rating is {host.rating} from {host.reviews} reviews.
            </p>
          ) : (
            <p className="quiet">This home is new and has no stay ratings yet.</p>
          )}
        </div>
        {hasScore && <ScoreRing value={rating.average} />}
      </div>
      {categories.length > 0 && (
        <ul className="rating-board">
          {categories.map((item) => (
            <li key={item.category}>
              <span className="rating-icon">
                <Icon category={item.category} />
              </span>
              <div>
                <span className="rating-name">{ratingLabel(item.category)}</span>
                <span className="rating-meter" style={{ '--score': item.rating / 5 }}>
                  <span />
                </span>
              </div>
              <strong>{item.rating.toFixed(1)}</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
