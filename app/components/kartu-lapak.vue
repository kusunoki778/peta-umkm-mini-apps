<script setup lang="ts">
export interface KartuLapak {
  slug: string
  name: string
  category: { name: string, color: string }
  distanceMeters: number | null
  isBoosted: boolean
  photoUrl: string | null
}

const props = defineProps<{
  lapak: KartuLapak
  terpilih?: boolean
}>()

defineEmits<{ pilih: [] }>()

const jarak = computed(() => {
  if (props.lapak.distanceMeters === null) return null
  const km = props.lapak.distanceMeters / 1000
  return km < 1 ? `${Math.round(props.lapak.distanceMeters)} m` : `${km.toFixed(1)} km`
})
</script>

<template>
  <!--
    Kartu ini adalah tautan, bukan tombol. Aksi utamanya membuka halaman lapak,
    jadi elemennya harus <a> supaya bisa dibuka di tab baru dan dibaca pembaca
    layar sebagai tautan (R-39).
  -->
  <NuxtLink
    :to="`/lapak/${lapak.slug}`"
    class="flex items-start gap-3 rounded-tag border p-3 transition-colors"
    :class="terpilih ? 'border-primary bg-surface' : 'border-border bg-surface hover:border-muted'"
    @mouseenter="$emit('pilih')"
    @focus="$emit('pilih')"
  >
    <img
      v-if="lapak.photoUrl"
      :src="lapak.photoUrl"
      :alt="`Foto ${lapak.name}`"
      width="56"
      height="56"
      loading="lazy"
      class="size-14 shrink-0 rounded-tag object-cover"
    >
    <span
      v-else
      class="flex size-14 shrink-0 items-center justify-center rounded-tag border border-dashed border-border text-[0.6875rem] text-muted"
      aria-hidden="true"
    >
      Tanpa foto
    </span>

    <span class="min-w-0 flex-1">
      <span class="flex items-center gap-2">
        <span class="truncate font-medium">{{ lapak.name }}</span>
        <span
          v-if="lapak.isBoosted"
          class="shrink-0 rounded-tag bg-accent/15 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-accent"
        >
          Unggulan
        </span>
      </span>
      <span class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <span class="flex items-center gap-1.5">
          <span class="size-2 rounded-full" :style="{ backgroundColor: lapak.category.color }" aria-hidden="true" />
          {{ lapak.category.name }}
        </span>
        <template v-if="jarak">
          <span aria-hidden="true">·</span>
          <span>{{ jarak }} dari titik pusat</span>
        </template>
      </span>
    </span>
  </NuxtLink>
</template>
