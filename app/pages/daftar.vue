<script setup lang="ts">
import type { FetchError } from 'ofetch'

useSeoMeta({
  title: 'Buat akun',
  description: 'Buat akun Lapak Peta untuk mendaftarkan lapak usaha dan mengajukan boost.',
})

const { fetch: refreshSession } = useUserSession()

const form = reactive({ name: '', email: '', phone: '', password: '' })
const errorMessage = ref('')
const submitting = ref(false)

async function submit() {
  errorMessage.value = ''
  submitting.value = true
  try {
    await $fetch('/api/auth/register', { method: 'POST', body: form })
    await refreshSession()
    await navigateTo('/kelola')
  } catch (error) {
    const failure = error as FetchError<{ message?: string }>
    errorMessage.value = failure.data?.message ?? 'Pendaftaran gagal. Coba lagi.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-md px-4 py-12">
    <h1 class="font-display text-2xl font-semibold text-ink">Buat akun pemilik lapak</h1>
    <p class="mt-2 text-muted">
      Satu akun bisa menampung beberapa lapak. Data usahamu kamu isi setelah akun jadi.
    </p>

    <form class="mt-8 space-y-5" novalidate @submit.prevent="submit">
      <p
        v-if="errorMessage"
        role="alert"
        class="rounded-lg border border-danger bg-danger/10 px-3 py-2 text-sm text-danger"
      >
        {{ errorMessage }}
      </p>

      <AppField id="daftar-nama" v-model="form.name" label="Nama" autocomplete="name" required />
      <AppField
        id="daftar-email"
        v-model="form.email"
        label="Email"
        type="email"
        autocomplete="email"
        required
      />
      <AppField
        id="daftar-telepon"
        v-model="form.phone"
        label="Nomor telepon (opsional)"
        type="tel"
        autocomplete="tel"
        hint="Dipakai kalau pembeli perlu menghubungi lapakmu."
      />
      <AppField
        id="daftar-sandi"
        v-model="form.password"
        label="Kata sandi"
        type="password"
        autocomplete="new-password"
        hint="Minimal 8 karakter."
        required
      />

      <button
        type="submit"
        :disabled="submitting"
        class="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-white hover:bg-primary/90 disabled:bg-primary/60"
      >
        {{ submitting ? 'Mendaftarkan...' : 'Buat akun' }}
      </button>
    </form>

    <p class="mt-6 text-sm text-muted">
      Sudah punya akun?
      <NuxtLink to="/masuk" class="font-medium text-primary underline underline-offset-2">
        Masuk
      </NuxtLink>
    </p>
  </div>
</template>
