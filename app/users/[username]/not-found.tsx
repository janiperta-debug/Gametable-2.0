import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserX, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="border-accent-gold/30 bg-card/50 max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="w-16 h-16 rounded-full bg-accent-gold/20 flex items-center justify-center mx-auto mb-4">
            <UserX className="h-8 w-8 text-accent-gold" />
          </div>
          <h1 className="text-xl font-heading text-accent-gold mb-2">
            Käyttäjää ei löytynyt
          </h1>
          <p className="text-muted-foreground mb-6">
            Etsimääsi käyttäjää ei ole olemassa tai hänen profiilinsa on yksityinen.
          </p>
          <Link href="/">
            <Button variant="outline" className="border-accent-gold/30">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Takaisin etusivulle
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
