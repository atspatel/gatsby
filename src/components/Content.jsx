import { useState } from 'react'
import { photoUrl, splitBullets } from '../format'
import RichText from './RichText'
import MapView from './MapView'
import Ratings from './Ratings'

export default function Content({ listing, onOpenRoom }) {
  const [showAmenities, setShowAmenities] = useState(false)
  const travel = splitBullets(listing.location.getting_around)
  const preview = listing.amenities
    .filter((group) => group.group !== 'Not included')
    .flatMap((group) => group.amenities)
    .slice(0, 8)
  const offered = listing.amenities.filter((group) => group.group !== 'Not included')
  const missing = listing.amenities.find((group) => group.group === 'Not included')
  const amenityCount = offered.reduce((sum, group) => sum + group.amenities.length, 0)

  return (
    <div className="content">
      <Ratings rating={listing.rating} host={listing.host} />

      <section aria-labelledby="about-title">
        <h2 id="about-title">About this home</h2>
        {listing.description.sections.map((section) => (
          <div key={section.heading || 'intro'} className="prose-block">
            {section.heading && <h3>{section.heading}</h3>}
            <RichText text={section.text} />
          </div>
        ))}
      </section>

      <section id="spaces" aria-labelledby="spaces-title">
        <h2 id="spaces-title">Where you’ll sleep</h2>
        <div className="space-grid">
          {listing.photos.by_room.map((room) => {
            const sleep = listing.sleeping_arrangements.find((space) => space.name === room.name)
            const detail = sleep
              ? sleep.beds.join(' · ')
              : `${room.photos.length} ${room.photos.length === 1 ? 'photo' : 'photos'}${room.details.length > 0 ? ` · ${room.details.slice(0, 2).join(', ')}` : ''}`
            return (
              <button key={room.name} type="button" className="space-card" onClick={() => onOpenRoom(room.name)}>
                {room.photos[0] && <img src={photoUrl(room.photos[0], 720)} alt="" />}
                <strong>{room.name}</strong>
                <small>{detail}</small>
              </button>
            )
          })}
          {listing.sleeping_arrangements
            .filter((space) => !listing.photos.by_room.some((room) => room.name === space.name))
            .map((space) => (
              <article key={space.name} className="space-card">
                {space.photo && <img src={photoUrl(space.photo, 720)} alt="" />}
                <strong>{space.name}</strong>
                <small>{space.beds.join(' · ')}</small>
              </article>
            ))}
        </div>
      </section>

      <section id="amenities" aria-labelledby="amenities-title">
        <h2 id="amenities-title">What this place offers</h2>
        {showAmenities ? (
          <div className="amenity-groups">
            {offered.map((group) => (
                <div key={group.group}>
                  <h3>{group.group}</h3>
                  <ul>
                    {group.amenities.map((amenity) => (
                      <li key={amenity.title}>
                        <strong>{amenity.title}</strong>
                        {amenity.subtitle && <span>{amenity.subtitle}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        ) : (
          <ul className="amenity-preview">
            {preview.map((amenity) => (
              <li key={amenity.title}>
                <strong>{amenity.title}</strong>
                {amenity.subtitle && <span>{amenity.subtitle}</span>}
              </li>
            ))}
          </ul>
        )}
        <button type="button" className="outline-button" onClick={() => setShowAmenities((open) => !open)}>
          {showAmenities ? 'Show fewer' : `Show all ${amenityCount} amenities`}
        </button>
        {missing && (
          <div className="missing">
            <h3>{missing.group}</h3>
            <ul>
              {missing.amenities.map((amenity) => (
                <li key={amenity.title}>
                  <strong>{amenity.title}</strong>
                  {amenity.subtitle && <span>{amenity.subtitle}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section id="location" aria-labelledby="location-title">
        <h2 id="location-title">Where you’ll be</h2>
        <p className="lead">{listing.location.summary}</p>
        <MapView
          latitude={listing.location.latitude}
          longitude={listing.location.longitude}
          label={`Map of ${listing.location.subtitle || listing.location.city || 'this home'}`}
        />
        <p className="quiet">
          {listing.location.is_exact ? 'The pin is the listing’s published location.' : 'The pin is approximate.'}{' '}
          <a
            href={`https://www.openstreetmap.org/?mlat=${listing.location.latitude}&mlon=${listing.location.longitude}#map=15/${listing.location.latitude}/${listing.location.longitude}`}
            target="_blank"
            rel="noreferrer"
          >
            Open the map
          </a>
        </p>
        <blockquote>
          <RichText text={listing.location.neighborhood} />
          <footer>From the host</footer>
        </blockquote>
        <h3>Getting around</h3>
        <RichText text={travel.before} />
        <ul className="plain-list">
          {travel.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {travel.after && <RichText text={travel.after} />}
        <div className="nearby">
          {listing.location.nearby.map((group) => (
            <div key={group.group}>
              <h3>{group.group}</h3>
              <ul>
                {group.places.map((place) => (
                  <li key={place.name}>
                    <strong>{place.name}</strong>
                    <span>{place.distance}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="rules-title">
        <h2 id="rules-title">House rules</h2>
        <p>{listing.house_rules.intro}</p>
        {listing.house_rules.groups.map((group) => (
          <div key={group.title} className="rule-group">
            <h3>{group.title}</h3>
            <ul>
              {group.items.map((item) => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  {item.description && <RichText text={item.description} />}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <h3>Safety</h3>
        <ul className="plain-list">
          {listing.safety.groups.flatMap((group) =>
            group.items.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                {item.description ? ` — ${item.description}` : ''}
              </li>
            )),
          )}
        </ul>
        <h3>Accessibility</h3>
        <ul className="plain-list">
          {listing.accessibility.map((item) => (
            <li key={item.feature}>
              <strong>{item.feature}</strong>
              {item.description && <span>{item.area}. {item.description}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section id="host" className="host" aria-labelledby="host-title">
        <div className="host-card">
          <div className="host-head">
            <img src={listing.host.profile_picture_url} alt="" />
            <div>
              <h2 id="host-title">Hosted by {listing.host.name}</h2>
              <p className="host-badges">
                {listing.host.is_superhost && <span className="superhost">Superhost</span>}
                {listing.host.is_verified && <span>Identity verified</span>}
              </p>
            </div>
          </div>
          <ul className="host-stats">
            <li>
              <strong>{listing.host.reviews}</strong>
              <span>Reviews</span>
            </li>
            <li>
              <strong>{listing.host.rating}</strong>
              <span>Rating</span>
            </li>
            <li>
              <strong>{listing.host.years_hosting}</strong>
              <span>{String(listing.host.years_hosting) === '1' ? 'Year hosting' : 'Years hosting'}</span>
            </li>
          </ul>
          <p className="host-response">
            {listing.host.response_rate}
            {listing.host.response_time ? ` · ${listing.host.response_time}` : ''}
          </p>
          <RichText text={listing.host.about} />
          {listing.host.highlights?.length > 0 && (
            <ul className="host-chips">
              {listing.host.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
