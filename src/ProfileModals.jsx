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
                <h3>1. Enter Your Song</h3>
                <p>
                Type or paste your lyrics into the editor. Add chords
                using square brackets before the lyrics.
                </p>
                <p><strong>Example:</strong> [G]Amazing [C]Grace</p>

                <h3>2. Edit Song Details</h3>
                <p>
                Enter your song title, artist, and instrument to
                personalize your chord sheet.
                </p>

                <h3>3. Transpose Chords</h3>
                <p>
                Use the transpose buttons to change the key of your
                song. Reset to return to the original key.
                </p>

                <h3>4. Use Stage Mode</h3>
                <p>
                Turn on Stage Mode for a clearer, performance-friendly
                chord sheet.
                </p>

                <h3>5. Save Your Songs</h3>
                <p>
                Log in to save your songs to the cloud and access them
                later.
                </p>

                <h3>6. Print or Save as PDF</h3>
                <p>
                Use the Print / Save PDF feature to create a copy
                of your chord sheet.
                </p>
            </>
            )}

            {activeModal === "about" && (
            <>
                <h3>About ChordFormatter</h3>

                <p>
                ChordFormatter is a simple and user-friendly tool
                designed to help musicians format, customize, and
                organize their chord sheets with ease.
                </p>

                <p>
                Whether you're practicing at home or performing on
                stage, ChordFormatter helps make your songs easier
                to read and play.
                </p>

                <p>
                This project was created with the goal of making
                chord sheet formatting accessible to everyone.
                </p>
            </>
            )}

            {activeModal === "version" && (
            <>
                <h3>ChordFormatter</h3>

                <p>
                Version 1.0.0
                </p>

                <p>
                ChordFormatter is continuously improving with new
                features, enhancements, and bug fixes.
                </p>

                <p>
                Thank you for using ChordFormatter and supporting
                this project!
                </p>
            </>
            )}

        </div>
      </div>
    </div>
  );
}
