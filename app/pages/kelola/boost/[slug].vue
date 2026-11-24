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
  serverKeySet: boolean
  clientKeySet: boolean
  serverKeySandbox: boolean
  clientKeySandbox: boolean
  isProduction: boolean
  snapScriptUrl: string
}
interface SnapWindow extends Window {
  snap?: { pay: (token: string, options: Record<string, () => void>) => void }
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

// Snap.js tidak dimuat lewat <script> di head, tapi setelah halaman ini siap.
// Kita simpan promise-nya supaya klik tombol menunggu sampai window.snap benar
// benar ada, bukan langsung gagal dengan "layanan belum siap".
let snapSiap: Promise<boolean> | null = null
const konfigurasi = ref<Konfigurasi | null>(null)

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

function muatSnap(url: string, clientKey: string) {
  const win = window as SnapWindow
  if (win.snap) return Promise.resolve(true)
  return new Promise<boolean>(resolve => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-snapjs]')
    const script = existing ?? document.createElement('script')
    script.addEventListener('load', () => resolve(Boolean(win.snap)))
    script.addEventListener('error', () => resolve(false))
    if (!existing) {
      script.src = url
      script.dataset.clientKey = clientKey
      script.dataset.snapjs = 'true'
      script.async = true
      document.head.appendChild(script)
    }
  })
}

// Data paket dimuat lewat useAsyncData supaya pilihan sudah tampil di HTML server,
// tanpa kedip skeleton. Snap.js tetap dimuat di klien karena butuh objek window.
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

async function bayar() {
  if (!dipilih.value || !lapak.value || sedangBayar.value) return
  pesan.value = ''
  gagal.value = ''

  if (!konfigurasi.value?.clientKeySet) {
    gagal.value = 'Kunci pembayaran belum diisi di server. Hubungi pengelola.'
    return
  }

  sedangBayar.value = true
  try {
    const result = await $fetch<{ orderId: string; snapToken: string }>('/api/boosts', {
      method: 'POST',
      body: { businessId: lapak.value.id, packageId: dipilih.value },
    })

    const siap = await (snapSiap ?? Promise.resolve(false))
    const win = window as SnapWindow
    if (!siap || !win.snap) {
      gagal.value =
        'Jendela pembayaran Midtrans gagal dimuat. Periksa koneksi lalu muat ulang halaman.'
      return
    }

    win.snap.pay(result.snapToken, {
      onSuccess: () => {
        pesan.value = 'Pembayaran diterima. Boost aktif setelah Midtrans mengonfirmasi transaksi.'
      },
      onPending: () => {
        pesan.value = 'Pembayaran menunggu konfirmasi.'
      },
      onError: () => {
        gagal.value = 'Pembayaran gagal. Coba lagi.'
      },
      onClose: () => {
        pesan.value = 'Jendela pembayaran ditutup.'
      },
    })
  } catch (error: unknown) {
    gagal.value = pesanError(error, 'Checkout gagal dibuat.')
  } finally {
    sedangBayar.value = false
  }
}

onMounted(() => {
  if (konfigurasi.value?.clientKeySet) {
    snapSiap = muatSnap(
      konfigurasi.value.snapScriptUrl,
      String(useRuntimeConfig().public.midtransClientKey ?? ''),
    )
  }
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8">
    <NuxtLink :to="`/kelola/${slug}`" class="text-sm text-primary hover:underline"
      >Kembali ke kelola lapak</NuxtLink
    >
    <h1 class="mt-3 font-display text-3xl font-semibold">Boost {{ lapak?.name ?? 'lapakmu' }}</h1>
    <p class="mt-2 text-muted">Pilih durasi sorotan. Pembayaran diproses Midtrans.</p>

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
        v-if="konfigurasi && (!konfigurasi.serverKeySet || !konfigurasi.clientKeySet)"
        class="rounded-tag border border-danger/40 bg-surface p-4 text-sm text-danger"
        role="alert"
      >
        Pembayaran belum bisa diproses karena kunci Midtrans belum lengkap di server ({{
          konfigurasi.serverKeySet ? '' : 'server key kosong'
        }}{{ !konfigurasi.serverKeySet && !konfigurasi.clientKeySet ? ', ' : ''
        }}{{ konfigurasi.clientKeySet ? '' : 'client key kosong' }}). Hubungi pengelola aplikasi.
      </p>
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
      <p v-if="pesan" class="text-sm text-primary" role="status">{{ pesan }}</p>
      <button
        type="button"
        class="min-h-11 rounded-tag bg-primary px-5 font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!dipilih || sedangBayar || !konfigurasi?.serverKeySet"
        @click="bayar"
      >
        {{ sedangBayar ? 'Menyiapkan pembayaran...' : 'Lanjut ke pembayaran' }}
      </button>
    </div>
  </div>
</template>
