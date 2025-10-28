import { ChecklistForm } from "@/components/checklist-form"

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Checklist NLC v1-25</h1>
          <p className="text-muted-foreground">Ferramenta de validação de conformidade para editais de licitação</p>
        </header>
        <ChecklistForm />
      </div>
    </div>
  )
}
