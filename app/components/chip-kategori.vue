<script setup lang="ts">
defineProps<{
  label: string
  aktif?: boolean
  warna?: string
  jumlah?: number
}>()

defineEmits<{ klik: [] }>()
</script>

<template>
  <button
    type="button"
    class="inline-flex min-h-11 items-center gap-2 rounded-tag border px-3 text-sm transition-colors"
    :class="aktif
      ? 'border-ink bg-ink text-paper'
      : 'border-border bg-surface text-ink hover:border-muted'"
    :aria-pressed="aktif ? 'true' : 'false'"
    @click="$emit('klik')"
  >
    <span
      v-if="warna"
      class="size-2.5 shrink-0 rounded-full"
      :style="{ backgroundColor: warna }"
      aria-hidden="true"
    />
    <span>{{ label }}</span>
    <span v-if="jumlah !== undefined" class="text-xs tabular-nums opacity-70">{{ jumlah }}</span>
  </button>
</template>
