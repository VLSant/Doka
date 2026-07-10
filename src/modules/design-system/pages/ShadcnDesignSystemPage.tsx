import { CalendarIcon, CheckCircle2Icon, FileTextIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/shadcn/ui/alert-dialog";
import { Badge } from "@/components/shadcn/ui/badge";
import { Button } from "@/components/shadcn/ui/button";
import { Calendar } from "@/components/shadcn/ui/calendar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/shadcn/ui/card";
import { Checkbox } from "@/components/shadcn/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/shadcn/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/shadcn/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/shadcn/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/shadcn/ui/dropdown-menu";
import { Input } from "@/components/shadcn/ui/input";
import { Label } from "@/components/shadcn/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/ui/select";
import { Separator } from "@/components/shadcn/ui/separator";
import { Skeleton } from "@/components/shadcn/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/shadcn/ui/tooltip";

export default function ShadcnDesignSystemPage() {
  return (
    <TooltipProvider>
      <main className="min-h-screen bg-background p-8 text-foreground">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <header className="flex items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Fundacao shadcn/ui</p>
              <h1 className="mt-2 text-3xl font-bold text-foreground">Design system Doka</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Tokens Tailwind v4 mapeados para roxo Doka, acento laranja, cards brancos e raio Dracma.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Cancelar</Button>
              <Button>
                <PlusIcon />
                Nova tarefa
              </Button>
            </div>
          </header>

          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader>
                <CardTitle>Controles base</CardTitle>
                <CardDescription>Botões, badges, campos e seleção com tokens oficiais.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="flex flex-wrap gap-2">
                  <Button>Primario roxo</Button>
                  <Button variant="secondary">Secundario</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Excluir</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>Aberta</Badge>
                  <Badge variant="accent">Operacional</Badge>
                  <Badge variant="secondary">Rotina</Badge>
                  <Badge variant="outline">Baixa prioridade</Badge>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="titulo">Titulo</Label>
                    <Input id="titulo" placeholder="Inspecao semanal" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Posto</Label>
                    <Select defaultValue="todos">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os postos</SelectItem>
                        <SelectItem value="posto-1">Posto 1</SelectItem>
                        <SelectItem value="posto-2">Posto 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox defaultChecked />
                  Exibir somente pendencias criticas
                </label>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Menu e popover</CardTitle>
                <CardDescription>Primitives Radix prontos para listas e filtros.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Acoes">
                      <MoreHorizontalIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                    <DropdownMenuItem>Inspecionar</DropdownMenuItem>
                    <DropdownMenuItem>Duplicar</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">Remover</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <CalendarIcon />
                      Prazo
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" />
                  </PopoverContent>
                </Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <FileTextIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ver historico</TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Modal Dracma adaptado</CardTitle>
                <CardDescription>Barra roxa de 8px, conteudo em card branco e footer separado.</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Abrir modal</Button>
                  </DialogTrigger>
                  <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
                    <div className="grid grid-cols-[8px_1fr]">
                      <div className="bg-primary" />
                      <div>
                        <DialogHeader className="p-6 pb-4">
                          <DialogTitle className="flex items-center gap-2 text-2xl">
                            <CheckCircle2Icon className="size-6 text-accent" />
                            Revisar tarefa
                          </DialogTitle>
                          <DialogDescription>Exemplo de cabecalho para os fluxos de criacao e edicao.</DialogDescription>
                        </DialogHeader>
                        <Separator />
                        <div className="grid gap-3 p-6">
                          <Input placeholder="Nome da tarefa" />
                          <Skeleton className="h-16" />
                        </div>
                        <DialogFooter className="border-t p-4">
                          <Button variant="outline">Cancelar</Button>
                          <Button>Salvar</Button>
                        </DialogFooter>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">Confirmacao</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover registro?</AlertDialogTitle>
                      <AlertDialogDescription>Esta acao aplica soft delete e mantem auditoria.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction>Confirmar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tabs, command e drawer</CardTitle>
                <CardDescription>Base para filtros, busca global e detalhe lateral.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="busca">
                  <TabsList>
                    <TabsTrigger value="busca">Busca</TabsTrigger>
                    <TabsTrigger value="drawer">Drawer</TabsTrigger>
                  </TabsList>
                  <TabsContent value="busca">
                    <Command className="rounded-lg border">
                      <CommandInput placeholder="Buscar tarefas, ocorrencias ou postos" />
                      <CommandList>
                        <CommandEmpty>Nenhum resultado.</CommandEmpty>
                        <CommandGroup heading="Sugestoes">
                          <CommandItem>Ocorrencias abertas</CommandItem>
                          <CommandItem>Rotinas vencidas</CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </TabsContent>
                  <TabsContent value="drawer">
                    <Drawer>
                      <DrawerTrigger asChild>
                        <Button variant="outline">Abrir drawer</Button>
                      </DrawerTrigger>
                      <DrawerContent>
                        <DrawerHeader>
                          <DrawerTitle>Detalhe rapido</DrawerTitle>
                          <DrawerDescription>Inspecao contextual sem desmontar a lista.</DrawerDescription>
                        </DrawerHeader>
                      </DrawerContent>
                    </Drawer>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">Tailwind esta sem preflight para preservar o CSS legado.</CardFooter>
            </Card>
          </section>
        </div>
      </main>
    </TooltipProvider>
  );
}
