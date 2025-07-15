import React, { useState, useEffect } from "react";
import { Note, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
  Plus,
  MessageSquare,
  Pencil,
  Trash2,
  Tag,
  Check,
  X,
  Lock,
  Unlock,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function NoteComponent({ itemId, itemType, className }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [showNewNoteForm, setShowNewNoteForm] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(null);
  const [editNoteContent, setEditNoteContent] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [showAddLabelDialog, setShowAddLabelDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [newLabel, setNewLabel] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  
  // Lista predefinida de etiquetas
  const predefinedLabels = [
    { name: "importante", color: "bg-red-100 text-red-800 border-red-200" },
    { name: "pergunta", color: "bg-blue-100 text-blue-800 border-blue-200" },
    { name: "ideia", color: "bg-green-100 text-green-800 border-green-200" },
    { name: "bug", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    { name: "decisão", color: "bg-purple-100 text-purple-800 border-purple-200" },
    { name: "documentação", color: "bg-gray-100 text-gray-800 border-gray-200" },
    { name: "risco", color: "bg-amber-100 text-amber-800 border-amber-200" },
    { name: "melhoria", color: "bg-emerald-100 text-emerald-800 border-emerald-200" }
  ];

  useEffect(() => {
    loadData();
  }, [itemId]);

  const loadData = async () => {
    try {
      setLoading(true);
      let allNotes = await Note.list();
      
      // Filtrar notas pelo item específico
      const itemNotes = allNotes.filter(note => 
        note.item_id === itemId && note.type === itemType
      );
      
      // Ordenar do mais recente para o mais antigo
      itemNotes.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      
      setNotes(itemNotes);
      
      // Carregar usuário atual
      const userData = await User.me();
      setCurrentUser(userData);
    } catch (error) {
      console.error("Erro ao carregar notas:", error);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    if (!newNoteContent.trim()) return;
    
    try {
      const newNote = {
        content: newNoteContent,
        type: itemType,
        item_id: itemId,
        author: currentUser.email,
        labels: [],
        is_private: false
      };
      
      await Note.create(newNote);
      setNewNoteContent("");
      setShowNewNoteForm(false);
      await loadData();
    } catch (error) {
      console.error("Erro ao criar nota:", error);
    }
  };

  const updateNote = async (noteId) => {
    if (!editNoteContent.trim()) return;
    
    try {
      const noteToUpdate = notes.find(note => note.id === noteId);
      if (!noteToUpdate) return;
      
      await Note.update(noteId, { 
        ...noteToUpdate,
        content: editNoteContent
      });
      
      setIsEditingNote(null);
      setEditNoteContent("");
      await loadData();
    } catch (error) {
      console.error("Erro ao atualizar nota:", error);
    }
  };

  const deleteNote = async () => {
    try {
      if (!noteToDelete) return;
      
      await Note.delete(noteToDelete.id);
      setShowDeleteConfirm(false);
      setNoteToDelete(null);
      await loadData();
    } catch (error) {
      console.error("Erro ao excluir nota:", error);
    }
  };

  const addLabel = async () => {
    if (!newLabel.trim() || !selectedNote) return;
    
    try {
      const note = notes.find(n => n.id === selectedNote.id);
      if (!note) return;
      
      const updatedLabels = [...(note.labels || [])];
      if (!updatedLabels.includes(newLabel)) {
        updatedLabels.push(newLabel);
      }
      
      await Note.update(note.id, { 
        ...note,
        labels: updatedLabels
      });
      
      setNewLabel("");
      setShowAddLabelDialog(false);
      setSelectedNote(null);
      await loadData();
    } catch (error) {
      console.error("Erro ao adicionar etiqueta:", error);
    }
  };

  const removeLabel = async (noteId, labelToRemove) => {
    try {
      const note = notes.find(n => n.id === noteId);
      if (!note || !note.labels) return;
      
      const updatedLabels = note.labels.filter(label => label !== labelToRemove);
      
      await Note.update(noteId, { 
        ...note,
        labels: updatedLabels
      });
      
      await loadData();
    } catch (error) {
      console.error("Erro ao remover etiqueta:", error);
    }
  };

  const togglePrivacy = async (noteId, currentPrivacy) => {
    try {
      const note = notes.find(n => n.id === noteId);
      if (!note) return;
      
      await Note.update(noteId, { 
        ...note,
        is_private: !currentPrivacy
      });
      
      await loadData();
    } catch (error) {
      console.error("Erro ao alterar privacidade da nota:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy 'às' HH:mm");
  };

  const handleEditClick = (note) => {
    setIsEditingNote(note.id);
    setEditNoteContent(note.content);
  };

  const handleDeleteClick = (note) => {
    setNoteToDelete(note);
    setShowDeleteConfirm(true);
  };

  const getLabelColor = (labelName) => {
    const label = predefinedLabels.find(l => l.name === labelName);
    return label ? label.color : "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getUserInitials = (email) => {
    if (!email) return "??";
    
    const namePart = email.split('@')[0];
    const parts = namePart.split('.');
    
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    
    return namePart.substring(0, 2).toUpperCase();
  };

  const isAutomatedNote = (email) => {
    return email?.endsWith('@system');
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-500" />
          Notas e Comentários
        </h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowNewNoteForm(true)}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Nova Nota
        </Button>
      </div>
      
      {showNewNoteForm && (
        <div className="bg-gray-50 rounded-lg p-4 border">
          <Textarea
            placeholder="Digite sua nota aqui..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            className="min-h-[100px] mb-3"
          />
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setShowNewNoteForm(false);
                setNewNoteContent("");
              }}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={createNote}>
              Salvar
            </Button>
          </div>
        </div>
      )}
      
      <ScrollArea className={notes.length > 5 ? "h-[400px]" : undefined}>
        {notes.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p>Nenhuma nota adicionada ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div 
                key={note.id} 
                className={cn(
                  "p-4 rounded-lg border border-gray-200",
                  note.is_private ? "bg-amber-50" : "bg-white",
                  isAutomatedNote(note.author) ? "bg-blue-50 border-blue-100" : ""
                )}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                      {getUserInitials(note.author)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {isAutomatedNote(note.author) 
                            ? note.author.split('@')[0].replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) 
                            : note.author.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                          }
                        </span>
                        {note.is_private && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                            <Lock className="h-3 w-3 mr-1" />
                            Privada
                          </Badge>
                        )}
                        {isAutomatedNote(note.author) && (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            Automática
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatDate(note.created_date)}
                      </div>
                    </div>
                  </div>
                  
                  {note.author === currentUser?.email && !isAutomatedNote(note.author) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(note)}>
                          <Pencil className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedNote(note);
                            setShowAddLabelDialog(true);
                          }}
                        >
                          <Tag className="h-4 w-4 mr-2" /> Adicionar etiqueta
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePrivacy(note.id, note.is_private)}>
                          {note.is_private ? (
                            <>
                              <Unlock className="h-4 w-4 mr-2" /> Tornar pública
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 mr-2" /> Tornar privada
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(note)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                
                {isEditingNote === note.id ? (
                  <div className="mt-3">
                    <Textarea
                      value={editNoteContent}
                      onChange={(e) => setEditNoteContent(e.target.value)}
                      className="min-h-[100px] mb-2"
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setIsEditingNote(null);
                          setEditNoteContent("");
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => updateNote(note.id)}
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 whitespace-pre-wrap">
                    {note.content}
                  </div>
                )}
                
                {note.labels && note.labels.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {note.labels.map((label, index) => (
                      <Badge 
                        key={index} 
                        variant="outline"
                        className={cn(getLabelColor(label), "py-0 px-2 h-6")}
                      >
                        {label}
                        {note.author === currentUser?.email && (
                          <X 
                            className="h-3 w-3 ml-1 cursor-pointer" 
                            onClick={() => removeLabel(note.id, label)}
                          />
                        )}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      <Dialog open={showAddLabelDialog} onOpenChange={setShowAddLabelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Etiqueta</DialogTitle>
            <DialogDescription>
              Escolha uma etiqueta predefinida ou crie uma nova
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-wrap gap-2 my-4">
            {predefinedLabels.map((label) => (
              <Badge 
                key={label.name}
                variant="outline"
                className={cn(label.color, "py-1 px-3 cursor-pointer hover:opacity-80")}
                onClick={() => {
                  setNewLabel(label.name);
                  addLabel();
                }}
              >
                {label.name}
              </Badge>
            ))}
          </div>
          
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Nova etiqueta..."
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <Button onClick={addLabel}>Adicionar</Button>
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAddLabelDialog(false);
                setNewLabel("");
                setSelectedNote(null);
              }}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Nota</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Tem certeza que deseja excluir esta nota?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setNoteToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={deleteNote}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}