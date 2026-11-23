<script setup lang="ts">
useHead({ title: 'Peta lapak di sekitarmu' })

interface Kategori {
  id: number
  slug: string
  name: string
  color: string
}

interface ItemPeta {
  id: string
  slug: string
  name: string
  latitude: number | null
  longitude: number | null
  distanceMeters: number | null
  isBoosted: boolean
  boostEndsAt: string | null
  photoUrl: string | null
  category: { slug: string, name: string, color: string }
}

interface HasilDaftar {
  origin: { lat: number, lng: number } | null
  radius: number | null
  total: number
  items: ItemPeta[]
}

// Titik pusat awal: kampus ITB. Angka ini titik acuan peta, bukan klaim data.
const PUSAT_AWAL = { lat: -6.8915, lng: 107.6107 }

const { data: kategori } = await useFetch<Kategori[]>('/api/categories', { default: () => [] })

const pusat = ref({ ...PUSAT_AWAL })
const radius = ref(3000)
const cari = ref('')
const cariAktif = ref('')
const kategoriDipilih = ref<string[]>([])
const urut = ref<'terdekat' | 'terbaru' | 'nama'>('terdekat')
const terpilih = ref<string | null>(null)
const statusLokasi = ref<'idle' | 'meminta' | 'dapat' | 'ditolak'>('idle')
const pesanLokasi = ref('')

let jedaCari: ReturnType<typeof setTimeout> | undefined
watch(cari, (nilai) => {
  clearTimeout(jedaCari)
  jedaCari = setTimeout(() => { cariAktif.value = nilai.trim() }, 300)
})
onBeforeUnmount(() => clearTimeout(jedaCari))

const query = computed(() => ({
  lat: pusat.value.lat,
  lng: pusat.value.lng,
  radius: radius.value,
  sort: urut.value,
  q: cariAktif.value || undefined,
  category: kategoriDipilih.value.length ? kategoriDipilih.value.join(',') : undefined,
}))

const { data, status, error, refresh } = await useFetch<HasilDaftar>('/api/businesses', {
  query,
  default: () => ({ origin: null, radius: null, total: 0, items: [] }),
  watch: [query],
})

const daftar = computed(() => data.value?.items ?? [])
const memuat = computed(() => status.value === 'pending')
const adaError = computed(() => status.value === 'error')

function alihkanKategori(slug: string) {
  const posisi = kategoriDipilih.value.indexOf(slug)
  if (posisi === -1) kategoriDipilih.value = [...kategoriDipilih.value, slug]
  else kategoriDipilih.value = kategoriDipilih.value.filter((s) => s !== slug)
}

function pakaiLokasiSaya() {
  if (!import.meta.client || !navigator.geolocation) {
    statusLokasi.value = 'ditolak'
    pesanLokasi.value = 'Peramban ini belum mendukung deteksi lokasi. Isi titik pusat secara manual lewat peta.'
    return
  }

  statusLokasi.value = 'meminta'
  pesanLokasi.value = ''

  navigator.geolocation.getCurrentPosition(
    (posisi) => {
      pusat.value = { lat: posisi.coords.latitude, lng: posisi.coords.longitude }
      statusLokasi.value = 'dapat'
      pesanLokasi.value = 'Titik pusat sekarang memakai lokasi kamu.'
    },
    (galat) => {
      statusLokasi.value = 'ditolak'
      pesanLokasi.value = galat.code === galat.PERMISSION_DENIED
        ? 'Izin lokasi ditolak. Daftar dan peta tetap memakai titik pusat kampus.'
        : 'Lokasi tidak bisa dibaca. Daftar dan peta tetap memakai titik pusat kampus.'
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
  )
}

function kembaliKeKampus() {
  pusat.value = { ...PUSAT_AWAL }
  statusLokasi.value = 'idle'
  pesanLokasi.value = ''
}

const adaFilter = computed(() => Boolean(cariAktif.value) || kategoriDipilih.value.length > 0)
</script>

<template>
  <div class="mx-auto max-w-[100rem] px-4 py-6 lg:py-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Temukan lapak di sekitarmu
        </h1>
        <p class="mt-2 max-w-prose text-sm text-muted">
          Warung, kos, dan bengkel di sekitar kampus. Urutan daftar mendahulukan lapak
          unggulan, lalu jarak terdekat.
        </p>
      </div>
      <NuxtLink
        to="/kelola/baru"
        class="inline-flex min-h-11 items-center rounded-tag bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"
      >
        Daftarkan lapak
      </NuxtLink>
    </div>

    <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <label for="cari-lapak" class="sr-only">Cari nama lapak</label>
        <input
          id="cari-lapak"
          v-model="cari"
          type="search"
          placeholder="Cari nama lapak, misalnya kopi"
          class="min-h-11 w-full rounded-tag border border-border bg-surface px-3 text-sm placeholder:text-muted"
        >
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="inline-flex min-h-11 items-center rounded-tag border border-border bg-surface px-3 text-sm hover:border-muted"
          :disabled="statusLokasi === 'meminta'"
          @click="pakaiLokasiSaya"
        >
          {{ statusLokasi === 'meminta' ? 'Membaca lokasi...' : 'Pakai lokasi saya' }}
        </button>
        <button
          v-if="pusat.lat !== PUSAT_AWAL.lat || pusat.lng !== PUSAT_AWAL.lng"
          type="button"
          class="inline-flex min-h-11 items-center rounded-tag border border-border bg-surface px-3 text-sm hover:border-muted"
          @click="kembaliKeKampus"
        >
          Kembali ke kampus
        </button>
        <label for="urut" class="sr-only">Urutkan daftar</label>
        <select
          id="urut"
          v-model="urut"
          class="min-h-11 rounded-tag border border-border bg-surface px-3 text-sm"
        >
          <option value="terdekat">Terdekat</option>
          <option value="terbaru">Terbaru</option>
          <option value="nama">Nama A-Z</option>
        </select>
      </div>
    </div>

    <p v-if="pesanLokasi" class="mt-2 text-sm" :class="statusLokasi === 'ditolak' ? 'text-danger' : 'text-muted'" role="status">
      {{ pesanLokasi }}
    </p>

    <div class="mt-4 flex flex-wrap items-center gap-2">
      <ChipKategori
        label="Semua"
        :aktif="kategoriDipilih.length === 0"
        @klik="kategoriDipilih = []"
      />
      <ChipKategori
        v-for="k in kategori"
        :key="k.id"
        :label="k.name"
        :warna="k.color"
        :aktif="kategoriDipilih.includes(k.slug)"
        @klik="alihkanKategori(k.slug)"
      />
    </div>

    <div class="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
      <section aria-label="Peta lapak" class="order-2 lg:order-1">
        <ClientOnly>
          <div class="h-[26rem] overflow-hidden rounded-tag border border-border lg:h-[calc(100vh-15rem)]">
            <PetaLapak
              :items="daftar"
              :pusat="pusat"
              :terpilih="terpilih"
              :tampilkan-lokasi-saya="statusLokasi === 'dapat'"
              @pilih="terpilih = $event"
            />
          </div>
          <template #fallback>
            <div class="flex h-[26rem] items-center justify-center rounded-tag border border-dashed border-border text-sm text-muted lg:h-[calc(100vh-15rem)]">
              Memuat peta...
            </div>
          </template>
        </ClientOnly>
      </section>

      <section aria-label="Daftar lapak" class="order-1 lg:order-2">
        <div class="mb-3 flex items-baseline justify-between">
          <h2 class="font-display text-lg font-semibold">
            {{ adaFilter ? 'Hasil pencarian' : 'Sekitar sini' }}
          </h2>
          <p v-if="!memuat && !adaError" class="text-sm text-muted tabular-nums">
            {{ data?.total ?? 0 }} lapak
          </p>
        </div>

        <!-- Keadaan memuat -->
        <ul v-if="memuat" class="space-y-2" aria-busy="true" aria-live="polite">
          <li class="sr-only">Memuat daftar lapak.</li>
          <li v-for="n in 4" :key="n" class="h-[5.25rem] animate-pulse rounded-tag border border-border bg-surface" />
        </ul>

        <!-- Keadaan galat -->
        <div v-else-if="adaError" class="rounded-tag border border-danger/40 bg-surface p-4">
          <p class="font-medium text-danger">Daftar lapak gagal dimuat.</p>
          <p class="mt-1 text-sm text-muted">
            Sambungan ke server terputus. Coba muat ulang.
          </p>
          <button
            type="button"
            class="mt-3 inline-flex min-h-11 items-center rounded-tag border border-border px-3 text-sm hover:border-muted"
            @click="refresh()"
          >
            Muat ulang
          </button>
        </div>

        <!-- Keadaan kosong -->
        <div v-else-if="daftar.length === 0" class="rounded-tag border border-dashed border-border bg-surface p-6 text-center">
          <p class="font-medium">Belum ada lapak yang cocok.</p>
          <p class="mt-1 text-sm text-muted">
            <template v-if="adaFilter">
              Coba hapus kata kunci atau pilih kategori lain.
            </template>
            <template v-else>
              Belum ada pemilik yang mendaftarkan lapak di sekitar titik ini.
            </template>
          </p>
          <button
            v-if="adaFilter"
            type="button"
            class="mt-4 inline-flex min-h-11 items-center rounded-tag bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90"
            @click="cari = ''; cariAktif = ''; kategoriDipilih = []"
          >
            Hapus semua filter
          </button>
        </div>

        <ol v-else class="space-y-2">
          <li v-for="item in daftar" :key="item.id">
            <KartuLapak
              :lapak="item"
              :terpilih="terpilih === item.slug"
              @pilih="terpilih = item.slug"
            />
          </li>
        </ol>

        <p v-if="error" class="mt-3 text-sm text-danger">
          {{ error.message }}
        </p>
      </section>
    </div>
  </div>
</template>
