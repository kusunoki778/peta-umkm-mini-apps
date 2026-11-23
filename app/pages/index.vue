<script setup lang="ts">
useHead({ title: 'Peta lapak di sekitarmu' })
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-10">
    <p class="font-display text-sm font-semibold text-primary">Tahap pengerjaan</p>
    <h1 class="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
      Temukan lapak di sekitarmu
    </h1>
    <p class="mt-3 max-w-prose text-muted">
      Peta lapak UMKM di sekitar kampus: tempat makan, kos, dan jasa. Halaman ini
      masih kerangka. Peta, pencarian, dan alur pendaftaran lapak dikerjakan pada
      Fase 1 sampai Fase 4 sesuai
      <NuxtLink to="/" class="text-primary underline underline-offset-2">docs/04-task-list.md</NuxtLink>.
    </p>

    <!-- Placeholder jujur: kanvas peta belum diimplementasikan. -->
    <div
      class="mt-8 flex aspect-[16/10] items-center justify-center rounded-tag border border-dashed border-border bg-surface text-sm text-muted"
    >
      [PETA: belum diimplementasikan]
    </div>
  </div>
</template>
