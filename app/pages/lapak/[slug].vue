<script setup lang="ts">
interface Jam {
  day: number
  openTime: string
  closeTime: string
  closed: boolean
}

interface Item {
  id: string
  name: string
  price: number | null
  description: string | null
}

interface Detail {
  id: string
  slug: string
  name: string
  description: string | null
  address: string
  phone: string | null
  whatsapp: string | null
  latitude: number | null
  longitude: number | null
  status: string
  isOwner: boolean
  isBoosted: boolean
  boostEndsAt: string | null
  category: { name: string; color: string; slug: string }
  photos: { id: string; url: string; alt: string | null }[]
  items: Item[]
  hours: Jam[]
}

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))

const { data: lapak, status, error } = await useFetch<Detail>(() => `/api/businesses/${slug.value}`)

if (error.value && import.meta.server) {
  const event = useRequestEvent()
  if (event) {
    setResponseStatus(event, error.value.statusCode ?? 500)
  }
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

// SEO halaman detail: judul, deskripsi, dan pratinjau tautan. Foto pertama dipakai
// sebagai gambar pratinjau karena stok foto lapak memang berasal dari pemiliknya.
useHead(() => {
  const data = lapak.value
  const deskripsi =
    data?.description?.slice(0, 155) ??
    (data ? `${data.name} di ${data.address}, kategori ${data.category.name}.` : undefined)
  const gambar = data?.photos?.[0]?.url.replace('-kartu.webp', '-detail.webp')
  const url = data ? `/lapak/${data.slug}` : undefined

  return {
    title: data?.name ?? 'Lapak',
    link: url ? [{ rel: 'canonical', href: url }] : [],
    meta: [
      ...(deskripsi ? [{ name: 'description', content: deskripsi }] : []),
      ...(data ? [{ property: 'og:type', content: 'business.business' }] : []),
      ...(url ? [{ property: 'og:url', content: url }] : []),
      ...(data ? [{ property: 'og:title', content: data.name }] : []),
      ...(deskripsi ? [{ property: 'og:description', content: deskripsi }] : []),
      ...(gambar ? [{ property: 'og:image', content: gambar }] : []),
      ...(gambar ? [{ name: 'twitter:card', content: 'summary_large_image' }] : []),
    ],
    script: data
      ? [
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: data.name,
              description: deskripsi,
              address: { '@type': 'PostalAddress', streetAddress: data.address },
              ...(data.phone ? { telephone: data.phone } : {}),
              ...(data.latitude !== null && data.longitude !== null
                ? {
                    geo: {
                      '@type': 'GeoCoordinates',
                      latitude: data.latitude,
                      longitude: data.longitude,
                    },
                  }
                : {}),
            }),
          },
        ]
      : [],
  }
})

function rupiah(nilai: number | null) {
  if (nilai === null) return 'Tanya pemilik'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(nilai)
}

const hariIni = new Date().getDay()
const jamHariIni = computed(() => lapak.value?.hours.find(h => h.day === hariIni) ?? null)

const jamTerurut = computed(() => {
  const daftar = lapak.value?.hours ?? []
  return [...daftar].sort((a, b) => ((a.day + 6) % 7) - ((b.day + 6) % 7))
})

const nomorWhatsapp = computed(() => {
  const nomor = lapak.value?.whatsapp ?? lapak.value?.phone
  if (!nomor) return null
  const digit = nomor.replace(/\D/g, '')
  if (!digit) return null
  return digit.startsWith('0') ? `62${digit.slice(1)}` : digit
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8">
    <div v-if="status === 'pending'" class="space-y-3" aria-busy="true" aria-live="polite">
      <p class="sr-only">Memuat detail lapak.</p>
      <div class="h-8 w-2/3 animate-pulse rounded-tag bg-surface" />
      <div class="h-4 w-1/3 animate-pulse rounded-tag bg-surface" />
      <div class="h-48 animate-pulse rounded-tag bg-surface" />
    </div>

    <div v-else-if="status === 'error'" class="rounded-tag border border-danger/40 bg-surface p-6">
      <h1 class="font-display text-xl font-semibold text-danger">Lapak ini tidak bisa dibuka.</h1>
      <p class="mt-2 text-sm text-muted">
        {{
          error?.statusCode === 404
            ? 'Alamatnya salah, atau lapaknya sudah dihapus pemilik.'
            : 'Server tidak menjawab. Coba muat ulang halaman.'
        }}
      </p>
      <NuxtLink
        to="/"
        class="mt-4 inline-flex min-h-11 items-center rounded-tag border border-border px-3 text-sm hover:border-muted"
      >
        Kembali ke peta
      </NuxtLink>
    </div>

    <article v-else-if="lapak">
      <NuxtLink
        to="/"
        class="mb-6 inline-flex min-h-11 items-center rounded-tag border border-border bg-surface px-3 text-sm font-medium text-ink hover:border-primary hover:text-primary"
      >
        Kembali ke peta
      </NuxtLink>
      <div class="flex items-center gap-2 text-sm">
        <span class="flex items-center gap-1.5 text-muted">
          <span
            class="size-2.5 rounded-full"
            :style="{ backgroundColor: lapak.category.color }"
            aria-hidden="true"
          />
          {{ lapak.category.name }}
        </span>
        <span
          v-if="lapak.isBoosted"
          class="rounded-tag bg-accent/15 px-1.5 py-0.5 text-xs font-semibold text-accent"
        >
          Lapak unggulan
        </span>
        <span
          v-if="lapak.status !== 'live'"
          class="rounded-tag border border-border px-1.5 py-0.5 text-xs text-muted"
        >
          Belum tayang
        </span>
      </div>

      <h1 class="mt-2 font-display text-3xl font-semibold tracking-tight">{{ lapak.name }}</h1>

      <p v-if="lapak.description" class="mt-3 max-w-prose text-muted">{{ lapak.description }}</p>

      <p class="mt-4 text-sm">{{ lapak.address }}</p>

      <div class="mt-3 flex flex-wrap gap-2">
        <a
          v-if="nomorWhatsapp"
          :href="`https://wa.me/${nomorWhatsapp}`"
          class="inline-flex min-h-11 items-center rounded-tag bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"
          rel="noopener noreferrer"
          target="_blank"
        >
          Hubungi lewat WhatsApp
        </a>
        <NuxtLink
          v-if="lapak.isOwner"
          :to="`/kelola/${lapak.slug}`"
          class="inline-flex min-h-11 items-center rounded-tag border border-border px-4 text-sm hover:border-muted"
        >
          Kelola lapak ini
        </NuxtLink>
      </div>

      <div v-if="lapak.photos.length" class="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <img
          v-for="foto in lapak.photos"
          :key="foto.id"
          :src="foto.url.replace('-kartu.webp', '-detail.webp')"
          :srcset="`${foto.url} 480w, ${foto.url.replace('-kartu.webp', '-detail.webp')} 960w`"
          sizes="(min-width: 640px) 240px, 45vw"
          :alt="foto.alt ?? `Foto ${lapak.name}`"
          width="480"
          height="360"
          loading="lazy"
          decoding="async"
          class="aspect-[4/3] w-full rounded-tag border border-border object-cover"
        />
      </div>

      <section class="mt-8">
        <h2 class="font-display text-lg font-semibold">Menu dan layanan</h2>
        <ul
          v-if="lapak.items.length"
          class="mt-3 divide-y divide-border rounded-tag border border-border bg-surface"
        >
          <li
            v-for="item in lapak.items"
            :key="item.id"
            class="flex items-start justify-between gap-4 p-3"
          >
            <span class="min-w-0">
              <span class="block font-medium">{{ item.name }}</span>
              <span v-if="item.description" class="mt-0.5 block text-sm text-muted">{{
                item.description
              }}</span>
            </span>
            <span
              class="shrink-0 text-sm tabular-nums"
              :class="item.price === null ? 'text-muted' : ''"
            >
              {{ rupiah(item.price) }}
            </span>
          </li>
        </ul>
        <p v-else class="mt-2 text-sm text-muted">Pemilik belum menambahkan menu atau layanan.</p>
      </section>

      <section class="mt-8">
        <h2 class="font-display text-lg font-semibold">Jam buka</h2>
        <p v-if="jamHariIni" class="mt-1 text-sm text-muted">
          Hari ini:
          <template v-if="jamHariIni.closed">tutup</template>
          <template v-else>{{ jamHariIni.openTime }} sampai {{ jamHariIni.closeTime }}</template>
        </p>
        <ul
          v-if="jamTerurut.length"
          class="mt-3 divide-y divide-border rounded-tag border border-border bg-surface text-sm"
        >
          <li
            v-for="jam in jamTerurut"
            :key="jam.day"
            class="flex justify-between gap-4 px-3 py-2"
            :class="jam.day === hariIni ? 'font-medium' : ''"
          >
            <span>{{ HARI[jam.day] }}</span>
            <span :class="jam.closed ? 'text-muted' : 'tabular-nums'">
              {{ jam.closed ? 'Tutup' : `${jam.openTime} - ${jam.closeTime}` }}
            </span>
          </li>
        </ul>
        <p v-else class="mt-2 text-sm text-muted">Pemilik belum mengisi jam buka.</p>
      </section>
    </article>
  </div>
</template>
