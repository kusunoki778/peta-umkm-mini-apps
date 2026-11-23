<script setup lang="ts">
import type { FetchError } from 'ofetch'

useSeoMeta({
  title: 'Masuk',
  description: 'Masuk ke akun Lapak Peta untuk mengelola lapak dan boost.',
})

const route = useRoute()
const { fetch: refreshSession } = useUserSession()

const form = reactive({ email: '', password: '' })
const errorMessage = ref('')
const submitting = ref(false)

async function submit() {
  errorMessage.value = ''
  submitting.value = true
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: form })
    await refreshSession()
    const next = typeof route.query.lanjut === 'string' ? route.query.lanjut : '/kelola'
    await navigateTo(next)
  }
  catch (error) {
    const failure = error as FetchError<{ message?: string }>
    errorMessage.value = failure.data?.message ?? 'Tidak bisa masuk sekarang. Coba lagi.'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-md px-4 py-12">
    <h1 class="font-display text-2xl font-semibold text-ink">Masuk ke akunmu</h1>
    <p class="mt-2 text-muted">
      Kelola data lapak dan pantau status boost dari satu tempat.
    </p>

    <form class="mt-8 space-y-5" novalidate @submit.prevent="submit">
      <p
        v-if="errorMessage"
        role="alert"
        class="rounded-lg border border-danger bg-danger/10 px-3 py-2 text-sm text-danger"
      >
        {{ errorMessage }}
      </p>

      <AppField
        id="masuk-email"
        v-model="form.email"
        label="Email"
        type="email"
        autocomplete="email"
        required
      />
      <AppField
        id="masuk-password"
        v-model="form.password"
        label="Kata sandi"
        type="password"
        autocomplete="current-password"
        required
      />

      <button
        type="submit"
        :disabled="submitting"
        class="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-white hover:bg-primary/90 disabled:bg-primary/60"
      >
        {{ submitting ? 'Sedang masuk...' : 'Masuk' }}
      </button>
    </form>

    <p class="mt-6 text-sm text-muted">
      Belum punya akun?
      <NuxtLink to="/daftar" class="font-medium text-primary underline underline-offset-2">
        Buat akun
      </NuxtLink>
    </p>
  </div>
</template>
