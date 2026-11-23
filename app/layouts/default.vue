<script setup lang="ts">
// Wordmark sementara berupa teks. Belum ada logo final (lihat docs/01-desain.md).
const { loggedIn, fetch: refreshSession } = useUserSession()
const signingOut = ref(false)

async function signOut() {
  signingOut.value = true
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await refreshSession()
    await navigateTo('/')
  }
  finally {
    signingOut.value = false
  }
}
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-paper text-ink">
    <!-- Blur dipakai sekali di sini supaya header tetap terbaca saat menumpuk
         di atas peta yang bergerak di belakangnya (lihat docs/01-desain.md). -->
    <header
      class="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur-sm"
    >
      <NuxtLink to="/" class="font-display text-lg font-semibold tracking-tight">
        Lapak Peta
      </NuxtLink>

      <nav class="flex items-center gap-2 text-sm" aria-label="Navigasi utama">
        <template v-if="loggedIn">
          <NuxtLink
            to="/kelola"
            class="rounded-tag px-3 py-2 text-muted hover:text-ink"
          >
            Lapak saya
          </NuxtLink>
          <button
            type="button"
            :disabled="signingOut"
            class="rounded-tag border border-border px-3 py-2 font-medium hover:border-primary hover:text-primary disabled:text-muted"
            @click="signOut"
          >
            {{ signingOut ? 'Keluar...' : 'Keluar' }}
          </button>
        </template>

        <template v-else>
          <NuxtLink
            to="/daftar"
            class="rounded-tag px-3 py-2 text-muted hover:text-ink"
          >
            Daftar
          </NuxtLink>
          <NuxtLink
            to="/masuk"
            class="rounded-tag border border-border px-3 py-2 font-medium hover:border-primary hover:text-primary"
          >
            Masuk
          </NuxtLink>
        </template>
      </nav>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-border px-4 py-6 text-sm text-muted">
      <p>Lapak Peta, proyek portofolio direktori UMKM berbasis peta.</p>
    </footer>
  </div>
</template>
