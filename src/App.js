import React, { useState, useEffect } from "react";
import { API, graphqlOperation } from "aws-amplify";
import { withAuthenticator } from "aws-amplify-react";
import { createNote, deleteNote, updateNote } from "./graphql/mutations";
import { listNotes } from "./graphql/queries";
import {
  onCreateNote,
  onDeleteNote,
  onUpdateNote,
} from "./graphql/subscriptions";

function App() {
  const [noteList, setNoteList] = useState([]);
  const [note, setNote] = useState("");
  const [id, setId] = useState();

  useEffect(() => {
    fetchListNote();
    const createNoteListener = API.graphql(
      graphqlOperation(onCreateNote)
    ).subscribe({
      next: (noteData) => {
        const newNote = noteData.value.data.onCreateNote;

        setNoteList((prevNotes) => {
          const oldNotes = prevNotes.filter((note) => note.id !== newNote.id);
          return [...oldNotes, newNote];
        });
      },
    });
    const deleteNoteListener = API.graphql(
      graphqlOperation(onDeleteNote)
    ).subscribe({
      next: (noteData) => {
        const deletedNote = noteData.value.data.onDeleteNote;
        setNoteList((prevNotes) => {
          const updatedNotes = prevNotes.filter(
            (note) => note.id !== deletedNote.id
          );
          return updatedNotes;
        });
      },
    });
    const updateNoteListener = API.graphql(
      graphqlOperation(onUpdateNote)
    ).subscribe({
      next: (noteData) => {
        const updatedNote = noteData.value.data.onUpdateNote;
        setNoteList((prevNotes) => {
          const updatedNoteList = prevNotes.map((note) =>
            note.id === updatedNote.id ? updatedNote : note
          );
          return updatedNoteList;
        });
        setNote("");
        setId("");
      },
    });
    return () => {
      createNoteListener.unsubscribe();
      deleteNoteListener.unsubscribe();
      updateNoteListener.unsubscribe();
    };
  }, []);

  const fetchListNote = async () => {
    const result = await API.graphql(graphqlOperation(listNotes));
    setNoteList(result.data.listNotes.items);
  };

  const handleChangeNote = ({ target }) => {
    setNote(target.value);
  };

  const hasExistingNote = () => {
    if (id) {
      const isNote = noteList.findIndex((item) => item.id === id) > -1;
      return isNote;
    }
  };

  const handleAddNote = (event) => {
    event.preventDefault();
    if (hasExistingNote()) {
      handleUpdateNote();
    } else {
      const data = {
        note,
      };
      API.graphql(graphqlOperation(createNote, { input: data }));
      setNote("");
    }
  };

  const handleDeleteNote = (id) => {
    const input = { id };
    API.graphql(graphqlOperation(deleteNote, { input }));
  };

  const handleUpdateNote = () => {
    const input = { id, note };
    API.graphql(graphqlOperation(updateNote, { input }));
  };

  const handleSetNote = (id, note) => {
    setNote(note);
    setId(id);
  };

  return (
    <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
      <h1 className="code f2-l">Amplify Notetaker</h1>
      <form className="mb3">
        <input
          type="text"
          className="pa2 f4"
          placeholder="Write your note"
          onChange={handleChangeNote}
          value={note}
        />
        <button className="pa2 f4" onClick={handleAddNote}>
          {id ? "Update note" : "Add note"}
        </button>
      </form>
      <div>
        {noteList.map(({ id, note }) => (
          <div key={id} className="flex item-center">
            <span
              onClick={() => handleSetNote(id, note)}
              className="list pa1 f3"
            >
              {note}
            </span>
            <button
              className="bg-transparent bn f4"
              onClick={() => handleDeleteNote(id)}
            >
              <span>&times;</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default withAuthenticator(App, { includeGreetings: true });
