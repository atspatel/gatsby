import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const ZOOM = 14

function pinMarkup(size) {
  return `<svg viewBox="0 0 32 42" width="${size}" height="${Math.round(size * 1.3)}" aria-hidden="true"><path d="M16 1.2C7.6 1.2.8 8 .8 16.4.8 28 16 40.2 16 40.2S31.2 28 31.2 16.4C31.2 8 24.4 1.2 16 1.2z" fill="#3d7a52"/><circle cx="16" cy="16.2" r="5.4" fill="#fffdf9"/></svg>`
}

function PinIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 32 42" width={size} height={Math.round(size * 1.3)} aria-hidden="true">
      <path
        d="M16 1.2C7.6 1.2.8 8 .8 16.4.8 28 16 40.2 16 40.2S31.2 28 31.2 16.4C31.2 8 24.4 1.2 16 1.2z"
        fill="#3d7a52"
      />
      <circle cx="16" cy="16.2" r="5.4" fill="#fffdf9" />
    </svg>
  )
}

export default function MapView({ latitude, longitude, label }) {
  const canvasRef = useRef(null)
  const resetRef = useRef(null)
  const [shifted, setShifted] = useState(false)

  useEffect(() => {
    if (latitude == null || longitude == null || !canvasRef.current) return undefined

    const node = canvasRef.current
    node.style.height = '320px'
    const map = L.map(node, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView([latitude, longitude], ZOOM)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)

    const marker = L.marker([latitude, longitude], {
      icon: L.divIcon({
        className: 'map-pin-marker',
        html: pinMarkup(32),
        iconSize: [32, 42],
        iconAnchor: [16, 40],
      }),
      keyboard: true,
      title: 'Center the map',
      alt: 'Listing location',
    }).addTo(map)

    const offCenter = () => {
      const center = map.getCenter()
      return (
        map.getZoom() !== ZOOM ||
        Math.abs(center.lat - latitude) > 0.0008 ||
        Math.abs(center.lng - longitude) > 0.0008
      )
    }

    const reset = () => {
      map.flyTo([latitude, longitude], ZOOM, { duration: 0.55 })
    }

    resetRef.current = reset
    marker.on('click', reset)
    map.on('moveend', () => setShifted(offCenter()))
    const settle = () => {
      map.invalidateSize()
      map.setView([latitude, longitude], ZOOM, { animate: false })
      setShifted(false)
    }
    const timer = window.setTimeout(settle, 0)

    return () => {
      window.clearTimeout(timer)
      resetRef.current = null
      map.remove()
    }
  }, [latitude, longitude])

  if (latitude == null || longitude == null) return null

  return (
    <div className="map-frame">
      <div ref={canvasRef} className="map-canvas" role="region" aria-label={label} />
      {shifted && (
        <button
          type="button"
          className="map-reset"
          onClick={() => resetRef.current?.()}
          aria-label="Center the map on the pin"
        >
          <PinIcon />
        </button>
      )}
    </div>
  )
}
