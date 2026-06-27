// app/messages/components/tracking/SessionNotes.jsx
// 📝 Live collaborative note-taking during sessions

import React, { useState, useEffect } from 'react';
import { Save, FileText, Plus, Trash2, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '../../../components/Toast';

const SessionNotes = ({ conversationId, currentUser }) => {
    const [notes, setNotes] = useState([]);
    const [currentNote, setCurrentNote] = useState('');
    const [isEditing, setIsEditing] = useState(null);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    useEffect(() => {
        loadNotes();
        subscribeToNotes();
    }, [conversationId]);

    const loadNotes = async () => {
        try {
            const { data, error } = await supabase
                .from('session_notes')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotes(data || []);
        } catch (error) {
            console.error('Error loading notes:', error);
        }
    };

    const subscribeToNotes = () => {
        const channel = supabase
            .channel(`notes:${conversationId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'session_notes',
                filter: `conversation_id=eq.${conversationId}`
            }, () => {
                loadNotes();
            })
            .subscribe();

        return () => channel.unsubscribe();
    };

    const saveNote = async () => {
        if (!currentNote.trim()) return;

        setLoading(true);
        try {
            if (isEditing) {
                // Update existing note
                const { error } = await supabase
                    .from('session_notes')
                    .update({ 
                        content: currentNote.trim(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', isEditing);

                if (error) throw error;
                toast.success('Note updated');
            } else {
                // Create new note
                const { error } = await supabase
                    .from('session_notes')
                    .insert({
                        conversation_id: conversationId,
                        user_id: currentUser.id,
                        content: currentNote.trim(),
                        created_at: new Date().toISOString()
                    });

                if (error) throw error;
                toast.success('Note saved');
            }

            setCurrentNote('');
            setIsEditing(null);
            loadNotes();
        } catch (error) {
            console.error('Error saving note:', error);
            toast.error('Failed to save note');
        } finally {
            setLoading(false);
        }
    };

    const deleteNote = async (noteId) => {
        if (!window.confirm('Delete this note?')) return;

        try {
            const { error } = await supabase
                .from('session_notes')
                .delete()
                .eq('id', noteId);

            if (error) throw error;
            toast.success('Note deleted');
            loadNotes();
        } catch (error) {
            console.error('Error deleting note:', error);
            toast.error('Failed to delete note');
        }
    };

    const editNote = (note) => {
        setCurrentNote(note.content);
        setIsEditing(note.id);
    };

    const cancelEdit = () => {
        setCurrentNote('');
        setIsEditing(null);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900">
            {/* Note Input */}
            <div className="p-4 border-b border-slate-700">
                <textarea
                    value={currentNote}
                    onChange={(e) => setCurrentNote(e.target.value)}
                    placeholder="Take notes during the session..."
                    className="w-full bg-slate-800 text-white rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-500"
                    rows={4}
                />
                <div className="flex items-center gap-2 mt-2">
                    <button
                        onClick={saveNote}
                        disabled={!currentNote.trim() || loading}
                        className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                    >
                        {loading ? (
                            <>Saving...</>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {isEditing ? 'Update Note' : 'Save Note'}
                            </>
                        )}
                    </button>
                    {isEditing && (
                        <button
                            onClick={cancelEdit}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Notes List */}
            <div className="flex-1 overflow-y-auto p-4">
                {notes.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                        <p className="text-gray-400 text-sm">No notes yet</p>
                        <p className="text-gray-500 text-xs mt-1">
                            Start taking notes during your session
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notes.map((note) => (
                            <div
                                key={note.id}
                                className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-purple-400" />
                                        <span className="text-xs text-gray-400">
                                            {new Date(note.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => editNote(note)}
                                            className="p-1 hover:bg-slate-700 rounded transition-colors"
                                            title="Edit"
                                        >
                                            <FileText className="w-3 h-3 text-blue-400" />
                                        </button>
                                        <button
                                            onClick={() => deleteNote(note.id)}
                                            className="p-1 hover:bg-slate-700 rounded transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3 h-3 text-red-400" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-white whitespace-pre-wrap">
                                    {note.content}
                                </p>
                                {note.updated_at && note.updated_at !== note.created_at && (
                                    <p className="text-xs text-gray-500 mt-2 italic">
                                        Edited {new Date(note.updated_at).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Tips */}
            <div className="p-3 border-t border-slate-700 bg-slate-800/50">
                <p className="text-xs text-gray-400 text-center">
                    💡 Notes are shared with both participants
                </p>
            </div>
        </div>
    );
};

export default SessionNotes;