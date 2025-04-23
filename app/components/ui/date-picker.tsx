import { useInputEvent, type FieldConfig } from "@conform-to/react"
import { useRef, useState } from "react"
import { type SelectSingleEventHandler } from "react-day-picker"

import { IconMatch } from "~/components/libs/icon"
import { Button } from "~/components/ui/button"
import { Calendar } from "~/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { cn } from "~/utils/cn"
import { formatDateDMY } from "~/utils/datetime"

export interface DatePickerProps {
  name: string
  className: string
  id: string
  required: boolean
  _defaultDate: Date
  onSelect: any
  formId: string
  disabled?: boolean
}

export function DatePicker({
  name,
  className,
  id,
  required,
  _defaultDate,
  onSelect,
  formId,
  disabled = false,
}: DatePickerProps) {
  const [date, setDate] = useState<Date>(_defaultDate); 
  const shadowInputRef = useRef<HTMLInputElement>(null)

  const control = useInputEvent({
    ref: shadowInputRef,
    onFocus: () => shadowInputRef.current?.focus(),
    onReset: () => setDate(_defaultDate),
  })

  return (
    <div>
      <Popover>
        <input
          id={id}
          form={formId}
          type="hidden"
          required={required}
          name={name}
          value={String(date)}
          onChange={event => {
            control.change(event.target.value)
            setDate(new Date(event.target.value))
            onSelect(new Date(event.target.value))
          }}
          // ref={ref}
        />

        <PopoverTrigger asChild>
          <Button
            disabled={disabled}
            variant="outline"
            className={cn(
              "h-9 justify-start gap-2 border-input p-2 text-left font-normal",
              !date && "text-muted-foreground",
              className,
            )}
          >
            <IconMatch icon="calendar-blank" className="size-5" />
            {date ? formatDateDMY(date) : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0">
          <Calendar
            initialFocus
            mode="single"
            selected={date}
            onSelect={setDate as SelectSingleEventHandler}
            defaultMonth={date}
            yearPast={5}
            yearFuture={5}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
