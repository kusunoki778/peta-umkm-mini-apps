<script setup lang="ts">
import type { FetchError } from 'ofetch'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))

type Item = { id: string, name: string, price: number | null, description: string | null }
type Hour = { id: string, day: number, openTime: string, closeTime: string, closed: boolean }

type Detail = {
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
  category: { name: string, color: string }
  photos: { id: string, url: string, alt: string | null }[]
  items: Item[]
  hours: Hour[]
}

const { data: business, status, error, refresh } = await useFetch<Detail>(
  () => `/api/businesses/${slug.value}`,
)

useSeoMeta({ title: () => business.value?.name ?? 'Kelola lapak' })

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu verifikasi admin',
  live: 'Tayang di peta',
  rejected: 'Ditolak admin',
  inactive: 'Tidak aktif',
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const pesan = ref('')
const pesanError = ref('')
const sibuk = ref(false)

function reset(pesanSukses = '') {
  pesan.value = pesanSukses
  pesanError.value = ''
}

async function kirim(fn: () => Promise<unknown>, pesanSukses: string) {
  sibuk.value = true
  pesan.value = ''
  pesanError.value = ''
  try {
    await fn()
    await refresh()
    pesan.value = pesanSukses
  }
  catch (err) {
    const failure = err as FetchError<{ message?: string }>
    pesanError.value = failure.data?.message ?? 'Perubahan gagal disimpan.'
  }
  finally {
    sibuk.value = false
  }
}

// --- Item menu / layanan -------------------------------------------------
const itemBaru = reactive({ name: '', price: '', description: '' })

function tambahItem() {
  const businessId = business.value?.id
  if (!businessId) return
  return kirim(
    () => $fetch<{ id: string }>(`/api/businesses/${businessId}/items`, {
      method: 'POST',
      body: {
        name: itemBaru.name,
        price: itemBaru.price === '' ? null : Number(itemBaru.price),
        description: itemBaru.description || null,
      },
    }),
    'Item ditambahkan.',
  ).then(() => Object.assign(itemBaru, { name: '', price: '', description: '' }))
}

function hapusItem(itemId: string) {
  return kirim(() => $fetch<{ ok: boolean }>(`/api/items/${itemId}`, { method: 'DELETE' }), 'Item dihapus.')
}

// --- Jam buka -----------------------------------------------------------
const jamDraft = ref<{ day: number, openTime: string, closeTime: string, closed: boolean }[]>([])

watchEffect(() => {
  if (!business.value) return
  jamDraft.value = HARI.map((_, day) => {
    const existing = business.value!.hours.find(hour => hour.day === day)
    return {
      day,
      openTime: existing?.openTime ?? '08:00',
      closeTime: existing?.closeTime ?? '20:00',
      closed: existing?.closed ?? false,
    }
  })
})

function simpanJam() {
  const businessId = business.value?.id
  if (!businessId) return
  return kirim(
    () => $fetch<{ ok: boolean }>(`/api/businesses/${businessId}/hours`, {
      method: 'PUT',
      body: { hours: jamDraft.value },
    }),
    'Jam buka disimpan.',
  )
}

// --- Identitas lapak ----------------------------------------------------
const edit = ref(false)
const form = reactive({ name: '', address: '', description: '', phone: '', whatsapp: '', latitude: '', longitude: '' })

function mulaiEdit() {
  if (!business.value) return
  Object.assign(form, {
    name: business.value.name,
    address: business.value.address,
    description: business.value.description ?? '',
    phone: business.value.phone ?? '',
    whatsapp: business.value.whatsapp ?? '',
    latitude: business.value.latitude === null ? '' : String(business.value.latitude),
    longitude: business.value.longitude === null ? '' : String(business.value.longitude),
  })
  edit.value = true
  reset()
}

function simpanEdit() {
  const businessId = business.value?.id
  if (!businessId) return
  return kirim(
    () => $fetch<{ id: string }>(`/api/businesses/${businessId}`, {
      method: 'PATCH',
      body: {
        name: form.name,
        address: form.address,
        description: form.description || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      },
    }),
    'Data lapak disimpan.',
  ).then(() => { edit.value = false })
}

const konfirmasiHapus = ref(false)

function hapusLapak() {
  const businessId = business.value?.id
  if (!businessId) return
  return kirim(async () => {
    await $fetch<{ ok: boolean }>(`/api/businesses/${businessId}`, { method: 'DELETE' })
    await navigateTo('/kelola')
  }, 'Lapak dihapus.')
}

function rupiah(value: number | null) {
  if (value === null) return 'Tanya pemilik'
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <NuxtLink to="/kelola" class="text-sm text-muted underline underline-offset-2">
      Kembali ke daftar lapak
    </NuxtLink>

    <p v-if="error" role="alert" class="mt-6 rounded-lg border border-danger bg-danger/10 px-3 py-2 text-sm text-danger">
      Lapak gagal dimuat. Pastikan lapak ini milik akunmu.
      <button type="button" class="underline underline-offset-2" @click="refresh()">Coba lagi</button>
    </p>

    <div v-else-if="status === 'pending'" class="mt-6 space-y-3" aria-hidden="true">
      <div class="h-8 w-48 animate-pulse rounded bg-border/40" />
      <div class="h-24 animate-pulse rounded-xl bg-border/40" />
      <div class="h-48 animate-pulse rounded-xl bg-border/40" />
    </div>

    <template v-else-if="business">
      <header class="mt-3">
        <h1 class="font-display text-2xl font-semibold text-ink">{{ business.name }}</h1>
        <p class="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span class="inline-flex items-center gap-1.5">
            <span class="inline-block size-2.5 rounded-full" :style="{ backgroundColor: business.category.color }" aria-hidden="true" />
            {{ business.category.name }}
          </span>
          <span aria-hidden="true">·</span>
          <span>{{ STATUS_LABEL[business.status] ?? business.status }}</span>
          <template v-if="business.isBoosted">
            <span aria-hidden="true">·</span>
            <span class="font-medium text-accent">Boost aktif</span>
          </template>
        </p>
      </header>

      <p
        v-if="pesan"
        role="status"
        class="mt-6 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary"
      >
        {{ pesan }}
      </p>
      <p
        v-if="pesanError"
        role="alert"
        class="mt-6 rounded-lg border border-danger bg-danger/10 px-3 py-2 text-sm text-danger"
      >
        {{ pesanError }}
      </p>

      <NuxtLink :to="`/kelola/${route.params.slug}/boost`" class="mt-6 inline-flex min-h-11 items-center rounded-tag bg-accent px-4 font-semibold text-ink hover:bg-accent/80">
        Boost lapak
      </NuxtLink>

      <section class="mt-6 rounded-xl border border-border bg-surface p-4">
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-display text-lg font-semibold text-ink">Data lapak</h2>
          <button
            v-if="!edit"
            type="button"
            class="text-sm font-medium text-primary underline underline-offset-2"
            @click="mulaiEdit"
          >
            Ubah
          </button>
        </div>

        <form v-if="edit" class="mt-4 space-y-4" novalidate @submit.prevent="simpanEdit">
          <AppField id="ubah-nama" v-model="form.name" label="Nama lapak" required />
          <AppField id="ubah-alamat" v-model="form.address" label="Alamat" required />
          <div class="space-y-1.5">
            <label for="ubah-deskripsi" class="block text-sm font-medium text-ink">Deskripsi</label>
            <textarea
              id="ubah-deskripsi"
              v-model="form.description"
              rows="3"
              maxlength="600"
              class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-ink"
            />
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <AppField id="ubah-telepon" v-model="form.phone" label="Telepon" type="tel" />
            <AppField id="ubah-whatsapp" v-model="form.whatsapp" label="WhatsApp" type="tel" />
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <AppField id="ubah-lintang" v-model="form.latitude" label="Lintang" type="number" required />
            <AppField id="ubah-bujur" v-model="form.longitude" label="Bujur" type="number" required />
          </div>
          <div class="flex gap-2">
            <button
              type="submit"
              :disabled="sibuk"
              class="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:bg-primary/60"
            >
              {{ sibuk ? 'Menyimpan...' : 'Simpan perubahan' }}
            </button>
            <button
              type="button"
              class="rounded-lg border border-border px-4 py-2.5 text-sm font-medium"
              @click="edit = false"
            >
              Batal
            </button>
          </div>
        </form>

        <dl v-else class="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-muted">Alamat</dt>
            <dd class="text-ink">{{ business.address }}</dd>
          </div>
          <div>
            <dt class="text-muted">Telepon</dt>
            <dd class="text-ink">{{ business.phone || 'Belum diisi' }}</dd>
          </div>
          <div>
            <dt class="text-muted">WhatsApp</dt>
            <dd class="text-ink">{{ business.whatsapp || 'Belum diisi' }}</dd>
          </div>
          <div>
            <dt class="text-muted">Koordinat</dt>
            <dd class="text-ink">
              {{ business.latitude === null || business.longitude === null
                ? 'Belum diisi'
                : `${business.latitude}, ${business.longitude}` }}
            </dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-muted">Deskripsi</dt>
            <dd class="text-ink">{{ business.description || 'Belum diisi' }}</dd>
          </div>
        </dl>
      </section>

      <section class="mt-6 rounded-xl border border-border bg-surface p-4">
        <h2 class="font-display text-lg font-semibold text-ink">Menu atau layanan</h2>

        <ul v-if="business.items.length" class="mt-3 divide-y divide-border">
          <li v-for="item in business.items" :key="item.id" class="flex items-start justify-between gap-3 py-2">
            <div>
              <p class="text-ink">{{ item.name }}</p>
              <p class="text-sm text-muted">{{ item.description || 'Tanpa keterangan' }}</p>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm tabular-nums text-ink">{{ rupiah(item.price) }}</span>
              <button
                type="button"
                :disabled="sibuk"
                class="text-sm text-danger underline underline-offset-2"
                @click="hapusItem(item.id)"
              >
                Hapus
              </button>
            </div>
          </li>
        </ul>
        <p v-else class="mt-2 text-sm text-muted">
          Belum ada item. Tambahkan menu atau layanan supaya pembeli tahu apa yang ditawarkan.
        </p>

        <form class="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]" novalidate @submit.prevent="tambahItem">
          <div class="space-y-1.5">
            <label for="item-nama" class="block text-sm font-medium text-ink">Nama item</label>
            <input
              id="item-nama"
              v-model="itemBaru.name"
              required
              class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-ink"
            >
          </div>
          <div class="space-y-1.5">
            <label for="item-harga" class="block text-sm font-medium text-ink">Harga</label>
            <input
              id="item-harga"
              v-model="itemBaru.price"
              type="number"
              min="0"
              step="500"
              class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-ink sm:w-32"
              placeholder="Opsional"
            >
          </div>
          <div class="flex items-end">
            <button
              type="submit"
              :disabled="sibuk || !itemBaru.name.trim()"
              class="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:bg-primary/60"
            >
              Tambah
            </button>
          </div>
        </form>
      </section>

      <section class="mt-6 rounded-xl border border-border bg-surface p-4">
        <h2 class="font-display text-lg font-semibold text-ink">Jam buka</h2>
        <p class="mt-1 text-sm text-muted">
          Centang Tutup untuk hari libur. Jam memakai format 24 jam.
        </p>

        <form class="mt-3 space-y-2" novalidate @submit.prevent="simpanJam">
          <div
            v-for="row in jamDraft"
            :key="row.day"
            class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 text-sm"
          >
            <span class="text-ink">{{ HARI[row.day] }}</span>
            <input
              v-model="row.openTime"
              type="time"
              :disabled="row.closed"
              :aria-label="`Jam buka ${HARI[row.day]}`"
              class="rounded-lg border border-border bg-surface px-2 py-1.5 text-ink disabled:opacity-50"
            >
            <input
              v-model="row.closeTime"
              type="time"
              :disabled="row.closed"
              :aria-label="`Jam tutup ${HARI[row.day]}`"
              class="rounded-lg border border-border bg-surface px-2 py-1.5 text-ink disabled:opacity-50"
            >
            <label class="flex items-center gap-1.5 text-muted">
              <input v-model="row.closed" type="checkbox">
              Tutup
            </label>
          </div>

          <button
            type="submit"
            :disabled="sibuk"
            class="mt-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:bg-primary/60"
          >
            {{ sibuk ? 'Menyimpan...' : 'Simpan jam buka' }}
          </button>
        </form>
      </section>

      <section class="mt-6 rounded-xl border border-border bg-surface p-4">
        <h2 class="font-display text-lg font-semibold text-ink">Hapus lapak</h2>
        <p class="mt-1 text-sm text-muted">
          Lapak akan hilang dari peta dan daftar. Riwayat boost tetap tersimpan untuk admin.
        </p>

        <button
          v-if="!konfirmasiHapus"
          type="button"
          class="mt-3 rounded-lg border border-danger px-4 py-2.5 text-sm font-medium text-danger"
          @click="konfirmasiHapus = true"
        >
          Hapus lapak ini
        </button>

        <div v-else class="mt-3 rounded-lg border border-danger/50 bg-danger/5 p-3">
          <p class="text-sm text-ink">Yakin ingin menghapus {{ business.name }}?</p>
          <div class="mt-3 flex gap-2">
            <button
              type="button"
              :disabled="sibuk"
              class="rounded-lg bg-danger px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              @click="hapusLapak"
            >
              {{ sibuk ? 'Menghapus...' : 'Ya, hapus' }}
            </button>
            <button
              type="button"
              class="rounded-lg border border-border px-4 py-2.5 text-sm font-medium"
              @click="konfirmasiHapus = false"
            >
              Batal
            </button>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
