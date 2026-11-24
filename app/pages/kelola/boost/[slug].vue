<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Paket {
  id: number
  name: string
  durationDays: number
  price: number
  features: string[] | null
}
interface Lapak {
  id: string
  name: string
  slug: string
}
interface Konfigurasi {
  siap: boolean
  penyedia: string
  kunciTerisi: boolean
  modeSandbox: boolean
  baseUrlTerisi: boolean
  webhookSecretTerisi: boolean
}
interface Tagihan {
  orderId: string
  amount: number
  checkoutUrl: string
  qrImageUrl: string
  reference: string
  expiresAt: string | null
}

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const lapak = ref<Lapak | null>(null)
const paket = ref<Paket[]>([])
const dipilih = ref<number | null>(null)
const memuat = ref(true)
const pesan = ref('')
const gagal = ref('')
const sedangBayar = ref(false)
const konfigurasi = ref<Konfigurasi | null>(null)
const tagihan = ref<Tagihan | null>(null)
const sedangCek = ref(false)

// Polling jalan sendiri selama halaman terbuka, jadi pembeli tidak perlu menekan
// apa pun setelah membayar. Ini pengganti webhook di localhost.
let pewaktu: ReturnType<typeof setInterval> | null = null

const rupiah = (nilai: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(nilai)

function pesanError(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = error.data
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string')
      return data.message
  }
  return error instanceof Error ? error.message : fallback
}

const { data: dataAwal, error: errorAwal } = await useAsyncData(
  () => `boost-${slug.value}`,
  async () => {
    const [detail, daftar, info] = await Promise.all([
      $fetch<Lapak>(`/api/businesses/${slug.value}`),
      $fetch<Paket[]>('/api/boost-packages'),
      $fetch<Konfigurasi>('/api/payments/config'),
    ])
    return { detail, daftar, info }
  },
)

if (dataAwal.value) {
  lapak.value = dataAwal.value.detail
  paket.value = dataAwal.value.daftar
  konfigurasi.value = dataAwal.value.info
  dipilih.value = dataAwal.value.daftar[0]?.id ?? null
} else if (errorAwal.value) {
  gagal.value = pesanError(errorAwal.value, 'Paket boost gagal dimuat.')
}
memuat.value = false

/** Tanya status ke server. Server yang meneruskan ke MiomiPay. */
async function cekStatus(otomatis = false) {
  if (!tagihan.value || sedangCek.value) return
  sedangCek.value = true
  if (!otomatis) pesan.value = 'Memeriksa status pembayaran...'
  try {
    const hasil = await $fetch<{ lunas: boolean; aktif: boolean; statusPembayaran: string }>(
      `/api/payments/${tagihan.value.orderId}/status`,
    )
    if (hasil.lunas) {
      hentikanPolling()
      pesan.value = 'Pembayaran diterima. Boost sudah aktif.'
      gagal.value = ''
      return
    }
    if (hasil.statusPembayaran === 'failed') {
      hentikanPolling()
      gagal.value = 'Tagihan kedaluwarsa atau dibatalkan. Silakan buat tagihan baru.'
      return
    }
    if (!otomatis) pesan.value = 'Pembayaran belum masuk. Coba lagi setelah membayar.'
  } catch (error) {
    if (!otomatis) gagal.value = pesanError(error, 'Status pembayaran gagal diperiksa.')
  } finally {
    sedangCek.value = false
  }
}

function hentikanPolling() {
  if (pewaktu) {
    clearInterval(pewaktu)
    pewaktu = null
  }
}

function mulaiPolling() {
  hentikanPolling()
  // 5 detik cukup responsif tanpa membebani server MiomiPay.
  pewaktu = setInterval(() => cekStatus(true), 5000)
}

async function bayar() {
  if (!dipilih.value || !lapak.value || sedangBayar.value) return
  pesan.value = ''
  gagal.value = ''

  if (!konfigurasi.value?.siap) {
    gagal.value = 'Kunci pembayaran belum diisi di server. Hubungi pengelola.'
    return
  }

  sedangBayar.value = true
  try {
    tagihan.value = await $fetch<Tagihan>('/api/boosts', {
      method: 'POST',
      body: { businessId: lapak.value.id, packageId: dipilih.value },
    })
    pesan.value = 'Tagihan dibuat. Pindai QR di bawah untuk membayar.'
    mulaiPolling()
  } catch (error: unknown) {
    gagal.value = pesanError(error, 'Tagihan gagal dibuat.')
  } finally {
    sedangBayar.value = false
  }
}

function batalkan() {
  hentikanPolling()
  tagihan.value = null
  pesan.value = ''
  gagal.value = ''
}

onBeforeUnmount(hentikanPolling)
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8">
    <NuxtLink :to="`/kelola/${slug}`" class="text-sm text-primary hover:underline"
      >Kembali ke kelola lapak</NuxtLink
    >
    <h1 class="mt-3 font-display text-3xl font-semibold">Boost {{ lapak?.name ?? 'lapakmu' }}</h1>
    <p class="mt-2 text-muted">Pilih durasi sorotan. Pembayaran QRIS diproses MiomiPay.</p>

    <div v-if="memuat" class="mt-8 space-y-3" aria-busy="true">
      <div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-tag bg-surface" />
    </div>
    <div
      v-else-if="gagal && !paket.length"
      class="mt-8 rounded-tag border border-danger/40 bg-surface p-5 text-danger"
      role="alert"
    >
      {{ gagal }}
    </div>

    <div v-else class="mt-8 space-y-4">
      <p
        v-if="konfigurasi && !konfigurasi.siap"
        class="rounded-tag border border-danger/40 bg-surface p-4 text-sm text-danger"
        role="alert"
      >
        Pembayaran belum bisa diproses karena kunci MiomiPay belum lengkap di server ({{
          konfigurasi.kunciTerisi ? '' : 'kunci API kosong'
        }}{{ !konfigurasi.kunciTerisi && !konfigurasi.baseUrlTerisi ? ', ' : ''
        }}{{ konfigurasi.baseUrlTerisi ? '' : 'alamat API kosong' }}). Hubungi pengelola aplikasi.
      </p>

      <template v-if="!tagihan">
        <label
          v-for="item in paket"
          :key="item.id"
          class="block cursor-pointer rounded-tag border p-4 transition hover:border-primary"
          :class="dipilih === item.id ? 'border-primary bg-primary/5' : 'border-border bg-surface'"
        >
          <input v-model="dipilih" type="radio" name="paket" :value="item.id" class="sr-only" />
          <span class="flex items-center justify-between gap-4"
            ><span
              ><strong>{{ item.name }}</strong
              ><span class="ml-2 text-sm text-muted">{{ item.durationDays }} hari</span></span
            ><strong class="text-primary">{{ rupiah(item.price) }}</strong></span
          >
          <span v-if="item.features?.length" class="mt-2 block text-sm text-muted">{{
            item.features.join(', ')
          }}</span>
        </label>
        <p v-if="gagal" class="text-sm text-danger" role="alert">{{ gagal }}</p>
        <button
          type="button"
          class="min-h-11 rounded-tag bg-primary px-5 font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!dipilih || sedangBayar || !konfigurasi?.siap"
          @click="bayar"
        >
          {{ sedangBayar ? 'Menyiapkan tagihan...' : 'Buat tagihan QRIS' }}
        </button>
      </template>

      <section v-else class="rounded-tag border border-border bg-surface p-5">
        <h2 class="font-display text-xl font-semibold">Pindai QRIS untuk membayar</h2>
        <p class="mt-1 text-sm text-muted">
          Nominal {{ rupiah(tagihan.amount) }}. Nomor tagihan
          <span class="font-mono">{{ tagihan.reference }}</span>.
        </p>

        <img
          :src="tagihan.qrImageUrl"
          alt="Kode QRIS untuk membayar boost"
          width="280"
          height="280"
          class="mx-auto mt-4 size-[280px] rounded-tag border border-border bg-white p-2"
        />

        <a
          :href="tagihan.checkoutUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
        >
          Buka halaman pembayaran
        </a>

        <p v-if="pesan" class="mt-3 text-sm text-primary" role="status" aria-live="polite">
          {{ pesan }}
        </p>
        <p v-if="gagal" class="mt-3 text-sm text-danger" role="alert">{{ gagal }}</p>

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            class="min-h-11 rounded-tag bg-primary px-5 font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="sedangCek"
            @click="cekStatus(false)"
          >
            {{ sedangCek ? 'Memeriksa...' : 'Saya sudah bayar' }}
          </button>
          <button
            type="button"
            class="min-h-11 rounded-tag border border-border px-5 font-semibold hover:border-muted"
            @click="batalkan"
          >
            Batalkan tagihan
          </button>
        </div>
        <p class="mt-3 text-xs text-muted">
          Status diperiksa otomatis tiap 5 detik. Halaman ini boleh ditutup; boost tetap aktif
          setelah pembayaran diterima.
        </p>
      </section>
    </div>
  </div>
</template>
