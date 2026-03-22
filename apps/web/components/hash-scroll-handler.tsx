"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) return;

  const node = document.getElementById(id);
  if (!node) return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

export function HashScrollHandler() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.location.hash) {
      scrollToHash(window.location.hash);
    }

    const handleHashChange = () => scrollToHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [pathname]);

  return null;
}
