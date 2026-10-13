/**
 * Altitude et météo actuelles du lieu approximatif du visiteur (bas d'écran de l'accueil).
 *
 * - Position : en-têtes de géolocalisation IP ajoutés gratuitement par Vercel (ville, à quelques km près).
 *   Rien n'est demandé au navigateur ni stocké. En local (pas d'en-têtes), on répond { located: false }.
 * - Météo + altitude : Open-Meteo (gratuit, sans clé). Mis en cache 10 min par zone d'environ 10 km.
 */

const WEATHER: [number[], string][] = [
  [[0], "ciel clair"],
  [[1, 2], "éclaircies"],
  [[3], "couvert"],
  [[45, 48], "brouillard"],
  [[51, 53, 55, 56, 57], "bruine"],
  [[61, 63, 65, 66, 67, 80, 81, 82], "pluie"],
  [[71, 73, 75, 77, 85, 86], "neige"],
  [[95, 96, 99], "orage"],
]
const label = (code: number) => WEATHER.find(([codes]) => codes.includes(code))?.[1] ?? ""

const fetchWeather = defineCachedFunction(
  async (lat: number, lon: number) => {
    const res = await $fetch<{
      elevation: number
      current: { temperature_2m: number; weather_code: number }
    }>("https://api.open-meteo.com/v1/forecast", {
      query: { latitude: lat, longitude: lon, current: "temperature_2m,weather_code" },
      timeout: 4000,
    })
    return {
      altitude: Math.round(res.elevation),
      temperature: Math.round(res.current.temperature_2m),
      weather: label(res.current.weather_code),
    }
  },
  { name: "local-weather", maxAge: 600, getKey: (lat: number, lon: number) => `${lat}:${lon}` },
)

// En développement (npm run dev), pas d'en-têtes Vercel : position de secours à Lyon pour voir l'affichage.
// Jamais utilisée en production, où une requête sans en-têtes répond { located: false }.
const DEV_FALLBACK = { lat: "45.76", lon: "4.84", city: "Lyon" }

export default defineEventHandler(async (event) => {
  const dev = import.meta.dev && !getHeader(event, "x-vercel-ip-latitude")
  const rawLat = dev ? DEV_FALLBACK.lat : getHeader(event, "x-vercel-ip-latitude")
  const rawLon = dev ? DEV_FALLBACK.lon : getHeader(event, "x-vercel-ip-longitude")
  const lat = Number(rawLat)
  const lon = Number(rawLon)
  if (!rawLat || !rawLon || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { located: false }
  }
  const city = dev ? DEV_FALLBACK.city : decodeURIComponent(getHeader(event, "x-vercel-ip-city") ?? "")
  try {
    // arrondi à 0,1° : moins d'appels à Open-Meteo, et la position n'est pas plus précise que la ville
    const wx = await fetchWeather(Math.round(lat * 10) / 10, Math.round(lon * 10) / 10)
    return { located: true, city, ...wx }
  } catch {
    return { located: false }
  }
})
