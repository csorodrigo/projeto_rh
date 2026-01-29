"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export interface TagInputProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /**
   * Current tags
   */
  tags: string[]
  /**
   * Callback when tags change
   */
  onChange: (tags: string[]) => void
  /**
   * Placeholder text
   */
  placeholder?: string
  /**
   * Suggested tags for autocomplete
   */
  suggestions?: string[]
  /**
   * Maximum number of tags allowed
   */
  maxTags?: number
  /**
   * Whether the input is disabled
   */
  disabled?: boolean
}

/**
 * TagInput Component
 *
 * An input component for adding and removing tags. Features include:
 * - Add tags by pressing Enter or comma
 * - Remove tags by clicking X or pressing Backspace
 * - Autocomplete suggestions
 * - Maximum tag limit
 * - Duplicate prevention
 *
 * @example
 * ```tsx
 * const [tags, setTags] = useState(["React", "TypeScript"])
 *
 * <TagInput
 *   tags={tags}
 *   onChange={setTags}
 *   placeholder="Add skills..."
 *   suggestions={["JavaScript", "Python", "Java"]}
 *   maxTags={10}
 * />
 * ```
 */
export function TagInput({
  tags,
  onChange,
  placeholder = "Add tag...",
  suggestions = [],
  maxTags,
  disabled = false,
  className,
  ...props
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Filter suggestions based on input and exclude existing tags
  const filteredSuggestions = React.useMemo(() => {
    if (!inputValue) return []

    return suggestions
      .filter(
        (suggestion) =>
          !tags.includes(suggestion) &&
          suggestion.toLowerCase().includes(inputValue.toLowerCase())
      )
      .slice(0, 5)
  }, [inputValue, suggestions, tags])

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()

    if (!trimmedTag) return
    if (tags.includes(trimmedTag)) return
    if (maxTags && tags.length >= maxTags) return

    onChange([...tags, trimmedTag])
    setInputValue("")
    setShowSuggestions(false)
  }

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      e.preventDefault()
      removeTag(tags[tags.length - 1])
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    setShowSuggestions(true)
  }

  return (
    <div className={cn("relative", className)} {...props}>
      <div
        className={cn(
          "flex flex-wrap gap-2 p-2 rounded-md border border-input bg-background",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1 pl-2 pr-1 py-0.5"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
              disabled={disabled}
              className={cn(
                "rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              aria-label={`Remove ${tag}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}

        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay to allow clicking suggestions
            setTimeout(() => setShowSuggestions(false), 200)
          }}
          placeholder={tags.length === 0 ? placeholder : ""}
          disabled={disabled || (maxTags !== undefined && tags.length >= maxTags)}
          className={cn(
            "flex-1 min-w-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-6",
            tags.length === 0 && "w-full"
          )}
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-auto">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors",
                "focus:outline-none focus-visible:bg-accent"
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {maxTags && (
        <p className="text-xs text-muted-foreground mt-1">
          {tags.length} / {maxTags} tags
        </p>
      )}
    </div>
  )
}
