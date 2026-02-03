import React, { useState } from 'react';
import { X, Save, Key, Zap } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, apiKey, setApiKey, useElevenLabs, setUseElevenLabs }) => {
    const [localKey, setLocalKey] = useState(apiKey);

    if (!isOpen) return null;

    const handleSave = () => {
        setApiKey(localKey);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-panel">
                <div className="modal-header">
                    <h3>Settings</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    <div className="setting-group">
                        <label className="toggle-label">
                            <Zap size={18} color={useElevenLabs ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
                            <span>Use Premium Voices (ElevenLabs)</span>
                            <input
                                type="checkbox"
                                checked={useElevenLabs}
                                onChange={(e) => setUseElevenLabs(e.target.checked)}
                            />
                        </label>
                        <p className="setting-desc">
                            Enable realistic AI voices using ElevenLabs API. Requires an API Key.
                        </p>
                    </div>

                    <div className={`setting-group ${!useElevenLabs ? 'disabled' : ''}`}>
                        <label className="input-label">
                            <Key size={16} /> API Key
                        </label>
                        <input
                            type="password"
                            className="text-input"
                            placeholder="xi-..."
                            value={localKey}
                            onChange={(e) => setLocalKey(e.target.value)}
                            disabled={!useElevenLabs}
                        />
                        <p className="setting-desc">
                            Your key is stored locally in your browser session.
                        </p>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="save-btn" onClick={handleSave}>
                        <Save size={16} /> Save Settings
                    </button>
                </div>
            </div>

            <style>{`
        .modal-overlay {
            position: fixed;
            top: 0; 
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(5px);
            z-index: 1000;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .modal-content {
            width: 90%;
            max-width: 400px;
            background: #161b22;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            border: 1px solid var(--border-color);
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            color: var(--text-primary);
        }

        .modal-body {
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }

        .setting-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .setting-group.disabled {
            opacity: 0.5;
            pointer-events: none;
        }

        .toggle-label {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
            cursor: pointer;
            color: var(--text-primary);
        }

        .input-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            color: var(--text-secondary);
        }

        .setting-desc {
            font-size: 0.8rem;
            color: var(--text-secondary);
            margin-left: 28px;
        }

        .text-input {
            background: rgba(0,0,0,0.2);
            border: 1px solid var(--border-color);
            padding: 0.8rem;
            border-radius: 6px;
            color: white;
            margin-top: 0.5rem;
            width: 100%;
        }
        
        .text-input:focus {
             border-color: var(--accent-primary);
             outline: none;
        }

        .modal-footer {
            margin-top: 2rem;
            display: flex;
            justify-content: flex-end;
        }

        .save-btn {
            background: var(--accent-primary);
            color: white;
            padding: 0.6rem 1.2rem;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 500;
        }
        
        .save-btn:hover {
            opacity: 0.9;
        }
      `}</style>
        </div>
    );
};

export default SettingsModal;
