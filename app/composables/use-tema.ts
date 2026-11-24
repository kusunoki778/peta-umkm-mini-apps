/**
 * Tema terang atau gelap. Pilihan disimpan di localStorage dan diterapkan ke
 * elemen <html> lewat kelas `.dark`, sesuai @custom-variant di main.css.
 *
 * Skrip kecil di nuxt.config.ts membaca localStorage sebelum halaman digambar,
 * supaya tidak ada kedip putih saat memuat ulang dalam mode gelap.
 */
const KUNCI = 'lapak-peta-tema'

export type Tema = 'terang' | 'gelap'

export function useTema() {
  const tema = useState<Tema>('tema', () => 'terang')

  function terapkan(nilai: Tema) {
    tema.value = nilai
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', nilai === 'gelap')
      document.documentElement.style.colorScheme = nilai === 'gelap' ? 'dark' : 'light'
    }
  }

  function ganti() {
    const berikut: Tema = tema.value === 'gelap' ? 'terang' : 'gelap'
    terapkan(berikut)
    try {
      localStorage.setItem(KUNCI, berikut)
    } catch {
      // Mode privat bisa menolak localStorage; tema tetap berlaku di sesi ini.
    }
  }

  onMounted(() => {
    const tersimpan = localStorage.getItem(KUNCI)
    if (tersimpan === 'gelap' || tersimpan === 'terang') {
      terapkan(tersimpan)
    } else {
      // Tanpa pilihan tersimpan, ikuti setelan sistem.
      terapkan(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'gelap' : 'terang')
    }
  })

  return { tema, ganti, terapkan }
}
