import React, { useState, useEffect } from "react";
import { Note, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
  MessageSquare,
  Edit,
  Trash2,
  Tag,
  Check,
  Clock,
  UserIcon,
  Sparkles,
  ListTodo,
  Loader2,
  Plus
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import NoteEditor from "./NoteEditor";

export default function ProjectNotes({ projectId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [users, setUsers] = useState({});

  useEffect(() => {
    if (projectId) {
      loadNotes();
      loadUsers();
    }
  }, [projectId]);

  const loadNotes = async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const allNotes = await Note.list();
      const projectNotes = allNotes.filter(note => 
        note.type === "project" && note.item_id === projectId
      );
      
      projectNotes.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
      
      setNotes(projectNotes);
    } catch (error) {
      console.error("Error loading project notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await User.list();
      const usersMap = {};
      usersData.forEach(user => {
        usersMap[user.email] = user;
      });
      setUsers(usersMap);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const deleteNote = async () => {
    if (!noteToDelete) return;
    
    try {
      await Note.delete(noteToDelete.id);
      await loadNotes();
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const getUserInitials = (email) => {
    if (!email) return "?";
    
    const user = users[email];
    if (user?.full_name) {
      const nameParts = user.full_name.split(" ");
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      }
      return user.full_name[0].toUpperCase();
    }
    
    const parts = email.split("@")[0].split(".");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getUserName = (email) => {
    if (!email) return "Desconhecido";
    
    const user = users[email];
    if (user?.full_name) {
      return user.full_name;
    }
    
    const nameFromEmail = email.split("@")[0].replace(".", " ");
    return nameFromEmail.split(" ")
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm");
    } catch (error) {
      return dateString;
    }
  };

  if (!projectId) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-indigo-500" />
          Notas do Projeto
        </CardTitle>
        <Button onClick={() => { setEditingNote(null); setShowEditor(!showEditor); }}>
          {showEditor && !editingNote ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              Nova Nota
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {showEditor && !editingNote && (
          <div className="mb-6">
            <NoteEditor 
              projectId={projectId}
              onNoteSaved={() => {
                loadNotes();
                setShowEditor(false);
              }}
            />
          </div>
        )}
        
        {editingNote && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Editando Nota</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setEditingNote(null)}
              >
                Cancelar
              </Button>
            </div>
            <NoteEditor 
              projectId={projectId}
              existingNote={editingNote}
              onNoteSaved={() => {
                loadNotes();
                setEditingNote(null);
              }}
            />
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : notes.length > 0 ? (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {notes.map((note) => (
                <div key={note.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <Avatar className="mt-0.5">
                        <AvatarFallback>{getUserInitials(note.author)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{getUserName(note.author)}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDate(note.created_date)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">•••</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingNote(note);
                            setShowEditor(false);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setNoteToDelete(note);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="mt-3 whitespace-pre-line text-gray-600">
                    {note.content}
                  </div>
                  
                  {note.labels?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {note.labels.map((label, index) => (
                        <Badge key={index} variant="outline">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-end mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => {
                        setEditingNote({
                          ...note,
                          content: note.content
                        });
                        setShowEditor(false);
                      }}
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Melhorar
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingNote({
                          ...note,
                          content: note.content
                        });
                      }}
                    >
                      <ListTodo className="h-4 w-4 mr-1" />
                      Extrair Tarefas
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma nota registrada</h3>
            <p className="text-gray-500 max-w-md">
              Adicione notas ao projeto para registrar ideias, decisões e informações importantes.
            </p>
          </div>
        )}
        
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir nota</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={deleteNote} className="bg-red-600 hover:bg-red-700">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}