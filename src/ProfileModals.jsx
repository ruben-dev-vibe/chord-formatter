export default function ProfileModals({ activeModal, onClose }) {
  if (!activeModal) return null;

  return (
    <div className="account-settings-overlay">
      <div className="account-settings-panel profile-content-modal">
        <div className="account-settings-header">
          <h2>How to Use ChordFormatter</h2>

          <button
            className="close-settings-button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="account-settings-content">
            {activeModal === "how-to-use" && (
                <>
                  <h3>1. Enter or Import Your Song</h3>
                  <p>
                    Type or paste your lyrics directly into the editor on the left. Wrap
                    chords in square brackets right before the syllable where they change,
                    and watch your formatted sheet appear instantly in the live preview. You
                    can also use the quick toolbar buttons to insert sections like Verse,
                    Chorus, or Bridge.
                  </p>
                  <p>
                    <strong>Example:</strong> [G]Amazing [C]Grace
                  </p>
                  <p>
                    <strong>Importing Files:</strong> You can upload an existing .txt or
                    .cho file using the <strong>Import File (.txt/.cho)</strong> button. To
                    ensure your song details load automatically, format the top of your file
                    like this:
                  </p>
                  <pre>
                    {`Title: Title Name\nArtist: Artist Name\nInstrument: Guitar\nKey: G\nTempo: 120\n\n[G]Amazing [C]Grace...`}
                  </pre>

                  <h3>2. Add or Edit Song Details</h3>
                  <p>
                    Fill in or update the song title, artist, instrument, key, and tempo
                    (BPM) fields to create a complete, organized header for your chord
                    sheet.
                  </p>

                  <h3>3. Customize Your Layout</h3>
                  <p>
                    Tailor the preview to fit your reading style. Adjust the font size,
                    switch between a 1-column or 2-column layout, or toggle chord diagrams on
                    and off for quick visual reference.
                  </p>

                  <h3>4. Transpose &amp; Set Capo</h3>
                  <p>
                    Use the <strong>Transpose</strong> controls to shift the entire song
                    into a new key instantly, or adjust the <strong>Capo</strong> setting to
                    match your instrument setup.
                  </p>

                  <h3>5. Perform with Stage Mode</h3>
                  <p>
                    Switch on <strong>Stage Mode</strong> for a distraction-free,
                    high-contrast view built for live playing. Use the built-in auto-scroll
                    speed controls to read your music hands-free while you perform.
                  </p>

                  <h3>6. Save, Export, or Print</h3>
                  <p>
                    Log in to save your chord sheets to the cloud so you can access them
                    from any device, or click <strong>Export / Print</strong> to download a
                    clean PDF copy for offline use.
                  </p>
                </>
              )}
            {activeModal === "about" && (
              <>
                <h3>About ChordFormatter</h3>

                <p>
                  <strong>ChordFormatter</strong> was built by a musician, for fellow
                  musicians—with one simple goal: to take the hassle out of creating clean,
                  reliable chord sheets.
                </p>

                <p>
                  Anyone who has ever tried typing chords above lyrics in a regular
                  document knows how frustrating it can be when spacing shifts, chords
                  drift out of place, or key changes require rewriting everything by hand.
                  ChordFormatter solves that by giving you a fast, distraction-free
                  workspace where your chords stay locked to the right syllables in real
                  time.
                </p>

                <p>
                  Whether you are practicing in your bedroom, leading a worship team, or
                  performing live on stage, ChordFormatter adapts to the way you play. From
                  instant transposition and capo adjustments to chord diagrams and
                  hands-free auto-scrolling, every feature is designed to keep your focus
                  on the music—not the formatting.
                </p>
              </>
            )}

            {activeModal === "version" && (
              <>
                <h3>ChordFormatter — Version 1.0.0</h3>

                <p>
                  Welcome to the official initial release of{" "}
                  <strong>ChordFormatter</strong>! Version 1.0.0 brings together all the
                  core tools musicians need to write, customize, and perform with clean
                  chord sheets in one place.
                </p>

                <p>
                  <strong>What&apos;s Included in v1.0.0:</strong>
                </p>
                <ul>
                  <li>
                    <strong>Real-Time Split-Screen Editor:</strong> Write lyrics with
                    bracketed chords on the left and watch your formatted chord sheet update
                    live on the right.
                  </li>
                  <li>
                    <strong>Quick Section Toolbar &amp; File Import:</strong> Insert
                    [Verse], [Chorus], and [Bridge] tags in one click, or import existing
                    .txt and .cho files directly into the editor.
                  </li>
                  <li>
                    <strong>Instant Transpose &amp; Capo Controls:</strong> Shift song keys
                    up or down effortlessly and set capo positions to match your instrument.
                  </li>
                  <li>
                    <strong>Custom Layout &amp; Chord Diagrams:</strong> Adjust font sizes,
                    switch between 1-column and 2-column layouts, and toggle visual chord
                    diagrams on or off.
                  </li>
                  <li>
                    <strong>Stage Mode &amp; Auto-Scroll:</strong> Perform hands-free with a
                    distraction-free stage view and adjustable scrolling speed.
                  </li>
                  <li>
                    <strong>Cloud Sync &amp; PDF Export:</strong> Save your songs to your
                    account for anytime access, or export and print clean sheets for offline
                    use.
                  </li>
                </ul>

                <p>
                  Thank you for being part of the very first version of ChordFormatter and
                  supporting this project!
                </p>
              </>
            )}
        </div>
      </div>
    </div>
  );
}
