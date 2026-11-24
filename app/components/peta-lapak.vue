<script setup lang="ts">
/**
 * Peta lapak. Dimuat hanya di klien karena Leaflet butuh objek window.
 *
 * Alasan tiap keputusan visual ada di docs/01-desain.md:
 * - Marker boost emas dengan cincin berdenyut adalah satu-satunya gerakan
 *   berulang, karena status boost memang berubah terhadap waktu.
 * - Marker boost dikeluarkan dari cluster supaya tidak tertimbun.
 */
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'

export interface PetaLapak {
  id: string
  slug: string
  name: string
  latitude: number | null
  longitude: number | null
  distanceMeters: number | null
  isBoosted: boolean
  category: { slug: string; name: string; color: string }
}

const props = defineProps<{
  items: PetaLapak[]
  pusat: { lat: number; lng: number }
  terpilih: string | null
  tampilkanLokasiSaya?: boolean
}>()

const emit = defineEmits<{
  pilih: [slug: string]
}>()

const wadah = ref<HTMLDivElement | null>(null)
let peta: L.Map | null = null
let lapisanCluster: L.LayerGroup | null = null
let penandaLokasiSaya: L.CircleMarker | null = null
const penanda = new Map<string, L.Marker>()

function buatIkon(item: PetaLapak) {
  const ukuran = item.isBoosted ? 34 : 26
  const kelas = item.isBoosted ? 'lapak-pin lapak-pin-boost' : 'lapak-pin'
  return L.divIcon({
    className: 'lapak-pin-bungkus',
    html: `<span class="${kelas}" style="--pin-warna:${item.category.color};width:${ukuran}px;height:${ukuran}px"></span>`,
    iconSize: [ukuran, ukuran],
    iconAnchor: [ukuran / 2, ukuran / 2],
  })
}

function gambarUlang() {
  if (!peta) return

  for (const marker of penanda.values()) marker.remove()
  penanda.clear()
  if (lapisanCluster) {
    peta.removeLayer(lapisanCluster)
    lapisanCluster = null
  }

  const cluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    disableClusteringAtZoom: 18,
    maxClusterRadius: 46,
    iconCreateFunction: grup => {
      const jumlah = grup.getChildCount()
      return L.divIcon({
        className: 'lapak-cluster-bungkus',
        html: `<span class="lapak-cluster">${jumlah}</span>`,
        iconSize: [38, 38],
      })
    },
  })

  for (const item of props.items) {
    if (item.latitude === null || item.longitude === null) continue
    const marker = L.marker([item.latitude, item.longitude], {
      icon: buatIkon(item),
      title: item.name,
      alt: item.isBoosted ? `${item.name}, lapak unggulan` : item.name,
      keyboard: true,
      riseOnHover: true,
    })
    marker.on('click', () => emit('pilih', item.slug))
    penanda.set(item.slug, marker)

    // Marker boost tampil langsung supaya terlihat menonjol, bukan ikut terkelompok.
    if (item.isBoosted) marker.addTo(peta)
    else cluster.addLayer(marker)
  }

  cluster.addTo(peta)
  lapisanCluster = cluster
}

onMounted(() => {
  if (!wadah.value) return

  peta = L.map(wadah.value, {
    center: [props.pusat.lat, props.pusat.lng],
    zoom: 15,
    zoomControl: true,
    scrollWheelZoom: true,
  })

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(peta)

  gambarUlang()
})

watch(() => props.items, gambarUlang, { deep: true })

watch(
  () => props.pusat,
  pusat => {
    peta?.setView([pusat.lat, pusat.lng])
  },
)

// Menyorot lapak yang sedang dipilih di panel daftar.
watch(
  () => props.terpilih,
  slug => {
    if (!peta || !slug) return
    const marker = penanda.get(slug)
    if (!marker) return
    const posisi = marker.getLatLng()
    peta.setView(posisi, Math.max(peta.getZoom(), 16))
    marker.setZIndexOffset(1000)
  },
)

watch(
  () => props.tampilkanLokasiSaya,
  aktif => {
    if (!peta || !aktif) {
      if (penandaLokasiSaya) {
        penandaLokasiSaya.remove()
        penandaLokasiSaya = null
      }
      return
    }
    penandaLokasiSaya = L.circleMarker([props.pusat.lat, props.pusat.lng], {
      radius: 7,
      color: '#0f6b4f',
      weight: 3,
      fillColor: '#f7f4ef',
      fillOpacity: 1,
    }).addTo(peta)
  },
)

onBeforeUnmount(() => {
  peta?.remove()
  peta = null
  penanda.clear()
})
</script>

<template>
  <div ref="wadah" class="size-full" role="application" aria-label="Peta sebaran lapak" />
</template>
