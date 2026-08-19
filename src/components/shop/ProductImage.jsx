"use client";

import { useState } from "react";
import Image from "next/image";

// Local, on-brand placeholder — never hotlinked, so it can't break. Rendered
// when a product has no image yet OR when a hotlinked image fails to load
// (onError), instead of a broken-image icon.
export const PRODUCT_PLACEHOLDER = "/images/product-placeholder.svg";

export default function ProductImage({ src, alt = "", onError, className, ...rest }) {
  const [failed, setFailed] = useState(false);
  const source = !src || failed ? PRODUCT_PLACEHOLDER : src;
  return (
    <Image
      src={source}
      alt={alt}
      className={className}
      onError={(e) => {
        setFailed(true);
        if (typeof onError === "function") onError(e);
      }}
      {...rest}
    />
  );
}