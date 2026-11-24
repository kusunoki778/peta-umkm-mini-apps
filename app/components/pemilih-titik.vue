<script setup lang="ts">
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = withDefaults(defineProps<{ latitude?: number | null; longitude?: number | null }>(), {
  latitude: null,
  longitude: null,
})
const emit = defineEmits<{ pilih: [latitude: number, longitude: number] }>()
const wadah = ref<HTMLElement | null>(null)
let peta: L.Map | null = null
let penanda: L.Marker | null = null
const pusat = { lat: -6.8915, lng: 107.6107 }

function pasangPenanda(lat: number, lng: number) {
  if (!peta) return
  penanda?.remove()
  penanda = L.marker([lat, lng]).addTo(peta)
  emit('pilih', Number(lat.toFixed(6)), Number(lng.toFixed(6)))
}

onMounted(() => {
  if (!wadah.value) return
  peta = L.map(wadah.value).setView(
    [props.latitude ?? pusat.lat, props.longitude ?? pusat.lng],
    props.latitude !== null && props.longitude !== null ? 16 : 14,
  )
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(peta)
  if (props.latitude !== null && props.longitude !== null)
    pasangPenanda(props.latitude, props.longitude)
  peta.on('click', (event: L.LeafletMouseEvent) =>
    pasangPenanda(event.latlng.lat, event.latlng.lng),
  )
})

watch(
  () => [props.latitude, props.longitude] as const,
  ([latitude, longitude]) => {
    if (
      !peta ||
      latitude === null ||
      latitude === undefined ||
      longitude === null ||
      longitude === undefined
    )
      return
    peta.setView([latitude, longitude], Math.max(peta.getZoom(), 15))
    penanda?.remove()
    penanda = L.marker([latitude, longitude]).addTo(peta)
  },
)

onBeforeUnmount(() => {
  peta?.remove()
  peta = null
  penanda = null
})
</script>

<template>
  <div
    ref="wadah"
    class="h-64 w-full overflow-hidden rounded-lg border border-border"
    role="application"
    aria-label="Pilih titik lokasi lapak di peta"
  />
</template>
