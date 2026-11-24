<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    id: string
    label: string
    modelValue: string
    type?: string
    autocomplete?: string
    required?: boolean
    error?: string
    hint?: string
  }>(),
  { type: 'text', required: false, autocomplete: undefined, error: undefined, hint: undefined },
)

defineEmits<{ 'update:modelValue': [value: string] }>()

const describedBy = computed(() => {
  if (props.error) return `${props.id}-error`
  if (props.hint) return `${props.id}-hint`
  return undefined
})
</script>

<template>
  <div class="space-y-1.5">
    <label :for="id" class="block text-sm font-medium text-ink">
      {{ label }}
      <span v-if="required" class="text-danger" aria-hidden="true">*</span>
    </label>

    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :autocomplete="autocomplete"
      :required="required"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy"
      class="w-full rounded-lg border bg-surface px-3 py-2 text-base text-ink placeholder:text-muted"
      :class="error ? 'border-danger' : 'border-border'"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />

    <p v-if="error" :id="`${id}-error`" class="text-sm text-danger">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-hint`" class="text-sm text-muted">{{ hint }}</p>
  </div>
</template>
