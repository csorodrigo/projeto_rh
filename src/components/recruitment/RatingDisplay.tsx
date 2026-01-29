"use client";

import { CandidateRating, Rating } from "@/types/recruitment";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatRelativeTime } from "@/lib/recruitment/candidate-utils";

interface RatingDisplayProps {
  rating: number | null;
  count?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

export function RatingStars({
  rating,
  count,
  size = "md",
  showCount = true,
  className,
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: "size-3",
    md: "size-4",
    lg: "size-5",
  };

  const iconSize = sizeClasses[size];
  const displayRating = rating || 0;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            iconSize,
            star <= displayRating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
          )}
        />
      ))}
      {showCount && count !== undefined && count > 0 && (
        <span className="ml-1 text-sm text-muted-foreground">({count})</span>
      )}
    </div>
  );
}

interface RatingListProps {
  ratings: Rating[];
  showComments?: boolean;
}

export function RatingList({ ratings, showComments = true }: RatingListProps) {
  if (ratings.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma avaliação registrada
        </p>
      </Card>
    );
  }

  // Agrupa por categoria
  const byCategory = ratings.reduce((acc, rating) => {
    const category = rating.category || "overall";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(rating);
    return acc;
  }, {} as Record<string, Rating[]>);

  return (
    <div className="space-y-6">
      {Object.entries(byCategory).map(([category, categoryRatings]) => {
        const average =
          categoryRatings.reduce((sum, r) => sum + r.rating, 0) /
          categoryRatings.length;

        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium capitalize">
                {category.replace(/_/g, " ")}
              </h4>
              <RatingStars
                rating={average}
                count={categoryRatings.length}
                size="sm"
              />
            </div>

            <div className="space-y-3">
              {categoryRatings.map((rating) => (
                <RatingItem
                  key={rating.id}
                  rating={rating}
                  showComment={showComments}
                />
              ))}
            </div>

            <Separator />
          </div>
        );
      })}
    </div>
  );
}

interface RatingItemProps {
  rating: Rating;
  showComment?: boolean;
}

function RatingItem({ rating, showComment = true }: RatingItemProps) {
  return (
    <div className="flex gap-3 rounded-lg border p-3">
      <Avatar className="size-8">
        <AvatarFallback className="text-xs">
          {rating.evaluator_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{rating.evaluator_name}</span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(rating.created_at)}
            </span>
          </div>
          <RatingStars rating={rating.rating} showCount={false} size="sm" />
        </div>

        {showComment && rating.comment && (
          <p className="text-sm text-muted-foreground">{rating.comment}</p>
        )}
      </div>
    </div>
  );
}

interface InteractiveRatingProps {
  value: CandidateRating | null;
  onChange: (rating: CandidateRating) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export function InteractiveRating({
  value,
  onChange,
  size = "md",
  disabled = false,
}: InteractiveRatingProps) {
  const [hover, setHover] = useState<number | null>(null);

  const sizeClasses = {
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
  };

  const iconSize = sizeClasses[size];
  const displayRating = hover ?? value ?? 0;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Tooltip key={star}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => !disabled && onChange(star as CandidateRating)}
                onMouseEnter={() => !disabled && setHover(star)}
                onMouseLeave={() => !disabled && setHover(null)}
                disabled={disabled}
                className={cn(
                  "transition-transform hover:scale-110",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <Star
                  className={cn(
                    iconSize,
                    star <= displayRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                  )}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getRatingLabel(star as CandidateRating)}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

function getRatingLabel(rating: CandidateRating): string {
  const labels: Record<CandidateRating, string> = {
    1: "Muito Ruim",
    2: "Ruim",
    3: "Regular",
    4: "Bom",
    5: "Excelente",
  };

  return labels[rating];
}

interface RatingSummaryProps {
  ratings: Rating[];
  className?: string;
}

export function RatingSummary({ ratings, className }: RatingSummaryProps) {
  if (ratings.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground", className)}>
        Sem avaliações
      </div>
    );
  }

  const average =
    ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

  // Distribui por estrela
  const distribution = [1, 2, 3, 4, 5].map((star) => {
    const count = ratings.filter((r) => r.rating === star).length;
    const percentage = (count / ratings.length) * 100;
    return { star, count, percentage };
  });

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start gap-6">
        {/* Média */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-4xl font-bold">{average.toFixed(1)}</div>
          <RatingStars rating={average} showCount={false} size="sm" />
          <div className="text-xs text-muted-foreground">
            {ratings.length} avaliação{ratings.length !== 1 && "ões"}
          </div>
        </div>

        {/* Distribuição */}
        <div className="flex-1 space-y-2">
          {distribution.reverse().map(({ star, count, percentage }) => (
            <div key={star} className="flex items-center gap-2">
              <span className="text-xs font-medium">{star}</span>
              <Star className="size-3 fill-yellow-400 text-yellow-400" />
              <div className="flex-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                  <div
                    className="h-full bg-yellow-400"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              <span className="w-8 text-xs text-muted-foreground">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

import { useState } from "react";
