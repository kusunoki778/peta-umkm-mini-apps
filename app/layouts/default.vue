<script setup lang="ts">
// Wordmark sementara berupa teks. Belum ada logo final (lihat docs/01-desain.md).
const { loggedIn, fetch: refreshSession } = useUserSession()
const signingOut = ref(false)
const { tema, ganti: gantiTema } = useTema()

async function signOut() {
  signingOut.value = true
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await refreshSession()
    await navigateTo('/')
  } finally {
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
        Ndekat
      </NuxtLink>

      <nav class="flex items-center gap-2 text-sm" aria-label="Navigasi utama">
        <button
          type="button"
          class="rounded-tag border border-border p-2 hover:border-primary hover:text-primary"
          :aria-label="tema === 'gelap' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'"
          :title="tema === 'gelap' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'"
          @click="gantiTema"
        >
          <svg
            v-if="tema === 'gelap'"
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="size-4"
          >
            <circle cx="12" cy="12" r="4" />
            <path
              d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"
            />
          </svg>
          <svg
            v-else
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="size-4"
          >
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
          </svg>
        </button>

        <template v-if="loggedIn">
          <NuxtLink to="/kelola" class="rounded-tag px-3 py-2 text-muted hover:text-ink">
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
          <NuxtLink to="/daftar" class="rounded-tag px-3 py-2 text-muted hover:text-ink">
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
      <p>Ndekat, direktori UMKM berbasis peta.</p>
    </footer>
  </div>
</template>
