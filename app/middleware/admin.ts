export default defineNuxtRouteMiddleware(() => {
  const { loggedIn, user } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo({ path: '/masuk', query: { lanjut: '/admin' } })
  }
  if (user.value?.role !== 'admin') {
    return navigateTo('/')
  }
})
