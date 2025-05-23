import { useState } from "react"

import { IconMatch } from "~/components/libs/icon"
import { Button } from "~/components/ui/button"
import { Input, type InputProps } from "~/components/ui/input"
import { cn } from "~/utils/cn"

export function InputPassword({isShowPw=false, placeholder = "Enter password", className, ...props }: InputProps) {
  const [isShown, setIsShown] = useState<Boolean>(isShowPw)

  function handleClick() {
    setIsShown(!isShown)
  }

  return (
    <div className="relative">
      <Input
        type={isShown ? "text" : "password"}
        placeholder={placeholder}
        className={cn(className)}
        {...props}
      />
      {isShowPw && <Button
        size="xs"
        type="button"
        variant="secondary"
        onClick={handleClick}
        className="absolute inset-y-0 right-0 my-1.5 me-1.5 flex w-20 gap-2"
      >
        {isShown ? <IconMatch icon="eye-slash" /> : <IconMatch icon="eye" />}
        <span className="text-xs">{isShown ? "Hide" : "Show"}</span>
      </Button> 
      }
    </div>
  )
}
