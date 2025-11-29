import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export interface EventCardProps {
  id: string;
  title: string;
  date: string;
  location: string;
  attendees: number;
  image: string;
  status: "upcoming" | "live" | "ended";
}

export default function EventCard({ id, title, date, location, attendees, image, status }: EventCardProps) {
  return (
    <Link href={`/events/${id}`} className="group overflow-hidden rounded-xl border border-border bg-card hover:shadow-lg transition">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img src={image} alt={title} className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
        <div className="absolute top-3 left-3">
          <Badge className={status === 'live' ? 'bg-primary text-primary-foreground' : status === 'ended' ? 'bg-muted' : 'bg-accent'}>
            {status === 'live' ? 'Live' : status === 'ended' ? 'Ended' : 'Upcoming'}
          </Badge>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{date} • {location}</p>
        <p className="mt-2 text-xs text-muted-foreground">{attendees.toLocaleString()} attendees</p>
      </div>
    </Link>
  );
}
