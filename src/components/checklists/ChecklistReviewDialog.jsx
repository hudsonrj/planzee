import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Loader2, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChecklistReviewDialog({
  isOpen,
  onClose,
  suggestions,
  phase,
  onSubmit,
  isLoading,
}) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (suggestions) {
      // Adiciona um ID único e um estado 'selected' para cada sugestão
      setItems(
        suggestions.map((item, index) => ({
          ...item,
          id: `item-${index}-${Date.now()}`,
          selected: true,
        }))
      );
    }
  }, [suggestions]);

  const handleItemChange = (id, field, value) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleAddItem = () => {
    const newItem = {
      id: `new-${Date.now()}`,
      description: "",
      completed: false,
      selected: true,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleSubmit = () => {
    // Filtra apenas os itens selecionados e remove as propriedades 'id' e 'selected'
    const finalItems = items
      .filter((item) => item.selected && item.description.trim() !== "")
      .map(({ id, selected, ...rest }) => rest);
    
    onSubmit(finalItems);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-teal-600" />
            Revisar e Criar Checklist para a Fase: {phase}
          </DialogTitle>
          <DialogDescription>
            Ajuste, adicione ou remova os itens sugeridos pela IA antes de criar a checklist final.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] my-4 pr-4">
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                <Checkbox
                  checked={item.selected}
                  onCheckedChange={(checked) =>
                    handleItemChange(item.id, "selected", checked)
                  }
                />
                <Input
                  value={item.description}
                  onChange={(e) =>
                    handleItemChange(item.id, "description", e.target.value)
                  }
                  placeholder="Descrição do item..."
                  className={cn(item.selected ? "" : "line-through text-gray-400")}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Button variant="outline" size="sm" onClick={handleAddItem} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Novo Item
        </Button>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Checklist Final"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}