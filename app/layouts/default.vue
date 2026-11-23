<script setup lang="ts">
// Wordmark sementara berupa teks. Belum ada logo final (lihat docs/01-desain.md).
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-paper text-ink">
    <header
      class="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur-sm"
    >
      <NuxtLink to="/" class="font-display text-lg font-semibold tracking-tight">
        Lapak Peta
      </NuxtLink>

      <nav class="flex items-center gap-2 text-sm" aria-label="Navigasi utama">
        <NuxtLink
          to="/kelola"
          class="hidden rounded-tag px-3 py-2 text-muted hover:text-ink sm:inline-block"
        >
          Dashboard
        </NuxtLink>
        <NuxtLink
          to="/masuk"
          class="rounded-tag border border-border px-3 py-2 font-medium hover:border-primary hover:text-primary"
        >
          Masuk
        </NuxtLink>
      </nav>
    </header>

    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>
