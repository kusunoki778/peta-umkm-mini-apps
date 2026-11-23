<script setup lang="ts">
import type { FetchError } from 'ofetch'

definePageMeta({ middleware: 'auth' })

useSeoMeta({ title: 'Tambah lapak' })

const { data: categories } = await useFetch('/api/categories')

type FormState = {
  name: string
  categoryId: string
  description: string
  address: string
  phone: string
  whatsapp: string
  latitude: string
  longitude: string
}

const form = reactive<FormState>({
  name: '',
  categoryId: '',
  description: '',
  address: '',
  phone: '',
  whatsapp: '',
  latitude: '',
  longitude: '',
})

const errorMessage = ref('')
const submitting = ref(false)

const canSubmit = computed(() =>
  form.name.trim().length >= 2
  && form.categoryId !== ''
  && form.address.trim().length >= 5
  && form.latitude !== ''
  && form.longitude !== '',
)

function useCurrentLocation() {
  errorMessage.value = ''
  if (!import.meta.client || !('geolocation' in navigator)) {
    errorMessage.value = 'Perangkat ini tidak mendukung pengambilan lokasi. Isi koordinat manual.'
    return
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      form.latitude = position.coords.latitude.toFixed(6)
      form.longitude = position.coords.longitude.toFixed(6)
    },
    () => {
      errorMessage.value = 'Izin lokasi ditolak. Isi koordinat manual, atau geser peta di halaman detail nanti.'
    },
    { enableHighAccuracy: true, timeout: 10000 },
  )
}

async function submit() {
  errorMessage.value = ''
  submitting.value = true
  try {
    const created = await $fetch<{ slug: string }>('/api/businesses', {
      method: 'POST',
      body: {
        name: form.name,
        categoryId: Number(form.categoryId),
        description: form.description || undefined,
        address: form.address,
        phone: form.phone || undefined,
        whatsapp: form.whatsapp || undefined,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      },
    })
    await navigateTo(`/kelola/${created.slug}`)
  }
  catch (error) {
    const failure = error as FetchError<{ message?: string }>
    errorMessage.value = failure.data?.message ?? 'Lapak gagal disimpan. Coba lagi.'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-10">
    <NuxtLink to="/kelola" class="text-sm text-muted underline underline-offset-2">
      Kembali ke daftar lapak
    </NuxtLink>

    <h1 class="mt-3 font-display text-2xl font-semibold text-ink">Tambah lapak</h1>
    <p class="mt-2 text-muted">
      Lapak akan ditinjau admin dulu sebelum muncul di peta. Kamu tetap bisa mengisi menu dan jam buka sekarang.
    </p>

    <form class="mt-8 space-y-5" novalidate @submit.prevent="submit">
      <p
        v-if="errorMessage"
        role="alert"
        class="rounded-lg border border-danger bg-danger/10 px-3 py-2 text-sm text-danger"
      >
        {{ errorMessage }}
      </p>

      <AppField id="lapak-nama" v-model="form.name" label="Nama lapak" required />

      <div class="space-y-1.5">
        <label for="lapak-kategori" class="block text-sm font-medium text-ink">
          Kategori <span class="text-danger" aria-hidden="true">*</span>
        </label>
        <select
          id="lapak-kategori"
          v-model="form.categoryId"
          required
          class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-ink"
        >
          <option value="" disabled>Pilih kategori</option>
          <option v-for="category in categories" :key="category.id" :value="String(category.id)">
            {{ category.name }}
          </option>
        </select>
      </div>

      <div class="space-y-1.5">
        <label for="lapak-deskripsi" class="block text-sm font-medium text-ink">Deskripsi</label>
        <textarea
          id="lapak-deskripsi"
          v-model="form.description"
          rows="3"
          maxlength="600"
          class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-ink"
          placeholder="Apa yang dijual atau ditawarkan di sini?"
        />
      </div>

      <AppField
        id="lapak-alamat"
        v-model="form.address"
        label="Alamat"
        required
        hint="Tulis patokan yang mudah dicari, misalnya nama gang atau bangunan terdekat."
      />

      <div class="grid gap-5 sm:grid-cols-2">
        <AppField id="lapak-telepon" v-model="form.phone" label="Telepon" type="tel" />
        <AppField id="lapak-whatsapp" v-model="form.whatsapp" label="WhatsApp" type="tel" />
      </div>

      <fieldset class="rounded-xl border border-border bg-surface p-4">
        <legend class="px-1 text-sm font-medium text-ink">Titik lokasi</legend>
        <p class="text-sm text-muted">
          Lapak ditampilkan di peta berdasarkan koordinat ini.
        </p>

        <div class="mt-3 grid gap-4 sm:grid-cols-2">
          <AppField
            id="lapak-lintang"
            v-model="form.latitude"
            label="Lintang (latitude)"
            type="number"
            required
            hint="Contoh: -6.891500"
          />
          <AppField
            id="lapak-bujur"
            v-model="form.longitude"
            label="Bujur (longitude)"
            type="number"
            required
            hint="Contoh: 107.610700"
          />
        </div>

        <button
          type="button"
          class="mt-3 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:border-primary hover:text-primary"
          @click="useCurrentLocation"
        >
          Pakai lokasi saya sekarang
        </button>
      </fieldset>

      <button
        type="submit"
        :disabled="submitting || !canSubmit"
        class="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-white hover:bg-primary/90 disabled:bg-primary/60"
      >
        {{ submitting ? 'Menyimpan...' : 'Simpan lapak' }}
      </button>
      <p v-if="!canSubmit" class="text-center text-sm text-muted">
        Isi nama, kategori, alamat, dan koordinat dulu.
      </p>
    </form>
  </div>
</template>
