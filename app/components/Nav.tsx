"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@heroui/react";
import { motion } from "motion/react";

export default function Nav({ dashboardHref }: { dashboardHref?: string | null }) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setHidden(y > lastY.current && y > 80);
      lastY.current = y;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -120, opacity: 0 }}
      animate={{ y: hidden ? -120 : 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-0 right-0 top-4 z-30 px-4"
    >
      <div className="relative mx-auto flex max-w-7xl items-center rounded-full bg-white px-6 py-4 shadow-sm backdrop-blur-md">
        <Link href="/" className="flex items-center">
          <Image
            src="/scanrest.svg"
            alt="ScanRest"
            width={2051}
            height={437}
            priority
            className="h-6 w-auto"
          />
        </Link>
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-sm font-medium text-[var(--muted)] md:flex">
          <a href="#how" className="hover:text-[var(--foreground)]">
            Cómo funciona
          </a>
          <a href="#audience" className="hover:text-[var(--foreground)]">
            Para quién es
          </a>
          <a href="#why" className="hover:text-[var(--foreground)]">
            Por qué ScanRest
          </a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {dashboardHref ? (
            <Link href={dashboardHref}>
              <Button variant="primary" size="sm" className="px-6 py-6">
                Ir al dashboard
                <ArrowRight size={14} />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="hidden sm:inline-block">
                <Button variant="ghost" size="sm">
                  Ingresar
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="primary" size="sm" className="px-6 py-6">
                  Empezar gratis
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
