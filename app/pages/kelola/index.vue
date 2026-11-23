<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

useSeoMeta({ title: 'Lapak saya' })

const { user } = useUserSession()
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="font-display text-2xl font-semibold text-ink">Lapak saya</h1>
    <p class="mt-2 text-muted">Masuk sebagai {{ user?.name }}.</p>

    <div class="mt-8 rounded-xl border border-dashed border-border bg-surface p-8 text-center">
      <p class="font-medium text-ink">Belum ada lapak di akun ini</p>
      <p class="mt-1 text-sm text-muted">
        Lapak yang kamu daftarkan akan muncul di sini.
      </p>
    </div>
  </div>
</template>
