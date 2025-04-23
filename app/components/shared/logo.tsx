import { cva, type VariantProps } from "class-variance-authority"
import { useTheme  } from "~/components/shared/theme"
import { cn } from "~/utils/cn"

const logoVariants = cva("flex items-center gap-1 font-semibold", {
  variants: {
    variant: {
      default: "",
      link: "",
    },
    size: {
      default: "text-xl sm:text-2xl",
      lg: "gap-2 text-2xl sm:text-3xl",
      xl: "gap-2 text-3xl sm:text-4xl",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

const logoIconVariants = cva("", {
  variants: {
    size: {
      default: "size-6 sm:size-8",
      lg: "size-8 sm:size-10",
      xl: "size-10 sm:size-12",
      c1: "w-[4rem]",
    },
  },
  defaultVariants: {
    size: "default",
  },
})

interface LogoProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof logoVariants> {
  text?: string
  classNameIcon?: string
}

export function Logo({ variant, size, className, classNameIcon, text }: LogoProps) {
  let imageUrl = ""
  const altText = "Rosely Group"
  const [theme, setTheme] = useTheme()

  if (theme === "dark") {
    imageUrl = "/images/logos/logo_dark.png"    
  } else {
    imageUrl = "/images/logos/logo.png"
  }

  return (
    <span className={cn(logoVariants({ variant, size, className }))}>
      <img
        src={imageUrl}
        alt={altText}
        className={cn(logoIconVariants({ size, className: classNameIcon }))}
      />
      <span className="inline-flex flex-nowrap font-display">{text}</span>
    </span>
  )
}
