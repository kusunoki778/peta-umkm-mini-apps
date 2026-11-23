<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

useSeoMeta({ title: 'Lapak saya' })

const { user } = useUserSession()

const { data: businesses, status, error, refresh } = await useFetch('/api/me/businesses')

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu verifikasi',
  live: 'Tayang',
  rejected: 'Ditolak',
  inactive: 'Tidak aktif',
}

const emptyMessage = computed(() => {
  if (status.value === 'pending') return 'Memuat daftar lapak...'
  return 'Belum ada lapak di akun ini.'
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="font-display text-2xl font-semibold text-ink">Lapak saya</h1>
        <p class="mt-2 text-muted">Masuk sebagai {{ user?.name }}.</p>
      </div>
      <NuxtLink
        to="/kelola/baru"
        class="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
      >
        Tambah lapak
      </NuxtLink>
    </div>

    <p
      v-if="error"
      role="alert"
      class="mt-8 rounded-lg border border-danger bg-danger/10 px-3 py-2 text-sm text-danger"
    >
      Daftar lapak gagal dimuat.
      <button type="button" class="underline underline-offset-2" @click="refresh()">Coba lagi</button>
    </p>

    <ul v-else-if="businesses?.length" class="mt-8 space-y-3">
      <li
        v-for="business in businesses"
        :key="business.id"
        class="rounded-xl border border-border bg-surface p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <NuxtLink
              :to="`/kelola/${business.slug}`"
              class="font-display text-lg font-semibold text-ink hover:text-primary"
            >
              {{ business.name }}
            </NuxtLink>
            <p class="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span class="inline-flex items-center gap-1.5">
                <span
                  class="inline-block size-2.5 rounded-full"
                  :style="{ backgroundColor: business.category.color }"
                  aria-hidden="true"
                />
                {{ business.category.name }}
              </span>
              <span aria-hidden="true">·</span>
              <span>{{ STATUS_LABEL[business.status] ?? business.status }}</span>
              <template v-if="business.isBoosted">
                <span aria-hidden="true">·</span>
                <span class="font-medium text-accent">Sedang di-boost</span>
              </template>
            </p>
            <p class="mt-1 text-sm text-muted">
              {{ business.itemCount }} item, {{ business.photoCount }} foto
            </p>
          </div>

          <NuxtLink
            :to="`/kelola/${business.slug}`"
            class="text-sm font-medium text-primary underline underline-offset-2"
          >
            Kelola
          </NuxtLink>
        </div>
      </li>
    </ul>

    <div
      v-else-if="status === 'pending'"
      class="mt-8 space-y-3"
      aria-hidden="true"
    >
      <div v-for="n in 2" :key="n" class="h-24 animate-pulse rounded-xl bg-border/40" />
    </div>

    <div v-else class="mt-8 rounded-xl border border-dashed border-border bg-surface p-8 text-center">
      <p class="font-medium text-ink">{{ emptyMessage }}</p>
      <p class="mt-1 text-sm text-muted">
        Mulai dengan menambahkan satu lapak: nama, kategori, alamat, dan titik lokasinya.
      </p>
      <NuxtLink
        to="/kelola/baru"
        class="mt-4 inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
      >
        Tambah lapak pertama
      </NuxtLink>
    </div>
  </div>
</template>
