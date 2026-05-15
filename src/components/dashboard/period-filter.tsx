import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateInput } from "@/utils/period";

export function PeriodFilter({ start, end }: { start: Date; end: Date }) {
  return (
    <form className="rounded-lg border border-border bg-card/70 p-2 shadow-sm sm:flex sm:items-end sm:gap-2" action="">
      <label className="block text-sm">
        <span className="mb-1 block text-muted-foreground">Início</span>
        <Input name="start" type="date" defaultValue={formatDateInput(start)} />
      </label>
      <label className="mt-2 block text-sm sm:mt-0">
        <span className="mb-1 block text-muted-foreground">Fim</span>
        <Input name="end" type="date" defaultValue={formatDateInput(end)} />
      </label>
      <Button className="mt-2 w-full sm:mt-0 sm:w-auto">
        <Filter className="size-4" />
        Filtrar
      </Button>
    </form>
  );
}
