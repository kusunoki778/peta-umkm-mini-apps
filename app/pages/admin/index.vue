<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
useSeoMeta({ title: 'Panel admin' })

interface Lapak { id: string, name: string, slug: string, status: string, address: string, owner: { name: string, email: string }, category: { name: string } }
interface Pembayaran { id: string, orderId: string, amount: number, status: string, boost: { business: { name: string }, package: { name: string } } }
interface Kategori { id: number, name: string, slug: string, _count: { businesses: number } }
const tab = ref<'lapak' | 'pembayaran' | 'kategori'>('lapak')
const { data: lapak, refresh: muatLapak } = await useFetch<Lapak[]>('/api/admin/businesses')
const { data: pembayaran } = await useFetch<Pembayaran[]>('/api/admin/payments')
const { data: kategori } = await useFetch<Kategori[]>('/api/admin/categories')
const pesan = ref('')
const gagal = ref('')
const memoderasi = ref<string | null>(null)
const alasan = ref<Record<string, string>>({})

async function moderasi(id: string, status: 'live' | 'rejected' | 'inactive') {
  memoderasi.value = id
  gagal.value = ''
  try {
    await $fetch(`/api/admin/businesses/${id}`, { method: 'PATCH', body: { status, reason: alasan.value[id] || null } })
    pesan.value = status === 'live' ? 'Lapak disetujui.' : 'Status lapak diperbarui.'
    await muatLapak()
  } catch { gagal.value = 'Status lapak gagal diperbarui.' } finally { memoderasi.value = null }
}

const rupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div><p class="text-sm text-muted">Lapak Peta</p><h1 class="font-display text-3xl font-semibold">Panel admin</h1></div>
      <nav class="flex gap-2" aria-label="Bagian panel admin">
        <button v-for="item in [{ id: 'lapak', label: 'Lapak' }, { id: 'pembayaran', label: 'Pembayaran' }, { id: 'kategori', label: 'Kategori' }]" :key="item.id" type="button" class="min-h-11 rounded-tag border px-3 text-sm" :class="tab === item.id ? 'border-primary bg-primary text-white' : 'border-border bg-surface'" @click="tab = item.id as typeof tab">{{ item.label }}</button>
      </nav>
    </header>
    <p v-if="pesan" class="mt-5 rounded-tag border border-primary/30 bg-primary/10 p-3 text-sm text-primary" role="status">{{ pesan }}</p>
    <p v-if="gagal" class="mt-5 rounded-tag border border-danger/30 bg-danger/10 p-3 text-sm text-danger" role="alert">{{ gagal }}</p>

    <section v-if="tab === 'lapak'" class="mt-6 overflow-x-auto rounded-tag border border-border bg-surface">
      <table class="w-full min-w-[840px] text-left text-sm"><caption class="sr-only">Daftar lapak untuk moderasi</caption><thead class="border-b border-border text-muted"><tr><th class="p-3">Lapak</th><th class="p-3">Pemilik</th><th class="p-3">Status</th><th class="p-3">Alasan penolakan</th><th class="p-3">Aksi</th></tr></thead><tbody><tr v-for="item in lapak" :key="item.id" class="border-b border-border last:border-0"><td class="p-3"><NuxtLink :to="`/lapak/${item.slug}`" class="font-medium text-primary hover:underline">{{ item.name }}</NuxtLink><span class="block text-xs text-muted">{{ item.category.name }}</span></td><td class="p-3">{{ item.owner.name }}<span class="block text-xs text-muted">{{ item.owner.email }}</span></td><td class="p-3">{{ item.status }}</td><td class="p-3"><label :for="`alasan-${item.id}`" class="sr-only">Alasan voor {{ item.name }}</label><input :id="`alasan-${item.id}`" v-model="alasan[item.id]" class="min-h-10 w-48 rounded-tag border border-border bg-surface px-2" placeholder="Opsional" maxlength="500"></td><td class="p-3"><div class="flex gap-2"><button type="button" class="min-h-10 rounded-tag bg-primary px-3 text-white disabled:opacity-50" :disabled="memoderasi === item.id" @click="moderasi(item.id, 'live')">Setujui</button><button type="button" class="min-h-10 rounded-tag border border-danger px-3 text-danger disabled:opacity-50" :disabled="memoderasi === item.id" @click="moderasi(item.id, 'rejected')">Tolak</button><button type="button" class="min-h-10 rounded-tag border border-border px-3 text-muted disabled:opacity-50" :disabled="memoderasi === item.id" @click="moderasi(item.id, 'inactive')">Nonaktifkan</button></div></td></tr></tbody></table>
      <p v-if="!lapak?.length" class="p-6 text-sm text-muted">Belum ada lapak untuk ditinjau.</p>
    </section>
    <section v-else-if="tab === 'pembayaran'" class="mt-6 overflow-x-auto rounded-tag border border-border bg-surface"><table class="w-full min-w-[620px] text-left text-sm"><caption class="sr-only">Daftar pembayaran boost</caption><thead class="border-b border-border text-muted"><tr><th class="p-3">Lapak</th><th class="p-3">Paket</th><th class="p-3">Order</th><th class="p-3">Status</th><th class="p-3">Jumlah</th></tr></thead><tbody><tr v-for="item in pembayaran" :key="item.id" class="border-b border-border last:border-0"><td class="p-3">{{ item.boost.business.name }}</td><td class="p-3">{{ item.boost.package.name }}</td><td class="p-3 font-mono text-xs">{{ item.orderId }}</td><td class="p-3">{{ item.status }}</td><td class="p-3">{{ rupiah(item.amount) }}</td></tr></tbody></table><p v-if="!pembayaran?.length" class="p-6 text-sm text-muted">Belum ada pembayaran.</p></section>
    <section v-else class="mt-6 rounded-tag border border-border bg-surface"><ul><li v-for="item in kategori" :key="item.id" class="flex items-center justify-between border-b border-border p-4 last:border-0"><span>{{ item.name }} <span class="text-sm text-muted">({{ item.slug }})</span></span><span class="text-sm text-muted">{{ item._count.businesses }} lapak</span></li></ul><p v-if="!kategori?.length" class="p-6 text-sm text-muted">Belum ada kategori.</p></section>
  </div>
</template>
