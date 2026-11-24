<script setup lang="ts">
/**
 * Unggah foto lapak. Berkas divalidasi di klien untuk umpan balik cepat, tapi
 * server tetap memeriksa ulang isi berkas dan memperkecil ukurannya.
 */
import type { FetchError } from 'ofetch'

interface Foto {
  id: string
  url: string
  alt: string | null
}

const props = defineProps<{ businessId: string; photos: Foto[]; maksimal?: number }>()
const emit = defineEmits<{ berubah: [] }>()

const MAKS_UKURAN = 5 * 1024 * 1024
const batas = computed(() => props.maksimal ?? 6)
const sisa = computed(() => Math.max(0, batas.value - props.photos.length))

const sibuk = ref(false)
const pesan = ref('')
const gagal = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const altDraft = ref('')

function ukuranTeks(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// URL kartu berukuran kecil; untuk tampilan kelola kita pakai varian detail.
function urlDetail(url: string) {
  return url.replace('-kartu.webp', '-detail.webp')
}

async function unggah(event: Event) {
  const input = event.target as HTMLInputElement
  const berkas = input.files?.[0]
  if (!berkas) return

  pesan.value = ''
  gagal.value = ''

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(berkas.type)) {
    gagal.value = 'Format foto harus JPG, PNG, atau WebP.'
    input.value = ''
    return
  }
  if (berkas.size > MAKS_UKURAN) {
    gagal.value = `Ukuran foto ${ukuranTeks(berkas.size)}, maksimal ${ukuranTeks(MAKS_UKURAN)}.`
    input.value = ''
    return
  }

  sibuk.value = true
  try {
    const badan = new FormData()
    badan.append('foto', berkas)
    if (altDraft.value.trim()) badan.append('alt', altDraft.value.trim())

    await $fetch(`/api/businesses/${props.businessId}/photos`, { method: 'POST', body: badan })
    altDraft.value = ''
    pesan.value = 'Foto ditambahkan.'
    emit('berubah')
  } catch (err) {
    const failure = err as FetchError<{ message?: string }>
    gagal.value = failure.data?.message ?? 'Foto gagal diunggah.'
  } finally {
    sibuk.value = false
    input.value = ''
  }
}

async function hapus(foto: Foto) {
  sibuk.value = true
  pesan.value = ''
  gagal.value = ''
  try {
    await $fetch(`/api/photos/${foto.id}`, { method: 'DELETE' })
    pesan.value = 'Foto dihapus.'
    emit('berubah')
  } catch (err) {
    const failure = err as FetchError<{ message?: string }>
    gagal.value = failure.data?.message ?? 'Foto gagal dihapus.'
  } finally {
    sibuk.value = false
  }
}
</script>

<template>
  <div>
    <ul v-if="photos.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <li
        v-for="foto in photos"
        :key="foto.id"
        class="overflow-hidden rounded-lg border border-border bg-paper"
      >
        <img
          :src="urlDetail(foto.url)"
          :alt="foto.alt || 'Foto lapak'"
          width="480"
          height="360"
          loading="lazy"
          decoding="async"
          class="aspect-4/3 w-full object-cover"
        />
        <div class="flex items-center justify-between gap-2 p-2">
          <span class="truncate text-xs text-muted">{{ foto.alt || 'Tanpa keterangan' }}</span>
          <button
            type="button"
            :disabled="sibuk"
            class="shrink-0 text-xs font-medium text-danger underline underline-offset-2 disabled:opacity-50"
            @click="hapus(foto)"
          >
            Hapus
          </button>
        </div>
      </li>
    </ul>
    <p v-else class="text-sm text-muted">
      Belum ada foto. Lapak dengan foto lebih dipercaya pembeli.
    </p>

    <div v-if="sisa > 0" class="mt-4 space-y-2">
      <div class="space-y-1.5">
        <label :for="`alt-foto-${businessId}`" class="block text-sm font-medium text-ink">
          Keterangan foto (opsional)
        </label>
        <input
          :id="`alt-foto-${businessId}`"
          v-model="altDraft"
          type="text"
          maxlength="160"
          placeholder="Contoh: Etalase depan toko"
          class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-base text-ink"
        />
      </div>
      <label
        class="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-primary px-4 text-sm font-medium text-primary hover:bg-primary/10"
        :class="sibuk ? 'opacity-60' : ''"
      >
        <input
          ref="inputRef"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="sr-only"
          :disabled="sibuk"
          @change="unggah"
        />
        {{ sibuk ? 'Mengunggah...' : 'Pilih foto' }}
      </label>
      <p class="text-xs text-muted">
        JPG, PNG, atau WebP. Maksimal {{ ukuranTeks(MAKS_UKURAN) }} per foto, sisa {{ sisa }} dari
        {{ batas }} slot. Foto otomatis diperkecil supaya peta tetap ringan.
      </p>
    </div>
    <p v-else class="mt-4 text-sm text-muted">
      Foto sudah penuh ({{ batas }} dari {{ batas }}). Hapus satu untuk menambah yang baru.
    </p>

    <div aria-live="polite">
      <p v-if="pesan" class="mt-2 text-sm text-primary">{{ pesan }}</p>
      <p v-if="gagal" role="alert" class="mt-2 text-sm text-danger">{{ gagal }}</p>
    </div>
  </div>
</template>
