<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface Paket { id: number, name: string, durationDays: number, price: number, features: string[] | null }
interface Lapak { id: string, name: string, slug: string }

const route = useRoute()
const config = useRuntimeConfig()
const slug = computed(() => String(route.params.slug ?? ''))
const lapak = ref<Lapak | null>(null)
const paket = ref<Paket[]>([])
const dipilih = ref<number | null>(null)
const memuat = ref(true)
const pesan = ref('')
const gagal = ref('')

const rupiah = (nilai: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(nilai)
function pesanError(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'data' in error) {
    const data = error.data
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') return data.message
  }
  return error instanceof Error ? error.message : fallback
}

async function muat() {
  memuat.value = true
  gagal.value = ''
  try {
    const [detail, daftar] = await Promise.all([
      $fetch<Lapak>(`/api/businesses/${slug.value}`),
      $fetch<Paket[]>('/api/boost-packages'),
    ])
    lapak.value = detail
    paket.value = daftar
    dipilih.value = daftar[0]?.id ?? null
  } catch (error: unknown) {
    gagal.value = pesanError(error, 'Paket boost gagal dimuat.')
  } finally {
    memuat.value = false
  }
}

async function bayar() {
  if (!dipilih.value || !lapak.value) return
  pesan.value = ''
  gagal.value = ''
  try {
    const result = await $fetch<{ orderId: string, snapToken: string }>(`/api/boosts`, {
      method: 'POST', body: { businessId: lapak.value.id, packageId: dipilih.value },
    })
    const win = window as Window & { snap?: { pay: (token: string, options: Record<string, () => void>) => void } }
    if (!win.snap) throw new Error('Layanan pembayaran belum siap.')
    win.snap.pay(result.snapToken, {
      onSuccess: () => { pesan.value = 'Pembayaran diterima. Boost aktif setelah Midtrans mengonfirmasi transaksi.' },
      onPending: () => { pesan.value = 'Pembayaran menunggu konfirmasi.' },
      onError: () => { gagal.value = 'Pembayaran gagal. Coba lagi.' },
      onClose: () => { pesan.value = 'Jendela pembayaran ditutup.' },
    })
  } catch (error: unknown) {
    gagal.value = pesanError(error, 'Checkout gagal dibuat.')
  }
}

onMounted(() => {
  const script = document.createElement('script')
  script.src = config.public.midtransIsProduction ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js'
  script.dataset.clientKey = config.public.midtransClientKey
  script.async = true
  document.head.appendChild(script)
  void muat()
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-8">
    <NuxtLink :to="`/kelola/${slug}`" class="text-sm text-primary hover:underline">Kembali ke kelola lapak</NuxtLink>
    <h1 class="mt-3 font-display text-3xl font-semibold">Boost {{ lapak?.name ?? 'lapakmu' }}</h1>
    <p class="mt-2 text-muted">Pilih durasi sorotan. Pembayaran diproses Midtrans.</p>

    <div v-if="memuat" class="mt-8 space-y-3" aria-busy="true"><div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-tag bg-surface" /></div>
    <div v-else-if="gagal && !paket.length" class="mt-8 rounded-tag border border-danger/40 bg-surface p-5 text-danger" role="alert">{{ gagal }}</div>
    <div v-else class="mt-8 space-y-4">
      <label v-for="item in paket" :key="item.id" class="block cursor-pointer rounded-tag border p-4 transition hover:border-primary" :class="dipilih === item.id ? 'border-primary bg-primary/5' : 'border-border bg-surface'">
        <input v-model="dipilih" type="radio" name="paket" :value="item.id" class="sr-only">
        <span class="flex items-center justify-between gap-4"><span><strong>{{ item.name }}</strong><span class="ml-2 text-sm text-muted">{{ item.durationDays }} hari</span></span><strong class="text-primary">{{ rupiah(item.price) }}</strong></span>
        <span v-if="item.features?.length" class="mt-2 block text-sm text-muted">{{ item.features.join(', ') }}</span>
      </label>
      <p v-if="gagal" class="text-sm text-danger" role="alert">{{ gagal }}</p>
      <p v-if="pesan" class="text-sm text-primary" role="status">{{ pesan }}</p>
      <button type="button" class="min-h-11 rounded-tag bg-primary px-5 font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50" :disabled="!dipilih" @click="bayar">Lanjut ke pembayaran</button>
    </div>
  </div>
</template>
