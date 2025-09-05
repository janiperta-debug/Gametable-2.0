import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

const mechanics = [
  { id: "worker-placement", label: "Worker Placement", count: 23 },
  { id: "deck-building", label: "Deck Building", count: 18 },
  { id: "area-control", label: "Area Control", count: 15 },
  { id: "cooperative", label: "Cooperative", count: 12 },
  { id: "engine-building", label: "Engine Building", count: 19 },
]

export function CollectionFilters() {
  return (
    <div className="space-y-6">
      <Card className="room-furniture">
        <CardHeader>
          <CardTitle className="ornate-text font-heading text-lg font-bold">Player Count</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-body">1 - 8+ Players</Label>
            <Slider defaultValue={[1, 8]} max={8} min={1} step={1} className="mt-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="room-furniture">
        <CardHeader>
          <CardTitle className="ornate-text font-heading text-lg font-bold">Play Time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-body">15 - 240+ Minutes</Label>
            <Slider defaultValue={[15, 240]} max={240} min={15} step={15} className="mt-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="room-furniture">
        <CardHeader>
          <CardTitle className="ornate-text font-heading text-lg font-bold">Mechanics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {mechanics.map((mechanic) => (
            <div key={mechanic.id} className="flex items-center space-x-2">
              <Checkbox id={mechanic.id} />
              <Label htmlFor={mechanic.id} className="flex-1 text-sm font-body">
                {mechanic.label}
              </Label>
              <span className="text-xs text-muted-foreground font-body">({mechanic.count})</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
