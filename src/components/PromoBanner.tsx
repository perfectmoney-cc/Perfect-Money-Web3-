import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PromoBannerProps {
  text?: string;
  endDate?: string;
  bonusPercentage?: number;
}

export const PromoBanner = ({ 
  text = "Special Offer: Buy PM Token & Get 20% Bonus!",
  endDate,
  bonusPercentage = 20
}: PromoBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    days: 89,
    hours: 15,
    minutes: 47,
    seconds: 1
  });
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Mouse drag handlers for horizontal scroll
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Calculate time left if endDate is provided
  useEffect(() => {
    if (endDate) {
      const calculateTimeLeft = () => {
        const now = new Date().getTime();
        const end = new Date(endDate).getTime();
        const difference = end - now;

        if (difference > 0) {
          return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
          };
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      };

      setTimeLeft(calculateTimeLeft());
    }
  }, [endDate]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (endDate) {
        const now = new Date().getTime();
        const end = new Date(endDate).getTime();
        const difference = end - now;

        if (difference > 0) {
          setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
          });
        } else {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
      } else {
        // Default countdown behavior
        setTimeLeft((prev) => {
          let { days, hours, minutes, seconds } = prev;
          
          if (seconds > 0) {
            seconds--;
          } else if (minutes > 0) {
            minutes--;
            seconds = 59;
          } else if (hours > 0) {
            hours--;
            minutes = 59;
            seconds = 59;
          } else if (days > 0) {
            days--;
            hours = 23;
            minutes = 59;
            seconds = 59;
          }
          
          return { days, hours, minutes, seconds };
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-[#E53E3E] via-[#d63030] to-[#E53E3E] text-white py-2.5 px-4 sticky top-0 z-50">
      <div 
        ref={scrollRef}
        className="container mx-auto flex items-center justify-between gap-2 md:gap-4 overflow-x-auto md:overflow-hidden scrollbar-hide cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex items-center gap-2 text-xs md:text-sm font-medium whitespace-nowrap flex-shrink-0">
          <span>{text.replace('{bonus}', String(bonusPercentage))}</span>
        </div>
        
        <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm font-mono font-bold shrink-0">
          <span className="bg-black/20 px-1.5 py-0.5 rounded">{timeLeft.days}d</span>
          <span>:</span>
          <span className="bg-black/20 px-1.5 py-0.5 rounded">{String(timeLeft.hours).padStart(2, '0')}h</span>
          <span>:</span>
          <span className="bg-black/20 px-1.5 py-0.5 rounded">{String(timeLeft.minutes).padStart(2, '0')}m</span>
          <span className="hidden md:inline">:</span>
          <span className="hidden md:inline bg-black/20 px-1.5 py-0.5 rounded">{String(timeLeft.seconds).padStart(2, '0')}s</span>
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <Button
            variant="default"
            size="sm"
            className="bg-black hover:bg-black/90 text-white font-medium text-xs md:text-sm px-2 md:px-4 h-7 md:h-8"
            onClick={() => navigate('/dashboard/buy')}
          >
            Buy Now
          </Button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            aria-label="Close banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
