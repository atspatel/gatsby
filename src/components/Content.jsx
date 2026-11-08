import { useState } from 'react'
import { omitStayTimes, photoUrl, splitBullets, staySchedule } from '../format'
import RichText from './RichText'
import MapView from './MapView'
import Ratings from './Ratings'

function StayNote({ text }) {
  const parts = text.split(/(\bearly check-?ins?\b|\bextensions?\b)/gi)
  return (
    <small>
      <span>
        {parts.map((part, index) =>
          /^(?:early check-?ins?|extensions?)$/i.test(part) ? <b key={index}>{part}</b> : part,
        )}
      </span>
    </small>
  )
}

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
  const schedule = staySchedule(listing)

  return (
    <div className="content">
      <Ratings rating={listing.rating} host={listing.host} />

      <section aria-labelledby="about-title">
        <h2 id="about-title">About this home</h2>
        {schedule && (
          <div className="stay-times" aria-label="Check-in and checkout">
            <article className={schedule.checkInNote ? 'has-note' : undefined}>
              <div>
                <span>Check-in</span>
                <strong>{schedule.checkIn || 'Ask the host'}</strong>
              </div>
              {schedule.checkInNote && <StayNote text={schedule.checkInNote} />}
            </article>
            <article className={schedule.checkOutNote ? 'has-note' : undefined}>
              <div>
                <span>Checkout</span>
                <strong>{schedule.checkOut || 'Ask the host'}</strong>
              </div>
              {schedule.checkOutNote && <StayNote text={schedule.checkOutNote} />}
            </article>
          </div>
        )}
        {listing.description.sections.map((section) => {
          const text = omitStayTimes(section.text, schedule)
          if (!section.heading && !text.trim()) return null
          return (
            <div key={section.heading || 'intro'} className="prose-block">
              {section.heading && <h3>{section.heading}</h3>}
              <RichText text={text} />
            </div>
          )
        })}
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
    </div>
  )
}
