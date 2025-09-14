"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const NavBarData = () => {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Stripe" },
    { href: "/socket", label: "Socket" },
  ];

  return (
    <nav className="font-medium border-b p-4 flex justify-center text-lg gap-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`px-3 py-1 rounded transition-colors ${
            pathname === link.href
              ? "bg-black text-white"
              : "hover:text-gray-800"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
};

export default NavBarData;
