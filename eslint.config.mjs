// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Prettier menulis elemen void sebagai <input /> dan <img />, sedangkan
    // aturan bawaan Vue justru menolaknya. Karena Prettier yang memegang
    // format, aturan ini disesuaikan supaya keduanya tidak saling bertentangan.
    'vue/html-self-closing': [
      'warn',
      {
        html: { void: 'always', normal: 'always', component: 'always' },
        svg: 'always',
        math: 'always',
      },
    ],
  },
})
