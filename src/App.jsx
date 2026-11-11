
import { useState } from 'react'
import './App.css'

const NOTES = [
  'C', 'C#', 'D', 'D#', 'E', 'F',
  'F#', 'G', 'G#', 'A', 'A#', 'B'
]

const SAMPLE_SHEET = `[G]Amazing grace, how [C]sweet the [G]sound
That [D]saved a [G]wretch like [D]me
I [G]once was [C]lost, but [G]now am [D]found
Was [G]blind, but [C]now I [G]see`

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

  const [showSavedSongs, setShowSavedSongs] = useState(false);
  const [savedSongs, setSavedSongs] = useState(() => {
    return JSON.parse(localStorage.getItem("savedSongs") || "[]");
  });
  const [selectedSongId, setSelectedSongId] = useState(null);


  const [songTitle, setSongTitle] = useState('Amazing Grace')
  const [artist, setArtist] = useState('Traditional Hymn')

  const lines = input.split('\n')

  const clearSong = () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear this song? This action cannot be undone.'
    )

    if (!confirmed) return

    setSongTitle('')
    setArtist('')
    setInput('')
    setTranspose(0)
    setSelectedSongId(null)
  }

  const loadSampleSong = () => {
    setSongTitle('Amazing Grace')
    setArtist('Traditional Hymn')
    setInput(SAMPLE_SHEET)
    setTranspose(0)
    setSelectedSongId(null)
  }

    
  const saveSong = () => {
    const currentSavedSongs = JSON.parse(
      localStorage.getItem("savedSongs") || "[]"
    );

    if (currentSavedSongs.length >= 3) {
      alert(
        "You have reached the Free Plan limit of 3 saved songs. Upgrade to Premium to save more!"
      );
      return;
    }

    const song = {
      id: Date.now(),
      title: songTitle,
      artist: artist,
      lyrics: input,
      transpose: transpose,
    };

    const updatedSongs = [...currentSavedSongs, song];

    localStorage.setItem(
      "savedSongs",
      JSON.stringify(updatedSongs)
    );

    setSavedSongs(updatedSongs);

    alert("Song saved successfully!");
  };

  const updateSong = () => {
    if (selectedSongId === null) {
      alert("Please select a saved song to update!");
      return;
    }

    const updatedSongs = savedSongs.map((song) =>
      song.id === selectedSongId
        ? {
            ...song,
            title: songTitle,
            artist: artist,
            lyrics: input,
            transpose: transpose,
          }
        : song
    );

    setSavedSongs(updatedSongs);

    localStorage.setItem(
      "savedSongs",
      JSON.stringify(updatedSongs)
    );

    alert("Song updated successfully!");
  };


  const loadSavedSong = () => {
    const savedSongs = JSON.parse(
      localStorage.getItem('savedSongs') || '[]'
    )

    if (savedSongs.length === 0) {
      alert('No saved songs found!')
      return
    }

    const songList = savedSongs
      .map((song, index) => `${index + 1}. ${song.title} - ${song.artist}`)
      .join('\n')

    const choice = prompt(
      `Choose a song to load:\n\n${songList}\n\nEnter the song number:`
    )

    const songIndex = Number(choice) - 1

    if (
      choice === null ||
      songIndex < 0 ||
      songIndex >= savedSongs.length
    ) {
      alert('Invalid song selection!')
      return
    }

    const song = savedSongs[songIndex]

    setSongTitle(song.title)
    setArtist(song.artist)
    setInput(song.lyrics)
    setTranspose(song.transpose)

    alert('Song loaded successfully!')
  }

  const deleteSavedSong = (indexToDelete) => {
    const songToDelete = savedSongs[indexToDelete];

    if (songToDelete.id === selectedSongId) {
      setSelectedSongId(null);
    }

    const updatedSongs = savedSongs.filter(
      (_, index) => index !== indexToDelete
    );

    setSavedSongs(updatedSongs);

    localStorage.setItem(
      "savedSongs",
      JSON.stringify(updatedSongs)
    );
};



  return (
    <div className={`app ${stageMode ? 'stage-mode' : ''}`}>
      <header className="app-header">
        <div className="brand">
          <div className="brand-icon">♫</div>
          <div>
            <h1>Chord<span>Sheet</span></h1>
            <p>FORMAT YOUR MUSIC, YOUR WAY</p>
          </div>
        </div>

        <div className="header-badge">
          <span className="status-dot"></span>
          Live Preview
        </div>
      </header>

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

            <div className="sheet-preview">
              <div className="sheet-title">
                <h2>{songTitle || 'Untitled Song'}</h2>
                <p>{artist || 'Unknown Artist'}</p>
              </div>

              <div className="sheet-content">
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
  )
}
