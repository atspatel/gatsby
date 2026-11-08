#!/usr/bin/env python3
"""Fetch Airbnb listing pages into the Gatsby catalog JSON."""

import json
import re
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IDS_PATH = Path(__file__).with_name("listing-ids.txt")
OUT_PATH = ROOT / "src" / "data" / "listings.json"
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)


def text_of(obj):
    if obj is None:
        return None
    if isinstance(obj, str):
        value = obj.strip()
        return value or None
    if isinstance(obj, dict):
        for key in ("localizedString", "text"):
            value = obj.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
        for key in ("content", "ugcContent"):
            found = text_of(obj.get(key))
            if found:
                return found
    return None


class DescriptionParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag == "br":
            self.parts.append("\n")
        elif tag == "b":
            self.parts.append("\n## ")

    def handle_endtag(self, tag):
        if tag == "b":
            self.parts.append("\n")

    def handle_data(self, data):
        self.parts.append(data)


def description_sections(html):
    if not html:
        return []
    parser = DescriptionParser()
    parser.feed(html)
    plain = re.sub(r"\n{3,}", "\n\n", "".join(parser.parts)).strip()
    sections = []
    current = {"heading": None, "text": []}
    for line in plain.splitlines():
        if line.startswith("## "):
            if current["heading"] or any(part.strip() for part in current["text"]):
                sections.append(
                    {
                        "heading": current["heading"],
                        "text": "\n".join(current["text"]).strip(),
                    }
                )
            current = {"heading": line[3:].strip(), "text": []}
        else:
            current["text"].append(line)
    if current["heading"] or any(part.strip() for part in current["text"]):
        sections.append(
            {"heading": current["heading"], "text": "\n".join(current["text"]).strip()}
        )
    return [section for section in sections if section["text"]]


def amenity_subtitle(subtitle):
    if not isinstance(subtitle, dict):
        return None
    return text_of(subtitle)


def detail_description(item):
    return text_of((item or {}).get("description"))


def images_from_items(items):
    urls = []
    for item in items or []:
        uri = ((item or {}).get("image") or {}).get("uri")
        if uri:
            urls.append(uri)
    return urls


def stop_bits(stop):
    bits = []
    for entry in ((stop or {}).get("description") or {}).get("descriptions") or []:
        text = text_of(entry)
        if text:
            bits.append(text)
    return bits


def find_payload(html):
    match = re.search(
        r'<script[^>]*id="data-deferred-state-0"[^>]*>(.*?)</script>',
        html,
        re.S,
    )
    if not match:
        raise ValueError("listing data was not in the page")
    data = json.loads(match.group(1))
    for entry in data.get("niobeClientData") or []:
        body = entry[1] if isinstance(entry, (list, tuple)) and len(entry) > 1 else entry
        if not isinstance(body, dict):
            continue
        payload = body.get("data") or {}
        node = payload.get("node") or {}
        if node.get("pdpPresentation") or payload.get("presentation"):
            return payload
    raise ValueError("listing presentation was not in the page")


def count_from_items(items, word):
    for item in items or []:
        match = re.match(rf"(\d+(?:\.\d+)?)\s+{word}", str(item), re.I)
        if match:
            number = float(match.group(1))
            return int(number) if number.is_integer() else number
    return None


def parse_listing(listing_id, html):
    payload = find_payload(html)
    node = payload.get("node") or {}
    pdp = node.get("pdpPresentation") or {}
    if not pdp:
        raise ValueError("missing listing presentation")

    overview = pdp.get("overview") or {}
    overview_items = overview.get("items") or []
    guest_picker = pdp.get("pdpGuestPickerConfig") or {}
    ratings = node.get("listingRatingStats") or {}
    overall = ratings.get("overallRatingStats") or {}
    categories = []
    for category in ratings.get("categoryRatingStats") or []:
        value = (category.get("value") or {}).get("ratingAverage")
        if isinstance(value, (int, float)):
            categories.append(
                {"category": category.get("categoryTypeA"), "rating": value}
            )

    location = pdp.get("location") or {}
    neighborhood = None
    getting_around = None
    for detail in (location.get("seeAllLocationDetails") or location.get("previewLocationDetails") or []):
        detail_id = detail.get("id")
        content = text_of(detail.get("content"))
        if detail_id == "neighborhood" and content:
            neighborhood = content
        elif detail_id == "transit" and content:
            getting_around = content
    if neighborhood is None:
        previews = location.get("previewLocationDetails") or []
        if previews:
            neighborhood = text_of(previews[0].get("content"))

    nearby = []
    for group in (location.get("nearbyPlacesData") or {}).get("groups") or []:
        nearby.append(
            {
                "group": group.get("title"),
                "places": [
                    {
                        "name": place.get("name"),
                        "category": place.get("category"),
                        "distance": place.get("distance"),
                    }
                    for place in group.get("pois") or []
                ],
            }
        )

    highlights = []
    for item in pdp.get("highlights") or []:
        headline = text_of(item.get("headline"))
        body = text_of(item.get("body"))
        if headline or body:
            highlights.append({"headline": headline, "body": body})

    rooms = []
    for stop in (pdp.get("mediaTour") or {}).get("stops") or []:
        photos = images_from_items(stop.get("items"))
        if not photos:
            continue
        rooms.append(
            {
                "name": stop.get("name") or "Photo",
                "details": stop_bits(stop),
                "photos": photos,
            }
        )

    sleeping = []
    for stop in (pdp.get("sleepingArrangements") or {}).get("stops") or []:
        photo_urls = images_from_items(stop.get("items"))
        sleeping.append(
            {
                "name": stop.get("name"),
                "beds": stop_bits(stop),
                "photo": photo_urls[0] if photo_urls else None,
            }
        )

    amenity_groups = []
    for group in (pdp.get("amenities") or {}).get("seeAllAmenitiesGroups") or []:
        amenity_groups.append(
            {
                "group": group.get("title"),
                "amenities": [
                    {
                        "title": amenity.get("title"),
                        "available": bool(amenity.get("available")),
                        "subtitle": amenity_subtitle(amenity.get("subtitle")),
                    }
                    for amenity in group.get("amenities") or []
                ],
            }
        )

    def groups(block):
        result = []
        for group in (block or {}).get("groupItems") or []:
            result.append(
                {
                    "title": group.get("title"),
                    "items": [
                        {
                            "title": item.get("title"),
                            "description": detail_description(item),
                        }
                        for item in group.get("items") or []
                    ],
                }
            )
        return result

    accessibility = []
    for stop in (pdp.get("accessibilityFeatures") or {}).get("stops") or []:
        bits = stop_bits(stop)
        accessibility.append(
            {
                "area": stop.get("category"),
                "feature": stop.get("name"),
                "description": " ".join(bits) or None,
            }
        )

    host_info = pdp.get("hostInfo") or {}
    passport = host_info.get("passportData") or {}
    stats = {stat.get("type"): stat.get("value") for stat in passport.get("stats") or []}
    sharing = pdp.get("sharingConfig") or {}
    seo = pdp.get("seoFeatures") or {}
    pet = node.get("petPolicy") or {}
    guests = count_from_items(overview_items, "guests") or guest_picker.get("guestMaxCount") or node.get("personCapacity")
    cover = sharing.get("imageUrl") or (rooms[0]["photos"][0] if rooms else None)
    rating_count = overall.get("ratingCount")
    try:
        rating_count = int(rating_count or 0)
    except (TypeError, ValueError):
        rating_count = 0
    rating_average = overall.get("ratingAverage")
    if not isinstance(rating_average, (int, float)):
        rating_average = 0

    long_html = text_of((pdp.get("descriptions") or {}).get("longDescriptionHtml"))
    short = text_of((pdp.get("descriptions") or {}).get("shortDescriptionHtml"))
    host_reviews = stats.get("REVIEW_COUNT") or passport.get("ratingCount") or 0
    try:
        host_reviews = int(host_reviews)
    except (TypeError, ValueError):
        host_reviews = 0

    return {
        "source": "airbnb",
        "url": seo.get("canonicalUrl") or f"https://www.airbnb.co.in/rooms/{listing_id}",
        "listing_id": str(listing_id),
        "managed_by": "Gatsby",
        "name": text_of(pdp.get("title")) or text_of(node.get("description")),
        "property_type": node.get("propertyType"),
        "space_type": node.get("spaceType"),
        "overview": overview.get("title"),
        "capacity": {
            "guests": guests,
            "bedrooms": count_from_items(overview_items, "bedrooms"),
            "beds": count_from_items(overview_items, "beds"),
            "bathrooms": count_from_items(overview_items, "bathrooms"),
            "max_guests": guest_picker.get("guestMaxCount") or guests or 1,
            "children_allowed": guest_picker.get("childrenAllowed"),
            "infants_allowed": guest_picker.get("infantsAllowed"),
            "infants_count_toward_guest_limit": guest_picker.get("includeInfantsInGuestCount"),
            "guest_summary": guest_picker.get("guestCountSummary"),
        },
        "pets": {
            "allowed": bool(pet.get("isAllowed")),
            "max_pets": pet.get("maxPetCount") or 0,
        },
        "rating": {
            "average": rating_average,
            "count": rating_count,
            "categories": categories,
            "few_reviews": bool((pdp.get("quality") or {}).get("hasFewReviews")),
            "guest_favorite": bool((pdp.get("quality") or {}).get("isGuestFavorite")),
        },
        "location": {
            "city": location.get("locationName")
            or ((location.get("subtitle") or "").split(",")[0].strip() or None),
            "subtitle": location.get("subtitle"),
            "summary": location.get("locationSummary"),
            "latitude": location.get("latitude"),
            "longitude": location.get("longitude"),
            "is_exact": location.get("isExactLocation"),
            "neighborhood": neighborhood,
            "getting_around": getting_around,
            "nearby": nearby,
        },
        "highlights": highlights,
        "description": {"short": short, "sections": description_sections(long_html)},
        "sleeping_arrangements": sleeping,
        "amenities": amenity_groups,
        "house_rules": {
            "intro": (pdp.get("rules") or {}).get("description"),
            "groups": groups(pdp.get("rules")),
        },
        "safety": {
            "intro": (pdp.get("safetyAndProperty") or {}).get("description"),
            "groups": groups(pdp.get("safetyAndProperty")),
        },
        "accessibility": accessibility,
        "host": {
            "name": passport.get("name"),
            "is_superhost": bool(passport.get("isSuperhost")),
            "is_verified": bool(passport.get("isVerified")),
            "profile_picture_url": passport.get("profilePictureUrl"),
            "reviews": host_reviews,
            "rating": passport.get("ratingAverage"),
            "years_hosting": stats.get("YEARS_HOSTING"),
            "response_rate": host_info.get("responseRateText"),
            "response_time": host_info.get("responseTimeText"),
            "about": text_of(host_info.get("about")),
            "highlights": [text_of(item.get("text")) for item in host_info.get("highlights") or [] if text_of(item.get("text"))],
        },
        "pricing": {
            "nightly_price": None,
            "note": "No dates were selected, so Airbnb did not include a nightly price in the page data.",
        },
        "photos": {"cover": cover, "by_room": rooms},
    }


def fetch_html(listing_id):
    url = f"https://www.airbnb.co.in/rooms/{listing_id}"
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept-Language": "en-IN,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    last_error = None
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                return response.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as error:
            last_error = error
            if error.code not in (429, 500, 502, 503, 403):
                raise
        except Exception as error:
            last_error = error
        time.sleep(1.5 * (attempt + 1))
    raise last_error


def fetch_one(listing_id):
    html = fetch_html(listing_id)
    listing = parse_listing(listing_id, html)
    if not listing.get("name"):
        raise ValueError("listing name was empty")
    return listing


def main():
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else None
    ids = [line.strip() for line in IDS_PATH.read_text().splitlines() if line.strip()]
    if limit:
        ids = ids[:limit]
    listings = []
    failures = []
    started = time.time()
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(fetch_one, listing_id): listing_id for listing_id in ids}
        for done, future in enumerate(as_completed(futures), start=1):
            listing_id = futures[future]
            try:
                listing = future.result()
                listings.append(listing)
                print(f"[{done}/{len(ids)}] ok {listing_id} {listing['name'][:60]}", flush=True)
            except Exception as error:
                failures.append({"listing_id": listing_id, "error": str(error)})
                print(f"[{done}/{len(ids)}] fail {listing_id} {error}", flush=True)
    order = {listing_id: index for index, listing_id in enumerate(ids)}
    listings.sort(key=lambda item: order.get(item["listing_id"], 9999))
    catalog = {
        "company": {
            "name": "Gatsby",
            "role": "Manages every home in this collection",
        },
        "listings": listings,
    }
    if not limit:
        OUT_PATH.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")
    report = {
        "requested": len(ids),
        "saved": len(listings),
        "failed": failures,
        "seconds": round(time.time() - started, 1),
    }
    Path("/tmp/gatsby-fetch-report.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2), flush=True)
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
