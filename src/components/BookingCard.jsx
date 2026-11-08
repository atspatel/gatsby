import { useState } from 'react'
import { isoDate, nightsBetween } from '../format'

function initialDates() {
  const start = new Date()
  start.setDate(start.getDate() + 14)
  const end = new Date(start)
  end.setDate(end.getDate() + 3)
  return {
    today: isoDate(new Date()),
    checkIn: isoDate(start),
    checkOut: isoDate(end),
  }
}

const INITIAL_DATES = initialDates()

export default function BookingCard({ listing }) {
  const today = INITIAL_DATES.today
  const [checkIn, setCheckIn] = useState(INITIAL_DATES.checkIn)
  const [checkOut, setCheckOut] = useState(INITIAL_DATES.checkOut)
  const [guests, setGuests] = useState(() => Math.min(2, listing.capacity.max_guests || 1))
  const [pets, setPets] = useState(0)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const nights = nightsBetween(checkIn, checkOut)
  const maxGuests = listing.capacity.max_guests
  const maxPets = listing.pets.max_pets

  function updateGuests(next) {
    setGuests(Math.min(maxGuests, Math.max(1, next)))
    setSent(false)
  }

  function updatePets(next) {
    setPets(Math.min(maxPets, Math.max(0, next)))
    setSent(false)
  }

  function submit(event) {
    event.preventDefault()
    if (!checkIn || !checkOut) {
      setError('Choose a check-in and a checkout date.')
      setSent(false)
      return
    }
    if (nights <= 0) {
      setError('Checkout has to be after check-in.')
      setSent(false)
      return
    }
    setError('')
    setSent(true)
  }

  return (
    <aside className="booking-card" aria-label="Request a stay">
      <div className="booking-intro">
        <p className="price-label">Price on request</p>
        <p className="price-note">The listing does not publish a nightly rate until dates are confirmed with the host.</p>
      </div>

      {sent ? (
        <div className="request-ready" role="status">
          <h2>Request ready</h2>
          <p>
            {nights} {nights === 1 ? 'night' : 'nights'} · {guests} {guests === 1 ? 'guest' : 'guests'}
            {pets > 0 ? ` · ${pets} pet` : ''}
          </p>
          <p>
            {checkIn} to {checkOut}
            {listing.location.city ? `, ${listing.location.city}` : ''}.
          </p>
          <a className="solid-button" href={listing.url} target="_blank" rel="noreferrer">
            Continue on Airbnb
          </a>
          <button type="button" className="text-button dark" onClick={() => setSent(false)}>
            Edit dates
          </button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="date-grid">
            <label>
              Check-in
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={(event) => {
                  setCheckIn(event.target.value)
                  setSent(false)
                }}
                required
              />
            </label>
            <label>
              Checkout
              <input
                type="date"
                value={checkOut}
                min={checkIn || today}
                onChange={(event) => {
                  setCheckOut(event.target.value)
                  setSent(false)
                }}
                required
              />
            </label>
          </div>
          <div className="stepper-row">
            <div>
              <strong>Guests</strong>
              <span>Up to {maxGuests}. Infants are not counted.</span>
            </div>
            <div className="stepper">
              <button type="button" onClick={() => updateGuests(guests - 1)} aria-label="Fewer guests" disabled={guests <= 1}>
                −
              </button>
              <span>{guests}</span>
              <button type="button" onClick={() => updateGuests(guests + 1)} aria-label="More guests" disabled={guests >= maxGuests}>
                +
              </button>
            </div>
          </div>
          <div className="stepper-row">
            <div>
              <strong>Pets</strong>
              <span>{listing.pets.allowed ? `Maximum ${maxPets}` : 'Not allowed'}</span>
            </div>
            <div className="stepper">
              <button type="button" onClick={() => updatePets(pets - 1)} aria-label="Fewer pets" disabled={pets <= 0}>
                −
              </button>
              <span>{pets}</span>
              <button type="button" onClick={() => updatePets(pets + 1)} aria-label="More pets" disabled={pets >= maxPets}>
                +
              </button>
            </div>
          </div>
          {nights > 0 && (
            <p className="nights">
              {nights} {nights === 1 ? 'night' : 'nights'} in {listing.location.city || 'this home'}
            </p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="solid-button" type="submit">
            Request these dates
          </button>
        </form>
      )}
    </aside>
  )
}
