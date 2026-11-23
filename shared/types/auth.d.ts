// Bentuk data pengguna yang disimpan di sesi. Augmentasi ini membuat
// useUserSession() dan getUserSession() bertipe, bukan `any`.
// Diletakkan di shared/ supaya terbaca oleh tsconfig server maupun klien.
declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    name: string
    role: 'owner' | 'admin'
  }
}

export {}
