export type NavLink = {
    label: string
    href?: string | null
}
export type sideLink = {
    label: string
    href?: string | null
}
export const links: NavLink[] = [
    { label: 'Home', href: '/home' },
    { label: 'Browse', href: null },
    { label: 'My Book', href: 'my-book' },
    { label: 'Rent', href: 'rent' },
]
export const adminLinks: sideLink[] = [
    { label: 'Dashboard', href: '/admin' },
]