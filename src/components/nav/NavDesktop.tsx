import NavLink from "@/components/nav/NavLink";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/resume", label: "Resume" },
  { href: "/travel", label: "Travel" },
] as const;

export default function NavDesktop() {
  return (
    <nav
      aria-label="Main navigation"
      className="hidden md:flex items-center gap-8"
    >
      {NAV_LINKS.map(({ href, label }) => (
        <NavLink key={href} href={href}>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
