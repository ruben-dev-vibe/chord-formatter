
import { useState, useEffect, useRef } from 'react'
import { Analytics } from '@vercel/analytics/react';
import { supabase } from './supabase'
import Auth from './Auth'
import './App.css'

const NOTES = [
  'C', 'C#', 'D', 'D#', 'E', 'F',
  'F#', 'G', 'G#', 'A', 'A#', 'B'
]


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

function transposeChord(chord, steps) {
  const transposeNote = (note) => {
    const normalized = note
      .replace('Db', 'C#')
      .replace('Eb', 'D#')
      .replace('Gb', 'F#')
      .replace('Ab', 'G#')
      .replace('Bb', 'A#')

    const index = NOTES.indexOf(normalized)

    if (index === -1) return note

    return NOTES[(index + steps + 12) % 12]
  }

  return chord.replace(
    /^([A-G](?:#|b)?)(.*?)(?:\/([A-G](?:#|b)?))?$/,
    (_, root, quality, bass) => {
      const newRoot = transposeNote(root)
      const newBass = bass ? `/${transposeNote(bass)}` : ''

      return `${newRoot}${quality}${newBass}`
    }
  )
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

export default function App() {
  const [input, setInput] = useState(SAMPLE_SHEET)
  const [transpose, setTranspose] = useState(0)
  const [stageMode, setStageMode] = useState(false)
  const [previewFullscreen, setPreviewFullscreen] = useState(false)
  const [previewFontSize, setPreviewFontSize] = useState(18)
  const [autoScroll, setAutoScroll] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(1)
  const [authUser, setAuthUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  const lines = input.split('\n')

  const clearSong = () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear this song? This action cannot be undone.'
    )

    if (!confirmed) return

    setSongTitle('')
    setArtist('')
    setInstrument('Guitar')
    setInput('')
    setTranspose(0)
    setSelectedSongId(null)
  }

  const loadSampleSong = () => {
    setSongTitle('Amazing Grace')
    setArtist('Traditional Hymn')
    setInstrument('Guitar')
    setInput(SAMPLE_SHEET)
    setTranspose(0)
    setSelectedSongId(null)
  }

    
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
    }
  }


  return (
    <>
    <div className={`app ${stageMode ? 'stage-mode' : ''}`}>
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">♫</div>
          <div>
            <h1>Chord<span>Formatter</span></h1>
            <p>FORMAT YOUR MUSIC, YOUR WAY</p>
          </div>
        </div>

        <div className="header-actions">
          <a
            href="mailto:moonsteraxy@gmail.com?subject=Inquiry%20about%20ChordFormatter"
            className="email-button"
          >
            ✉ Email Me
          </a>

          {authUser ? (
            <>
              <button
                className="user-avatar"
                onClick={() => setShowAccountSettings(true)}
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

                {!showPasswordChange && (
                  <button
                    className="change-password-button"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
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
                <span className="panel-label">01 / EDITOR</span>
                <h3>Chord Input</h3>
              </div>
              <span className="panel-icon">✎</span>
            </div>

            <div className="editor-info">
              Use square brackets for chords, like <code>[G]</code> or <code>[Am]</code>.
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
                <label htmlFor="instrument">INSTRUMENT</label>
                <select
                  id="instrument"
                  value={instrument}
                  onChange={(event) => setInstrument(event.target.value)}
                >
                  <option value="Guitar">Guitar</option>
                  <option value="Piano">Piano</option>
                  <option value="Ukulele">Ukulele</option>
                  <option value="Keyboard">Keyboard</option>
                  <option value="Bass">Bass</option>
                </select>
              </div>
            </div>

            <textarea
              className="chord-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              spellCheck="false"
              placeholder="[G]Write your lyrics here..."
            />

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
                <span className="panel-label">02 / PREVIEW</span>
                <h3>Chord Sheet</h3>
              </div>
              
              <div className="preview-actions">
                <button
                  className="print-button"
                  onClick={() => window.print()}
                >
                  Print / Save PDF
                </button>

                <button
                  className="stage-toggle"
                  onClick={() => setStageMode((value) => !value)}
                >
                  {stageMode ? 'Exit Stage Mode' : 'Stage Mode'}
                </button>

                <button
                  className="stage-toggle"
                  onClick={() => setPreviewFullscreen((value) => !value)}
                >
                  {previewFullscreen ? 'Exit Fullscreen' : 'Fullscreen Preview'}
                </button>

                {previewFullscreen && (
                  <>
                    <button
                      className="stage-toggle"
                      onClick={() =>
                        setPreviewFontSize((value) => Math.max(12, value - 2))
                      }
                    >
                      A−
                    </button>

                    <button
                      className="stage-toggle"
                      onClick={() =>
                        setPreviewFontSize((value) => Math.min(32, value + 2))
                      }
                    >
                      A+
                    </button>

                    <button
                      className="stage-toggle"
                      onClick={() => setAutoScroll((value) => !value)}
                    >
                      {autoScroll ? 'Pause Scroll' : 'Play Scroll'}
                    </button>

                    <button
                      className="stage-toggle"
                      onClick={() =>
                        setScrollSpeed((value) => Math.max(1, value - 1))
                      }
                    >
                      Speed −
                    </button>

                    <span className="scroll-speed-label">
                      Speed {scrollSpeed}
                    </span>

                    <button
                      className="stage-toggle"
                      onClick={() =>
                        setScrollSpeed((value) => Math.min(5, value + 1))
                      }
                    >
                      Speed +
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="transpose-bar">
              <span className="transpose-label">TRANSPOSE</span>

              <div className="transpose-controls">
                <button
                  onClick={() => setTranspose((value) => value - 1)}
                  aria-label="Transpose down"
                >
                  −
                </button>

                <span className="transpose-value">
                  {transpose > 0 ? `+${transpose}` : transpose}
                </span>

                <button
                  onClick={() => setTranspose((value) => value + 1)}
                  aria-label="Transpose up"
                >
                  +
                </button>

                <button
                  className="reset-button"
                  onClick={() => setTranspose(0)}
                >
                  Reset
                </button>

                <button
                  className="reset-button"
                  onClick={clearSong}
                >
                  Clear Song
                </button>

                <button
                  className="reset-button"
                  onClick={loadSampleSong}
                >
                  Load Sample
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
              </div>

              <div
                className="sheet-content"
                style={{
                  fontSize: previewFullscreen
                    ? `${previewFontSize}px`
                    : undefined,
                }}
              >
                {lines.map((line, index) => (
                  <div className="sheet-line" key={index}>
                    {parseLine(line, transpose)}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="preview-footer">
              <div className="preview-footer-info">
                <span>♫</span> Formatted in real time
              </div>

              <div className="my-songs-actions">
                <button
                  className="reset-button"
                  onClick={selectedSongId !== null ? updateSong : saveSong}
                >
                  {selectedSongId !== null ? "Update Song" : "Save Song"}
                </button>
                <button
                  className="reset-button"
                  onClick={() => setShowSavedSongs(!showSavedSongs)}
                >
                  Saved Songs ▲
                </button>
              </div>        
              {showSavedSongs && (
                <div className="saved-songs-dropdown">
                  <div className="saved-songs-dropdown-header">
                    <h3>Saved Songs</h3>
                    <span className="saved-songs-limit">
                      {savedSongs.length} / 3 Song(s)
                    </span>
                  </div>

                  <div className="saved-songs-dropdown-list">
                    {savedSongs.length === 0 ? (
                      <p>No saved songs yet.</p>
                    ) : (
                      savedSongs.map((song, index) => (
                      <div
                        className={`saved-song-item ${
                          selectedSongId === song.id ? "selected" : ""
                        }`}
                        key={song.id || index}
                        onClick={() => {
                          setSelectedSongId(song.id);

                          setSongTitle(song.title);
                          setArtist(song.artist);
                          setInstrument(song.instrument)
                          setInput(song.lyrics);
                          setTranspose(song.transpose);
                          setShowSavedSongs(false);
                        }}
                      >
                          <div className="saved-song-meta">
                            <span className="saved-song-number">
                              {String(index + 1).padStart(2, "0")}
                            </span>

                            <span className="saved-song-artist">
                              {song.artist}
                            </span>

                            <button
                              className="delete-saved-song-button"
                              onClick={(e) => {
                                e.stopPropagation();

                                const confirmed = window.confirm(
                                  `Are you sure you want to delete "${song.title}"?`
                                );

                                if (confirmed) {
                                  deleteSavedSong(index);
                                }
                              }}
                              title="Delete song"
                            >
                              🗑
                            </button>
                          </div>
                        <div className="saved-song-details">
                          <span className="saved-song-title">
                            {song.title}
                          </span>
                        </div>
                      </div>
                      ))
                    )}
                  </div>
                </div>
              )}
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
