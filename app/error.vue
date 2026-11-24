<script setup lang="ts">
defineProps<{ error: { statusCode?: number; statusMessage?: string; message?: string } }>()
const route = useRoute()
useSeoMeta({ title: 'Halaman tidak ditemukan' })
</script>

<template>
  <main class="mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-4 py-12">
    <p class="text-sm font-semibold text-primary">Lapak Peta</p>
    <h1 class="mt-3 font-display text-4xl font-semibold text-ink">Halaman tidak ditemukan</h1>
    <p class="mt-3 text-muted">
      Alamat <code class="rounded bg-surface px-1">{{ route.path }}</code> tidak tersedia atau sudah
      dipindahkan.
    </p>
    <NuxtLink
      to="/"
      class="mt-6 inline-flex min-h-11 w-fit items-center rounded-tag bg-primary px-4 font-semibold text-white hover:bg-primary/90"
      >Kembali ke peta</NuxtLink
    >
  </main>
</template>
