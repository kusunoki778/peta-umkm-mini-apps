export default defineEventHandler(async () => {
  const categories = await prisma.category.findMany({ orderBy: { sort: 'asc' } })
  return categories.map(category => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    color: category.color,
    icon: category.icon,
  }))
})
