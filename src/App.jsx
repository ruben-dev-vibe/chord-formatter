
import { useState, useEffect, useRef } from 'react'
import { Analytics } from '@vercel/analytics/react';
import { supabase } from './supabase'
import Auth from './Auth'
import './App.css'
import ProfileModals from "./ProfileModals";

const SAMPLE_SHEET = `[G]Amazing grace, how [C]sweet the [G]sound
That [D]saved a [G]wretch like [D]me
I [G]once was [C]lost, but [G]now am [D]found
Was [G]blind, but [C]now I [G]see

[G]Twas grace that [C]taught my [G]heart to fear
And [D]grace my [G]fears re[D]lieved
How [G]precious [C]did that [G]grace ap[D]pear
The [G]hour I [C]first be[G]lieved

[G]Through many [C]dangers, [G]toils and snares
I [D]have al[G]ready [D]come
'Tis [G]grace hath [C]brought me [G]safe thus [D]far
And [G]grace will [C]lead me [G]home

[G]The Lord has [C]promised [G]good to me
His [D]word my [G]hope se[D]cures
He [G]will my [C]shield and [G]portion [D]be
As [G]long as [C]life en[G]dures

[G]Yes, when this [C]flesh and [G]heart shall fail
And [D]mortal [G]life shall [D]cease
I [G]shall pos[C]sess, within the [G]veil
A [G]life of [C]joy and [G]peace

[G]When we've been [C]there ten [G]thousand years
Bright [D]shining [G]as the [D]sun
We've [G]no less [C]days to [G]sing God's [D]praise
Than [G]when we [C]first be[G]gun`


const SHARP_NOTES = [
  'C', 'C#', 'D', 'D#', 'E', 'F',
  'F#', 'G', 'G#', 'A', 'A#', 'B'
];

const FLAT_NOTES = [
  'C', 'Db', 'D', 'Eb', 'E', 'F',
  'Gb', 'G', 'Ab', 'A', 'Bb', 'B'
];

function transposeChord(chord, steps, useFlats = false) {
  const transposeNote = (note) => {
    const normalized = note
      .replace('Db', 'C#')
      .replace('Eb', 'D#')
      .replace('Fb', 'E')
      .replace('Gb', 'F#')
      .replace('Ab', 'G#')
      .replace('Bb', 'A#')
      .replace('Cb', 'B')
      .replace('E#', 'F')
      .replace('B#', 'C');

    const index = SHARP_NOTES.indexOf(normalized);

    if (index === -1) return note;

    const newIndex = (((index + steps) % 12) + 12) % 12;

    return useFlats
      ? FLAT_NOTES[newIndex]
      : SHARP_NOTES[newIndex];
  };

  return chord.replace(
    /^([A-G](?:#|b)?)(.*?)(?:\/([A-G](?:#|b)?))?$/,
    (_, root, quality, bass) => {
      const newRoot = transposeNote(root);
      const newBass = bass ? `/${transposeNote(bass)}` : '';

      return `${newRoot}${quality}${newBass}`;
    }
  );
}


function parseLine(line, transpose) {
  const parts = line.split(/(\[[^\]]+\])/g)

  return parts.map((part, index) => {
    const chordMatch = part.match(/^\[([^\]]+)\]$/)

    if (chordMatch) {
      const chord = transposeChord(chordMatch[1], transpose)
      const lyrics = parts[index + 1] || ''

      return (
        <span className="chord-unit" key={index}>
          <span className="chord">{chord}</span>
          <span className="lyrics">{lyrics}</span>
        </span>
      )
    }

    if (part.startsWith('[')) return null

    // Text without a chord
    if (index === 0) {
      return (
        <span className="plain-text" key={index}>
          {part}
        </span>
      )
    }

    // Lyrics after a chord are already displayed by the chord-unit
    if (parts[index - 1]?.startsWith('[')) return null

    return (
      <span className="plain-text" key={index}>
        {part}
      </span>
    )
  })
}
function getUniqueChords(input, netSteps) {
  const chordMatches = input.match(/\[([^\]]+)\]/g) || [];

  const chords = chordMatches.map((match) => {
    const chord = match.slice(1, -1);
    return transposeChord(chord, netSteps);
  });

  return [...new Set(chords)];
}
function ChordDiagram({ chord }) {
  
const chordShapes = {
  G:  [3, 2, 0, 0, 0, 3],
  C:  [-1, 3, 2, 0, 1, 0],
  D:  [-1, -1, 0, 2, 3, 2],
  Am: [-1, 0, 2, 2, 1, 0],
  Em: [0, 2, 2, 0, 0, 0],
  E:  [0, 2, 2, 1, 0, 0],
  A:  [-1, 0, 2, 2, 2, 0],
  B: [-1, 2, 4, 4, 4, 2],
  Dm: [-1, -1, 0, 2, 3, 1],
  F:  [1, 3, 3, 2, 1, 1],

  // Major sharp chords
  "F#": [2, 4, 4, 3, 2, 2],
  "C#": [-1, 4, 6, 6, 6, 4],
  "G#": [4, 6, 6, 5, 4, 4],
  "D#": [-1, 6, 8, 8, 8, 6],
  "A#": [-1, 1, 3, 3, 3, 1],

  // Major flat chords
  Bb: [-1, 1, 3, 3, 3, 1],
  Eb: [-1, 6, 8, 8, 8, 6],
  Ab: [4, 6, 6, 5, 4, 4],
};

  const fingers = chordShapes[chord] || [-1, -1, -1, -1, -1, -1];

  const highestFret = Math.max(...fingers);
  const baseFret = highestFret > 4 ? highestFret - 3 : 1;

  return (
    <div className="chord-diagram">
      <h4>{chord}</h4>

      <svg
        viewBox="0 0 120 150"
        className="chord-diagram-svg"
      >
        {[20, 36, 52, 68, 84, 100].map((x, index) => (
          <line
            key={x}
            x1={x}
            y1="30"
            x2={x}
            y2="110"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        ))}

        {[30, 50, 70, 90, 110].map((y) => (
          <line
            key={y}
            x1="20"
            y1={y}
            x2="100"
            y2={y}
            stroke="currentColor"
            strokeWidth="1.5"
          />
        ))}

        <line
          x1="20"
          y1="30"
          x2="100"
          y2="30"
          stroke="currentColor"
          strokeWidth="4"
        />
                
        {fingers.map((fret, index) => {
          const x = 20 + index * 16;

          // Muted string
          if (fret === -1) {
            return (
              <text
                key={index}
                x={x}
                y="20"
                textAnchor="middle"
                fill="#f87171"
                fontSize="14"
                fontWeight="bold"
              >
                ×
              </text>
            );
          }

          // Open string
          if (fret === 0) {
            return (
              <circle
                key={index}
                cx={x}
                cy="20"
                r="4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            );
          }
          // Fretted string
          const y = 30 + (fret - baseFret + 1) * 20 - 10;

          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="5"
              fill="#b8f36b"
            />
        );
        })}
      </svg>
    </div>
  );
}

function UkuleleChordDiagram({ chord }) {
  
const chordShapes = {
  C:  [0, 0, 0, 3],
  G:  [0, 2, 3, 2],
  Am: [2, 0, 0, 0],
  F:  [2, 0, 1, 0],
  D:  [2, 2, 2, 0],
  A:  [2, 1, 0, 0],
  Bb: [3, 2, 1, 1],
  B:  [4, 3, 2, 2],
  "C#": [1, 1, 1, 4],
  Eb: [3, 3, 3, 1],
  E:  [4, 4, 4, 2],
  "F#": [3, 1, 2, 1],
  Ab: [1, 3, 4, 3],
  Gm: [0, 2, 3, 1],
  Dm: [2, 2, 1, 0],
  Em: [0, 4, 3, 2],
};


  const frets = chordShapes[chord] || [0, 0, 0, 0];

  return (
    <div className="chord-diagram">
      <h4>{chord}</h4>

      <svg
        viewBox="0 0 120 150"
        className="chord-diagram-svg"
      >
        {/* Four Ukulele strings */}
        {[30, 50, 70, 90].map((x) => (
          <line
            key={x}
            x1={x}
            y1="30"
            x2={x}
            y2="110"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        ))}

        {/* Frets */}
        {[30, 50, 70, 90, 110].map((y) => (
          <line
            key={y}
            x1="30"
            y1={y}
            x2="90"
            y2={y}
            stroke="currentColor"
            strokeWidth="1.5"
          />
        ))}

        {/* Nut */}
        <line
          x1="30"
          y1="30"
          x2="90"
          y2="30"
          stroke="currentColor"
          strokeWidth="4"
        />

        {/* Finger positions and open strings */}
        {frets.map((fret, index) => {
          const x = 30 + index * 20;

          if (fret === 0) {
            return (
              <circle
                key={index}
                cx={x}
                cy="20"
                r="4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            );
          }

          const y = 30 + fret * 20 - 10;

          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="5"
              fill="#b8f36b"
            />
          );
        })}
      </svg>
    </div>
  );
}

function PianoChordDiagram({ chord }) {
  const chordNotes = {
    // Major chords
    C: ["C", "E", "G"],
    D: ["D", "F#", "A"],
    E: ["E", "G#", "B"],
    F: ["F", "A", "C"],
    G: ["G", "B", "D"],
    A: ["A", "C#", "E"],
    B: ["B", "D#", "F#"],

    // Sharp major chords
    "C#": ["C#", "F", "G#"],
    "D#": ["D#", "G", "A#"],
    "F#": ["F#", "A#", "C#"],
    "G#": ["G#", "C", "D#"],
    "A#": ["A#", "D", "F"],

    // Flat major chords
    Bb: ["A#", "D", "F"],
    Eb: ["D#", "G", "A#"],
    Ab: ["G#", "C", "D#"],

    // Minor chords
    Cm: ["C", "D#", "G"],
    Dm: ["D", "F", "A"],
    Em: ["E", "G", "B"],
    Fm: ["F", "G#", "C"],
    Gm: ["G", "A#", "D"],
    Am: ["A", "C", "E"],
    Bm: ["B", "D", "F#"],

    // Sharp minor chords
    "C#m": ["C#", "E", "G#"],
    "D#m": ["D#", "F#", "A#"],
    "F#m": ["F#", "A", "C#"],
    "G#m": ["G#", "B", "D#"],
    "A#m": ["A#", "C#", "F"],

    // Flat minor chords
    Bbm: ["A#", "C#", "F"],
    Ebm: ["D#", "F#", "A#"],
    Abm: ["G#", "B", "D#"],
  }

  const notes = chordNotes[chord] || [];

  const whiteKeys = ["C", "D", "E", "F", "G", "A", "B"];

  const blackKeys = [
    { note: "C#", position: 0.7 },
    { note: "D#", position: 1.7 },
    { note: "F#", position: 3.7 },
    { note: "G#", position: 4.7 },
    { note: "A#", position: 5.7 },
  ];

  return (
    <div className="chord-diagram">
      <h4>{chord}</h4>

      <svg
        viewBox="0 0 140 100"
        className="chord-diagram-svg"
      >
        {whiteKeys.map((note, index) => (
          <rect
            key={note}
            x={10 + index * 17}
            y="10"
            width="17"
            height="70"
            fill={notes.includes(note) ? "#b8f36b" : "#ffffff"}
            stroke="#0f172a"
            strokeWidth="1"
          />
        ))}

        {blackKeys.map(({ note, position }) => (
          <rect
            key={note}
            x={10 + position * 17}
            y="10"
            width="11"
            height="42"
            rx="2"
            fill={notes.includes(note) ? "#b8f36b" : "#0f172a"}
          />
        ))}
      </svg>
    </div>
  );
}

function BassChordDiagram({ chord }) {  
  const chordShapes = {
    // Major chords
    C:  [3, 3, 5, 5],
    D:  [5, 5, 7, 7],
    E:  [0, 2, 2, 1],
    F:  [1, 3, 3, 1],
    G:  [3, 2, 0, 0],
    A:  [0, 0, 2, 2],
    B:  [2, 4, 4, 2],

    // Sharp major chords
    "C#": [4, 4, 6, 6],
    "D#": [6, 6, 8, 8],
    "F#": [2, 4, 4, 3],
    "G#": [4, 6, 6, 5],
    "A#": [1, 3, 3, 2],

    // Flat major chords
    Bb: [1, 3, 3, 2],
    Eb: [6, 6, 8, 8],
    Ab: [4, 6, 6, 5],

    // Minor chords
    Cm:  [3, 1, 1, 3],
    Dm:  [5, 3, 3, 5],
    Em:  [0, 2, 2, 0],
    Fm:  [1, 3, 3, 0],
    Gm:  [3, 1, 0, 0],
    Am:  [0, 0, 2, 2],
    Bm:  [2, 4, 4, 2],

    // Sharp minor chords
    "C#m": [4, 2, 2, 4],
    "D#m": [6, 4, 4, 6],
    "F#m": [2, 4, 4, 2],
    "G#m": [4, 2, 1, 1],
    "A#m": [1, 3, 2, 2],

    // Flat minor chords
    Bbm: [1, 3, 2, 2],
    Ebm: [6, 4, 4, 6],
    Abm: [4, 2, 1, 1],
  };
  const frets = chordShapes[chord] || [0, 0, 0, 0];
  const highestFret = Math.max(...frets);
  const baseFret = highestFret > 4 ? highestFret - 3 : 1;

  return (
    <div className="chord-diagram">
      <h4>{chord}</h4>

      <svg
        viewBox="0 0 120 150"
        className="chord-diagram-svg"
      >
        {/* Four Bass strings */}
        {[30, 50, 70, 90].map((x) => (
          <line
            key={x}
            x1={x}
            y1="30"
            x2={x}
            y2="110"
            stroke="currentColor"
            strokeWidth="2.5"
          />
        ))}

        {/* Frets */}
        {[30, 50, 70, 90, 110].map((y) => (
          <line
            key={y}
            x1="30"
            y1={y}
            x2="90"
            y2={y}
            stroke="currentColor"
            strokeWidth="1.5"
          />
        ))}

        {/* Nut */}
        <line
          x1="30"
          y1="30"
          x2="90"
          y2="30"
          stroke="currentColor"
          strokeWidth="4"
        />

        {/* Fret positions */}
        {frets.map((fret, index) => {
          if (fret === 0) return null;

          const x = 30 + index * 20;
          const y = 30 + (fret - baseFret + 1) * 20 - 10;

          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="5"
              fill="#b8f36b"
            />
          );
        })}
      </svg>
    </div>
  );
}



export default function App() {
  const [input, setInput] = useState(SAMPLE_SHEET)
  const [transpose, setTranspose] = useState(0)
  const [stageMode, setStageMode] = useState(false)

  const [previewFullscreen, setPreviewFullscreen] = useState(false)
  const [isFullscreenEdit, setIsFullscreenEdit] = useState(false);

  const [previewFontSize, setPreviewFontSize] = useState(18)
  const [autoScroll, setAutoScroll] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(1)
  const [authUser, setAuthUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const [activeProfileModal, setActiveProfileModal] = useState(null);

  const [capo, setCapo] = useState(0);
  const [previewColumns, setPreviewColumns] = useState(1);

  const [showChordDiagrams, setShowChordDiagrams] = useState("show");


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileMenu]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const fetchSavedSongs = async () => {
      if (!authUser) {
        setSavedSongs([]);
        return;
      }

      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading saved songs:", error);
        alert("Unable to load your saved songs.");
        return;
      }

      setSavedSongs(data || []);
    };

    fetchSavedSongs();
  }, [authUser]);

  const sheetPreviewRef = useRef(null)
    useEffect(() => {
      if (!autoScroll) return

      const container = sheetPreviewRef.current

      if (!container) return

      const interval = setInterval(() => {
        container.scrollTop += scrollSpeed
      }, 50)

      return () => clearInterval(interval)
    }, [autoScroll, scrollSpeed])

  const [showSavedSongs, setShowSavedSongs] = useState(false);
  const [savedSongs, setSavedSongs] = useState([]);
  const [selectedSongId, setSelectedSongId] = useState(null);


  const [songTitle, setSongTitle] = useState('Amazing Grace')
  const [artist, setArtist] = useState('Traditional Hymn')
  const [instrument, setInstrument] = useState('Guitar')
  const [instrumentDropdownOpen, setInstrumentDropdownOpen] = useState(false);
  const [songKey, setSongKey] = useState("C");
  const [keyDropdownOpen, setKeyDropdownOpen] = useState(false);
  const [tempo, setTempo] = useState("120");

  const lines = input.split('\n')

  const newSong = () => {
    setSongTitle('');
    setArtist('');
    setInstrument('Guitar');
    setSongKey('');
    setTempo('');
    setInput('');
    setTranspose(0);
    setSelectedSongId(null);
  };

  const loadSampleSong = () => {
    setSongTitle("Amazing Grace");
    setArtist("Traditional Hymn");
    setInstrument("Piano");
    setSongKey("G");
    setTempo("100");
    setInput(SAMPLE_SHEET);
    setTranspose(0);
    setSelectedSongId(null);
  };

  const insertSection = (section) => {
    const textarea = document.querySelector(".chord-input");

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newText =
      input.substring(0, start) +
      `[${section}]\n` +
      input.substring(end);

    setInput(newText);
  };

  const insertSymbol = (symbol) => {
    const textarea = document.querySelector(".chord-input");

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newText =
      input.substring(0, start) +
      symbol +
      input.substring(end);

    setInput(newText);

    setTimeout(() => {
      textarea.focus({ preventScroll: true });

      const newCursorPosition = start + symbol.length;

      textarea.setSelectionRange(
        newCursorPosition,
        newCursorPosition
      );
    }, 0);
  };

  const autoFormatPaste = () => {
    const lines = input
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line !== "");

    const formattedLines = [];

    lines.forEach((line) => {
      const isSection = /^\[(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus)(\s*\d*)?\]$/i.test(line);

      if (isSection && formattedLines.length > 0) {
        formattedLines.push("");
      }

      formattedLines.push(line);
    });

    setInput(formattedLines.join("\n"));
  };

  const [showEditorOptions, setShowEditorOptions] = useState(false);
  const [isOptionsPinned, setIsOptionsPinned] = useState(false);
  const editorOptionsRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        editorOptionsRef.current &&
        !editorOptionsRef.current.contains(event.target) &&
        !isOptionsPinned
      ) {
        setShowEditorOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOptionsPinned]);

  useEffect(() => {
    document.body.style.overflow = isFullscreenEdit ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullscreenEdit]);

    
  
  const saveSong = async () => {
    if (!authUser) {
      alert(
        "Create a free account or log in to save your songs to the cloud!"
      );
      return;
    }

    const { count, error: countError } = await supabase
      .from("songs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", authUser.id);

    if (countError) {
      console.error("Error checking saved songs:", countError);
      alert("Unable to check your saved songs limit.");
      return;
    }

    if (count >= 3) {
      alert(
        "You have reached the Free Plan limit of 3 saved songs. Upgrade to Premium to save more!"
      );
      return;
    }

    const { data, error } = await supabase
      .from("songs")
      .insert({
        user_id: authUser.id,
        title: songTitle,
        artist: artist,
        instrument: instrument,
        lyrics: input,
        transpose: transpose,
        song_key: songKey,
        tempo: Number(tempo),
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving song:", error);
      alert("Unable to save your song.");
      return;
    }

    setSavedSongs((currentSongs) => [data, ...currentSongs]);

    alert("Song saved successfully!");
  };

  const updateSong = async () => {
    if (selectedSongId === null) {
      alert("Please select a saved song to update!");
      return;
    }

    if (!authUser) {
      alert("Please log in to update your song.");
      return;
    }

    const { data, error } = await supabase
      .from("songs")
      .update({
        title: songTitle,
        artist: artist,
        instrument: instrument,
        lyrics: input,
        transpose: transpose,
        song_key: songKey,
        tempo: Number(tempo),
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedSongId)
      .eq("user_id", authUser.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating song:", error);
      alert("Unable to update your song.");
      return;
    }

    setSavedSongs((currentSongs) =>
      currentSongs.map((song) =>
        song.id === selectedSongId ? data : song
      )
    );

    alert("Song updated successfully!");
  };

  const deleteSavedSong = async (indexToDelete) => {
    const songToDelete = savedSongs[indexToDelete];

    if (!songToDelete) {
      return;
    }

    if (!authUser) {
      alert("Please log in to delete your song.");
      return;
    }

    const { error } = await supabase
      .from("songs")
      .delete()
      .eq("id", songToDelete.id)
      .eq("user_id", authUser.id);

    if (error) {
      console.error("Error deleting song:", error);
      alert("Unable to delete your song.");
      return;
    }

    if (songToDelete.id === selectedSongId) {
      setSelectedSongId(null);
    }

    setSavedSongs((currentSongs) =>
      currentSongs.filter((song) => song.id !== songToDelete.id)
    );
  };

  
  const loadSavedSong = (song) => {
    setSongTitle(song.title || '');
    setArtist(song.artist || '');
    setInstrument(song.instrument || 'Guitar');
    setInput(song.lyrics || '');
    setTranspose(song.transpose || 0);

    // Restore Song Key and Tempo
    setSongKey(song.song_key || 'C');
    setTempo(String(song.tempo || 120));

    setSelectedSongId(song.id);
    setShowSavedSongs(false);
  };

  const handleChangePassword = async () => {
    const newPassword = document.getElementById("new-password")?.value;

    if (!newPassword) {
      alert("Please enter your new password.");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("Error updating password:", error);
      alert(error.message);
      return;
    }

    alert("Password updated successfully!");

    document.getElementById("new-password").value = "";
  };
  
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      alert(error.message)
    } else {
      setShowAccountSettings(false)
      setShowPasswordChange(false)
      setShowAuthModal(false)
    }
  }

  const [showWelcomeModal, setShowWelcomeModal] = useState(
    !sessionStorage.getItem("welcomeModalDismissed")
  );

  return (
  <>
    {showWelcomeModal && (
      <div className="welcome-modal-overlay">
        <div
          className="welcome-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-modal-title"
        >
          <div className="welcome-modal-icon">♫</div>

          <h2 id="welcome-modal-title">
            Welcome to ChordFormatter!
          </h2>

          <span className="welcome-modal-badge">
            EARLY ACCESS
          </span>

          <p>
            Thanks for visiting ChordFormatter!
          </p>

          <p>
            This website is still under development.
            Some features may be incomplete, and certain
            buttons may not work as expected.
          </p>

          <p>
            We're continuously working to improve your
            experience. We appreciate your patience
            and feedback!
          </p>

          <button
            className="welcome-modal-button"
            onClick={() => {
              sessionStorage.setItem(
                "welcomeModalDismissed",
                "true"
              );
              setShowWelcomeModal(false);
            }}
          >
            I Understand — Let's Get Started
          </button>
        </div>
      </div>
    )}

    <div className={`app ${stageMode ? 'stage-mode' : ''}`}>
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">♫</div>
          <div>
            <h1>Chord<span>Formatter</span></h1>
            <p>FORMAT YOUR MUSIC, YOUR WAY</p>
          </div>
        </div>

        <div className="header-actions" ref={profileMenuRef}>
          <a
            href="mailto:moonsteraxy@gmail.com?subject=Inquiry%20about%20ChordFormatter"
            className="email-button"
          >
            ✉ Email Me
          </a>

          {authUser ? (
            <>
              <button
                className={`user-avatar ${showProfileMenu ? "active" : ""}`}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                title={authUser.email}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                </svg>
              </button>
            </>
          ) : (           
            <button
              className="user-avatar"
              onClick={() => setShowAuthModal(true)}
              title="Log In or Sign Up"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
              </svg>
            </button>
          )}
          {showProfileMenu && (
            <div className="profile-menu">
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  setActiveProfileModal("how-to-use");
                }}
              >
                How to Use
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  setActiveProfileModal("about");
                }}
              >
                About ChordFormatter
              </button>

              <button onClick={() => setShowProfileMenu(false)}>
                Buy Me a Coffee
              </button>

              <button onClick={() => setShowProfileMenu(false)}>
                Ratings & Feedback
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  setActiveProfileModal("version");
                }}
              >
                App Version
              </button>

              <div className="profile-menu-divider"></div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  setShowAccountSettings(true);
                }}
              >
                Settings
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  handleSignOut();
                }}
                className="profile-menu-signout"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>
      {authUser && showAccountSettings && (
        <div className="account-settings-overlay">
          <div className="account-settings-panel">
            <div className="account-settings-header">
              <h2>Account Settings</h2>   
              <button
                className="close-settings-button"
                onClick={() => {
                  setShowAccountSettings(false);
                  setShowPasswordChange(false);
                }}
              >
                ✕
              </button>
            </div>

            <div className="account-settings-content">
              <p className="settings-label">Logged in as</p>

              <p className="settings-email">
                {authUser?.email}
              </p>
              
              <div className="change-password-section">
                <button
                  className="change-password-button"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                >
                  {showPasswordChange ? "Cancel Change Password" : "Change Password"}
                </button>

                {showPasswordChange && (
                  <div className="password-change-form">
                    <input
                      type="password"
                      placeholder="Enter new password"
                      id="new-password"
                    />

                    <button
                      className="change-password-button"
                      onClick={handleChangePassword}
                    >
                      Update Password
                    </button>
                  </div>
                )}
              </div>     
            </div>
          </div>
        </div>
      )}

      {showAuthModal && !authUser && (
        <div className="account-settings-overlay">
          <div className="account-settings-panel auth-modal-panel">
            <div className="account-settings-header">
              <h2>Log In / Sign Up</h2>

              <button
                className="close-settings-button"
                onClick={() => setShowAuthModal(false)}
              >
                ✕
              </button>
            </div>
            <Auth />
            
          </div>
        </div>
      )}

      <ProfileModals
        activeModal={activeProfileModal}
        onClose={() => setActiveProfileModal(null)}
      />

      <main className="main-content">
        <section className="welcome">
          <div>
            <h2>Your music. <span>Your format.</span></h2>
            <p>
              Write your chords and lyrics. See your formatted sheet instantly.
            </p>
          </div>
        </section>

        <div className="workspace">
          <section className="panel editor-panel">
            <div className="panel-header">
              <div>
                <span className="panel-label">EDITOR</span>
              </div>

              <div className="preview-actions">
                <button
                  className="print-button"
                  type="button"
                  onClick={() => document.getElementById("import-song-file").click()}
                >
                  Import File (.txt/.cho)
                </button>

                <input
                  id="import-song-file"
                  type="file"
                  accept=".txt,.cho"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files[0];

                    if (!file) return;

                    const reader = new FileReader();

                    reader.onload = (event) => {
                      const fileContent = event.target.result;
                      const lines = fileContent.split(/\r?\n/);

                      const metadata = {};
                      const lyrics = [];

                      lines.forEach((line) => {
                        const match = line.match(
                          /^\s*(?:\{(title|artist|instrument|key|tempo)\s*:\s*(.*?)\}|(title|artist|instrument|key|tempo)\s*:\s*(.*))\s*$/i
                        );

                        if (match) {
                          const field = (match[1] || match[3]).toLowerCase();
                          const value = match[2] || match[4];

                          metadata[field] = value.trim();
                        } else {
                          lyrics.push(line);
                        }
                      });

                      if (metadata.title) {
                        setSongTitle(metadata.title);
                      }

                      if (metadata.artist) {
                        setArtist(metadata.artist);
                      }

                      if (metadata.instrument) {
                        setInstrument(metadata.instrument);
                      }

                      if (metadata.key) {
                        setSongKey(metadata.key);
                      }

                      if (metadata.tempo) {
                        setTempo(metadata.tempo.replace(/[^0-9]/g, ""));
                      }

                      setInput(lyrics.join("\n").trim());
                    };

                    reader.readAsText(file);

                    e.target.value = "";
                  }}
                />
                <button
                  className="stage-toggle"
                  type="button"
                  onClick={loadSampleSong}
                >
                  Load Sample
                </button>
                <button
                  className="stage-toggle"
                  type="button"
                  onClick={newSong}
                >
                  New Song
                </button>
                <button
                  className="stage-toggle"
                  type="button"
                  onClick={() => setIsFullscreenEdit(!isFullscreenEdit)}
                >
                  Fullscreen Edit
                </button>
              </div>
            </div>

            <div className="song-details">
              <div className="song-field">
                <label htmlFor="songTitle">SONG TITLE</label>
                <input
                  id="songTitle"
                  type="text"
                  value={songTitle}
                  onChange={(event) => setSongTitle(event.target.value)}
                  placeholder="Enter song title"
                />
              </div>

              <div className="song-field">
                <label htmlFor="artist">ARTIST</label>
                <input
                  id="artist"
                  type="text"
                  value={artist}
                  onChange={(event) => setArtist(event.target.value)}
                  placeholder="Enter artist name"
                />
              </div>
              
              <div className="song-field">
                <label>INSTRUMENT</label>

                <div className="custom-dropdown">
                  <button
                    type="button"
                    className="custom-dropdown-button"
                    onClick={() => setInstrumentDropdownOpen((prev) => !prev)}
                  >
                    {instrument}
                    <span>▾</span>
                  </button>

                  {instrumentDropdownOpen && (
                    <div className="custom-dropdown-menu">
                      {["Guitar", "Piano", "Ukulele", "Keyboard", "Bass"].map((option) => (
                        <button
                          type="button"
                          key={option}
                          className={`custom-dropdown-option ${
                            instrument === option ? "selected" : ""
                          }`}
                          onClick={() => {
                            setInstrument(option);

                            if (option === "Piano" || option === "Keyboard" || option === "Vocals") {
                              setCapo(0);
                            }

                            setInstrumentDropdownOpen(false);
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
                            
              <div className="song-field">
                <label>KEY</label>

                <div className="custom-dropdown">
                  <button
                    type="button"
                    className="custom-dropdown-button"
                    onClick={() => setKeyDropdownOpen((prev) => !prev)}
                  >
                    {songKey}
                    <span>▾</span>
                  </button>

                  {keyDropdownOpen && (
                    <div className="custom-dropdown-menu">
                      {["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"].map((option) => (
                        <button
                          type="button"
                          key={option}
                          className={`custom-dropdown-option ${
                            songKey === option ? "selected" : ""
                          }`}
                          onClick={() => {
                            setSongKey(option);
                            setKeyDropdownOpen(false);
                          }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="song-field">
                <label htmlFor="tempo">TEMPO (BPM)</label>
                <input
                  id="tempo"
                  type="number"
                  min="1"
                  max="300"
                  value={tempo}
                  onChange={(event) => setTempo(event.target.value)}
                  placeholder="e.g. 120"
                />
              </div>
            </div>
            <div className="helper-toolbar">
              <span className="helper-label">TOOLBAR</span>
              <div className="helper-button">
                <button
                  type="button"
                  className="helper-toolbar-button"
                  onClick={() => insertSymbol("[Verse]\n")}
                >
                  [Verse]
                </button>

                <button
                  type="button"
                  className="helper-toolbar-button"
                  onClick={() => insertSymbol("[Chorus]\n")}
                >
                  [Chorus]
                </button>

                <button
                  type="button"
                  className="helper-toolbar-button"
                  onClick={() => insertSymbol("[Bridge]\n")}
                >
                  [Bridge]
                </button>

                <button
                  type="button"
                  className="helper-toolbar-button"
                  onClick={() => insertSymbol("#")}
                >
                  #
                </button>

                <button
                  type="button"
                  className="helper-toolbar-button auto-format"
                  onClick={() => insertSymbol("♭")}
                >
                  ♭
                </button>

                <button
                  type="button"
                  className="helper-toolbar-button"
                  onClick={autoFormatPaste}
                >
                  ✨ Auto-Format Paste
                </button>
              </div>
            </div> 

            <textarea
              className={`chord-input ${isFullscreenEdit ? "fullscreen-edit" : ""}`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck="false"
              placeholder="Write or paste your lyrics here...
Use square brackets for chords, like [G] or [Am]."
            />
            {isFullscreenEdit && (
              <div
                className="fullscreen-editor-options-wrapper"
                ref={editorOptionsRef}
              >
                <button
                  type="button"
                  className="fullscreen-options-toggle"
                  onClick={() =>
                    setShowEditorOptions(!showEditorOptions)
                  }
                >
                  Options
                  <span>{showEditorOptions ? "▲" : "▼"}</span>
                </button>

                {showEditorOptions && (
                  <div className="fullscreen-editor-options">
                    <div className="fullscreen-options-header">
                      <span>Options</span>

                      <button
                        type="button"
                        className={`options-pin-button ${
                          isOptionsPinned ? "pinned" : ""
                        }`}
                        onClick={() =>
                          setIsOptionsPinned(!isOptionsPinned)
                        }
                        title={isOptionsPinned ? "Unpin Options" : "Pin Options"}
                      >
                        {isOptionsPinned ? "📌" : "📍"}
                      </button>
                    </div>

                    <button
                      type="button"
                      className="fullscreen-option-button"
                      onClick={() => insertSymbol("[Verse]\n")}
                    >
                      [Verse]
                    </button>

                    <button
                      type="button"
                      className="fullscreen-option-button"
                      onClick={() => insertSymbol("[Chorus]\n")}
                    >
                      [Chorus]
                    </button>

                    <button
                      type="button"
                      className="fullscreen-option-button"
                      onClick={() => insertSymbol("[Bridge]\n")}
                    >
                      [Bridge]
                    </button>

                    <button
                      type="button"
                      className="fullscreen-option-button"
                      onClick={() => insertSymbol("#")}
                    >
                      Sharp #
                    </button>

                    <button
                      type="button"
                      className="fullscreen-option-button"
                      onClick={() => insertSymbol("♭")}
                    >
                      Flat ♭
                    </button>

                    <button
                      type="button"
                      className="fullscreen-option-button auto-format-option"
                      onClick={autoFormatPaste}
                    >
                      ✨ Auto-Format
                    </button>

                    <button
                      type="button"
                      className="fullscreen-close-editor-button"
                      onClick={() => {
                        setIsFullscreenEdit(false);
                        setShowEditorOptions(false);
                        setIsOptionsPinned(false);
                      }}
                    >
                      ✕ Close Editor
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="editor-footer">
              <span>{input.split('\n').length} lines</span>
              <button
                className="clear-button"
                onClick={() => setInput('')}
              >
                Clear text
              </button>
            </div>
          </section>

          <section
            className={`panel preview-panel ${
              previewFullscreen ? 'preview-fullscreen' : ''
            }`}
          >
            <div className="panel-header">
              <div>
                <span className="panel-label">PREVIEW</span>
              </div>
              
              <div className="preview-actions">               
                <button
                  className="print-button"
                  onClick={() => window.print()}
                >
                  Export / Print
                </button>

                <div className="saved-songs-wrapper">
                  <button
                    className="stage-toggle"
                    onClick={() => setShowSavedSongs((value) => !value)}
                  >
                    Saved Songs ▾
                  </button>

                  {showSavedSongs && (
                    <div className="saved-songs-dropdown">
                      <div className="saved-songs-dropdown-header">
                        <span>Saved Songs</span>
                        <span className="saved-songs-limit">
                          {savedSongs.length} saved
                        </span>
                      </div>

                      <div className="saved-songs-dropdown-list">
                        {savedSongs.length === 0 ? (
                          <p>No saved songs yet.</p>
                        ) : (
                          savedSongs.map((song, index) => (
                            <div
                              key={song.id}
                              className={`saved-song-item ${
                                selectedSongId === song.id ? "selected" : ""
                              }`}
                              onClick={() => loadSavedSong(song)}
                            >
                              <div className="saved-song-meta">
                                <span className="saved-song-number">
                                  {index + 1}
                                </span>

                                <span className="saved-song-artist">
                                  {song.artist || "Unknown Artist"}
                                </span>

                                <button
                                  type="button"
                                  className="delete-saved-song-button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    deleteSavedSong(index);
                                  }}
                                >
                                  ×
                                </button>
                              </div>

                              <div className="saved-song-details">
                                <span className="saved-song-title">
                                  {song.title || "Untitled Song"}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  className="stage-toggle"
                  onClick={saveSong}
                >
                  Save
                </button>

                {selectedSongId && (
                  <button
                    className="stage-toggle"
                    onClick={updateSong}
                  >
                    Update
                  </button>
                )}
              </div>
            </div>
            <div className="music-controls-toolbar transpose-etc">                          
              <div className="music-control-group">
                <span className="music-control-label">
                  TRANSPOSE {transpose > 0 ? `+${transpose}` : transpose < 0 ? transpose : ""}
                </span>
                <div className="music-control-buttons">
                  <button
                    type="button"
                    onClick={() => setTranspose((prev) => prev - 1)}
                  >
                    −
                  </button>

                  <button
                    type="button"
                    onClick={() => setTranspose((prev) => prev + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="music-control-group">
                <span className="music-control-label">
                  CAPO {capo > 0 ? `· ${capo}` : ""}
                </span>

                <div className="music-control-buttons">
                  <button
                    type="button"
                    onClick={() => setCapo((prev) => Math.max(0, prev - 1))}
                    disabled={
                      capo === 0 ||
                      instrument === "Piano" ||
                      instrument === "Keyboard" ||
                      instrument === "Vocals"
                    }
                  >
                    −
                  </button>

                  <button
                    type="button"
                    onClick={() => setCapo((prev) => Math.min(11, prev + 1))}
                    disabled={
                      capo === 11 ||
                      instrument === "Piano" ||
                      instrument === "Keyboard" ||
                      instrument === "Vocals"
                    }
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="music-control-group">
                <span className="music-control-label">
                  FONT SIZE · {previewFontSize}px
                </span>
                <div className="music-control-buttons">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewFontSize((prev) => Math.max(12, prev - 1))
                    }
                    disabled={previewFontSize <= 12}
                  >
                    −
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPreviewFontSize((prev) => Math.min(32, prev + 1))
                    }
                    disabled={previewFontSize >= 32}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="music-control-group">
                <span className="music-control-label">COLUMNS</span>

                <div className="music-control-buttons">
                  <button
                    type="button"
                    className={previewColumns === 1 ? "active" : ""}
                    onClick={() => setPreviewColumns(1)}
                  >
                    1
                  </button>

                  <button
                    type="button"
                    className={previewColumns === 2 ? "active" : ""}
                    onClick={() => setPreviewColumns(2)}
                  >
                    2
                  </button>
                </div>
              </div>
            </div>

            <div className="playback-controls-toolbar">
              <div className="music-control-group">
                <span className="music-control-label">CHORD DIAGRAMS</span>
                <div className="music-control-buttons">
                  <select
                    className="music-control-select"
                    value={showChordDiagrams}
                    onChange={(e) => setShowChordDiagrams(e.target.value)}
                  >
                    <option value="show">Show</option>
                    <option value="hide">Hide</option>
                  </select>
                </div>
              </div>

              <div className="music-control-group">
                <span className="music-control-label">SCROLL</span>
                <div className="music-control-buttons">
                  <button type="button">−</button>
                  <button type="button">▶</button>
                  <button type="button">+</button>
                </div>
              </div>

              <div className="music-control-group stage-mode">
                <button type="button" className="stage-mode-button">
                  Stage Mode
                </button>
              </div>
            </div>

            <div
                className="sheet-preview"
                ref={sheetPreviewRef}
              >
              <div className="sheet-title">
                <h2>{songTitle || 'Untitled Song'}</h2>
                <p>
                  {artist || 'Unknown Artist'} — {instrument}
                </p>
                <p className="sheet-metadata">
                  Key: {songKey} | Tempo: {tempo || '--'} BPM
                </p>
                {capo > 0 && (
                  <p className="sheet-metadata">
                    Capo: Fret {capo}
                  </p>
                )}

              </div>                              
                {showChordDiagrams === "show" && (
                  <div className="chord-diagrams-container">
                    {instrument === "Guitar" &&
                      getUniqueChords(input, transpose - capo).map((chord) => (
                        <ChordDiagram key={chord} chord={chord} />
                    ))}

                    {instrument === "Ukulele" &&
                      getUniqueChords(input, transpose - capo).map((chord) => (
                        <UkuleleChordDiagram key={chord} chord={chord} />
                    ))}
                    
                    {instrument === "Piano" &&
                      getUniqueChords(input, transpose - capo).map((chord) => (
                        <PianoChordDiagram key={chord} chord={chord} />
                    ))}

                    {instrument === "Bass" &&
                      getUniqueChords(input, transpose - capo).map((chord) => (
                        <BassChordDiagram key={chord} chord={chord} />
                    ))}


                  </div>
                )}
              <div
                className="sheet-content"
                style={{
                  fontSize: `${previewFontSize}px`,
                  columnCount: previewColumns,
                  columnGap: "32px",
                }}
              >
                {lines.map((line, index) => (
                  <div className="sheet-line" key={index}>
                    {parseLine(line, transpose - capo)}
                  </div>
                ))}
              </div>
            </div>
            <div className="preview-footer">
              <div className="preview-footer-info">
                <span>♫</span> Formatted in real time
              </div>
            </div>
          </section>
        </div>

        <footer className="app-footer">
          <span>CHORDSHEET FORMATTER</span>
          <span>Made for musicians ♡</span>
        </footer>
      </main>
    </div>
    <Analytics />
    </>
  )
}
