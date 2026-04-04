import { useState } from 'react';
import { EventBus } from '../game/EventBus';
import { motion, AnimatePresence } from 'framer-motion';
import {
  submitToGoogleSheets,
  type RegistrationData,
  type SubmissionStatus,
} from '../lib/googleSheets';

interface RegistrationFormProps {
  isCredits?: boolean;
}

const TRACKS = [
  'AI / Machine Learning',
  'Web3 / Blockchain',
  'Climate Tech',
  'Open Innovation',
];

/* ─── Shared Styles ─── */
const inputClass =
  'w-full bg-black/60 border-2 border-white/30 p-2 text-white font-pixel text-[10px] outline-none focus:border-hackathon-primary focus:shadow-[0_0_10px_rgba(74,222,128,0.3)] transition-all placeholder:text-white/30';
const labelClass = 'text-[9px] text-hackathon-secondary tracking-wider uppercase';

/* ─── Mini spinner ─── */
const Spinner = () => (
  <span className="inline-block w-3 h-3 border-2 border-black/40 border-t-black rounded-full animate-spin" />
);

/* ─── Status overlay shown after submission attempt ─── */
function StatusScreen({
  status,
  onRetry,
}: {
  status: 'success' | 'error';
  onRetry?: () => void;
}) {
  if (status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8 flex flex-col items-center gap-4"
      >
        <div className="text-6xl">🎉</div>
        <h3 className="text-xl text-hackathon-primary glow-text">QUEST ACCEPTED!</h3>
        <p className="text-xs text-gray-300">Your team has been registered for CodeQuest 2026.</p>
        <p className="text-[10px] text-hackathon-secondary mt-1">
          📊 Data saved to Google Sheets
        </p>
        <p className="text-[10px] text-hackathon-accent mt-1">SEE YOU AT THE HACKATHON</p>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8 flex flex-col items-center gap-4"
    >
      <div className="text-6xl">⚠️</div>
      <h3 className="text-xl text-red-400">SUBMISSION FAILED</h3>
      <p className="text-xs text-gray-300">
        Could not reach Google Sheets. Check your internet connection and make sure
        VITE_GOOGLE_SHEET_URL is configured in <code className="text-hackathon-primary">.env</code>.
      </p>
      <button onClick={onRetry} className="pixel-btn text-[9px] mt-2 bg-red-500 border-red-800">
        ↩ TRY AGAIN
      </button>
    </motion.div>
  );
}

/* ─── Main Form ─── */
export const RegistrationForm = ({ isCredits }: RegistrationFormProps) => {
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [formData, setFormData] = useState<RegistrationData>({
    teamName: '',
    teamLead: '',
    college: '',
    contact: '',
    members: '',
    emails: '',
    track: TRACKS[0],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => e.stopPropagation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const result = await submitToGoogleSheets(formData);
      if (result.ok) {
        setStatus('success');
        setTimeout(() => {
          EventBus.emit('close-modal', isCredits ? 'credits' : 'register');
        }, 4500);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const handleRetry = () => setStatus('idle');

  /* ──────── Credits variant ──────── */
  if (isCredits) {
    return (
      <div className="relative overflow-hidden h-[420px] flex flex-col items-center">
        <motion.div
          initial={{ y: 420 }}
          animate={{ y: -700 }}
          transition={{ duration: 16, ease: 'linear' }}
          className="flex flex-col items-center gap-10 text-center"
        >
          <div className="flex flex-col gap-3">
            <h3 className="text-2xl text-hackathon-primary glow-text">CODEQUEST</h3>
            <p className="text-sm text-hackathon-accent">A Journey Through Code</p>
            <div className="gradient-underline w-32 mx-auto mt-2 rounded-full" />
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-hackathon-secondary text-[10px] tracking-widest">DESIGNED BY</p>
            <p className="text-sm">ANTIGRAVITY AI</p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-hackathon-secondary text-[10px] tracking-widest">BUILT WITH</p>
            <p className="text-sm text-white">PHASER 3 • REACT • VITE</p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-hackathon-secondary text-[10px] tracking-widest">DATA STORED VIA</p>
            <p className="text-sm text-hackathon-primary">GOOGLE SHEETS</p>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-hackathon-secondary text-[10px] tracking-widest">SPECIAL THANKS</p>
            <p className="text-sm text-white">PHASER ENGINE</p>
            <p className="text-sm text-white">REACT CORE TEAM</p>
            <p className="text-sm text-white">FRAMER MOTION</p>
          </div>

          <div className="mt-8">
            <p className="text-xs text-hackathon-primary glow-text">★ SYSTEM STABILIZED ★</p>
            <p className="text-[10px] text-gray-400 mt-2">REGISTER YOUR TEAM BELOW</p>
          </div>
        </motion.div>

        <AnimatePresence>
          {status !== 'success' && status !== 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ delay: 2 }}
              className="absolute bottom-0 left-0 right-0 bg-hackathon-surface/95 backdrop-blur p-4 border-t-4 border-hackathon-primary"
            >
              <form
                onSubmit={handleSubmit}
                onKeyDown={handleKeyDown}
                className="flex flex-col gap-2 overflow-y-auto max-h-[220px] pr-2 custom-scrollbar"
              >
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Team Name</label>
                    <input
                      required
                      name="teamName"
                      type="text"
                      value={formData.teamName}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Team Lead</label>
                    <input
                      required
                      name="teamLead"
                      type="text"
                      value={formData.teamLead}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>Contact</label>
                    <input
                      required
                      name="contact"
                      type="tel"
                      value={formData.contact}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className={labelClass}>College</label>
                    <input
                      required
                      name="college"
                      type="text"
                      value={formData.college}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Members Names</label>
                  <input
                    required
                    name="members"
                    type="text"
                    value={formData.members}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Name 1, Name 2, ..."
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Members Emails</label>
                  <input
                    required
                    name="emails"
                    type="text"
                    value={formData.emails}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="email1, email2, ..."
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className={labelClass}>Track</label>
                  <select
                    name="track"
                    value={formData.track}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {TRACKS.map(t => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="pixel-btn bg-hackathon-primary text-black py-2 mt-1 text-[10px] sticky bottom-0 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {status === 'loading' ? (
                    <>
                      <Spinner /> SUBMITTING…
                    </>
                  ) : (
                    '🚀 REGISTER TEAM'
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(status === 'success' || status === 'error') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/95"
            >
              <StatusScreen status={status} onRetry={handleRetry} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ──────── Standard modal variant ──────── */
  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {status === 'idle' || status === 'loading' ? (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            className="flex flex-col gap-4 mt-4 text-left max-h-[60vh] overflow-y-auto pr-3 custom-scrollbar"
          >
            <div className="bg-black/30 border border-hackathon-primary/20 p-3 rounded">
              <p className="text-gray-300 text-[10px] leading-relaxed">
                🏰 You've reached the final castle! Enter your team's details to secure your spot at
                CodeQuest 2026. Registrations are saved directly to Google Sheets.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Team Name</label>
                <input
                  required
                  name="teamName"
                  type="text"
                  value={formData.teamName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Team Quantum"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Team Lead Name</label>
                <input
                  required
                  name="teamLead"
                  type="text"
                  value={formData.teamLead}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className={labelClass}>College / Institution</label>
                <input
                  required
                  name="college"
                  type="text"
                  value={formData.college}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="IIT Bombay"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className={labelClass}>Contact Number</label>
                <input
                  required
                  name="contact"
                  type="tel"
                  value={formData.contact}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelClass}>Members Names (comma separated)</label>
              <textarea
                required
                name="members"
                value={formData.members}
                onChange={handleChange}
                className={`${inputClass} h-16 resize-none`}
                placeholder="Alice, Bob, Carol"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelClass}>Team Members Email IDs (comma separated)</label>
              <textarea
                required
                name="emails"
                value={formData.emails}
                onChange={handleChange}
                className={`${inputClass} h-16 resize-none`}
                placeholder="alice@example.com, bob@example.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className={labelClass}>Select Track</label>
              <select
                name="track"
                value={formData.track}
                onChange={handleChange}
                className={inputClass}
              >
                {TRACKS.map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Google Sheets badge */}
            <div className="flex items-center gap-2 text-[8px] text-hackathon-secondary border border-hackathon-secondary/20 bg-hackathon-secondary/5 p-2">
              <span>📊</span>
              <span>
                Data is saved to Google Sheets via Apps Script.
                {!import.meta.env.VITE_GOOGLE_SHEET_URL && (
                  <span className="text-yellow-400 ml-1">
                    (VITE_GOOGLE_SHEET_URL not set — see GOOGLE_SHEETS_SETUP.md)
                  </span>
                )}
              </span>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="pixel-btn mt-2 bg-hackathon-primary text-black sticky bottom-0 text-xs flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {status === 'loading' ? (
                <>
                  <Spinner /> SUBMITTING TO SHEETS…
                </>
              ) : (
                '🚀 SUBMIT REGISTRATION'
              )}
            </button>
          </motion.form>
        ) : (
          <motion.div key="status" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <StatusScreen status={status as 'success' | 'error'} onRetry={handleRetry} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
