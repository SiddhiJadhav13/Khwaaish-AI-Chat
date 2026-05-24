"use client";

import { motion } from "framer-motion";

import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/types";

type ProductCarouselProps = {
  products: Product[];
  variant?: "default" | "compact";
};

export const ProductCarousel = ({ products, variant = "default" }: ProductCarouselProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.08 }}
      className="no-scrollbar flex items-stretch snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pr-2 scroll-smooth touch-pan-x overscroll-x-contain w-full min-w-0"
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} variant={variant} />
      ))}
    </motion.div>
  );
};
